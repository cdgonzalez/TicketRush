import { Request, Response } from 'express';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { logger } from '../../infrastructure/logging/logger';

export class HealthController {
  constructor(
    private readonly dbPool: Pool,
    private readonly redisClient: RedisClientType
  ) {}

  check = async (req: Request, res: Response): Promise<void> => {
    try {
      // Verificar conexión a PostgreSQL
      const pgStart = Date.now();
      await this.dbPool.query('SELECT 1');
      const pgLatency = Date.now() - pgStart;

      // Verificar conexión a Redis
      const redisStart = Date.now();
      await this.redisClient.ping();
      const redisLatency = Date.now() - redisStart;

      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: { status: 'up', latencyMs: pgLatency },
          redis: { status: 'up', latencyMs: redisLatency }
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Health check failed');
      res.status(503).json({
        status: 'UNAVAILABLE',
        timestamp: new Date().toISOString(),
      });
    }
  };
}