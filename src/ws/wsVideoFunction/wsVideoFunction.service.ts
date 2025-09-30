import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File as FileGenai } from '@google/genai'
import { basename, join } from 'path';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';

import { File } from 'src/api/files/entities/file.entity';
import { AwsS3Service } from 'src/modules/aws-s3/aws-s3.service';
import { GeminiService } from 'src/modules/gemini/gemini.service';
import { WsException } from '@nestjs/websockets';
import { OutputGetVideoFromS3, OutputSplitVideoAndSaveParts, ParamsGetVideoFromDB } from './interfaces/ParamsWsIaFunctionsService.interfaces';
import { Socket } from 'socket.io';
import { validVideoInstructions } from 'src/common/interfaces/valid-instructions';
import { SplitVideoService } from 'src/modules/split-video/split-video.service';

@Injectable()
export class WsVideoFunctionsService {

  private readonly logger = new Logger('ws-ia-functions.service')

  //Variables para esperar a que el video este listo
  private readonly MAX_ATTEMPTS = 30; // 30 intentos * 10 segundos = 5 minuto máximo
  private readonly DELAY_MS = 5000; //5s

  //Variables para evaluar si se divide el videro para procesarse por partes o no
  private readonly MAX_SIZE_VIDEO = 500; //MB
  private readonly MINUTES_TO_SPLIT_VIDEO = 20;

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly s3Service: AwsS3Service,
    private readonly geminiService: GeminiService,
    private readonly splitVideoService: SplitVideoService
  ) { }

  async getVideoFronDB(fileId: string, client: Socket): Promise<ParamsGetVideoFromDB> {

    //Get video from db TODO: Verificar match de que el file le pertenezca al usuario
    this.logger.log({ InProcess: `Searching ${fileId} in DB` });
    const video = await this.fileRepository.findOneBy({ id: fileId })
    if (!video) throw new WsException('Video not found');
    const { id, mimetype, size_bytes } = video;

    //Si el video supera el tamaño permitido
    if (size_bytes > this.MAX_SIZE_VIDEO * 1000000) {
      client.emit('endMessageResponse', { state: 'end' });
      throw new WsException(`Size video must be lower than ${this.MAX_SIZE_VIDEO} mb`);
    }

    this.logger.log({ done: `File ${fileId}.${mimetype} got from DB` });
    return { id, mimetype, size_bytes };
  }

  async getVideoFromS3(fileId: string, mimetype: string, client: Socket): Promise<OutputGetVideoFromS3> {

    //Get video Object (from s3)
    this.logger.log({ InProcess: `Getting object ${fileId}.${mimetype} from S3` });
    const pathTempToSaveFile = join(__dirname, '../../filesTemp');
    if (!existsSync(pathTempToSaveFile)) mkdirSync(pathTempToSaveFile);
    const key = `${fileId}.${mimetype.split('/')[1]}`;
    const pathTemporalFileToSave = join(pathTempToSaveFile, key)

    try {
      await this.s3Service.getObject(key, pathTemporalFileToSave);
      this.logger.log({ done: `File ${key} got from s3` });
      return { pathTempToSaveFile, pathTemporalFileToSave, key }
    } catch (error) {
      client.emit('endMessageResponse', { state: 'end' });
      throw new WsException(error.message);
    }
  }

  async splitVideoAndSaveParts(
    pathTempToSaveFile: string,
    pathTemporalFileToSave: string,
    fileId: string
  ): Promise<OutputSplitVideoAndSaveParts> {
    const outputDirForVideoParts = join(pathTempToSaveFile, `${fileId}`);

    // Crear directorio de output si no existe
    if (!existsSync(outputDirForVideoParts)) {
      mkdirSync(outputDirForVideoParts, { recursive: true });
    }

    //dividir video
    try {
      await this.splitVideoService.splitVideo(
        pathTemporalFileToSave,
        outputDirForVideoParts,
        this.MINUTES_TO_SPLIT_VIDEO)
    } catch (error) {
      throw new WsException(error.message);
    }

    //obtenemos todos las partes
    const videoPartsPaths = readdirSync(outputDirForVideoParts)
      .filter(file => file.startsWith('segment_'))
      .sort()// Ordenar alfabéticamente (segment_001, segment_002, etc.)
      .map(file => join(outputDirForVideoParts, file));
    this.logger.log({ done: `Video divided`, videoParts: videoPartsPaths });
    /**
     * Result:
     * [
     * "/home/abdiel/Documents/dacuai-backend/filesTemp/f53d372a-40bb-4141-b5cc-a207ede1fcd9/segment_000.mp4",
     * "/home/abdiel/Documents/dacuai-backend/filesTemp/f53d372a-40bb-4141-b5cc-a207ede1fcd9/segment_001.mp4",
     * "/home/abdiel/Documents/dacuai-backend/filesTemp/f53d372a-40bb-4141-b5cc-a207ede1fcd9/segment_002.mp4",
     * "/home/abdiel/Documents/dacuai-backend/filesTemp/f53d372a-40bb-4141-b5cc-a207ede1fcd9/segment_003.mp4",
     * "/home/abdiel/Documents/dacuai-backend/filesTemp/f53d372a-40bb-4141-b5cc-a207ede1fcd9/segment_004.mp4",
     * "/home/abdiel/Documents/dacuai-backend/filesTemp/f53d372a-40bb-4141-b5cc-a207ede1fcd9/segment_005.mp4"
     * ]
     */

    return { videoPartsPaths, outputDirForVideoParts };

  }

  async getSingleResponseFromGemini(
    pathTemporalFileToSave: string,
    mimetype: string,
    key: string,
    iaInstruction: string,
    client: Socket
  ): Promise<void> {
    //Subimos el video a Gemini
    this.logger.log({ InProcess: `Uploading file to Gemini...` });
    const fileGenai = await this.geminiService.loadLocallyStoredFile(
      {
        pathWithFilenameAndWxtension: pathTemporalFileToSave,
        mimeType: mimetype,
        filenameWithExtension: key
      }
    );

    const videoWasReady = await this.videoWasReadyInGemini(fileGenai);

    if (!videoWasReady) {
      rmSync(pathTemporalFileToSave);
      client.emit('endMessageResponse', { state: 'end' });
      throw new WsException(`Failed to upload video to Gemini`);
    }

    this.logger.log(`${fileGenai.displayName} state is ACTIVE`);

    //Generamos respuesta de gemini
    this.logger.log({ done: `Generating response from Gemini.`, Instruction: iaInstruction, video: fileGenai.displayName });
    let iaResponseText
    try {
      client.emit('videoIaProcessStatus', { state: 'Dacuai está pensando' });
      iaResponseText = await this.geminiService.simpleChatStreaming(validVideoInstructions[iaInstruction], [fileGenai]);

      for await (const chunk of iaResponseText) {
        client.emit('videoIaMessageResponse', chunk.text )
      }
    } catch (error) {
      client.emit('endMessageResponse', { state: 'end' });
      throw new WsException(error.message);
    }
    rmSync(pathTemporalFileToSave);
    this.logger.log({ done: `Response generated` });

    this.geminiService.deleteFiles()
  }

  /**Se utiliza para procesar un video por partes */
  async getMultipleResponsesFromGemini(
    videoPartsPaths: string[],
    mimetype: string,
    fileId: string,
    iaInstruction: string,
    pathTemporalFileToSave: string,
    outputDirForVideoParts: string,
    client: Socket

  ): Promise<void> {
    //upload videos to gemini
    this.logger.log({ InProcess: `Uploading video parts to gemini...` });
    let videoPartsInGemini: FileGenai[];
    try {
      videoPartsInGemini = await this.geminiService.uploadMultipleFiles(
        videoPartsPaths.map(videoPartPath => {
          return {
            pathWithFilenameAndWxtension: videoPartPath,
            mimeType: mimetype,
            filenameWithExtension: `${fileId}_${basename(videoPartPath)}`
          }
        })
      );
      this.logger.log({ done: `Videos uploades` });

    } catch (error) {
      client.emit('endMessageResponse', { state: 'end' });
      throw new WsException(error.message);
    }

    //Obtenemos respuesta de gemini
    this.logger.log({ InProcess: `Getting responses from gemini...` });

    //Enviamos mensaje de inicio
    for (const [index, VideoPart] of videoPartsInGemini.entries()) {
      client.emit('videoIaProcessStatus', { state: 'Dacuai esta pensando' });
      await this.processVideoPartInGeminiPlusPrompt(
        VideoPart,
        validVideoInstructions[iaInstruction],
        index + 1,
        client
      );

    }
    /**Promise.all: Para procesar en paralelo y si espera a que las promesas se resuelvan. Util para eficientar tiempo
     * forEach: Para procesar concurrentemente, sin esperar a que las promesas se resuelvan
     * for of: Procesa secuencialmente, si espera a que las promesas se resuelvan
    */


    this.logger.log({ done: `Response generated` });
    rmSync(pathTemporalFileToSave);
    rmSync(outputDirForVideoParts, { recursive: true, force: true });

    //delete files in gemini
    this.geminiService.deleteFiles()
    // return responsesPartVideos.join('\n\n');
  }

  /**Se utiliza para recibir el status del archivo en gemini, si ya esta listo para usarse o está en PROCESSING 
   * Para ambos, procesar video por partes y procesar un video entero
  */
  private async videoWasReadyInGemini(fileGenai: FileGenai): Promise<boolean> {

    const fileName = fileGenai.name;
    let fileState = (await this.geminiService.getFile(fileName as string)).state

    let attempts = 0;
    let videoLoadedSuccessfully = true;
    while (fileState !== 'ACTIVE' && attempts < this.MAX_ATTEMPTS) {
      attempts++;

      switch (fileState) {
        case 'PROCESSING':
          this.logger.log(`Waiting for file to be ready (attempt ${attempts}/${this.MAX_ATTEMPTS}). Current state: ${fileGenai.state}`);
          await new Promise(resolve => setTimeout(resolve, this.DELAY_MS));
          break;

        case 'FAILED':
          this.logger.error(`File ${fileGenai.displayName} failed processing. Final state: ${fileGenai.state}`);
          videoLoadedSuccessfully = false;
          break;

        default:
          this.logger.warn(`Unexpected state: ${fileGenai.state}. Waiting...`);
          videoLoadedSuccessfully = false;
          await new Promise(resolve => setTimeout(resolve, this.DELAY_MS));
      }

      fileState = (await this.geminiService.getFile(fileName as string)).state
      videoLoadedSuccessfully = fileState === 'ACTIVE';
    }

    this.logger.log({ done: `${fileGenai.displayName} STATE IS ${fileState}` });
    return videoLoadedSuccessfully;

  }

  /**Se utiliza para enviar el prompt + una parte de un video + numero de parte y obetener la respuesta en texto. 
   * Para procesar video por partes en getMultipleResponsesFromGemini
   * Aquí se emite al client: Socket
  */
  private async processVideoPartInGeminiPlusPrompt(
    fileGenai: FileGenai,
    prompt: string,
    partNum: number,
    client: Socket
  ): Promise<void> {

    //Esperamos a que el video este listo para utilizarse en los servidores de gemini
    if (! await this.videoWasReadyInGemini(fileGenai))
      throw new WsException(`NO fue posible preparar el video ${fileGenai.displayName}`);

    this.logger.log({ inProcess: `Getting response from gemini for ${fileGenai.displayName}` })
    try {

      const responseIa = await this.geminiService.simpleChatStreaming(prompt, [fileGenai]);

      let responseHeader = `### Parte ${partNum}\n\n`
      client.emit('videoIaMessageResponse', responseHeader)

      for await (const chunk of responseIa) {
        client.emit('videoIaMessageResponse', chunk.text)
      }
      //envio qué parte del video se estpa procesando. Para debug solamente
      // for await (const chunk of responseIa) {
      //   client.emit('videoIaMessageResponse', {
      //     part: partNum,
      //     text: chunk.text
      //   })
      // }

    } catch (error) {
      throw new WsException(error.message);
    }

    this.logger.log({ done: `Response got from gemini for part ${partNum}` })
    // return response;

  }


}
