import { Router } from "express";
import { userController } from "./user.controller";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "./user.interface";

const router = Router();

router.post(
  "/register",

  multerUpload.single("profile_picture"),
  userController.userRegister
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

// Route to get user preferences
router.get(
  "/preferences",
  checkAuth(Role.USER),
  userController.getUserPreferences
);

router.put(
  "/preferences",
  checkAuth(Role.USER),
  userController.updateUserPreferences
);

export const userRouter = router;
