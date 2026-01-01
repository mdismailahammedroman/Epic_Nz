import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

type CLOUDINARY_TYPE = {
  CLOUDINARY_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_SECRET: string;
};

type REDIS_TYPE = {
  REDIS_HOST: string;
  REDIS_PORT: string;
  REDIS_USERNAME: string;
  REDIS_PASSWORD: string;
};

type SMTP_TYPE = {
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
};

type GOOGLE_TYPE = {
  GOOGLE_OAUTH_ID: string;
  GOOGLE_OAUTH_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
};

type FACEBOOK_TYPE = {
  FACEBOOK_APP_ID: string;
  FACEBOOK_APP_SECRET: string;
  FACEBOOK_APP_CALLBACK_URL: string;
};

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
  CLOUDINARY: CLOUDINARY_TYPE;
  REQUEST_RATE_LIMIT: string;
  REQUEST_RATE_LIMIT_TIME: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLIC_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  REDIS: REDIS_TYPE;
  SMTP: SMTP_TYPE;
  GOOGLE_AUTH: GOOGLE_TYPE;
  FACEBOOK_AUTH: FACEBOOK_TYPE;
  SESSION_SECRET: string;
  OPENWEATHER_API_KEY: string;
  WEATHER_API_URL: string;
  LOCATIONIQ_API_KEY: string;
  GOOGLE_MAPS_API_KEY: string;
  PRICE_WEEKLY: string;
  PRICE_MONTHLY: string;
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
    "SESSION_SECRET",
    "OPENWEATHER_API_KEY",
    "WEATHER_API_URL",
    "LOCATIONIQ_API_KEY",
    "GOOGLE_MAPS_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLIC_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "PRICE_WEEKLY",
    "PRICE_MONTHLY",
  ];

  requiredEnvVariables.forEach((varName) => {
    if (!process.env[varName]) {
      throw new Error(
        `Environment variable ${varName} is required but not defined.`
      );
    }
  });

  return {
    PORT: process.env.PORT!,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    MONGO_URI: process.env.MONGO_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION!,
    BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND!,
    EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    CLOUDINARY: {
      CLOUDINARY_NAME: process.env.CLOUDINARY_NAME!,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
      CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET!,
    },
    REQUEST_RATE_LIMIT: process.env.REQUEST_RATE_LIMIT!,
    REQUEST_RATE_LIMIT_TIME: process.env.REQUEST_RATE_LIMIT_TIME!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY!,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
    PRICE_WEEKLY: process.env.PRICE_WEEKLY!,
    PRICE_MONTHLY: process.env.PRICE_MONTHLY!,
    REDIS: {
      REDIS_HOST: process.env.REDIS_HOST!,
      REDIS_PORT: process.env.REDIS_PORT!,
      REDIS_USERNAME: process.env.REDIS_USERNAME!,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD!,
    },
    SMTP: {
      SMTP_HOST: process.env.SMTP_HOST!,
      SMTP_PORT: process.env.SMTP_PORT!,
      SMTP_USER: process.env.SMTP_USER!,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD!,
    },
    GOOGLE_AUTH: {
      GOOGLE_OAUTH_ID: process.env.GOOGLE_OAUTH_ID!,
      GOOGLE_OAUTH_SECRET: process.env.GOOGLE_OAUTH_SECRET!,
      GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL!,
    },
    FACEBOOK_AUTH: {
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID!,
      FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET!,
      FACEBOOK_APP_CALLBACK_URL: process.env.FACEBOOK_APP_CALLBACK_URL!,
    },
    SESSION_SECRET: process.env.SESSION_SECRET!,
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY!,
    WEATHER_API_URL: process.env.WEATHER_API_URL!,
    LOCATIONIQ_API_KEY: process.env.LOCATIONIQ_API_KEY!,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY!,
  };
};

export const envVar = loadEnvVariables();
