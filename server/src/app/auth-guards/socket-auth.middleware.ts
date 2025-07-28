import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenData } from '../interfaces/tokenData';
import { AuthenticatedSocket } from '../interfaces/authenticatedSocket';

@Injectable()
export class SocketAuthMiddleware {
  constructor(private jwt: JwtService) {}
  use(socket: AuthenticatedSocket, next: (err?: any) => void) {
    const token: string | undefined = (
      socket.handshake.auth as { token?: string }
    )?.token;

    if (!token || typeof token !== 'string') {
      return next(new UnauthorizedException('Token not provided'));
    }

    try {
      const payload = this.jwt.verify<TokenData>(token);
      socket.data.user = payload;
      next();
    } catch (err) {
      console.log(err);
      return next(new UnauthorizedException('Invalid token'));
    }
  }
}
