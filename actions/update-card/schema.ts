import { z } from "zod";

export const UpdateCard = z.object({
  tagIDs: z.optional(
    z.array(z.string())
  ),
  taggedUsers: z.optional(
    z.array(z.string())
  ),
  boardId: z.string(),
  dueDate: z.optional(
    z.date({
      required_error: "Date is required",
      invalid_type_error: "Date is required",
    }),
  ),
  completedDate: z.optional(
    z.date({
      required_error: "Date is required",
      invalid_type_error: "Date is required",
    }),
  ),
  description: z.optional(
    z.string({
      required_error: "Description is required",
      invalid_type_error: "Description is required",
    }).min(3, {
      message: "Description is too short.",
    }),
  ),

  progress: z.optional(
    z.string({
      required_error: "Progress is required",
      invalid_type_error: "Progress is required",
    }).min(3, {
      message: "Progress is too short.",
    }),
  ),
  title: z.optional(
    z.string({
      required_error: "Title is required",
      invalid_type_error: "Title is required",
    }).min(2, {
      message: "Title is too short",
    })
  ),
  id: z.string(),
  visible: z.optional(
    z.boolean(),
  ),
});
