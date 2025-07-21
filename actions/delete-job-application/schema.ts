import { z } from "zod";

export const DeleteJobApplication = z.object({
  id: z.string(),
});
