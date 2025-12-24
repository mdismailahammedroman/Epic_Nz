import { Response } from "express";
import { envVar } from "../config/envVar";

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
  const isProduction = envVar.NODE_ENV === "production";

  res.cookie("accessToken", tokenInfo.accessToken || "", {
    httpOnly: true,
    secure: isProduction, // false in dev
    sameSite: isProduction ? "none" : "lax", // lax in dev
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/", // available to all routes
  });

  res.cookie("refreshToken", tokenInfo.refreshToken || "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
};
