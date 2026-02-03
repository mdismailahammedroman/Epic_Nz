/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";
import { Server as SocketIoServer } from "socket.io";

import app from "./app";
import { envVar } from "./app/config/envVar";
import { connectRedis } from "./app/config/redisConfig";
import { setIo } from "./app/modules/socket/socket.store";
import { initSockets } from "./app/modules/socket/socket";

dotenv.config();

const PORT = envVar.PORT || 3000;
const MONGO_URL = envVar.MONGO_URI;

// ---------------- Create HTTP Server ----------------
const server = http.createServer(app);

const io = new SocketIoServer(server, {
  cors: {
    origin: envVar.FRONTEND_URL,
    credentials: true,
  },
});

// 🔥 IMPORTANT ORDER
setIo(io);
initSockets(io);

// ---------------- Start Server ----------------
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ MongoDB connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

(async () => {
  await startServer();
  await connectRedis();
})();

// ---------------- Graceful Shutdown ----------------
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception!", err);
  shutdown(1);
});

process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled Rejection!", err);
  shutdown(1);
});

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

function shutdown(exitCode = 0) {
  console.log("🧩 Shutting down...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(exitCode);
  });
}
