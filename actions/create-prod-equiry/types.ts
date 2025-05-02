import { z } from "zod";
import { ProductEnquiry } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { CreateProductEquiry } from "./schema";

export type InputType = z.infer<typeof CreateProductEquiry>;
export type ReturnType = ActionState<InputType, ProductEnquiry>;
