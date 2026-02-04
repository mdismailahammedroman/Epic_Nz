import { NextFunction, Request, Response, Router } from "express";
import { sendResponse } from "../SendResponse";
import { fcmMessaging } from "../../config/firebase.config";

const router = Router();

router.post(
  "/send_push",
  async (req: Request, res: Response, next: NextFunction) => {
    const tokens = [
      "fXnhFQxOSwq9rnG1OSJgaO:APA91bEcC45fDzw8D2lyqz6jOj19diTulcCeDXfUnO8f-qvHHzaL7-8FGRppWCEZKyhF6nqUUOYqO_n7M9RsNbSLgnnJj9KapBsrCXQ1MQNyBkTIbJPM8K4",
    ];

    try {
      const push = fcmMessaging().sendEachForMulticast({
        tokens: tokens,
        notification: {
          title: "Hamim vai er biye",
          body: "Kalke kacchi khabo",
        },
        data: {},
      });
      sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "message has been sent",
        data: push,
      });
    } catch (error) {
      next(error);
    }
  },
);

export const testRouter = router;
