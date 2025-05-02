import { z } from "zod";
import { Enquiry } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { CreateEnquiry } from "./schema";

export type InputType = z.infer<typeof CreateEnquiry>;
export type ReturnType = ActionState<InputType, Enquiry>;
