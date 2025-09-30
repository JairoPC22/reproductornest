import { Module } from '@nestjs/common';
import { IaFunctionsService } from './ia-functions.service';
import { IaFunctionsController } from './ia-functions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from 'src/api/files/entities/file.entity';
import { AwsS3Module } from 'src/modules/aws-s3/aws-s3.module';
import { GeminiModule } from 'src/modules/gemini/gemini.module';
import { SplitVideoModule } from 'src/modules/split-video/split-video.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    AwsS3Module,
    GeminiModule,
    SplitVideoModule
  ],
  controllers: [IaFunctionsController],
  providers: [IaFunctionsService],
})
export class IaFunctionsModule { }
