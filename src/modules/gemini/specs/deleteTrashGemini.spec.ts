import { Test, TestingModule } from '@nestjs/testing';
import { GeminiService } from '../gemini.service';
import { CachedContent, File as FileGenai, GenerateContentResponse, Tokens } from '@google/genai';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { readFileSync, writeFileSync } from 'fs';
import { response } from 'express';
import { fail } from 'assert';

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

    it('Test 1. Delete all caches in Gemini',
        async () => {
            try {
                await geminiService.deleteAllCaches();
            } catch (error) {
                fail('No se pudo borrar los caches en gemini');
            }
        }
    );

    it('Test 2. Delete all files in Gemini',
        async () => {
            try {
                await geminiService.deleteFiles();
            } catch (error) {
                fail('No se pudo borrar los caches en gemini');
            }
        }
    );

    it('Test de comprobación: Recuperación de caches lista',
        async () => {
            const cachesLIst = await geminiService.listCaches();
            console.log({ cachesLIst });
            expect(cachesLIst).toBeDefined();
        }
    )


});

/**Salida de Test 2:
 * {
 *   responseFromCachedContent: GenerateContentResponse {
 *     sdkHttpResponse: { headers: [Object] },
 *     candidates: [ [Object] ],
 *     modelVersion: 'gemini-2.5-pro',
 *     usageMetadata: {
 *       promptTokenCount: 354542,
 *       candidatesTokenCount: 104,
 *       totalTokenCount: 355879,
 *       cachedContentTokenCount: 354524,
 *       promptTokensDetails: [Array],
 *       cacheTokensDetails: [Array],
 *       thoughtsTokenCount: 1233
 *     }
 *   },
 *   tokens: {
 *     promptTokenCount: 354542,
 *     candidatesTokenCount: 104,
 *     totalTokenCount: 355879,
 *     cachedContentTokenCount: 354524,
 *     promptTokensDetails: [ [Object], [Object], [Object] ],
 *     cacheTokensDetails: [ [Object], [Object], [Object] ],
 *     thoughtsTokenCount: 1233
 *   }
 * }
 */