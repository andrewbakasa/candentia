import { z } from "zod";
import { User } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { UpdatePageSize } from "./schema";

export type InputType = z.infer<typeof UpdatePageSize>;
export type ReturnType = ActionState<InputType, User>;