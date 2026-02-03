import { Server, Socket } from "socket.io";

export const chatSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("💬 [Chat] client connected:", socket.id);

    socket.on("join-chat", (roomId: string) => {
      socket.join(roomId);
      console.log(`👥 [Chat] ${socket.id} joined ${roomId}`);
    });

    socket.on("leave-chat", (roomId: string) => {
      socket.leave(roomId);
      console.log(`🚪 [Chat] ${socket.id} left ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ [Chat] client disconnected:", socket.id);
    });
  });
};
