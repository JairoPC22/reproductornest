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

    // it('Test 1. Creamos un cacheCOntent con un segmento de un video y un systemInstructions',
    //     async () => {

    //         const videoToSaveInCache = 'segment_000.mp4';
    //         const jsonFile = 'GeminiServiceCacheCreated.json';

    //         //Opcional limpiamos archivos antes de
    //         try {
    //             await geminiService.deleteFiles();
    //         } catch (error) {
    //             console.warn('Error cleaning up files:', error);
    //         }

    //         //creamos el cache con ./static/videos/segment_000.mp4
    //         const file: FileGenai = await geminiService.loadLocallyStoredFile({
    //             filenameWithExtension: videoToSaveInCache,
    //             mimeType: 'video/mp4',
    //             pathWithFilenameAndWxtension: `./static/videos/${videoToSaveInCache}`
    //         });

    //         if (!await geminiService.fileIsActiveInGemini(file)) {
    //             fail(`EL archivo ${file.name} no pudo subirse a gemini`);
    //         }

    //         const systemInstructions = `
    //         Actua como un asistente de IA especializado en el análisis de video. Tu única función es procesar un fragmento de video y responder a la pregunta del usuario acerca del video con la máxima precisión. Sigue todas las reglas rigurosamente.
    //         ## CONTEXTO IMPORTANTE
    //         Estás analizando un fragmento de un video más largo. Este es el fragmento número 1 de un total de 5 fragmentos. Basa tus respuestas únicamente en este fragmento de video.
    //         ## TAREA A REALIZAR
    //         Debido a que estas analizando solo un fragmento del video original, la respuesta a la consulta del usuario puede o no venir en este fragmento, tu deber es analizar el fragmento del video y tratar de responder la consulta del usuario. Si no encuentras respuesta dime que no encontraste respuetsa. Si no encuentras respuesta es porque posiblemente la respuesta a la consulta se encuentra en otro segmento del video que en este momento tú no estás analizando.
    //         A continuación te doy la consulta del usuario y el fragmento de video a analizar
    //         `;

    //         const cache = await geminiService.createCacheContent(
    //             file,
    //             systemInstructions,
    //             videoToSaveInCache
    //         )
    //         console.log({ cache });

    //         // guardamos el resultado en un cache.json
    //         try {
    //             const filePath = join('./static/testResults', jsonFile);
    //             const jsonData = JSON.stringify(cache, null, 2);
    //             writeFileSync(filePath, jsonData, 'utf-8');
    //         } catch (error) {
    //             console.error('No se guardo el cache en el archivo JSON');

    //         }


    //         expect(cache).toBeDefined();
    //         expect(cache.name).toBeDefined();



    //         /**
    //          * El test paso. Resultado:
    //          * {
    //          *   cache: {
    //          *     name: 'cachedContents/fhohvygvgt6frlyatvf3sn27bol73lbldqh42kof',
    //          *     displayName: '',
    //          *     model: 'models/gemini-2.5-pro',
    //          *     createTime: '2025-08-27T20:11:28.283006Z',
    //          *     updateTime: '2025-08-27T20:11:28.283006Z',
    //          *     expireTime: '2025-08-27T21:11:19.063499437Z',
    //          *     usageMetadata: { totalTokenCount: 354524 }
    //          *   }
    //          * }
    //          */
    //     },
    //     120000 //2 minutos de timeout para que le de tiempo al test
    // );


    // it('Test 2. Lee un cache de un JSON y lo utiliza parauna petición en gemini',
    //     async () => {
    //         //leemos el cache guardado en el test anterior
    //         const jsonFile = 'GeminiServiceCacheCreated.json';
    //         let cacheJson: CachedContent;
    //         try {
    //             const filePath = join('./static/testResults', 'GeminiServiceCacheCreated.json');
    //             const data = readFileSync(filePath, 'utf-8');
    //             cacheJson = JSON.parse(data);
    //         } catch (error) {
    //             if (error.code === 'ENOENT') {
    //                 fail(`Archivo ${jsonFile} no encontrado`);
    //             }
    //             fail(`Error al leer archivo: ${error.message}`);
    //         }

    //         //creamos un cache de gemini a partir del json
    //         const cacheGemini: CachedContent = cacheJson;
    //         // console.log({ cacheGemini });

    //         //comprobamos que el cache sea valido:
    //         const expirationTime = new Date(cacheGemini.expireTime!);
    //         const currentTime = new Date();

    //         const cacheIsActive: boolean = expirationTime > currentTime;
    //         // console.log({ expirationTime, currentTime, cacheIsActive });

    //         let response: GenerateContentResponse | string;
    //         let tokens: any;
    //         if (cacheIsActive) {
    //             response = await geminiService.simpleChatWithCacheContent(
    //                 cacheGemini,
    //                 '¿De qué trata el video? ¿trata sobre el rayo McQuin?'
    //             )
    //             tokens = response.usageMetadata;

    //         } else {
    //             response = `El cache ha expirado. expirationTime: ${expirationTime}, currentTime: ${currentTime}`;
    //         }

    //         console.log({ responseFromCachedContent: response, tokens })
    //         expect(response).toBeDefined()
    //         expect(cacheGemini).toBeDefined();
    //         expect(cacheGemini.name).toBeDefined();



    //     }, 120000 //2 minutos de timeout
    // );

    // it('Tets 3. Test para guardar información de un video en db',
    //     async () => {
    //         //subimos un video a gemini
    //         const video = 'segment_000.mp4';
    //         const jsonFile = 'datosDeVideoEnGemini.json' //aqui guardaremos los datos

    //         const videoGemini: FileGenai = await geminiService.loadLocallyStoredFile({
    //             filenameWithExtension: video,
    //             mimeType: 'video/mp4',
    //             pathWithFilenameAndWxtension: join('./static/videos/', video)
    //         });
    //         console.log({videoGemini})

    //         // guardamos el resultado en un cache.json
    //         try {
    //             const filePath = join('./static/testResults', jsonFile);
    //             const jsonData = JSON.stringify(videoGemini, null, 2);
    //             writeFileSync(filePath, jsonData, 'utf-8');
    //         } catch (error) {
    //             console.error('No se guardo el cache en el archivo JSON');

    //         }

    //         //volvemos a leer el archivo:
    //         let fileDataRetrieved: FileGenai;
    //         try {
    //             const filePath = join('./static/testResults', jsonFile);
    //             const data = readFileSync(filePath, 'utf-8');
    //             fileDataRetrieved = JSON.parse(data);
    //         } catch (error) {
    //             if (error.code === 'ENOENT') {
    //                 fail(`Archivo ${jsonFile} no encontrado`);
    //             }
    //             fail(`Error al leer archivo: ${error.message}`);
    //         }

    //         console.log({fileDataRetrieved})
    //         expect(videoGemini).toBeDefined();
    //         expect(fileDataRetrieved).toBeDefined();
    //     }, 120000//2 minutos de timeout
    // );

    // it('Test 4. Comprobar si un video aun existe',
    //     async () => {
    //         //leemos el archivo
    //         const jsonFile = 'datosDeVideoEnGemini.json' //aqui guardaremos los datos

    //         let fileDataRetrieved;
    //         try {
    //             const filePath = join('./static/testResults', jsonFile);
    //             const data = readFileSync(filePath, 'utf-8');
    //             fileDataRetrieved = JSON.parse(data);
    //         } catch (error) {
    //             if (error.code === 'ENOENT') {
    //                 fail(`Archivo ${jsonFile} no encontrado`);
    //             }
    //             fail(`Error al leer archivo: ${error.message}`);
    //         }

    //         const fileInfo = await geminiService.getFile(fileDataRetrieved.name!);
    //         console.log({ message: 'antes de borrar', fileInfo });

    //         //borramos
    //         await geminiService.deleteFiles();
    //         const file2 = await geminiService.getFile(fileDataRetrieved.name!);
    //         console.log({ message: 'despues de borrar', file2 });

    //         expect(fileInfo).toBeDefined();

    //     }
    // )

    // it('Test 5. Crear 10 caches de 350 000 tokens',
    //     async () => {

    //         //Interface para guardar la info
    //         interface CacheInfo {
    //             name: string
    //             displayName: string
    //             model: string
    //             createTime: string
    //             updateTime: string
    //             expireTime: string
    //             usageMetadata: any
    //         }


    //         const videoToSaveInCache = 'segment_000.mp4'; //video a usar
    //         const jsonFile = 'MuchosCaches.json'; //archivo donde guardar la info

    //         //Opcional limpiamos archivos antes de
    //         try {
    //             await geminiService.deleteFiles();
    //         } catch (error) {
    //             console.warn('Error cleaning up files:', error);
    //         }

    //         //creamos el cache con ./static/videos/segment_000.mp4
    //         const file: FileGenai = await geminiService.loadLocallyStoredFile({
    //             filenameWithExtension: videoToSaveInCache,
    //             mimeType: 'video/mp4',
    //             pathWithFilenameAndWxtension: `./static/videos/${videoToSaveInCache}`
    //         });

    //         if (!await geminiService.fileIsActiveInGemini(file)) {
    //             fail(`EL archivo ${file.name} no pudo subirse a gemini`);
    //         }

    //         const systemInstructions = `
    //                 Actua como un asistente de IA especializado en el análisis de video. Tu única función es procesar un fragmento de video y responder a la pregunta del usuario acerca del video con la máxima precisión. Sigue todas las reglas rigurosamente.
    //                 ## CONTEXTO IMPORTANTE
    //                 Estás analizando un fragmento de un video más largo. Este es el fragmento número 1 de un total de 5 fragmentos. Basa tus respuestas únicamente en este fragmento de video.
    //                 ## TAREA A REALIZAR
    //                 Debido a que estas analizando solo un fragmento del video original, la respuesta a la consulta del usuario puede o no venir en este fragmento, tu deber es analizar el fragmento del video y tratar de responder la consulta del usuario. Si no encuentras respuesta dime que no encontraste respuetsa. Si no encuentras respuesta es porque posiblemente la respuesta a la consulta se encuentra en otro segmento del video que en este momento tú no estás analizando.
    //                 A continuación te doy la consulta del usuario y el fragmento de video a analizar
    //                 `;

    //         //creamos 10 caches
    //         let caches: CacheInfo[] = [];
    //         for (let i = 0; i < 10; i++) {
    //             const cache = await geminiService.createCacheContent(
    //                 file,
    //                 systemInstructions,
    //                 videoToSaveInCache + `${i}`
    //             );
    //             caches.push({
    //                 name: cache.name!,
    //                 model: cache.model!,
    //                 displayName: cache.displayName!,
    //                 createTime: cache.createTime!,
    //                 expireTime: cache.expireTime!,
    //                 updateTime: cache.updateTime!,
    //                 usageMetadata: cache.usageMetadata!,
    //             })

    //         }

    //         // guardamos el resultado en un cache.json
    //         try {
    //             const filePath = join('./static/testResults', jsonFile);
    //             const jsonData = JSON.stringify(caches, null, 2);
    //             writeFileSync(filePath, jsonData, 'utf-8');
    //         } catch (error) {
    //             console.error('No se guardo el cache en el archivo JSON');

    //         }


    //         expect(caches).toBeDefined();
    //     }, 240000 //4 min time out
    // )

    // it('Test 6. Recuperación de caches lista',
    //     async () => {
    //         const cachesLIst = await geminiService.listCaches();
    //         console.log({ cachesLIst });
    //         expect(cachesLIst).toBeDefined();
    //     }
    // )

    // it('Test 7. Recuperación de archivos en gemini',
    //     async () => {
    //         //eliminamos archivo
    //         await geminiService.deleteFiles();

    //         // creamos request con cache
    //         const filesGenai = await geminiService.listFiles();
    //         console.log({ filesGenai });
    //         expect(filesGenai).toBeDefined();
    //     }
    // )
    // it('Test 8. Eliminamos FileGenai, pero no el cache y hacemos solicitud con cache',
    //     async () => {
    //         //eliminamos archivo
    //         await geminiService.deleteFiles();
    //         console.log('fileGenai eliminado')

    //         // leemos el cache guardado en el test anterior
    //         const jsonFile = 'GeminiServiceCacheCreated.json';
    //         let cacheJson: CachedContent;
    //         try {
    //             const filePath = join('./static/testResults', 'GeminiServiceCacheCreated.json');
    //             const data = readFileSync(filePath, 'utf-8');
    //             cacheJson = JSON.parse(data);
    //         } catch (error) {
    //             if (error.code === 'ENOENT') {
    //                 fail(`Archivo ${jsonFile} no encontrado`);
    //             }
    //             fail(`Error al leer archivo: ${error.message}`);
    //         }

    //         //creamos un cache de gemini a partir del json
    //         const cacheGemini: CachedContent = cacheJson;
    //         // console.log({ cacheGemini });

    //         //comprobamos que el cache sea valido:
    //         const expirationTime = new Date(cacheGemini.expireTime!);
    //         const currentTime = new Date();

    //         const cacheIsActive: boolean = expirationTime > currentTime;
    //         // console.log({ expirationTime, currentTime, cacheIsActive });

    //         let response: GenerateContentResponse | string;
    //         let tokens: any;
    //         if (cacheIsActive) {
    //             response = await geminiService.simpleChatWithCacheContent(
    //                 cacheGemini,
    //                 '¿De qué trata el video? ¿trata sobre el rayo McQuin?'
    //             )
    //             tokens = response.usageMetadata;

    //         } else {
    //             response = `El cache ha expirado. expirationTime: ${expirationTime}, currentTime: ${currentTime}`;
    //         }

    //         console.log({ responseFromCachedContent: response instanceof GenerateContentResponse ? response.text : response, tokens })
    //         expect(response).toBeDefined()
    //         expect(cacheGemini).toBeDefined();
    //         expect(cacheGemini.name).toBeDefined();


    //     }, 120000//2 min timeout
    // )

    it('Test 9. Intentamos crear un cache con menos de  4,096 for 2.5 Pro',
        async () => {
            // Interface para guardar la info
            interface CacheInfo {
                name: string
                displayName: string
                model: string
                createTime: string
                updateTime: string
                expireTime: string
                usageMetadata: any
            }


            const fileToSaveInCache = 'info.pdf'; //video a usar
            const jsonFile = 'cacheinsuficiente.json'; //archivo donde guardar la info

            //Opcional limpiamos archivos antes de
            try {
                await geminiService.deleteFiles();
            } catch (error) {
                console.warn('Error cleaning up files:', error);
            }

            //creamos el cache con ./static/pdfs/info.pdf
            let file;
            try {

                file = await geminiService.loadLocallyStoredFile({
                    filenameWithExtension: fileToSaveInCache,
                    mimeType: 'application/pdf',
                    pathWithFilenameAndWxtension: `./static/pdfs/${fileToSaveInCache}`
                });
            } catch (error) {
                fail(error);

            }

            if (!await geminiService.fileIsActiveInGemini(file)) {
                console.log({ fileInGenai: await geminiService.getFile(file.name) })
                fail(`EL archivo ${file.name} no pudo subirse a gemini`);
            }

            const systemInstructions = `
                    Actua como un asistente de IA especializado en el análisis de video. Tu única función es procesar un fragmento de video y responder a la pregunta del usuario acerca del video con la máxima precisión. Sigue todas las reglas rigurosamente.
                    ## CONTEXTO IMPORTANTE
                    Estás analizando un fragmento de un video más largo. Este es el fragmento número 1 de un total de 5 fragmentos. Basa tus respuestas únicamente en este fragmento de video.
                    ## TAREA A REALIZAR
                    Debido a que estas analizando solo un fragmento del video original, la respuesta a la consulta del usuario puede o no venir en este fragmento, tu deber es analizar el fragmento del video y tratar de responder la consulta del usuario. Si no encuentras respuesta dime que no encontraste respuetsa. Si no encuentras respuesta es porque posiblemente la respuesta a la consulta se encuentra en otro segmento del video que en este momento tú no estás analizando.
                    A continuación te doy la consulta del usuario y el fragmento de video a analizar
                    `;

            let cache;
            try {
                cache = await geminiService.createCacheContent(
                    file,
                    systemInstructions,
                    fileToSaveInCache
                );
                console.log({ cache })

            } catch (error) {
                fail(error)
                /**
                 * Message:
                 * ApiError: {"error":{"code":400,"message":"Cached content is too small. total_token_count=487, min_total_token_count=2048","status":"INVALID_ARGUMENT"}}
                 */
            }


            // guardamos el resultado en un cache.json
            try {
                const filePath = join('./static/testResults', jsonFile);
                const jsonData = JSON.stringify(cache, null, 2);
                writeFileSync(filePath, jsonData, 'utf-8');
            } catch (error) {
                console.error('No se guardo el cache en el archivo JSON');
                console.error(error);
            }


            expect(cache).toBeDefined();


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