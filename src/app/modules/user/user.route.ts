import { Router } from "express";
import { userController } from "./user.controller";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "./user.interface";

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

router.get("/get_me", checkAuth(...Object.keys(Role)), userController.getMe);
router.get(
  "/profile/:userId",
  checkAuth(...Object.keys(Role)),
  userController.getProfile
);
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.USER),
  userController.getAllUser
);
router.patch("/:userId", checkAuth(Role.USER), userController.userUpdate);
router.delete(
  "/:userId",
  checkAuth(...Object.keys(Role)),
  userController.userDelete
);

export const userRouter = router;
