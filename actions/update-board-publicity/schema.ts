import { z } from "zod";

export const UpdateBoard = z.object({  
  id: z.string(),
  public: z.boolean(),
});
