import { z } from "zod";

export const UpdateTag = z.object({  
  id: z.string(),
   
  description: z.optional(z.string()),

  name: z.string({
    required_error:"Name is required", 
    invalid_type_error:"Name is required"}).min(2,    {message:"Name is too short"}).max(100,{message:"Name too long"})
  ,});
