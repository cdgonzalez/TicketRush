import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Pool } from "pg";
import { env } from "./config/env";
import { PostgresTicketRepository } from "./infrastructure/database/PostgresTicketRepository";
import { ReserveTicketUseCase } from "./application/use-cases/ReserveTicketUseCase";
import { TicketController } from "./presentation/controllers/TicketController";
import { createTicketRouter } from "./presentation/routes/ticketRoutes";

async function bootstrap() {
  const app = express();

  // Middlewares base
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Health check route
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // 1. Database Connection
  const dbPool = new Pool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    max: 20, // Connection pool size crucial para alta concurrencia
  });

  // 2. Dependency Injection (Composition Root)
  const ticketRepository = new PostgresTicketRepository(dbPool);
  const reserveTicketUseCase = new ReserveTicketUseCase(
    ticketRepository,
    dbPool,
  );
  const ticketController = new TicketController(reserveTicketUseCase);

  // 3. Routing
  const ticketRouter = createTicketRouter(ticketController);
  app.use("/api/v1/tickets", ticketRouter);

  const server = app.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port} in ${env.nodeEnv} mode`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Initiating graceful shutdown...`);

    server.close(async () => {
      console.log("HTTP server closed.");
      await dbPool.end();
      console.log("Database pool closed.");
      console.log("Process terminated.");
      process.exit(0);
    });

    // Fallback if closing takes too long
    setTimeout(() => {
      console.error("Forcing shutdown due to timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  console.error("Error bootstrapping application:", error);
  process.exit(1);
});
