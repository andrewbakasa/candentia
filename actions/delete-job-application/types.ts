import { z } from "zod";
import { JobApplication } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { DeleteJobApplication } from "./schema";

export type InputType = z.infer<typeof DeleteJobApplication>;
export type ReturnType = ActionState<InputType, JobApplication>;