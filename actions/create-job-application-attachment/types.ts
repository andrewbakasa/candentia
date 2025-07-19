import { z } from "zod";
import { JobAttachment } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { CreateJobImage } from "./schema";

export type InputType = z.infer<typeof CreateJobImage>;
export type ReturnType = ActionState<InputType, JobAttachment>;
