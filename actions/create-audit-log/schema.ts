import { z } from "zod";

export const CreateAudit = z.object({
  title: z.string({
    required_error: "Title is required",
    invalid_type_error: "Title is required",
  }),
  id: z.string(),
});
