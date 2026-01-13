import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let ioInstance: SocketIOServer | null = null;

export function setSocketIOServer(io: SocketIOServer) {
  ioInstance = io;
}

export function getSocketIOServer(): SocketIOServer | null {
  return ioInstance;
}

