import { z } from "zod";
import { Card } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { ActivateCard } from "./schema";

export type InputType = z.infer<typeof ActivateCard>;
export type ReturnType = ActionState<InputType, Card>;
