import { z } from "zod";
import {  Comment } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";

import { UpdateComment } from "./schema";

export type InputType = z.infer<typeof UpdateComment>;
export type ReturnType = ActionState<InputType, Comment>;
