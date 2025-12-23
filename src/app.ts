import cors from "cors";
import cookieParser from "cookie-parser";
import express, { Application } from "express";

const app: Application = express();

/**
 * ✅ Normal middlewares AFTER webhook
 */
app.use(express.json()); // Global JSON parser is now safe
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
  })
);

app.get("/", (_req, res) => {
  res.send("API Working...");
});

/**
 * ✅ API ROUTES
 */
app.use("/api/v1");

export default app;
