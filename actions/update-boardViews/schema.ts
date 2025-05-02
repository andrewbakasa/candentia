import { z } from "zod";

export const UpdateBoardViews = z.object({
  boardId: z.string(),
  id: z.string(),
 
});
