import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

interface CLOUDINARY_TYPE {
  CLOUDINARY_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_SECRET: string;
}

interface REDIS_TYPE {
  REDIS_HOST: string;
  REDIS_PORT: string;
  REDIS_USERNAME: string;
  REDIS_PASSWORD: string;
}

interface SMTP_TYPE {
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
}

interface GOOGLE_TYPE {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
}

interface APPLE_AUTH_TYPE {
  APPLE_CLIENT_ID: string;
  APPLE_TEAM_ID: string;
  APPLE_KEY_ID: string;
  APPLE_PRIVATE_KEY_PATH: string;
  APPLE_CALLBACK_URL: string;
}

interface EnvVar {
  PORT: string;
  NODE_ENV: "development" | "production";
  MONGO_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRATION: string;
  BCRYPT_SALT_ROUND: string;
  EXPRESS_SESSION_SECRET: string;
  FRONTEND_URL: string;
  APP_URL: string;
  CLOUDINARY: CLOUDINARY_TYPE;
  REQUEST_RATE_LIMIT: string;
  REQUEST_RATE_LIMIT_TIME: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  PRICE_YEARLY: string;
  PRICE_MONTHLY: string;
  REDIS: REDIS_TYPE;
  SMTP: SMTP_TYPE;
  GOOGLE_AUTH: GOOGLE_TYPE;
  APPLE_AUTH: APPLE_AUTH_TYPE;
  SESSION_SECRET: string;
  OPENWEATHER_API_KEY: string;
  WEATHER_API_URL: string;
  MAP_BOX_ACCESS_TOKEN: string;
  FIREBASE_SERVICE_ACCOUNT_PATH: string;
}

const loadEnvVariables = (): EnvVar => {
  const requiredEnvVariables: string[] = [
    "PORT",
    "MONGO_URI",
    "JWT_SECRET",
    "NODE_ENV",
    "JWT_EXPIRATION",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRATION",
    "BCRYPT_SALT_ROUND",
    "EXPRESS_SESSION_SECRET",
    "FRONTEND_URL",
    "APP_URL",
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
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL",
    "SESSION_SECRET",
    "OPENWEATHER_API_KEY",
    "WEATHER_API_URL",
    "MAP_BOX_ACCESS_TOKEN",
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "PRICE_YEARLY",
    "PRICE_MONTHLY",
    "FIREBASE_SERVICE_ACCOUNT_PATH",
    "APPLE_CLIENT_ID",
    "APPLE_TEAM_ID",
    "APPLE_KEY_ID",
    "APPLE_PRIVATE_KEY_PATH",
    "APPLE_CALLBACK_URL",
  ];

  requiredEnvVariables.forEach((varName) => {
    if (!process.env[varName]) {
      throw new Error(
        `Environment variable ${varName} is required but not defined.`,
      );
    }
  });

  return {
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    MONGO_URI: process.env.MONGO_URI as string,
    JWT_SECRET: process.env.JWT_SECRET as string,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION as string,
    BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
    EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    APP_URL: process.env.APP_URL as string,
    CLOUDINARY: {
      CLOUDINARY_NAME: process.env.CLOUDINARY_NAME as string,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
      CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET as string,
    },
    REQUEST_RATE_LIMIT: process.env.REQUEST_RATE_LIMIT as string,
    REQUEST_RATE_LIMIT_TIME: process.env.REQUEST_RATE_LIMIT_TIME as string,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY as string,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
    PRICE_YEARLY: process.env.PRICE_YEARLY as string,
    PRICE_MONTHLY: process.env.PRICE_MONTHLY as string,
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
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
      GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    APPLE_AUTH: {
      APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID as string,
      APPLE_TEAM_ID: process.env.APPLE_TEAM_ID as string,
      APPLE_KEY_ID: process.env.APPLE_KEY_ID as string,
      APPLE_PRIVATE_KEY_PATH: process.env.APPLE_PRIVATE_KEY_PATH as string,
      APPLE_CALLBACK_URL: process.env.APPLE_CALLBACK_URL as string,
    },
    SESSION_SECRET: process.env.SESSION_SECRET as string,
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY as string,
    WEATHER_API_URL: process.env.WEATHER_API_URL as string,

    MAP_BOX_ACCESS_TOKEN: process.env.MAP_BOX_ACCESS_TOKEN as string,
    FIREBASE_SERVICE_ACCOUNT_PATH: process.env
      .FIREBASE_SERVICE_ACCOUNT_PATH as string,
  };
};

export const envVar = loadEnvVariables();
