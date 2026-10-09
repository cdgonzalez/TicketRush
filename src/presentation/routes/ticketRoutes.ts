import { Router } from 'express';
import { TicketController } from '../controllers/TicketController';
import { reserveLimiter } from '../middlewares/rateLimiter';
import { requireAuth } from '../middlewares/requireAuth';
import { validateRequest } from '../middlewares/validateRequest';
import { reserveTicketSchema } from '../dtos/ticketSchemas';

export function createTicketRouter(ticketController: TicketController): Router {
  const router = Router();
  
  router.post(
    '/reserve',
    reserveLimiter,
    requireAuth,
    validateRequest(reserveTicketSchema),
    ticketController.reserve
  );
  
  return router;
}