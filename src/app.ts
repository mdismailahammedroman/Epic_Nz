import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import globalErrorHandler from "./app/errorHelper/globalErrorHandler"; // Error handler
import { router } from "./app/routes";

// Load environment variables
dotenv.config();

// Create the Express app
const app: Application = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ credentials: true }));

// Sample root route for testing
app.get("/", (_req, res) => {
  res.send("API Working...");
});

// API Routes (you can define your API routes here)
app.use("/api/v1", router); // Replace with actual routes

// Global Error Handler (Catches errors from routes and middleware)
app.use(globalErrorHandler);

export default app; // Export the app instance
