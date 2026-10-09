import { Router } from "express";
import { TicketController } from "../controllers/TicketController";

export function createTicketRouter(ticketController: TicketController): Router {
  const router = Router();
  router.post("/reserve", ticketController.reserve);
  return router;
}
