import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { TokenData } from '../interfaces/tokenData';
import { AuthenticatedSocket } from '../interfaces/authenticatedSocket';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: AuthenticatedSocket = context.switchToWs().getClient();
    const token: string | undefined = (
      client.handshake.auth as { token?: string }
    )?.token;

    if (!token || typeof token !== 'string') {
      throw new WsException('Token not provided');
    }

    try {
      const payload = this.jwt.verify<TokenData>(token);

      client.data.user = payload;
      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }
}
