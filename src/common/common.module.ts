import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GeminiCacheMetadata } from './entities/GeminiCacheMetadata.entity';
import { GeminiFileMetadata } from './entities/GeminiFileMetadata.entity';

@Module({
    imports: [TypeOrmModule.forFeature([GeminiCacheMetadata, GeminiFileMetadata])]
})
export class CommonModule { }
