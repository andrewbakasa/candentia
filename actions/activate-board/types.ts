import { z } from "zod";
import { Board } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { ActivateBoard } from "./schema";

export type InputType = z.infer<typeof ActivateBoard>;
export type ReturnType = ActionState<InputType, Board>;
