import { z } from "zod";
import { User } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { UpdateUser } from "./schema";

export type InputType = z.infer<typeof UpdateUser>;
export type ReturnType = ActionState<InputType, User>;
