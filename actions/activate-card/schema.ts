import { z } from "zod";

export const ActivateCard = z.object({
  id: z.string(),
});
