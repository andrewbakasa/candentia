import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";

import { CreateAudit } from "./schema";

export type InputType = z.infer<typeof CreateAudit>;
export type ReturnType = ActionState<InputType, Boolean>;
