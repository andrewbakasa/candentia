import { z } from "zod";

export const ActivateBoard = z.object({
  id: z.string(),
});
