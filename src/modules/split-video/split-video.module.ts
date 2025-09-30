import { Module } from '@nestjs/common';
import { SplitVideoService } from './split-video.service';

@Module({
  providers: [SplitVideoService],
  exports: [SplitVideoService]
})
export class SplitVideoModule {}
