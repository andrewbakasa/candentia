import { z } from "zod";

export const GetCurrentUser = z.object({  
  email: z.string(),
   
  });
