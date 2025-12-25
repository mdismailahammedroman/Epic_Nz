import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/login", authController.credentialLogin);
///refresh'
//('/change-password
//('/forget-password/:email
//('/reset-password/:email/:otp

export const AuthRouter = router;
