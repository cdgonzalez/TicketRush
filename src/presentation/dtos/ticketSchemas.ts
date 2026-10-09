import { z } from "zod";

export const reserveTicketSchema = z.object({
  eventId: z
    .string()
    .uuid({ message: "Invalid eventId format. Must be a UUID." }),
  userId: z
    .string()
    .uuid({ message: "Invalid userId format. Must be a UUID." }),
});
