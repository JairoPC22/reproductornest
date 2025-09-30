import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { WsException } from "@nestjs/websockets";
import { Repository } from "typeorm";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { rm } from "fs/promises";
import { ApiError, Content, FunctionCallingConfigMode, GenerateContentResponse } from "@google/genai";
import { Socket } from "socket.io";

import { GeminiService } from "../../../modules/gemini/gemini.service";
import { File } from "../../../api/files/entities/file.entity";
import { AwsS3Service } from "../../../modules/aws-s3/aws-s3.service";
import { generateTemporalUnicName } from "../../..//common/utils/generateTemporalFileName";
import { outputAnswerQuestionAboutVideo } from "../interfaces/outputAnswerQuestionAboutVideo.interface";
import { InputForAgentIA } from "../interfaces/inputForAgent.interface";
import { answerQuestionAboutVideoFunctionDeclaration } from "./functionDeclarations";
import { systemInstructionQuestionsAboutVideo } from "../../../common/prompts/legalSection/preguntasSobreVideo.prompts";
import { paramsAnswerQuestionAoutVideo } from "../interfaces/inputAswerQuestionAboutVideo.interface";
import { FileSegment } from "../../../api/files/entities/FileSegment.entity";

@Injectable()
export class AgentIaQuestionsVideo {

    private readonly PATH_TEMPORAL_VIDEOS = './filesTemp/questions-video'
    private readonly logger = new Logger('questions-video.agentIa.class.ts');

    ///dev only 
    private totalTokens: number = 0;

    /**Mapa de funciones para llamar a la función que me diga el agente de IA por medio del functionCalling */
    private readonly functionMap: { [key: string]: Function } = {
        'answerQuestionAboutVideo': this.answerQuestionAboutVideo.bind(this),
        // agregar más funciones en el futuro
    }

    constructor(
        private readonly geminiService: GeminiService,
        @InjectRepository(FileSegment)
        private readonly fileSegmentRepository: Repository<FileSegment>,
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        private readonly awsService: AwsS3Service
    ) {
        //creamos la capreta temporal por si no existe donde se van a descargar los videos temporales
        // if (!existsSync(this.PATH_TEMPORAL_VIDEOS))
        //     mkdirSync(this.PATH_TEMPORAL_VIDEOS, { recursive: true })
    }

    /**Función principal de entrada para el agente de IA. Esta función es un controlador que maneja la lógica de Gemini, function calling, la desición del agente si examinar o no el video, etc. Además llama a las otras funciones de esta misma clase*/
    async main(client: Socket, inputForAgentIA: InputForAgentIA) {

        const firstContentInput: Content = {
            role: 'user',
            parts: [{ text: JSON.stringify(inputForAgentIA) }]
        }

        //Primera solicitud a Gemini
        let iaResponse: GenerateContentResponse;
        try {
            iaResponse = await this.geminiService.chatWithFunctionCalling(
                [firstContentInput],
                [answerQuestionAboutVideoFunctionDeclaration], //las declaraciones de funciones
                FunctionCallingConfigMode.AUTO, //Gemini decide si llamar o no una función
                systemInstructionQuestionsAboutVideo, //dirige el comportamiento del llm
            );
            //TODO: Desactivar el thought
            this.logger.log({
                message: `Primera solicitud chatWithFunctionCalling`,
                tokens: iaResponse.usageMetadata?.totalTokenCount,
                TOTAL_TOKENS: `${this.totalTokens} + ${iaResponse.usageMetadata?.totalTokenCount} = ${this.totalTokens + (iaResponse.usageMetadata?.totalTokenCount || 0)}`
            });
            this.totalTokens += iaResponse.usageMetadata?.totalTokenCount || 0;

        } catch (error) {
            this.logger.error(String(error));
            throw new WsException(error);
        }

        //Ejecutamos la función llamada
        if (iaResponse.functionCalls && iaResponse.functionCalls.length > 0) {
            for (const call of iaResponse.functionCalls) {
                const functionName = call.name;
                const functionArgs = call.args;

                this.logger.log(`Gemini wants to call ${functionName} with args:`, functionArgs);
                client.emit('status', { state: 'Dacuai está analizando el video...' });

                //Llamamos a la función
                if (this.functionMap[functionName!]) {
                    const result: Promise<outputAnswerQuestionAboutVideo> = await this.functionMap[functionName!](
                        functionArgs,
                    );
                    try {
                        //creamos el historial
                        const contents: Content[] = [
                            firstContentInput,
                            {
                                role: 'model',
                                parts: [{
                                    functionCall: {
                                        name: functionName,
                                        args: functionArgs
                                    }
                                }]
                            },
                            {
                                role: 'function',
                                parts: [{
                                    functionResponse: {
                                        name: functionName!,
                                        response: { output: result } // Pasa el resultado real de tu función aquí
                                    }
                                }]
                            }
                        ];

                        //Segunda llamada a gemini
                        this.logger.log(`Procesando segunda solicitud chatWithFunctionCalling a Gemini`);
                        client.emit('status', { state: 'Dacuai está escribiendo...' });
                        const iaFinalResponse: GenerateContentResponse = await this.geminiService.chatWithFunctionCalling(
                            contents,
                            [answerQuestionAboutVideoFunctionDeclaration],
                            FunctionCallingConfigMode.AUTO,
                            systemInstructionQuestionsAboutVideo,
                        );

                        this.totalTokens += iaFinalResponse.usageMetadata?.totalTokenCount || 0
                        this.logger.log({
                            message: `Segunda solicitud a chatWithFunctionCalling`,
                            tokens: iaFinalResponse.usageMetadata,
                            iaFinalResponse: iaFinalResponse.text,
                            //Aquí se imprimió el ultimo conteo de tokens:
                            TOTAL_TOKENS: `${this.totalTokens} + ${iaFinalResponse.usageMetadata?.totalTokenCount} = ${this.totalTokens + (iaFinalResponse.usageMetadata?.totalTokenCount || 0)}`
                        });

                        if (iaFinalResponse.text) {
                            client.emit('responseChatAboutVideo', iaFinalResponse.text);
                            // return iaFinalResponse.text;
                        }
                    } catch (error) {
                        if (error instanceof ApiError) {
                            if (error.status === 429) { //https://ai.google.dev/gemini-api/docs/rate-limits#current-rate-limits for further
                                client.emit('exception', { status: 'Has excedido el límite de peticiones por minuto, intenta más tarde' });

                            } else {
                                client.emit('exception', { status: 'No fue posible obtener respuetsa de IA sobre al video' })
                            }
                        }
                        return;
                        // throw error;
                    } finally {
                        this.geminiService.deleteFiles();
                    }
                }
                if (iaResponse.text) {
                    client.emit('responseChatAboutVideo', iaResponse.text);
                }

            }
        } else if (iaResponse.text) {
            client.emit('responseChatAboutVideo', iaResponse.text);
        } else {
            this.logger.error("No function call or text response from Gemini.");
            throw new WsException('No function call or text response from Gemini.');
        }
    }

    /**Función para el procesamiento de hacerle una pregunta a la IA sobre un video.
     * Esta función debe estar en la declaración de funciones
     * Ver diagrama de actividades para más información */
    private async answerQuestionAboutVideo(params: paramsAnswerQuestionAoutVideo): Promise<outputAnswerQuestionAboutVideo> {
        const { videoId, question } = params;

        //obtenemos el video
        let videoFile;
        try {
            videoFile = await this.fileRepository.findOneBy({ id: videoId });
        } catch (error) {
            //enviamos una respuesta indicando el error
            this.logger.error(String(error));
            return {
                mensaje_error: 'No fue posible obtener el video de la base de datos debido a un error interno del servidor'
            }
        }

        // Verificar si el video existe
        if (!videoFile) {
            return {
                mensaje_error: 'Video no encontrado en la base de datos'
            }
        }

        if (videoFile.is_split) {
            /**b). Create request package for all segments:
             * Segment_1.mp4 +  Prompt b
             * ...
             * Segment_n.mp4 + Prompt b
            */
            const { id, mimetype, name } = videoFile;
            const videoExtension = mimetype.split('/')[1];
            const temporalUnicName = generateTemporalUnicName(id);
            const temporalFolder = join(this.PATH_TEMPORAL_VIDEOS, temporalUnicName);
            try {

                //Descargamos todos los segementos
                const segments = await this.fileSegmentRepository.find({
                    where: { parent_file_id: { id } }
                })
                this.logger.log('Video dividido en segmentos. Procesando por segmentos');

                if (!existsSync(temporalFolder)) mkdirSync(temporalFolder, { recursive: true });

                this.logger.log('Dividiendo videos...');
                const temporalVideos: {
                    filenameWithExtension: string,
                    mimeType: string,
                    pathWithFilenameAndWxtension: string,
                    segment_number: number
                }[] = await Promise.all(segments.map(async (segment) => {
                    const { id, segment_number } = segment;
                    const key = `${id}.${videoExtension}`;
                    const temporalVideo = join(temporalFolder, key);
                    await this.awsService.getObject(key, temporalVideo);
                    return {
                        filenameWithExtension: key,
                        mimeType: mimetype,
                        pathWithFilenameAndWxtension: temporalVideo,
                        segment_number: +segment_number
                    };
                }))

                //Lanzamos segemntos + prompt b
                this.logger.log('Enviando segentos + prompt b');
                const responses = (await Promise.all(temporalVideos.map(async (temporalVideo) => {
                    const { filenameWithExtension, mimeType, pathWithFilenameAndWxtension, segment_number } = temporalVideo;
                    const videoInGemini = await this.geminiService.loadLocallyStoredFile(
                        {
                            filenameWithExtension,
                            mimeType,
                            pathWithFilenameAndWxtension
                        }
                    )
                    if (await this.geminiService.fileIsActiveInGemini(videoInGemini)) {
                        this.logger.log('video active. procesando listongas');
                        const resuesta_de_IA = (await this.geminiService.simpleChat(question, [videoInGemini]));
                        this.logger.log({
                            message: `Se hizo una llamada a simpleChat`,
                            segment_number,
                            tokens: resuesta_de_IA.usageMetadata,
                            resuesta_de_IA: resuesta_de_IA.text,
                            TOTAL_TOKENS: `${this.totalTokens} + ${resuesta_de_IA.usageMetadata?.totalTokenCount} = ${this.totalTokens + (resuesta_de_IA.usageMetadata?.totalTokenCount || 0)}`
                        })
                        this.totalTokens += resuesta_de_IA.usageMetadata?.totalTokenCount || 0
                        return {
                            num_segmento: segment_number,
                            resuesta_de_IA: resuesta_de_IA.text
                        }
                    }
                    return undefined;
                }))).filter(
                    (response): response is { num_segmento: number; resuesta_de_IA: string } =>
                        response !== undefined && typeof response.resuesta_de_IA === 'string'
                );
                /**
                 * En resumen:
                 * El filter elimina los elementos undefined y asegura que solo queden objetos con la estructura esperada, facilitando el trabajo seguro con los datos en los siguientes pasos del código.
                 * TODO: Buscar mejores opciones
                 */

                this.logger.log('Everythong ok!');

                //Retornamos respuesta final
                return {
                    nombre_video: name,
                    video_analizado_por_segmentos: true,
                    resultado: responses
                }

            } catch (error) {
                if (error instanceof ApiError) {
                    if (error.status === 429) {
                        throw new WsException({
                            status: 492,
                            message: 'Has excedido el límite de peticiones por minutp, intenta más tarde',
                            details: 'No details'
                        })
                    }
                }
                throw new WsException({
                    status: error.status,
                    message: error.message,
                    details: error.details || 'No details'
                });
            } finally {
                rm(temporalFolder, { recursive: true });
            }



        } else {//El video no está dividido
            //Create request package just for one video video + prompt a

            const { id, mimetype, name } = videoFile;
            const videoExtension = mimetype.split('/')[1];
            const temporalUnicName = generateTemporalUnicName(id);
            const key = `${id}.${videoExtension}`;

            const temporalFolder = join(this.PATH_TEMPORAL_VIDEOS, temporalUnicName);
            const temporalVideo = join(temporalFolder, key);
            if (!existsSync(temporalFolder)) mkdirSync(temporalFolder, { recursive: true });

            try {
                //Descargaos el video en carpeta temporal
                await this.awsService.getObject(key, temporalVideo);

                //subimos el video a Gemini
                const videoInGemini = await this.geminiService.loadLocallyStoredFile({
                    filenameWithExtension: key,
                    mimeType: mimetype,
                    pathWithFilenameAndWxtension: temporalVideo
                })

                if (! await this.geminiService.fileIsActiveInGemini(videoInGemini))
                    throw new Error(`No fue posible subir el video ${name} a Gemini`);

                //enviamos la pregunta con el video y el prompt a
                const resultado = await this.geminiService.simpleChat(question, [videoInGemini]);
                this.logger.log({
                    message: `Se hizo una llamada a simpleChat`,
                    segment_number: 'fue un video que no estaba dividiso por segmentos',
                    tokens: resultado.usageMetadata,
                    resuesta_de_IA: resultado.text,
                    TOTAL_TOKENS: `${this.totalTokens} + ${resultado.usageMetadata?.totalTokenCount} = ${this.totalTokens + (resultado.usageMetadata?.totalTokenCount || 0)}`
                })
                this.totalTokens += resultado.usageMetadata?.totalTokenCount || 0
                return {
                    nombre_video: name,
                    video_analizado_por_segmentos: false,
                    resultado: resultado.text
                }

            } catch (error) {
                if (error instanceof ApiError) {
                    if (error.status === 429) {
                        throw new WsException({
                            status: 492,
                            message: 'Has excedido el límite de peticiones por minutp, intenta más tarde',
                            details: 'No details'
                        })
                    }
                }
                throw new WsException({
                    status: error.status,
                    message: error.message,
                    details: error.details || 'No details'
                });
            } finally {
                rm(temporalFolder, { recursive: true });
            }
        }
    }
}