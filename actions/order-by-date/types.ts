import { z } from "zod";
import { List } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { OrderByDate } from "./schema";

export type InputType = z.infer<typeof OrderByDate>;
export type ReturnType = ActionState<InputType, List>;
