import { z } from "zod";

export const ToggleList = z.object({
  listId: z.string(),
  boardId:z.string(),
});
