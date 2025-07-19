import { z } from "zod";

export const CreateJobImage = z.object({
  jobAppId: z.string(),
  url: z.string(),
  type: z.string(),
  fileName: z.string(),
});

