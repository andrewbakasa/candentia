import { z } from "zod";

export const OrderByDate = z.object({
  id: z.string(),
  boardId: z.string(),
});
