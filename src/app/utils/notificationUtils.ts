/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../errorHelper/AppError";
import { fcmMessaging } from "../config/firebase.config";

/**
 * FCM data payload must be string -> string.
 * This helper converts any values to strings safely.
 */
const normalizeData = (data: Record<string, any> = {}) => {
  const normalized: Record<string, string> = {};
  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    normalized[k] = typeof v === "string" ? v : String(v);
  });
  return normalized;
};

interface PushResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
  failedTokens: string[];
  response: any;
}

export const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, any> = {},
): Promise<PushResult> => {
  if (!tokens || tokens.length === 0) {
    console.log("No tokens provided. Skipping notification.");
    return {
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
      failedTokens: [],
      response: null,
    };
  }

  // ✅ Remove empty tokens + duplicate tokens
  const uniqueTokens = Array.from(
    new Set(tokens.filter((t) => typeof t === "string" && t.trim().length > 0)),
  );

  if (uniqueTokens.length === 0) {
    console.log("All tokens were invalid/empty. Skipping notification.");
    return {
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
      failedTokens: [],
      response: null,
    };
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: normalizeData(data),
      tokens: uniqueTokens,
    };

    // ✅ Firebase multicast send
    const response = await fcmMessaging().sendEachForMulticast(message);

    console.log(response);

    const invalidTokens: string[] = [];
    const failedTokens: string[] = [];

    if (response.failureCount > 0) {
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          const token = uniqueTokens[idx];
          failedTokens.push(token);

          const code = resp?.error?.code;

          // Common invalid token codes
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            invalidTokens.push(token);
          }

          console.log("FCM failed token:", {
            token,
            code,
            message: resp?.error?.message,
          });
        }
      });

      console.log("FCM summary:", {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokensCount: invalidTokens.length,
      });
    } else {
      console.log("All notifications were sent successfully!", {
        successCount: response.successCount,
      });
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
      failedTokens,
      response,
    };
  } catch (error: any) {
    console.error("Error sending push notification:", {
      message: error?.message,
      stack: error?.stack,
    });

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to send push notification",
    );
  }
};
