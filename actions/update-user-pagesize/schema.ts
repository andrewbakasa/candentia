import { z } from "zod";

export const UpdatePageSize = z.object({
  id: z.string(),
  pageSize: z.coerce.number(),
  });
