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
  subscriptionController.stripeWebhook,
);

// 2️⃣ Normal middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "https://epicnz.app",
      "https://www.epicnz.app",
      "http://localhost:3000"
    ],
    credentials: true,
  })
);

app.set("trust proxy", 1);

app.use(safeSanitizeMiddleware);

session({
  secret: envVar.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none"
  }
})

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
