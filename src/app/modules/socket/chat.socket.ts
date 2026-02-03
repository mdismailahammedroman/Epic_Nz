// app/modules/chat/chat.socket.ts
import { Server, Socket } from "socket.io";

export const chatSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("💬 [Chat] client connected:", socket.id);

    // Join chat room
    socket.on("join-chat", (chatId: string) => {
      socket.join(chatId);
      console.log(`👥 ${socket.id} joined chat ${chatId}`);
    });

    // Leave chat room
    socket.on("leave-chat", (chatId: string) => {
      socket.leave(chatId);
      console.log(`🚪 ${socket.id} left chat ${chatId}`);
    });

    // Typing indicators
    socket.on("typing", (chatId: string) => {
      socket.to(chatId).emit("typing", { user: socket.id });
    });

    socket.on("stop-typing", (chatId: string) => {
      socket.to(chatId).emit("stop-typing", { user: socket.id });
    });

    socket.on("disconnect", () => {
      console.log("❌ [Chat] disconnected:", socket.id);
    });
  });
};
