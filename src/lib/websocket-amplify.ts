import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  groupId?: string;
  message?: unknown;
  userId?: string;
  messageId?: string;
}

export function useWebSocketAmplify(groupId: string | null) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const connectRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    if (!session?.user?.id || !groupId) {
      return;
    }

    const wsEndpoint = process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT;
    if (!wsEndpoint) {
      console.warn("[WebSocket] WebSocket endpoint not configured");
      return;
    }

    // WebSocket接続URL（userIdをクエリパラメータとして送信）
    const wsUrl = `${wsEndpoint}?userId=${session.user.id}`;
    
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[WebSocket] Connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // 団体のルームに参加
        if (groupId) {
          ws.send(JSON.stringify({
            action: "join-group",
            groupId,
          }));
        }
      };

      ws.onclose = () => {
        console.log("[WebSocket] Disconnected");
        setIsConnected(false);
        setSocket(null);

        // 再接続を試みる
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (connectRef.current) {
              connectRef.current();
            }
          }, delay);
        } else {
          console.error("[WebSocket] Max reconnect attempts reached");
        }
      };

      ws.onerror = (error: Event) => {
        console.error("[WebSocket] Error:", error);
      };

      setSocket(ws);
    } catch (error: unknown) {
      console.error("[WebSocket] Connection error:", error);
    }
  }, [session?.user?.id, groupId]);

  // connect関数をrefに保存（useEffect内で更新）
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (groupId && session?.user?.id) {
      connect();
    }

    return () => {
      if (socket) {
        // 団体のルームから退出
        if (groupId) {
          try {
            socket.send(JSON.stringify({
              action: "leave-group",
              groupId,
            }));
          } catch (error: unknown) {
            console.error("[WebSocket] Error leaving group:", error);
          }
        }
        socket.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [groupId, session?.user?.id, connect, socket]);

  const sendMessage = useCallback((groupId: string, message: unknown) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("[WebSocket] Socket not connected");
      return false;
    }

    try {
      socket.send(JSON.stringify({
        action: "send-message",
        groupId,
        message,
      }));
      return true;
    } catch (error: unknown) {
      console.error("[WebSocket] Error sending message:", error);
      return false;
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    sendMessage,
  };
}

export function useWebSocketMessageHandler<T = unknown>(
  socket: WebSocket | null,
  onNewMessage: (data: { groupId: string; message: T }) => void,
  onReadUpdated: (data: { groupId: string; userId: string; messageId: string }) => void
) {
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data as string);

        if (data.type === "new-message" && data.groupId && data.message) {
          onNewMessage({
            groupId: data.groupId,
            message: data.message as T,
          });
        } else if (data.type === "read-updated" && data.groupId && data.userId && data.messageId) {
          onReadUpdated({
            groupId: data.groupId,
            userId: data.userId,
            messageId: data.messageId,
          });
        }
      } catch (error: unknown) {
        console.error("[WebSocket] Error parsing message:", error);
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, onNewMessage, onReadUpdated]);
}

