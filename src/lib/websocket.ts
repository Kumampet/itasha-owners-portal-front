import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

let socketInstance: Socket | null = null;

export function getSocket(userId?: string): Socket | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (socketInstance?.connected) {
    return socketInstance;
  }

  if (!userId) {
    return null;
  }

  // Socket.ioクライアントの初期化
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
  socketInstance = io(socketUrl, {
    path: "/api/socket.io",
    auth: {
      userId,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socketInstance.on("connect", () => {
    console.log("[WebSocket] Connected");
  });

  socketInstance.on("disconnect", () => {
    console.log("[WebSocket] Disconnected");
  });

  socketInstance.on("error", (error) => {
    console.error("[WebSocket] Error:", error);
  });

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function useWebSocket(groupId: string | null) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !groupId) {
      return;
    }

    const socket = getSocket(session.user.id);
    if (!socket) {
      return;
    }

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // 団体のルームに参加
      socket.emit("join-group", groupId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // クリーンアップ
    return () => {
      if (socket && groupId) {
        socket.emit("leave-group", groupId);
      }
    };
  }, [session?.user?.id, groupId]);

  // socketRefは内部状態管理用で、外部に公開しない
  // 代わりに、isConnectedとsendMessage関数を提供
  return {
    isConnected,
    sendMessage: (message: unknown) => {
      if (socketRef.current && socketRef.current.readyState === 1) {
        socketRef.current.send(JSON.stringify(message));
        return true;
      }
      return false;
    },
  };
}

