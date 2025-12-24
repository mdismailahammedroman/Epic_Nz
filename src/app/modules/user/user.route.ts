import { Router } from "express";
import { userController } from "./user.controller";

// '/registration',
// '/get_me',
// '/profile/:userId',
// '/',getAllUser
// '/:userId',
// '/:userId',

// '/verify/:otp',
// '/resend-otp',

const router = Router();

router.post("/register", userController.userRegister);

export const userRouter = router;
