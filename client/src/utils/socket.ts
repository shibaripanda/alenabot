import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const createSocket = (token: string): Socket => {
  socket = io(import.meta.env.VITE_WEB_URL, {
    auth: {
      token,
    },
    transports: ['websocket'],
  });

  return socket;
};

export const getSocket = () => socket;