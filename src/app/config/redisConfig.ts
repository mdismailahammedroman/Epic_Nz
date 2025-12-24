import { createClient } from "redis";
import { envVar } from "./envVar";

export const redisClient = createClient({
  username: envVar.REDIS.REDIS_USERNAME,
  password: envVar.REDIS.REDIS_PASSWORD,
  socket: {
    host: envVar.REDIS.REDIS_HOST,
    port: Number(envVar.REDIS.REDIS_PORT),
    tls: true,
  },
});

redisClient.on("error", (error: any) =>
  console.log("Redis client error", error)
);

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis connected");
  }
};
