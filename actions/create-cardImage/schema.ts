import { z } from "zod";

export const CreateCardImage = z.object({
  boardId: z.string(),
  url: z.string(),
  cardId: z.string(),
  type: z.string(),
  fileName: z.string(),
});
