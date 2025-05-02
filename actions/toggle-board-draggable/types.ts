import { z } from "zod";
import { Board } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { ToggleBoardDraggable } from "./schema";

export type InputType = z.infer<typeof ToggleBoardDraggable>;
export type ReturnType = ActionState<InputType, Board>;
