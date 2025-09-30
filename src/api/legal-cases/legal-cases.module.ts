import { Module } from '@nestjs/common';
import { LegalCasesService } from './legal-cases.service';
import { LegalCasesController } from './legal-cases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalCase } from './entities/legal-case.entity';
import { File } from '../files/entities/file.entity';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegalCase, File]),
    AuthModule,
    FilesModule
  ],
  controllers: [LegalCasesController],
  providers: [LegalCasesService],
})
export class LegalCasesModule { }
