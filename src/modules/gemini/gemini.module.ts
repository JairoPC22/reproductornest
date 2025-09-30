import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports:[ConfigModule],
    providers: [
        {
            provide: GeminiService,
            useFactory: (configService: ConfigService) => {
                return new GeminiService(configService.get('GEMINI_API_KEY')!, configService.get('GEMINI_MODEL_NAME')!)
            },
            inject: [ConfigService]
        }
    ],
    exports: [GeminiService]
})
export class GeminiModule {}
