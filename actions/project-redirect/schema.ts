import { z } from "zod";

export const MyBoard = z.object({
  url: z.string(),
});
