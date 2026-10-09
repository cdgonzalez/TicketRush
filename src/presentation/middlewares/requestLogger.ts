import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../infrastructure/logging/logger";

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  req.correlationId = (req.headers["x-correlation-id"] as string) || uuidv4();

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      {
        correlationId: req.correlationId,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
        ip: req.ip,
        userId: req.user?.userId || "anonymous",
      },
      "HTTP Request Processed",
    );
  });

  next();
};
