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
import { subscriptionController } from "./app/modules/subscription/subscription.controller";

import "./app/config/firebase.config"; // ensures init at startup

dotenv.config();

const app: Application = express();

/* 🔐 STRIPE WEBHOOK (MUST BE FIRST) */
app.post(
  "/api/v1/subscription/webhook",
  express.raw({ type: "application/json" }),
  subscriptionController.stripeWebhook,
);

/* 🌐 STANDARD MIDDLEWARE */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://elflike-snoopy-ernie.ngrok-free.dev",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser (mobile, curl)
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  }),
);

app.set("trust proxy", 1);

app.use(safeSanitizeMiddleware);

app.use(
  session({
    secret: envVar.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());
/* 🚦 RATE LIMIT (EXCLUDE WEBHOOK) */
const limiter = rateLimit({
  windowMs: Number(envVar.REQUEST_RATE_LIMIT_TIME) * 1000,
  max: Number(envVar.REQUEST_RATE_LIMIT),
});

app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/subscription/webhook") return next();
  limiter(req, res, next);
});

/* 🧭 ROUTES */
app.get("/", (_req, res) => res.send("API Working..."));
app.use("/api/v1", router);

/* ❌ ERRORS */
app.use(globalErrorHandler);
app.use(notFound);

export default app;
