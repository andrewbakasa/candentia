import { z } from "zod";
import { Board } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { ToggleBoard } from "./schema";

export type InputType = z.infer<typeof ToggleBoard>;
export type ReturnType = ActionState<InputType, Board>;
