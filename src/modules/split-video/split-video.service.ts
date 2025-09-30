import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { exec } from 'child_process';
import * as ffmpegStatic from 'ffmpeg-static';

@Injectable()
export class SplitVideoService {

    async splitVideo(inputPath: string, outputDir: string, chunkMinutes: number): Promise<boolean> {
        const outputPattern = `${outputDir}/segment_%03d.mp4`;
        const command = `${ffmpegStatic} -i ${inputPath} -c copy -f segment -segment_time ${chunkMinutes * 60} -reset_timestamps 1 ${outputPattern}`;

        try {
            return new Promise((resolve, reject) => {
                exec(command, (error) => {
                    if (error) reject(error);
                    // else resolve("Vídeos divididos exitosamente");
                    else resolve(true);
                });
            });
        } catch (error) {
            // throw new InternalServerErrorException(`It was not possible to split the video into parts`);
            throw new Error(`It was not possible to split the video into parts`);
        }
    }
}
