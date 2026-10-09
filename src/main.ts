import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Pool } from "pg";
import { env } from "./config/env";
import { PostgresTicketRepository } from "./infrastructure/database/PostgresTicketRepository";
import { ReserveTicketUseCase } from "./application/use-cases/ReserveTicketUseCase";
import { TicketController } from "./presentation/controllers/TicketController";
import { createTicketRouter } from "./presentation/routes/ticketRoutes";
import { requestLogger } from "./presentation/middlewares/requestLogger";
import {
  metricsMiddleware,
  metricsEndpoint,
} from "./presentation/middlewares/metrics";
import { HealthController } from "./presentation/controllers/HealthControllers";
import {
  redisClient,
  connectRedis,
  disconnectRedis,
} from "./infrastructure/redis/redisClient";
import { logger } from "./infrastructure/logging/logger";

async function bootstrap() {
  const app = express();

  // Middlewares base
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);
  app.use(metricsMiddleware);

  // 1. Conexiones a Bases de Datos y Cache
  const dbPool = new Pool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    max: 20,
  });

  await connectRedis();

  // 2. Health Check y Métricas
  const healthController = new HealthController(dbPool, redisClient);
  app.get("/health", healthController.check);
  app.get("/metrics", metricsEndpoint);

  // 3. Inyección de dependencias
  const ticketRepository = new PostgresTicketRepository(dbPool);
  const reserveTicketUseCase = new ReserveTicketUseCase(
    ticketRepository,
    dbPool,
  );
  const ticketController = new TicketController(reserveTicketUseCase);

  // 4. Rutas
  const ticketRouter = createTicketRouter(ticketController);
  app.use("/api/v1/tickets", ticketRouter);

  const server = app.listen(env.port, () => {
    logger.info(`🚀 Server running on port ${env.port} in ${env.nodeEnv} mode`);
  });

  // 5. Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`\n${signal} received. Initiating graceful shutdown...`);

    server.close(async () => {
      logger.info("HTTP server closed.");
      await dbPool.end();
      logger.info("Database pool closed.");
      await disconnectRedis();
      logger.info("Redis connection closed.");
      logger.info("Process terminated.");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forcing shutdown due to timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  logger.error({ err: error }, "Error bootstrapping application");
  process.exit(1);
});
