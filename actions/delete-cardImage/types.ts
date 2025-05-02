import { z } from "zod";
import { CardImage } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { DeleteCardImage } from "./schema";

export type InputType = z.infer<typeof DeleteCardImage>;
export type ReturnType = ActionState<InputType, CardImage>;
