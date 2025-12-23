import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { Server } from "node:http";

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ credentials: true }));

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.send("API Working...");
});

// API Routes (Placeholder for future routes)
app.use("/api/v1", (req, res) => {
  res.send("API v1");
});

// Global Error Handler (Catches errors from routes and middleware)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong!" });
});

// Create and start server
let server: Server;
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error starting the server:", err);
  }
}

(async () => {
  await startServer();
})();

// Graceful shutdown
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
