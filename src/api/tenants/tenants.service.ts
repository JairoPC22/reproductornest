import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/api/auth/entities/user.entity';
import { ValidRoles } from 'src/common/interfaces/valid-roles';
import { AllValidPermisosArray, ValidPermisos } from 'src/common/interfaces/valid-permisos.enum';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { isUUID } from 'class-validator';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {

  private readonly logger = new Logger('tenant.service');

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRespository: Repository<Tenant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource //TypORM ya sabe cual es el ds
  ) { }

  async create(createTenantDto: CreateTenantDto) {
    const { nameTenant, email, pass, fullname } = createTenantDto;
    const slug = nameTenant
      .trim()
      .toLowerCase()
      .replaceAll(' ', '-')

    try {
      const tenant = this.tenantRespository.create({
        nameTenant: nameTenant.trim(),
        slug,
        users: [
          this.userRepository.create({
            email,
            pass: bcrypt.hashSync(pass, 10),
            fullname,
            roles: [ValidRoles.adminTenant],
            permisos: [...AllValidPermisosArray, ValidPermisos.addUser, ValidPermisos.deleteUser],
          }),
        ],
      })

      await this.tenantRespository.save(tenant);

      return tenant;
    } catch (error) {
      this.handleErrorDb(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, offset, active } = paginationDto;
    const tenants = await this.tenantRespository.find({
      take: limit,
      skip: offset,
      where: active !== undefined ? {isActive: active === 'true'} : {}
      // relations: { 
      //   users: true //true si quieres que se muestren los usuarios. Default depende del eager en tenant.entity
      // }
    })
    return tenants;
  }

  async findOne(term: string) {//Se puede buscar por id o slug

    let tenant: Tenant | null;

    if (isUUID(term)) {
      tenant = await this.tenantRespository.findOneBy({ id: term });
    }
    else {

      tenant = await this.tenantRespository.findOneBy({ slug: term })

      /**
       * Recuerda que otra opción para no utilizar el findOneBy({slug: term}), es utilizar el Query Builder:
       * const queryBuilder = this.tenantRespository.createQueryBuilder('tenantQB') //alias
       * tenant = await queryBuilder
       *     .where('slug=:slug',{slug:term})
       *     .leftJoinAndSelect('tenantQB.user', 'tenantUser') //relacion, alias de la relación. Incluir solo si se quieren los usuarios del tenant (como si fuera eager: true)
       *     .getOne()
       */
    }

    if (!tenant) throw new NotFoundException(`Tenant '${term}' not found`)

    return tenant;
    /**Si mas adelante se requiere, se puede crear un método para aplanar el tenant y devolver
     * solo ciertos campos
     */
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    //solo ara actualiar el nombre del tenant y el slug

    //verificamos que se incluya el nuevo nombre
    const { nameTenant, isActive } = updateTenantDto;
    if (!nameTenant && !isActive) throw new BadRequestException(`Nothing to update`);
    console.log(updateTenantDto)

    const tenant = await this.tenantRespository.findOneBy({ id });
    if (!tenant) throw new BadRequestException(`Tenant '${id}' not found`);

    try {

      if(nameTenant){
        tenant.nameTenant = nameTenant!.trim();
        tenant.slug = nameTenant!.trim().toLowerCase().replaceAll(' ', '_');
      }
      if(isActive) tenant.isActive = isActive === 'true';
      await this.tenantRespository.save(tenant);

      return tenant;
    } catch (error) {
      this.handleErrorDb(error);
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //Desactivar el tenant
      const aux = await queryRunner.manager.update(Tenant, id, { isActive: false });
      if (!aux.affected) throw new BadRequestException(`Tenant not foundd`);
      console.log(aux)

      //desactivar los usuarios
      await queryRunner.manager.update(User, { tenant: { id } }, { isActive: false });
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleErrorDb(error);
    } finally {
      await queryRunner.release();

    }

  }

  private handleErrorDb(error: any) {
    if (error.code === '23505') {
      this.logger.error(error.detail);
      throw new BadRequestException(error.detail)
    }
    if (error.status === 400) {
      this.logger.error(error);
      throw new BadRequestException(`Tenant not found`);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(`Please check server logs`);
  }
}
