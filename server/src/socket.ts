import type { Server } from 'socket.io';

let io: Server | null = null;

export function setSocketServer(server: Server) {
  io = server;
}

export function emitToRoom(room: string, event: string, payload: unknown) {
  io?.to(room).emit(event, payload);
}
