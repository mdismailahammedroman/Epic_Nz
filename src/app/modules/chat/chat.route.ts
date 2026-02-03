// app/modules/chat/chat.route.ts
import { Router } from "express";

import { ChatController } from "./chat.controller";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";

const router = Router();

router.post(
  "/send_message",
  checkAuth(...Object.values(Role)),
  ChatController.sendMessage,
);

router.get(
  "/conversations",
  checkAuth(...Object.values(Role)),
  ChatController.getConversations,
);

router.get(
  "/:chatId/messages",
  checkAuth(...Object.values(Role)),
  ChatController.getMessages,
);

router.patch(
  "/:chatId/mark-read",
  checkAuth(...Object.values(Role)),
  ChatController.markMessagesAsRead,
);
export const chatRoutes = router;
