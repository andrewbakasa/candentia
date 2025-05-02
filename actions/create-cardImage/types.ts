import { z } from "zod";
import { CardImage } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { CreateCardImage } from "./schema";

export type InputType = z.infer<typeof CreateCardImage>;
export type ReturnType = ActionState<InputType, CardImage>;
