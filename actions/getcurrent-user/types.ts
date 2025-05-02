import { z } from "zod";
import { User, } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { GetCurrentUser } from "./schema";
import { SafeUser } from "@/app/types";

export type InputType = z.infer<typeof GetCurrentUser>;
export type ReturnType = ActionState<InputType, SafeUser>;
