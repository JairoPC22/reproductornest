import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { QuestionsVideoService } from './questions-video.service';
import { Server, Socket } from 'socket.io';
import { Logger, UseFilters } from '@nestjs/common';
import { MessageAboutVideoDto } from './dto/messageAboutVideo.dto';
import { MyWsExceptionFilter } from '../../common/filters/WsException.filter';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

@UseFilters(new MyWsExceptionFilter())
@WebSocketGateway({ namespace: 'chatAboutVideo', cors: true })
export class QuestionsVideoGateway implements OnGatewayConnection, OnGatewayDisconnect {

    private readonly TEMPORAL_PATH = './filesTemp';
    private readonly logger = new Logger('questions-video.gateway');
    @WebSocketServer() wss: Server

    constructor(private readonly questionsVideoService: QuestionsVideoService) {
        if (!existsSync(this.TEMPORAL_PATH)) mkdirSync(this.TEMPORAL_PATH, { recursive: true });
    }

    handleConnection(client: Socket) {
        this.logger.log({ message: 'Client connected', clientId: client.id });

        // Crear el directorio del cliente cuando se conecta
        const clientPath = join(this.TEMPORAL_PATH, client.id);
        if (!existsSync(clientPath)) {
            mkdirSync(clientPath, { recursive: true });
        }

    }

    handleDisconnect(client: Socket) {
        this.logger.log({ message: 'Client disconnected', clientId: client.id });

        // Eliminar el directorio del cliente cuando se desconecta
        const clientPath = join(this.TEMPORAL_PATH, client.id);
        if (existsSync(clientPath)) {
            rmSync(clientPath, { recursive: true, force: true });
        }
    }

    /**
     * Eventos para escuchar en este endpoint
     * startMessageResponseAboutVideo: { state: 'start' }
     * endMessageResponseAboutVideo: {state: 'end'}
     * responseChatAboutVideo: string
     * exception: {status: 'error', message: string}
     */
    @SubscribeMessage('chat-about-video')
    async chatAboutVideo(client: Socket, messageAboutVideoDto: MessageAboutVideoDto) {
        const wsIdTemp = '1234';
        await this.questionsVideoService.chatAboutVideo(
            client,
            messageAboutVideoDto
        );
    }
}
