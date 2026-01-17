import http from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app";
import { envVar } from "./app/config/envVar";
import { connectRedis } from "./app/config/redisConfig";

dotenv.config();

const PORT = envVar.PORT || 3000;
const MONGO_URL = envVar.MONGO_URI;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("geolocation", (data) => {
    console.log("Received geolocation:", data);
    socket.broadcast.emit("geolocation", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

(async () => {
  await startServer();
  await connectRedis();
})();

// ---------------- Global Error & Shutdown Handlers ----------------

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception! Server shutting down.", err);
  shutdown(1);
});

process.on("unhandledRejection", (error) => {
  console.error("⚠️ Unhandled Rejection! Server shutting down.", error);
  shutdown(1);
});

process.on("SIGTERM", (signal) => {
  console.log("🧩 SIGTERM received. Shutting down gracefully.", signal);
  shutdown(0);
});

process.on("SIGINT", (signal) => {
  console.log("🧩 SIGINT received (Ctrl+C). Shutting down.", signal);
  shutdown(0);
});

function shutdown(exitCode: number) {
  if (server) {
    server.close(() => {
      console.log("✅ Server closed.");
      process.exit(exitCode);
    });
  } else {
    process.exit(exitCode);
  }
}
