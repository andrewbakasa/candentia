import { z } from "zod";
import {  Enquiry } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { UpdateEnquiry } from "./schema";

export type InputType = z.infer<typeof UpdateEnquiry>;
export type ReturnType = ActionState<InputType, Enquiry>;
