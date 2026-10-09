import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';

async function bootstrap() {
  const app = express();

  // Middlewares base
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Health check route
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  const server = app.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port} in ${env.nodeEnv} mode`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Initiating graceful shutdown...`);
    
    server.close(() => {
      console.log('HTTP server closed.');
      // Aquí cerraremos conexiones a PG y Redis en iteraciones futuras
      console.log('Process terminated.');
      process.exit(0);
    });

    // Fallback if closing takes too long
    setTimeout(() => {
      console.error('Forcing shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('Error bootstrapping application:', error);
  process.exit(1);
});