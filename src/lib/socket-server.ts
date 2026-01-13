import { Server as SocketIOServer } from "socket.io";

let ioInstance: SocketIOServer | null = null;

export function setSocketIOServer(io: SocketIOServer) {
  ioInstance = io;
}

export function getSocketIOServer(): SocketIOServer | null {
  return ioInstance;
}

