import { Request, Response } from "express";
import { ReserveTicketUseCase } from "../../application/use-cases/ReserveTicketUseCase";

export class TicketController {
  constructor(private readonly reserveTicketUseCase: ReserveTicketUseCase) {}

  reserve = async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId, userId } = req.body;

      // Validación básica (se reemplazará por Zod/Joi en la iteración de seguridad)
      if (!eventId || !userId) {
        res.status(400).json({ error: "Missing eventId or userId" });
        return;
      }

      const result = await this.reserveTicketUseCase.execute({
        eventId,
        userId,
      });

      res.status(201).json({
        message: "Ticket reserved successfully",
        data: result,
      });
    } catch (error: any) {
      if (error.message === "SOLD_OUT") {
        res
          .status(409)
          .json({ error: "Event is sold out or no tickets available" });
        return;
      }

      console.error("[TicketController] Error reserving ticket:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
