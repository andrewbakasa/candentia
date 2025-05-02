import { z } from "zod";
import { List } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { ActivateList } from "./schema";

export type InputType = z.infer<typeof ActivateList>;
export type ReturnType = ActionState<InputType, List>;
