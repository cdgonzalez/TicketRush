import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../../infrastructure/redis/redisClient";

export const reserveLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: "rl:reserve:",
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Límite de 5 intentos por IP
  message: { error: "Too many reservation attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
