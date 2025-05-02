import { z } from "zod";

export const CreateComment = z.object({
  comment: z.string({
    required_error: "Title is required",
    invalid_type_error: "Title is required",
  }).min(3, {
    message: "Title is too short",
  }),
  cardId: z.string(),
  // imageThumbURL: z.optional(z.string()),
  boardId: z.string(),
});
