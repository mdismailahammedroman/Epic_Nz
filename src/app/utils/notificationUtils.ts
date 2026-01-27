/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../errorHelper/AppError";
import { fcm } from "../config/firebase.config";

export const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {},
) => {
  if (!tokens || tokens.length === 0) {
    console.log("No tokens provided. Skipping notification.");
    return; // Early return if no tokens are provided
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };

    // Send notifications to all tokens using Firebase Cloud Messaging (FCM)
    const response = await fcm.sendEachForMulticast(message);

    // Log the response from FCM
    console.log("Successfully sent message:", response);

    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]); // Collect failed tokens
        }
      });

      console.log(
        "List of tokens that caused failures: " + failedTokens.join(", "),
      );
    } else {
      console.log("All notifications were sent successfully!");
    }

    return response;
  } catch (error) {
    console.error("Error sending push notification:", error); // Improved error logging
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to send push notification",
    );
  }
};
