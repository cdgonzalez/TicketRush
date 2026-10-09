import promClient from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Recolectar métricas base de Node.js (CPU, Memory, Event Loop)
promClient.collectDefaultMetrics();

export const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000] // Buckets enfocados en latencia baja/media
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route ? req.route.path : req.path, res.statusCode.toString())
      .observe(duration);
  });
  
  next();
};

export const metricsEndpoint = async (req: Request, res: Response): Promise<void> => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
};