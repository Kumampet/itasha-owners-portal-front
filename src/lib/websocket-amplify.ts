import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  groupId?: string;
  message?: any;
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
            connect();
          }, delay);
        } else {
          console.error("[WebSocket] Max reconnect attempts reached");
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
      };

      setSocket(ws);
    } catch (error) {
      console.error("[WebSocket] Connection error:", error);
    }
  }, [session?.user?.id, groupId]);

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
          } catch (error) {
            console.error("[WebSocket] Error leaving group:", error);
          }
        }
        socket.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [groupId, session?.user?.id, connect]);

  const sendMessage = useCallback((groupId: string, message: any) => {
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
    } catch (error) {
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

export function useWebSocketMessageHandler(
  socket: WebSocket | null,
  onNewMessage: (data: { groupId: string; message: any }) => void,
  onReadUpdated: (data: { groupId: string; userId: string; messageId: string }) => void
) {
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);

        if (data.type === "new-message" && data.groupId && data.message) {
          onNewMessage({
            groupId: data.groupId,
            message: data.message,
          });
        } else if (data.type === "read-updated" && data.groupId && data.userId && data.messageId) {
          onReadUpdated({
            groupId: data.groupId,
            userId: data.userId,
            messageId: data.messageId,
          });
        }
      } catch (error) {
        console.error("[WebSocket] Error parsing message:", error);
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, onNewMessage, onReadUpdated]);
}

