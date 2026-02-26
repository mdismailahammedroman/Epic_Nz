// app/modules/chat/chat.route.ts
import { Router } from "express";

import { ChatController } from "./chat.controller";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.post(
  "/send_message/:receiverId",
  multerUpload.array("image", 5),
  checkAuth(...Object.values(Role)),
  ChatController.sendMessage,
);

router.get(
  "/conversations",
  checkAuth(...Object.values(Role)),
  ChatController.getConversations,
);
router.get(
  "/messages/:otherUserId",
  checkAuth(...Object.values(Role)),
  ChatController.getMessages,
);
router.get(
  "/admin-messages",
  checkAuth(...Object.values(Role)),
  ChatController.getAdmin,
);

export const chatRoutes = router;
