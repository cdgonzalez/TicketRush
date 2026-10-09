import { createClient, RedisClientType } from "redis";
import { env } from "../../config/env";
import { logger } from "../logging/logger";

export const redisClient: RedisClientType = createClient({
  url: `redis://${env.redis.host}:${env.redis.port}`,
});

// Obligatorio para evitar crashes por 'unhandled error event'
redisClient.on("error", (err) => {
  logger.error({ err }, "[Redis] Error in Redis client");
});

redisClient.on("connect", () => {
  logger.info("[Redis] Connected successfully");
});

export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
};
