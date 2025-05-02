import { z } from "zod";

export const ToggleBoard = z.object({
  id: z.string(),
});
