import { WebSocketGateway, SubscribeMessage, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, WsException } from '@nestjs/websockets';
import { WsVideoFunctionsService } from './wsVideoFunction.service';
import { Server, Socket } from 'socket.io';
import { Logger, UseFilters } from '@nestjs/common';
import { IaVideoFunctionDto } from './dto/videoIaFunction.dto';
import { MyWsExceptionFilter } from '../../common/filters/WsException.filter';
import { validVideoInstructions } from 'src/common/interfaces/valid-instructions';
import path from 'path';

@UseFilters(new MyWsExceptionFilter())
@WebSocketGateway({ namespace: 'videoIaFunction', cors: true })
export class WsVideoFunctionsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger = new Logger('WsIaFunctions.gateway');
  @WebSocketServer() wss: Server

  //Variables para evaluar si se divide el videro para procesarse por partes o no
  private readonly MAX_SIZE_PART_VIDEO = 95; //MB

  constructor(
    private readonly wsIaFunctionsService: WsVideoFunctionsService
  ) { }
  handleDisconnect(client: Socket) {
    this.logger.log({ message: 'Client disconnected', clientId: client.id});
  }

  async handleConnection(client: Socket) {
    this.logger.log({ message: 'Client connected', clientId: client.id });
  }

  /**
   * Eventos para escuchar en este ws:
   * 
   * startMessageResponse: {state: 'start'}
   * endMessageResponse: {state: 'end'}
   * videoIaMessageResponse: string
   * videoIaProcessStatus: {state: string (Procesando video, Dacuai esta pensando)}
   * exception: {status: 'error', message: string}
   * 
   * TODO: 
   *  1. Cuando se lanze WsException, el proceso se detenga
   *  2. Conectar a DB y guardar conversación
   */
  @SubscribeMessage('videoIaFunctionRequest')
  async analizeVideo(client: Socket, iaVideoFunctionDto: IaVideoFunctionDto) {
    const { fileId, iaInstruction, chatId } = iaVideoFunctionDto;

    client.emit('startMessageResponse', { state: 'start' });
    if (!Object.keys(validVideoInstructions).includes(iaInstruction)) {
      client.emit('endMessageResponse', { state: 'end' });
      throw new WsException(`Instrucción de IA inválida para videos`);
    }

    client.emit('videoIaProcessStatus', { state: 'Procesando video' });
    //Get video from db
    const {
      id,
      mimetype,
      size_bytes
    } = await this.wsIaFunctionsService.getVideoFronDB(fileId, client);

    //Get video from s3
    const {
      pathTempToSaveFile,
      pathTemporalFileToSave,
      key
    } = await this.wsIaFunctionsService.getVideoFromS3(fileId, mimetype, client);

    if (size_bytes > this.MAX_SIZE_PART_VIDEO * 1000000) {

      //Se procesa el video por partes
      this.logger.log({ InProcess: `Size video: ${size_bytes}Video > ${this.MAX_SIZE_PART_VIDEO} mb. Spliting video...` });

      const {
        videoPartsPaths,
        outputDirForVideoParts
      } = await this.wsIaFunctionsService.splitVideoAndSaveParts(
        pathTempToSaveFile,
        pathTemporalFileToSave,
        fileId
      );

      //Upload to gemini
      //EN esta función este el client.emit('videoIaFunctionResponse'...)
      await this.wsIaFunctionsService.getMultipleResponsesFromGemini(
        videoPartsPaths,
        mimetype,
        fileId,
        iaInstruction,
        pathTemporalFileToSave,
        outputDirForVideoParts,
        client
      );

      client.emit('endMessageResponse', { state: 'end' });

    } else {
      //Se procesa el video completo

      await this.wsIaFunctionsService.getSingleResponseFromGemini(
        pathTemporalFileToSave,
        mimetype,
        key,
        iaInstruction,
        client
      );

      client.emit('endMessageResponse', { state: 'end' });

    }

  }

}
