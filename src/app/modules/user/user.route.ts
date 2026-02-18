import { Router } from "express";
import { userController } from "./user.controller";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "./user.interface";

const router = Router();

router.post(
  "/register",

  multerUpload.single("profile_picture"),
  userController.userRegister,
);

router.get("/get_me", checkAuth(...Object.keys(Role)), userController.getMe);
router.get(
  "/profile/:userId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userController.getProfile,
);
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userController.getAllUser,
);
router.patch(
  "/update-user",
  // multerUpload.single("coverPicture"),
  // multerUpload.single("profile_picture"),
  multerUpload.fields([
    { name: "coverPicture", maxCount: 1 },
    { name: "profile_picture", maxCount: 1 },
  ]),
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  userController.userUpdate,
);
router.delete(
  "/:userId",
  checkAuth(...Object.keys(Role)),
  userController.userDelete,
);

// Route to get user preferences
router.get(
  "/preferences",
  checkAuth(Role.USER),
  userController.getUserPreferences,
);

router.patch(
  "/preferences",
  checkAuth(Role.USER),
  userController.updateUserPreferences,
);

router.get(
  "/fcm-token",
  checkAuth(...Object.values(Role)),
  userController.getMyFcmToken,
);

router.patch(
  "/fcm-token",
  checkAuth(...Object.values(Role)),
  userController.updateFcmToken,
);

export const userRouter = router;
