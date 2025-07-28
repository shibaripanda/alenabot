import { Socket } from 'socket.io';
import { TokenData } from './tokenData';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: TokenData;
  };
}
