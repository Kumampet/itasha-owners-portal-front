import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { setSocketIOServer } from "./src/lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Socket.ioサーバーの初期化
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: dev ? "http://localhost:3000" : process.env.NEXTAUTH_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socket.io",
  });

  // Socket.ioインスタンスをエクスポート（API Routeから使用可能にする）
  setSocketIOServer(io);

  // 認証済みの接続を管理
  const authenticatedUsers = new Map<string, { userId: string; groupIds: Set<string> }>();

  // 接続時の認証ミドルウェア
  io.use(async (socket, next) => {
    try {
      // クライアントから送信されたuserIdを取得
      const userId = socket.handshake.auth.userId;
      
      if (!userId) {
        return next(new Error("User ID required"));
      }

      // ユーザーが存在するか確認
      const { prisma } = await import("./src/lib/prisma");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, is_banned: true },
      });

      if (!user) {
        return next(new Error("User not found"));
      }

      if (user.is_banned) {
        return next(new Error("User is banned"));
      }

      // 認証情報をsocketに保存
      (socket as any).userId = userId;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket as any).userId;
    console.log(`[Socket] User connected: ${userId}`);

    // ユーザーが参加している団体を取得
    try {
      const { prisma } = await import("./src/lib/prisma");
      const userEvents = await prisma.userEvent.findMany({
        where: {
          user_id: userId,
          group_id: {
            not: null,
          },
        },
        include: {
          group: {
            select: {
              id: true,
            },
          },
        },
      });

      const groupIds = userEvents
        .filter((ue) => ue.group)
        .map((ue) => ue.group!.id);

      // ユーザー情報を保存
      authenticatedUsers.set(socket.id, {
        userId,
        groupIds: new Set(groupIds),
      });

      // 各団体のルームに参加
      groupIds.forEach((groupId) => {
        socket.join(`group:${groupId}`);
        console.log(`[Socket] User ${userId} joined group:${groupId}`);
      });
    } catch (error) {
      console.error("Error fetching user groups:", error);
    }

    // 団体に参加
    socket.on("join-group", (groupId: string) => {
      socket.join(`group:${groupId}`);
      const userInfo = authenticatedUsers.get(socket.id);
      if (userInfo) {
        userInfo.groupIds.add(groupId);
      }
      console.log(`[Socket] User ${userId} joined group:${groupId}`);
    });

    // 団体から退出
    socket.on("leave-group", (groupId: string) => {
      socket.leave(`group:${groupId}`);
      const userInfo = authenticatedUsers.get(socket.id);
      if (userInfo) {
        userInfo.groupIds.delete(groupId);
      }
      console.log(`[Socket] User ${userId} left group:${groupId}`);
    });

    // メッセージ送信
    socket.on("send-message", async (data: { groupId: string; message: any }) => {
      try {
        const { groupId, message } = data;
        
        // ユーザーがこの団体のメンバーか確認
        const userInfo = authenticatedUsers.get(socket.id);
        if (!userInfo || !userInfo.groupIds.has(groupId)) {
          socket.emit("error", { message: "Not a member of this group" });
          return;
        }

        // メッセージをブロードキャスト（送信者を含む全メンバーに）
        io.to(`group:${groupId}`).emit("new-message", {
          groupId,
          message,
        });

        console.log(`[Socket] Message sent to group:${groupId} by user:${userId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // 既読状態の更新
    socket.on("mark-read", async (data: { groupId: string; messageId: string }) => {
      try {
        const { groupId, messageId } = data;
        
        // ユーザーがこの団体のメンバーか確認
        const userInfo = authenticatedUsers.get(socket.id);
        if (!userInfo || !userInfo.groupIds.has(groupId)) {
          return;
        }

        // 未読状態の更新をブロードキャスト
        io.to(`group:${groupId}`).emit("read-updated", {
          groupId,
          userId,
          messageId,
        });

        console.log(`[Socket] Read status updated for group:${groupId} by user:${userId}`);
      } catch (error) {
        console.error("Error updating read status:", error);
      }
    });

    // 切断時
    socket.on("disconnect", () => {
      authenticatedUsers.delete(socket.id);
      console.log(`[Socket] User disconnected: ${userId}`);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});

