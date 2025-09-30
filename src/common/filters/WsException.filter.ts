import { Catch, WsExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException)
export class MyWsExceptionFilter implements WsExceptionFilter {
    catch(exception: WsException, host: ArgumentsHost) {
        const client = host.switchToWs().getClient<Socket>(); // Cliente WebSocket

        // 1. Emitir el error al cliente
        client.emit('exception', exception.getError());
        /**Verificar que siempre enviemos:
         * status
         * message
         * details
         */
    }
}