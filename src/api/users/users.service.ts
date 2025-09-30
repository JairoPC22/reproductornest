import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
// import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/api/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {

  private readonly logger = new Logger('users.service');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) { }
  // create(createUserDto: CreateUserDto) {
  //   return 'This action adds a new user';
  // }

  async findAll(paginationDto: PaginationDto) {
    const { limit, offset, active } = paginationDto;
    const users = await this.userRepository.find({
      take: limit,
      skip: offset,
      where: active ? { isActive: active === 'true' } : undefined
    })

    return users;
  }

  async findOne(term: string) { //id or email
    let user: User | null;

    //by id
    if (isUUID(term)) user = await this.userRepository.findOneBy({ id: term })
    //by email
    else user = await this.userRepository.findOneBy({ email: term })

    if (!user) throw new NotFoundException(`User not found`);

    return user;

  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    //Puede modificar todo menos el tenantId

    const { pass, isActive } = updateUserDto;

    try {
      const { affected } = await this.userRepository.update(id, {
        ...updateUserDto,
        isActive: isActive ? isActive === 'true' : undefined,
        pass: pass ? bcrypt.hashSync(pass, 10) : undefined
      })
      if (!affected) throw new NotFoundException(`User not found`);
    } catch (error) {
      this.handleErrorDb(error);
    }

  }

  async remove(id: string) {
    try {
      const { affected } = await this.userRepository.update(id, {
        isActive: false
      })
      if (!affected) throw new NotFoundException(`User not found`);

    } catch (error) {
      this.handleErrorDb(error);

    }

  }

  private handleErrorDb(error: any) {
    if (error.status === 404) {
      this.logger.error(error.response.message);
      throw new NotFoundException(`User not found`)
    }
    if (error.code === '23505') {
      this.logger.error(error.detail);
      throw new BadRequestException(error.detail)
    }
    this.logger.error(error)
    throw new InternalServerErrorException(`Please check server logs`)
  }
}
