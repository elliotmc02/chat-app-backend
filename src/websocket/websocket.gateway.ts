import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { User } from 'src/interfaces/User';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private users: Map<string, User> = new Map();
  private rooms: Map<string, Set<string>> = new Map();

  handleConnection(@ConnectedSocket() client: Socket) {
    const username = `User_${client.id.slice(0, 5)}`;
    this.users.set(client.id, {
      id: client.id,
      username,
      rooms: new Set(),
    });

    client.join('global');
    this.users.get(client.id).rooms.add('global');

    client.emit('connected', {
      id: client.id,
      username,
    });
    this.server.emit('getConnectedUsers', this.getConnectedUsers());
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = this.users.get(client.id);
    if (user) {
      user.rooms.forEach((roomId) => {
        const room = this.rooms.get(roomId);
        if (room) {
          room.delete(client.id);
          if (room.size === 0) {
            this.rooms.delete(roomId);
          }
        }
      });
      this.users.delete(client.id);

      this.server.emit('getConnectedUsers', this.getConnectedUsers());
    }
  }

  @SubscribeMessage('globalMessage')
  handleGlobalMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: string,
  ) {
    const user = this.users.get(client.id);
    if (user) {
      this.server.to('global').emit('globalMessage', {
        userId: user.id,
        username: user.username,
        message,
        timestamp: new Date().toISOString().split('T')[0],
      });
    }
  }

  @SubscribeMessage('getConnectedUsers')
  handleGetConnectedUsers(@ConnectedSocket() client: Socket) {
    client.emit('getConnectedUsers', this.getConnectedUsers());
  }

  private getConnectedUsers() {
    return Array.from(this.users.values()).map((user) => ({
      id: user.id,
      username: user.username,
      rooms: Array.from(user.rooms),
    }));
  }
}
