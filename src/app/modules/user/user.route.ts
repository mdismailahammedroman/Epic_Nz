import { Router } from "express";
import { userController } from "./user.controller";
import { multerUpload } from "../../config/multer.config";

// '/registration',
// '/get_me',
// '/profile/:userId',
// '/',getAllUser
// '/:userId',
// '/:userId',

// '/verify/:otp',
// '/resend-otp',

const router = Router();

// POST request to register a new user
router.post(
  "/register", // Endpoint for user registration
  multerUpload.single("picture"), // Middleware to handle file upload
  userController.userRegister // Controller function to handle user registration
);

export const userRouter = router;
