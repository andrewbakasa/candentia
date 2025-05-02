"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSafeAction } from "@/lib/create-safe-action";

import { MyBoard } from "./schema";
import { InputType, ReturnType } from "./types";
//import { useOriginSourceUrl } from "@/hooks/use-origin-source";


const handler = async (data: InputType): Promise<ReturnType> => {
  
  const {url} = data;
  //console.log('inside deleate board action id>>>', url);
  // let board;
  //const url =useOriginSourceUrl((state) => state.sourceUrl)
  //const url ="project"
  revalidatePath(`/${url}`);
  redirect(`/${url}`);
};

export const myBoard = createSafeAction(MyBoard, handler);
