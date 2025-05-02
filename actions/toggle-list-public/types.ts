import { z } from "zod";
import { List } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { ToggleList } from "./schema";

export type InputType = z.infer<typeof ToggleList>;
export type ReturnType = ActionState<InputType, List>;
