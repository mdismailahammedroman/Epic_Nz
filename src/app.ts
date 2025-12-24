import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import globalErrorHandler from "./app/errorHelper/globalErrorHandler"; // Error handler
import { router } from "./app/routes";
import notFound from "./app/helper/notFound";
import { envVar } from "./app/config/envVar";
import rateLimit from "express-rate-limit";
import safeSanitizeMiddleware from "./app/middleware/mongo-sanitize";

// Load environment variables
dotenv.config();

// Create the Express app
const app: Application = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ credentials: true }));
app.use(safeSanitizeMiddleware);

// Ensure the values are parsed as numbers
const rateLimitTime = Number(envVar.REQUEST_RATE_LIMIT_TIME) * 1000 * 10; // Convert to milliseconds
const rateLimitMax = Number(envVar.REQUEST_RATE_LIMIT); // Ensure this is a number

// Rate Limiter configuration
const limiter = rateLimit({
  windowMs: rateLimitTime, // Set the time window in milliseconds
  max: rateLimitMax, // Max requests allowed within the window
  message: {
    success: false,
    statusCode: 400,
    message: "Too many requests, please try again later.",
  },
});

// Apply rate limiting to all routes
app.use(limiter);

// Sample root route for testing
app.get("/", (_req, res) => {
  res.send("API Working...");
});

// API Routes (you can define your API routes here)
app.use("/api/v1", router); // Replace with actual routes

// Global Error Handler (Catches errors from routes and middleware)
app.use(globalErrorHandler);
app.use(notFound);
export default app; // Export the app instance
