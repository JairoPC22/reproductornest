import { Module } from '@nestjs/common';
import { WsVideoFunctionsService } from './wsVideoFunction.service';
import { WsVideoFunctionsGateway } from './wsVideoFunction.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AwsS3Module } from 'src/modules/aws-s3/aws-s3.module';
import { GeminiModule } from 'src/modules/gemini/gemini.module';
import { File } from 'src/api/files/entities/file.entity';
import { SplitVideoModule } from 'src/modules/split-video/split-video.module';

@Module({
  providers: [WsVideoFunctionsGateway, WsVideoFunctionsService],
  imports: [
    TypeOrmModule.forFeature([File]),
    AwsS3Module,
    GeminiModule,
    SplitVideoModule
  ],
})
export class WsVideoFunctionsModule { }
