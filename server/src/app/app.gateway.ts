import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { SocketAuthMiddleware } from 'src/app/auth-guards/socket-auth.middleware';
import { WsJwtAuthGuard } from './auth-guards/socket-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly socketAuthMiddleware: SocketAuthMiddleware) {}
  @WebSocketServer()
  server: Server;

  // private logger: Logger = new Logger('AppGateway');

  afterInit(server: Server) {
    server.use((socket, next) => {
      this.socketAuthMiddleware.use(socket, next);
    });
    console.log('Socket server initialized');
    // this.logger.log('Socket server initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('messageToServer')
  @UseGuards(WsJwtAuthGuard)
  handleMessage(client: Socket, payload: any): void {
    // this.logger.log(
    //   `Received message from ${client.id}: ${JSON.stringify(payload)}`,
    // );
    this.server.emit('messageToClient', payload); // широковещательно всем
  }
}
