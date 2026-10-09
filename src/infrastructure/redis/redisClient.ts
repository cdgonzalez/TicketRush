import { createClient } from 'redis';
import { env } from '../../config/env';

// Cliente Redis dedicado para el rate limiter
export const redisClient = createClient({
  url: `redis://${env.redis.host}:${env.redis.port}`
});
redisClient.connect().catch(console.error);
