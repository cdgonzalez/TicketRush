import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

export const validateRequest =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((e) => ({
            path: e.path,
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
