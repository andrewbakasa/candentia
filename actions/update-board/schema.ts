import { z } from "zod";

export const UpdateBoard = z.object({
  title: z.optional(
      z.string({
        required_error: "Title is required",
        invalid_type_error: "Title is required",
      }).min(3, {
        message: "Title is too short",
        
    }),
  ),
  progressStatus: z.optional(
    z.string({
      required_error: "Progress is required",
      invalid_type_error: "Progress is required",
    }).min(1, {
      message: "Progress is too short.",
    }),
  ),
  id: z.string(),
});
