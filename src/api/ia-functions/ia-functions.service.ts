import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join, basename } from 'path';
import { existsSync, mkdirSync, readdirSync, rmdirSync, rmSync } from 'fs'
import { File as FileGenai } from '@google/genai'

import { IaVideoFunctionDto } from './dto/create-ia-function.dto';
import { File } from 'src/api/files/entities/file.entity';
import { AwsS3Service } from 'src/modules/aws-s3/aws-s3.service';
import { GeminiService } from 'src/modules/gemini/gemini.service';
import { validVideoInstructions } from 'src/common/interfaces/valid-instructions';
import { SplitVideoService } from 'src/modules/split-video/split-video.service';


@Injectable()
export class IaFunctionsService {

  private readonly logger = new Logger('ia-function.service');

  //Variables para esperar a que el video este listo
  private readonly MAX_ATTEMPTS = 30; // 30 intentos * 10 segundos = 5 minuto máximo
  private readonly DELAY_MS = 10000; //10s

  //Variables para evaluar si se divide el videro para procesarse por partes o no
  private readonly MAX_SIZE_VIDEO = 500; //MB
  private readonly MAX_SIZE_PART_VIDEO = 95; //MB
  private readonly MINUTES_TO_SPLIT_VIDEO = 20;


  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly s3Service: AwsS3Service,
    private readonly geminiService: GeminiService,
    private readonly splitVideoService: SplitVideoService
  ) { }

  async analizeVideoAndReturnIaReponseText(iaVideoFunctionDto: IaVideoFunctionDto) {

    const { fileId, iaInstruction } = iaVideoFunctionDto

    //Get video. (from db) TODO: Verificar match de que el file le pertenezca al usuario
    this.logger.log({ InProcess: `Searching ${fileId} in DB` });
    const video = await this.fileRepository.findOneBy({ id: fileId })
    if (!video) throw new NotFoundException(`Video not found`);
    const { id, mimetype, size_bytes } = video;
    this.logger.log({ done: `File ${fileId}.${mimetype} got from DB` });

    //Si el video supera el tamaño permitido
    if (size_bytes > this.MAX_SIZE_VIDEO * 1000000) {
      throw new BadRequestException(`Size video must be lower than ${this.MAX_SIZE_VIDEO} mb`);
    }

    //Get video Object (from s3)
    this.logger.log({ InProcess: `Getting object ${fileId}.${mimetype} from S3` });
    const pathTempToSaveFile = join(__dirname, '../../filesTemp');
    if (!existsSync(pathTempToSaveFile)) mkdirSync(pathTempToSaveFile);
    const key = `${id}.${mimetype.split('/')[1]}`;
    const pathTemporalFileToSave = join(pathTempToSaveFile, key)
    await this.s3Service.getObject(key, pathTemporalFileToSave);
    this.logger.log({ done: `File ${key} got from s3` });

    //Decidimos si dividir el video o no
    if (size_bytes > this.MAX_SIZE_PART_VIDEO * 1000000) {

      this.logger.log({ InProcess: `Video > ${this.MAX_SIZE_PART_VIDEO} mb. Spliting video...` });

      //se crea una carpeta temportal con el nombre del id del video -> filesTemp/uuid/
      const outputDirForVideoParts = join(pathTempToSaveFile, `${id}`);

      // Crear directorio de output si no existe
      if (!existsSync(outputDirForVideoParts)) {
        mkdirSync(outputDirForVideoParts, { recursive: true });
      }

      //dividir video
      await this.splitVideoService.splitVideo(pathTemporalFileToSave, outputDirForVideoParts, this.MINUTES_TO_SPLIT_VIDEO)

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

      //upload videos to gemini
      this.logger.log({ InProcess: `Uploading video parts to gemini...` });
      const videoPartsInGemini = await this.geminiService.uploadMultipleFiles(
        videoPartsPaths.map(videoPartPath => {
          return {
            pathWithFilenameAndWxtension: videoPartPath,
            mimeType: mimetype,
            filenameWithExtension: `${id}_${basename(videoPartPath)}`
          }
        })
      );
      this.logger.log({ done: `Videos uploades` });

      //Obtenemos respuesta de gemini
      this.logger.log({ InProcess: `Getting responses from gemini...` });
      const responsesPartVideos = await Promise.all(
        videoPartsInGemini.map((videoPart, index) => {
          return this.processVideoPartInGeminiPlusPrompt(
            videoPart,
            validVideoInstructions[iaInstruction],
            index + 1
          )
        })
      )

      this.logger.log({ done: `Response generated` });
      rmSync(pathTemporalFileToSave);
      rmSync(outputDirForVideoParts, { recursive: true, force: true });

      //delete files in gemini
      this.geminiService.deleteFiles()
      return responsesPartVideos.join('\n\n');

    } else {

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
        throw new InternalServerErrorException(`Failed to upload video to Gemini`);
      }

      this.logger.log(`${fileGenai.displayName} state is ACTIVE`);

      //Generamos respuesta de gemini
      this.logger.log({ done: `Generating response from Gemini.`, Instruction: iaInstruction, video: fileGenai.displayName });
      const iaResponseText = await this.geminiService.simpleChat(validVideoInstructions[iaInstruction], [fileGenai]);
      rmSync(pathTemporalFileToSave);
      this.logger.log({ done: `Response generated` });

      this.geminiService.deleteFiles()
      return iaResponseText.text
    }
  }

  async videoWasReadyInGemini(fileGenai: FileGenai): Promise<boolean> {

    let fileState = fileGenai.state;
    const fileName = fileGenai.name;

    let attempts = 0;
    let videoLoadedSuccessfully = false;
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
          await new Promise(resolve => setTimeout(resolve, this.DELAY_MS));
      }

      fileState = (await this.geminiService.getFile(fileName as string)).state
      if (fileState === 'ACTIVE') videoLoadedSuccessfully = true;
    }

    this.logger.log({ done: `STATE IS ${fileState}` });
    return videoLoadedSuccessfully;

  }

  /**Se utiliza para enviar el prompt + una parte de un video + numero de parte y obetener la respuesta en texto. */
  async processVideoPartInGeminiPlusPrompt(fileGenai: FileGenai, prompt: string, partNum: number): Promise<string> {
    let response = `### Parte ${partNum}\n\n`

    if (! await this.videoWasReadyInGemini(fileGenai))
      return `No fue posible analizar la parte ${partNum} del video \n\n`;

    this.logger.log({ inProcess: `Getting response from gemini for part ${partNum}` })
    const responseIa = (await this.geminiService.simpleChat(prompt, [fileGenai])).text
    response = responseIa
      ? response + responseIa
      : response

    this.logger.log({ done: `Response got from gemini for part ${partNum}` })
    return response

  }

}
