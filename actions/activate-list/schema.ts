import { z } from "zod";

export const ActivateList = z.object({
  id: z.string(),
});
