import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateLegalCaseDto } from './dto/create-legal-case.dto';
import { UpdateLegalCaseDto } from './dto/update-legal-case.dto';
import { LegalCase } from './entities/legal-case.entity';
import { DataSource, Repository, UpdateResult } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { FilesService } from '../files/files.service';
import { plainToClass } from 'class-transformer';
import { LegalCaseResponseDto } from './dto/case-response.dto';

@Injectable()
export class LegalCasesService {

  private readonly logger = new Logger('legal-case.service');
  constructor(
    //Repositories
    @InjectRepository(LegalCase)
    private readonly legalCaseRepository: Repository<LegalCase>,

    //Services
    private readonly filesService: FilesService,
    private readonly dataSource: DataSource,

  ) { }
  async create(createLegalCaseDto: CreateLegalCaseDto, user: User) {
    try {
      const newCase = this.legalCaseRepository.create({
        description: createLegalCaseDto.description,
        title: createLegalCaseDto.title,
        user,
        tenant: user.tenant
      });
      await this.legalCaseRepository.save(newCase);
      return { newCaseId: newCase.id };

    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(`It was not possible to create a new legal case. Please check server errors`);
    }
  }

  async findAll(paginationDto: PaginationDto, user: User) {
    try {
      const cases = await this.legalCaseRepository.find({
        take: paginationDto.limit,
        skip: paginationDto.offset,
        where: { user: { id: user.id } },
        order: { updated_at: 'DESC' } // Ordena por el último modificado
      });
      return cases;

    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(`It was not possible to get data. Please check server errors`);
    }
  }

  async findOne(legalCaseId: string) {
    try {
      let legalCase: any = await this.legalCaseRepository.findOne({
        where: { id: legalCaseId },
        relations: ['files'], // <-- Esto incluye los archivos relacionados
        select: {
          id: true,
          title: true,
          caseSummary: true,
          created_at: true,
          updated_at: true,
          description: true,
          files: {
            id: true,
            name: true,
            file_type: true,
            extension: true,
            mimetype: true,
            size_bytes: true,
            created_at: true,
            updated_at: true
          }
        }
      });
      if (!legalCase) throw new NotFoundException(`Caso legal no encontrado`);

      return plainToClass(LegalCaseResponseDto, legalCase, {
        excludeExtraneousValues: true //Solo expone campos marcados
      })

    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`It was not possible to get data. Please check server errors`);
    }
  }

  async update(legalCaseId: string, updateLegalCaseDto: UpdateLegalCaseDto) {
    const { caseSummary, description, title } = updateLegalCaseDto;
    let fileUploaded: UpdateResult;
    try {
      fileUploaded = await this.legalCaseRepository.update(
        { id: legalCaseId },
        {
          caseSummary,
          description,
          title
        }
      );

    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(`It was not possible to update data. Please check server errors`);
    }
    if (fileUploaded.affected === 0) throw new NotFoundException(`Legal case not found`);
  }

  async remove(legalCaseId: string) {

    let legalCase: LegalCase | null;
    try {
      legalCase = await this.legalCaseRepository.findOne({
        where: { id: legalCaseId },
        relations: ['files']
      })
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(`Error deleting legal case. PLease check server errors`);
    }
    if (!legalCase) throw new NotFoundException(`Legal case not found`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      await Promise.all(legalCase.files.map(async (file) => {
        await this.filesService.remove(file.id);
      }))

      await queryRunner.manager.delete(LegalCase, { id: legalCaseId });
      await queryRunner.commitTransaction();
    } catch (error) {

      await queryRunner.rollbackTransaction();

      //this.filesService.remove(file.id) retorna estos dos tipos de error
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException)
        throw error;
    } finally {
      await queryRunner.release();
    }

  }
}
