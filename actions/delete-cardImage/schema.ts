import { z } from "zod";

export const DeleteCardImage = z.object({
  id: z.string(),
});
