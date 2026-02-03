import { Server, Socket } from "socket.io";

export const notificationSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("🔔 [Notification] client connected:", socket.id);

    socket.on("join-notification", (userId: string) => {
      const room = `notification_${userId}`;
      socket.join(room);
      console.log(`🔔 ${socket.id} joined ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ [Notification] client disconnected:", socket.id);
    });
  });
};
