import { z } from "zod";
import { Board } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { MyBoard } from "./schema";

export type InputType = z.infer<typeof MyBoard>;
export type ReturnType = ActionState<InputType, Board>;
