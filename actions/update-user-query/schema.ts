import { z } from "zod";

export const UpdateEnquiry= z.object({
  first_name: z.optional(
    z.string().min(1, { message: "First name is required" }),
  ),
  last_name: z.optional(
    z.string().min(1, { message: "Last name is required" })
  ),
  phone_number: z.optional(
    z.string().min(1, { message: "Phone number is required" }),
  ),
  
  email: z.string().email({ message: "Invalid email" }),
  message: z.string().min(1, { message: "Message is required" }),
  demoproducts: z.string().array().optional().default([]), // Added demoproducts
  id: z.string(),
});
