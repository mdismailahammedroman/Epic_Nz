import express, { Application } from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import globalErrorHandler from "./app/errorHelper/globalErrorHandler";
import { router } from "./app/routes";
import notFound from "./app/helper/notFound";
import { envVar } from "./app/config/envVar";
import rateLimit from "express-rate-limit";
import safeSanitizeMiddleware from "./app/middleware/mongo-sanitize";
import passport from "./app/config/passport.config";

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(safeSanitizeMiddleware);

app.use(
  session({
    secret: envVar.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const limiter = rateLimit({
  windowMs: Number(envVar.REQUEST_RATE_LIMIT_TIME) * 1000,
  max: Number(envVar.REQUEST_RATE_LIMIT),
});

app.use(limiter);

app.get("/", (_req, res) => {
  res.send("API Working...");
});

app.use("/api/v1", router);

app.use(globalErrorHandler);
app.use(notFound);

export default app;
