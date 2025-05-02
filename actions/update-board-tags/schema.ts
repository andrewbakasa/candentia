import { z } from "zod";

export const UpdateBoard = z.object({
  percent: z.number({
    required_error: "percent is required",
    invalid_type_error: "percent is required",
  }).min(0, {
    message: "percent is is less than 0",
  }).max(100,{
    message: "percent is greater thaan 100",
  }),
  id: z.string(),
});
