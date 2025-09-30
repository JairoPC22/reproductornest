import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { FilesController } from './files.controller';
import { User } from '../auth/entities/user.entity';
import { File } from './entities/file.entity';
import { AuthModule } from '../auth/auth.module';
import { FilesService } from './files.service';
import { AwsS3Module } from '../../modules/aws-s3/aws-s3.module';
import { SplitVideoModule } from '../../modules/split-video/split-video.module';
import { FileSegment } from './entities/FileSegment.entity';
import { GeminiCacheMetadata } from '../../common/entities/GeminiCacheMetadata.entity';
import { LegalCase } from '../legal-cases/entities/legal-case.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, File, FileSegment, GeminiCacheMetadata, LegalCase]),
    ConfigModule,
    AuthModule,
    AwsS3Module,
    SplitVideoModule
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService]
})
export class FilesModule { }
