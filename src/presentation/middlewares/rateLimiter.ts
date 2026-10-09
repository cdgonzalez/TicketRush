import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { env } from '../../config/env';

// Cliente Redis dedicado para el rate limiter
const redisClient = createClient({
  url: `redis://${env.redis.host}:${env.redis.port}`
});
redisClient.connect().catch(console.error);

export const reserveLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Límite de 5 intentos de reserva por IP cada 15 minutos
  message: { error: 'Too many reservation attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});