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

// 1️⃣ Stripe webhook FIRST
app.post(
  "/api/v1/subscription/webhook",
  express.raw({ type: "application/json" }),
  subscriptionController.stripeWebhook
);

// 2️⃣ Normal middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "http://209.38.86.70/api/",
  "http://209.38.86.70/",
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

// 6️⃣ Passport
app.use(passport.initialize());
app.use(passport.session());

const limiter = rateLimit({
  windowMs: Number(envVar.REQUEST_RATE_LIMIT_TIME) * 1000,
  max: Number(envVar.REQUEST_RATE_LIMIT),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

/* 🧭 ROUTES */
app.get("/", (_req, res) => res.send("API Working..."));
app.use("/api/v1", router);

/* ❌ ERRORS */
app.use(globalErrorHandler);
app.use(notFound);

export default app;
