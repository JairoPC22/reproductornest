import { Test, TestingModule } from '@nestjs/testing';
import { GeminiService } from '../gemini.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('GeminiService', () => {
    let geminiService: GeminiService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot()],
            providers: [
                {
                    provide: GeminiService,
                    useFactory: (configService: ConfigService) => {
                        return new GeminiService(configService.get('GEMINI_API_KEY')!, configService.get('GEMINI_MODEL_NAME')!)
                    },
                    inject: [ConfigService]
                }
            ],
        }).compile();

        geminiService = module.get<GeminiService>(GeminiService);
    });

   
    it('Test 6. Recuperación de caches lista',
        async () => {
            const cachesLIst = await geminiService.listCaches();
            console.log({ cachesLIst });
            expect(cachesLIst).toBeDefined();
        }
    )

    it('Test 7. Recuperación de archivos en gemini',
        async () => {
            const filesGenai = await geminiService.listFiles();
            console.log({ filesGenai });
            expect(filesGenai).toBeDefined();
        }
    )
    
});