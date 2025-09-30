import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, MoreThan, Repository } from 'typeorm';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ApiError, CachedContent, File as FileGenai } from '@google/genai'

import { MessageAboutVideoDto } from './dto/messageAboutVideo.dto';
import { GeminiService } from '../../modules/gemini/gemini.service';
import { AgentIaQuestionsVideo } from './agentAI/agentIa.class';
import { File } from '../../api/files/entities/file.entity';
import { InputForAgentIA } from './interfaces/inputForAgent.interface';
import { GeminiCacheMetadata } from '../../common/entities/GeminiCacheMetadata.entity';
import { join } from 'path';
import { existsSync } from 'fs';
import { AwsS3Service } from '../../modules/aws-s3/aws-s3.service';
import { systemInstructionsA } from '../../common/prompts/legalSection/preguntasSobreVideo.prompts';
import { GeminiFileMetadata } from '../../common/entities/GeminiFileMetadata.entity';
import { FileSegment } from '../../api/files/entities/FileSegment.entity';

@Injectable()
export class QuestionsVideoService {

    private readonly logger = new Logger('questions-video.service.ts');
    private readonly TEMPORAL_PATH = './filesTemp';

    constructor(
        //Services
        private readonly geminiService: GeminiService,
        private readonly agantIa: AgentIaQuestionsVideo,
        private readonly awsService: AwsS3Service,
        private readonly dataSource: DataSource,

        //Repositories
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        @InjectRepository(FileSegment)
        private readonly fileSegmentRepository: Repository<FileSegment>,
        @InjectRepository(GeminiCacheMetadata)
        private readonly geminiCacheMetadataRepository: Repository<GeminiCacheMetadata>,
        @InjectRepository(GeminiFileMetadata)
        private readonly geminiFileMetadataRepository: Repository<GeminiFileMetadata>
    ) { }

    /**Función principal para procesar la lógica de hacer una pregunta sobre el video */
    async main(client: Socket, messageAboutVideoDto: MessageAboutVideoDto) {
        /**Notas para el Abdi del futuro:
         * - Este método implementa el diagrama de actividades de '1. Question about video - Activity diagram with video.drawio'
         * - EL método aún no esta completo, unicamente fue escrito y testeado para la
         * parte de procesar un video NO DIVIDIDO, es decir, la primera mitad del diagrama, la parte de arriba.
         * - Este método concluye hasta la parte de 'Process for temporary files'. La
         * fase de 'Process for agent-IA' está pendiente por escribirse, testearse y conectarse con
         * este método main. Por ello es que al final esta comentada la parte donde se llama al agente de IA.
         * - El agente de IA, clase de agentIa.class.ts, necesita re-hacerse tomando en cuenta
         * que la parte de crear el cache/video en Gemini para que el agente pueda hacer preguntas, ya está cubierta en este mmétodo main.
         * - Los returns que aparecen al final de cada mase de este mpetodo, por ejemplo:
         * return {
         *     cacheCreated,
         *     fileGenai,
         * }
         * son solo para uso de los test de 'questions-video.service.ts', esto debido a que
         * este método main sigue en desarrollo. Cuando se termine el desarrollo y se conecte con el agent-ia
         * se deben eliminar.
         */
        const { videoId, message } = messageAboutVideoDto;

        if (!videoId || !message) throw new WsException({
            status: 400,
            message: 'Bad Request',
            details: 'Params videoId and message are required',
        });

        //Verificamos que exista el video
        let videoFile: File | null = null;
        try {
            videoFile = await this.fileRepository.findOneBy({ id: videoId });
        } catch (error) {
            this.logger.error(String(error));
            return String(error);
        }

        if (!videoFile) throw new WsException({
            status: 404,
            message: 'Not found',
            details: 'Video not found in db',
        });

        const { id, name, is_split, aws_s3_key, mimetype, cache_is_possible } = videoFile;

        if (!is_split) {

            // is it possible to make a cache content?
            if (cache_is_possible === false) {

                //Get video from the aws-s3 bucket
                let videoInServer: string | null;
                try {
                    videoInServer = await this.getTemporalVideoInServer(aws_s3_key, client.id);
                } catch (error) {
                    this.logger.error(error);
                    throw new WsException({
                        status: 500,
                        message: 'Internal Server error',
                        details: 'It was impossible to get video from cloud. Check server errors',
                    });
                }

                //Upload video to Gemini
                let fileGenai: FileGenai | null;
                try {
                    fileGenai = await this.geminiService.loadLocallyStoredFile({
                        filenameWithExtension: name,
                        mimeType: mimetype,
                        pathWithFilenameAndWxtension: videoInServer
                    });
                    //Wait for the video to be ready in Gemini
                    await this.geminiService.waitForToBeActiveInGemini(fileGenai.name!);

                } catch (error) {
                    if (error instanceof ApiError) {
                        //No se subió
                        this.logger.error(`NO fue posible subir el video al API de gemini. Error en 'main' -> ${error}`);
                    } else {
                        //Se subió pero no se pudo cargar
                        this.logger.error(`Se subió el video pero fallo al esperar en 'waitForToBeActiveInGemini' -> ${error}`);
                        this.geminiService.deleteOneFile(fileGenai!.name!);
                    }
                    throw new WsException({
                        status: 500,
                        message: 'Internal Server error',
                        details: 'It was impossible to send video to IA. Check server errors',
                    });
                }

                //Save/update videoGenai in db
                const queryRunner = this.dataSource.createQueryRunner();
                try {
                    await queryRunner.connect();
                    await queryRunner.startTransaction();

                    // 1. Intentar UPDATE primero
                    const updateResult = await queryRunner.manager.update(
                        GeminiFileMetadata,
                        { file: { id } }, //where condition
                        {
                            name: fileGenai.name,
                            displayName: fileGenai.displayName,
                            mimeType: fileGenai.mimeType,
                            sizeBytes: BigInt(fileGenai.sizeBytes!),
                            createTime: fileGenai.createTime,
                            updateTime: fileGenai.updateTime,
                            expirationTime: fileGenai.expirationTime,
                            sha256Hash: fileGenai.sha256Hash,
                            uri: fileGenai.uri,
                            // state: 'fileGenai.state',
                            state: 'ACTIVE',
                            source: fileGenai.source
                        }
                    );

                    // 2. Si no se actualizó nada, hacer INSERT
                    if (updateResult.affected === 0) {
                        await queryRunner.manager.save(GeminiFileMetadata, {
                            file: videoFile,
                            name: fileGenai.name,
                            displayName: fileGenai.displayName,
                            mimeType: fileGenai.mimeType,
                            sizeBytes: BigInt(fileGenai.sizeBytes!),
                            createTime: fileGenai.createTime,
                            updateTime: fileGenai.updateTime,
                            expirationTime: fileGenai.expirationTime,
                            sha256Hash: fileGenai.sha256Hash,
                            uri: fileGenai.uri,
                            // state: 'fileGenai.state',
                            state: 'ACTIVE',
                            source: fileGenai.source,
                        });
                    }
                    await queryRunner.commitTransaction();

                } catch (error) {
                    this.logger.error(`Error in Save/update videoGenai in db -> ${error} `);
                    await queryRunner.rollbackTransaction();
                    this.geminiService.deleteOneFile(fileGenai.name!);
                    throw new WsException({
                        status: 500,
                        message: 'Internal Server error',
                        details: 'It was impossible to connect with db. Check server errors',
                    });
                } finally {
                    await queryRunner.release();
                }

                /**DO NOT delete video in Gemini yet */
                /**Hasta aquí termina Process for temporary files*/

                return {
                    message: 'Cache is not possible. FileGenai guardado en db',
                    fileGenai
                }

            }
            else { //cache si es posible o tal vez

                /**
                * cache_is_possible === true || cache_is_possible === null
                * Ejecuta el código si el cache es posible (true)
                * O si no sabemos si es posible (null) porque es la primera vez intentandolo para este video,
                * pero NO lo ejecutes si sabemos que definitivamente NO es posible (false)
                */

                //Is there a cache?
                let cache: GeminiCacheMetadata | null;
                try {
                    const tenMInutesFromNow = new Date(Date.now() + 10 * 60 * 1000); //Suma 10 minutos al tiempo actual 
                    //Obtiene el cache solo si le faltan al menos 10 min para expirar
                    cache = await this.geminiCacheMetadataRepository.findOne({
                        where: {
                            file: { id },
                            expireTime: MoreThan(tenMInutesFromNow)
                        }
                    });
                } catch (error) {
                    this.logger.error(`Error asking if is there a cache in db -> ${error} `);
                    throw new WsException({
                        status: 500,
                        message: 'Internal Server errors',
                        details: 'No db connection. Check server errors',
                    });
                }

                if (!cache) {

                    //Get video from the aws-s3 bucket
                    let videoInServer: string | null;
                    try {
                        videoInServer = await this.getTemporalVideoInServer(aws_s3_key, client.id);
                    } catch (error) {
                        this.logger.error(error);
                        throw new WsException({
                            status: 500,
                            message: 'Internal Server error',
                            details: 'It was impossible to get video from cloud. Check server errors',
                        });
                    }

                    //Upload video to Gemini:
                    let fileGenai: FileGenai | null;
                    try {
                        fileGenai = await this.geminiService.loadLocallyStoredFile({
                            filenameWithExtension: name,
                            mimeType: mimetype,
                            pathWithFilenameAndWxtension: videoInServer
                        })

                        //Wait for the video to be ready in Gemini
                        await this.geminiService.waitForToBeActiveInGemini(fileGenai.name!);
                    } catch (error) {
                        //No se subió
                        if (error instanceof ApiError) {
                            this.logger.error(`NO fue posible subir el video al API de gemini. Error en (!cache) -> ${error}`);
                        } else {
                            //Se subió pero no se pudo cargar
                            this.logger.error(`Se subió el video pero fallo al esperar con la función 'waitForToBeActiveInGemini'. Error específico en la sección de (!cache) -> ${error}`);
                            this.geminiService.deleteOneFile(fileGenai!.name!);
                        }
                        throw new WsException({
                            status: 500,
                            message: 'Internal Server error',
                            details: 'It was impossible to send video to IA. Check server errors',
                        });

                    }

                    // Create a Cache &update/save in db
                    let geminiCache: CachedContent | null;
                    let cacheCreated = false;
                    const queryRunner = this.dataSource.createQueryRunner();
                    try {
                        await queryRunner.connect();
                        await queryRunner.startTransaction()
                        geminiCache = await this.geminiService.createCacheContent(
                            fileGenai,
                            systemInstructionsA,
                            name
                        );

                        cacheCreated = true;

                        //1. Try update cache in db
                        const updateCache = await queryRunner.manager.update(GeminiCacheMetadata,
                            { file: { id } }, //where condition
                            {
                                name: geminiCache.name,
                                displayName: geminiCache.displayName,
                                model: geminiCache.model,
                                createTime: geminiCache.createTime,
                                updateTime: geminiCache.updateTime,
                                expireTime: geminiCache.expireTime,
                                usageMetadata: geminiCache.usageMetadata as any
                            }
                        );

                        // if nothing was updated, INSERT
                        if (updateCache.affected === 0) {
                            await queryRunner.manager.save(GeminiCacheMetadata,
                                {
                                    file: videoFile,
                                    name: geminiCache.name,
                                    displayName: geminiCache.displayName,
                                    model: geminiCache.model,
                                    createTime: geminiCache.createTime,
                                    updateTime: geminiCache.updateTime,
                                    expireTime: geminiCache.expireTime,
                                    usageMetadata: geminiCache.usageMetadata as any
                                }
                            );
                        }

                        await queryRunner.commitTransaction();

                    } catch (error) {
                        if (error instanceof ApiError) {
                            this.logger.error(`Error in save/update CACHE in db -> ${error}`);
                            await queryRunner.rollbackTransaction()
                            throw new WsException({
                                status: 500,
                                message: 'Internal Server Error',
                                details: 'It was impossible to create a cached content, Check server errors'
                            });
                        }

                    } finally {
                        this.geminiService.deleteOneFile(fileGenai.name!);
                        await queryRunner.release()
                    }

                    /**Aquí se termina el ciclo.
                     * Ya hay un cache en db
                     * O
                     * Ya hay fileMetadata en db
                     */

                    return {
                        cacheCreated,
                        fileGenai,
                    }
                }

                else {
                    //  Si ya hay un cache no se debe hacer nada, el proceso termina porque se utilizará ese cache
                    return {
                        message: `Ya existe un cache del video ${name}`
                    }
                }

            }

            /**End of Process of temporary files */

        } else { //El video si está dividido
            return {
                message: 'Video dividido y method not implemented'
            }

        }


        // const inputForAgent: InputForAgentIA = {
        //     videoName: name,
        //     videoId,
        //     question: message
        // };

        // //Delegamos la lógica de contestar la pregunta a la función main del agente de IA
        // await this.agantIa.main(client, inputForAgent);

    }

    //AUX FUNCTIONS: Funciones de lǵogica de negocio para utilizar dentro de main

    /**Esta función devuelve un video temporal almacenado en './filesTemp/wsClientId/aws_s3_key' */
    async getTemporalVideoInServer(aws_s3_key: string, wsClientId: string) {

        const temporalVideoInServer = join(this.TEMPORAL_PATH, wsClientId, aws_s3_key);
        if (!existsSync(temporalVideoInServer)) {
            //Si el video no está en el servidor lo Descargamos temporal video from s3
            try {
                await this.awsService.getObject(aws_s3_key, temporalVideoInServer);
            } catch (error) {
                const wrappedError = new Error(`NO fue posible descargar arhivo temporal de s3. Error en 'getTemporalVideoInServer' -> ${error}`);
                wrappedError.cause = error;
                throw wrappedError;
            }
        }
        return temporalVideoInServer;

    }

    /**Esta función recive FileSegment[] y devuelve aquellos segmentos de video que NO tienen un cache vigente en la DB de al menos 10 minutos */
    private async getVideoSegmentsWithoutCache(fileSegments: FileSegment[]): Promise<FileSegment[]> {
        const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

        // Obtiene los ids de los segmentos
        const segmentIds = fileSegments.map(seg => seg.id);

        // Busca los caches relacionados a estos segmentos y que expiren en al menos 10 min
        let caches: GeminiCacheMetadata[];
        try {
            caches = await this.geminiCacheMetadataRepository.find({
                where: {
                    fileSegment: {
                        id: In(segmentIds) // 🎯 Una sola condición IN
                    },
                    expireTime: MoreThan(tenMinutesFromNow)
                }
            });
        } catch (error) {
            this.logger.error(`Error en la conexión a db en getVideoSegmentsWithoutCache -> ${error}`);
            throw error;
        }

        if (!caches?.length) return []; //(!caches || caches.length === 0) Para verificar null/undefined Y array vacío:

        // Obtiene los ids de los segmentos que sí tienen cache vigente
        const cachedSegmentIds = new Set(caches.map(cache => cache.fileSegment.id));

        // Filtra los segmentos que NO tienen cache vigente
        return fileSegments.filter(seg => !cachedSegmentIds.has(seg.id));

    }

    //TEST FUNCTIONS: Funciones solo de prueba y para el archivo SPEC

    /**Función solo de prueba para conextar y probar el ws*/
    async chatAboutVideo(client: Socket, messageAboutVideo: MessageAboutVideoDto): Promise<void> {
        const { videoId, message } = messageAboutVideo;
        client.emit('startMessageResponseAboutVideo', { state: 'start' });
        client.emit('status', { state: 'Dacuai está pensando' });

        //Esperamos 6 segundos
        await new Promise(resolve => setTimeout(resolve, 6000));

        //Verificamos que exista el video
        let videoFile: File | null = null;
        try {
            videoFile = await this.fileRepository.findOneBy({ id: videoId });
        } catch (error) {
        }

        if (!videoFile) {
            client.emit('exception', { status: 'Video Not foud' })
            return;
        }

        try {

            const iaResponseText = await this.geminiService.chatPruebaStreaming(message);

            for await (const chunk of iaResponseText) {
                client.emit('responseChatAboutVideo', chunk.text)
            }
            client.emit('endMessageResponseAboutVideo', { state: 'end' });

        } catch (error) {
            client.emit('exception', { state: 'Dacuai no está disponible en este momento' });
            return;
        }


    }

    /**FUnción solo para probar que jale el archivo spec */
    async showCacheAndFilesInGemini() {
        //thisng in Gemini
        const cachesInGemini = await this.geminiService.listCaches();
        const filesInGemini = await this.geminiService.listFiles();

        //things in db
        const cachesInDb = await this.geminiCacheMetadataRepository.find();
        const filesInDb = await this.geminiFileMetadataRepository.find();

        return {
            cachesInGemini,
            filesInGemini,
            cachesInDb,
            filesInDb
        }
    }

}
