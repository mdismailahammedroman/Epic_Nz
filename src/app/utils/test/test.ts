/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response, Router } from "express";
import { sendResponse } from "../SendResponse";
import { getIo } from "../../modules/socket/socket.store";

const router = Router();

router.post(
  "/send_message",
  async (req: Request, res: Response, next: NextFunction) => {
    const { text, receiverId } = req.body;
    const io = getIo();
    io.to(receiverId).emit("message", text);

    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Message sent success!",
      data: null,
    });
  },
);

export const testRouter = router;
