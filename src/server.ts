import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";
import { Server as SocketIoServer } from "socket.io";
import "./app/utils/jobs/index";
import app from "./app";
import { envVar } from "./app/config/envVar";
import { connectRedis, redisClient } from "./app/config/redisConfig";
import { setIo } from "./app/modules/socket/socket.store";
import { initSockets } from "./app/modules/socket/socket";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";

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

    server.listen(PORT, '0.0.0.0' as any, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

(async () => {
  await connectRedis();
  await startServer();
  await seedSuperAdmin();
})();

// ---------------- Graceful Shutdown ----------------
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception!", err);
  shutdown(1);
});

process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled Rejection!", err);
  shutdown(1);
});

function shutdown(exitCode: number) {
  console.log("🧩 Shutting down...");
   redisClient.quit();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(exitCode); // MUST be number
  });
}

  
