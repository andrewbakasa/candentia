import { z } from "zod";
import { BoardView } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { UpdateBoardViews } from "./schema";

export type InputType = z.infer<typeof UpdateBoardViews>;
export type ReturnType = ActionState<InputType, BoardView>;
