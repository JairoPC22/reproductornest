import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QuestionsVideoService } from './questions-video.service';
import { QuestionsVideoGateway } from './questions-video.gateway';
import { GeminiModule } from '../../modules/gemini/gemini.module';
import { AgentIaQuestionsVideo } from './agentAI/agentIa.class';
import { File } from '../../api/files/entities/file.entity';
import { AwsS3Module } from '../../modules/aws-s3/aws-s3.module';
import { FileSegment } from '../../api/files/entities/FileSegment.entity';
import { GeminiCacheMetadata } from '../../common/entities/GeminiCacheMetadata.entity';
import { GeminiFileMetadata } from '../../common/entities/GeminiFileMetadata.entity';

@Module({
  providers: [
    QuestionsVideoGateway,
    QuestionsVideoService,
    AgentIaQuestionsVideo
  ],
  imports: [
    TypeOrmModule.forFeature([File, FileSegment, GeminiCacheMetadata, GeminiFileMetadata]),
    GeminiModule,
    AwsS3Module
  ]
})
export class QuestionsVideoModule { }
