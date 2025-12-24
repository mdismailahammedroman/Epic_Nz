import dotenv from "dotenv";

dotenv.config();

type CLOUDINARY_TYPE = {
  CLOUDINARY_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_SECRET?: string;
};
type REDIS_TYPE = {
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_USERNAME?: string;
  REDIS_PASSWORD?: string;
};
type SMTP_TYPE = {
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
};
type GOOGLE_TYPE = {
  GOOGLE_OAUTH_ID?: string;
  GOOGLE_OAUTH_SECRET?: string;
  GOOGLE_CALLBACK_URL?: string;
};
type FACEBOOK_TYPE = {
  FACEBOOK_APP_ID?: string;
  FACEBOOK_APP_SECRET?: string;
  FACEBOOK_APP_CALLBACK_URL?: string;
};
interface EnvVar {
  PORT?: string;
  NODE_ENV?: string;
  MONGO_URI?: string;
  JWT_SECRET?: string;
  JWT_EXPIRATION?: string;
  JWT_REFRESH_SECRET?: string;
  JWT_REFRESH_EXPIRATION?: string;
  BCRYPT_SALT_ROUND?: string;
  EXPRESS_SESSION_SECRET?: string;
  FRONTEND_URL?: string;
  CLOUDINARY: CLOUDINARY_TYPE;
  REQUEST_RATE_LIMIT?: string;
  REQUEST_RATE_LIMIT_TIME?: string;
  REDIS: REDIS_TYPE;
  SMTP: SMTP_TYPE;
  GOOGLE_AUTH: GOOGLE_TYPE;
  FACEBOOK_AUTH: FACEBOOK_TYPE;
}
const loadEnvVariables = (): EnvVar => {
  const requireEnvVariables: string[] = [
    "PORT",
    "MONGO_URI",
    "JWT_SECRET",
    "NODE_ENV",
    "JWT_SECRET",
    "JWT_EXPIRATION",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRATION",
    "BCRYPT_SALT_ROUND",
    "EXPRESS_SESSION_SECRET",
    "FRONTEND_URL",
    "CLOUDINARY_NAME",
    "CLOUDINARY_SECRET",
    "CLOUDINARY_API_KEY",
    "REQUEST_RATE_LIMIT",
    "REQUEST_RATE_LIMIT_TIME",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_USERNAME",
    "REDIS_PASSWORD",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "GOOGLE_OAUTH_ID",
    "GOOGLE_OAUTH_SECRET",
    "GOOGLE_CALLBACK_URL",
    "FACEBOOK_APP_ID",
    "FACEBOOK_APP_SECRET",
    "FACEBOOK_APP_CALLBACK_URL",
  ];
  requireEnvVariables.forEach((varName) => {
    if (!process.env[varName]) {
      throw new Error(
        `Environment variable ${varName} is required but not defined.`
      );
    }
  });
  return {
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV || "development",
    MONGO_URI: process.env.MONGO_URI as string,
    JWT_SECRET: process.env.JWT_SECRET as string,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || "15m",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || "7d",
    BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
    EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    CLOUDINARY: {
      CLOUDINARY_NAME: process.env.CLOUDINARY_NAME as string,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
      CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET as string,
    },
    REQUEST_RATE_LIMIT: process.env.REQUEST_RATE_LIMIT as string,
    REQUEST_RATE_LIMIT_TIME: process.env.REQUEST_RATE_LIMIT_TIME as string,
    REDIS: {
      REDIS_HOST: process.env.REDIS_HOST as string,
      REDIS_PORT: process.env.REDIS_PORT as string,
      REDIS_USERNAME: process.env.REDIS_USERNAME as string,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,
    },
    SMTP: {
      SMTP_HOST: process.env.SMTP_HOST as string,
      SMTP_PORT: process.env.SMTP_PORT as string,
      SMTP_USER: process.env.SMTP_USER as string,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD as string,
    },
    GOOGLE_AUTH: {
      GOOGLE_OAUTH_ID: process.env.GOOGLE_OAUTH_ID as string,
      GOOGLE_OAUTH_SECRET: process.env.GOOGLE_OAUTH_SECRET as string,
      GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    FACEBOOK_AUTH: {
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID as string,
      FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET as string,
      FACEBOOK_APP_CALLBACK_URL: process.env
        .FACEBOOK_APP_CALLBACK_URL as string,
    },
  };
};
export const envVar = loadEnvVariables();
