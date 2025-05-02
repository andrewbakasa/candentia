"use client";

import { toast } from "sonner";
import { List } from "@prisma/client";
import { useEventListener } from "usehooks-ts";
import { useState, useRef, ElementRef, useEffect } from "react";

import { useAction } from "@/hooks/use-action";
import { updateList } from "@/actions/update-list-percent";
import { FormInput } from "@/components/form/form-input";

import { cn } from "@/lib/utils";
//import {useNumberVarStore} from "@/hooks/use-percent-updata";

interface ListProgressProps {
  data: List;
  setPercent:(value:number) => void;
  percent:number
};

export const ListProgress = ({
  data,
  setPercent,
  percent
}: ListProgressProps) => {
  // const { numberVar, setNumberVar } = useNumberVarStore();
  // //set variable
  // setNumberVar(data.percent)
 
  
  //const [percent, setPercent] = useState(data.percent);
  //setPercent(data.percent)// initial
  /* Maximum update depth exceeded. This can happen when a component repeatedly calls setState 
  inside componentWillUpdate or componentDidUpdate. 
  React limits the number of nested updates to prevent infinite loops.
  ----- I replace this code  with the UseEffect down  on this datw Wednesdasy 08 January 2025 @1308hrs in Workshopes Enggeer Office Mutare NRZ
  */
  useEffect(() => {
    setPercent(data.percent);
  }, [data.percent]);

  const [isEditing, setIsEditing] = useState(false);

  const formRef = useRef<ElementRef<"form">>(null);
  const inputRef = useRef<ElementRef<"input">>(null);

  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const disableEditing = () => {
    setIsEditing(false);
  };

  const { execute } = useAction(updateList, {
    onSuccess: (data) => {
      toast.success(`List percentage progress updated to "${data.percent}%"`);
      setPercent(Number(data.percent));
      //setNumberVar(data.percent)
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const handleSubmit = (formData: FormData) => {
    let percent1 = formData.get("percent") as string;
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;

    const percent = Number(percent1)

    if (percent === data.percent) {
      return disableEditing();
    }

    execute({
      percent,
      id,
      boardId,
    });
  }

  const onBlur = () => {
    formRef.current?.requestSubmit();
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      formRef.current?.requestSubmit();
    }
  };

  useEventListener("keydown", onKeyDown);

  return (
    // If List in private show darker handle
    <div className={cn("pt-2 px-2 text-sm/13px w-[80%] font-semibold flex justify-between items-start- gap-x-2",
                   data.visible?"": "bg-rose-200")}>
      {isEditing ? (
        <form 
          name= "name1"
          ref={formRef}
          action={handleSubmit}  
          className="flex-1 px-[2px]"
        >
          <input hidden id="id" name="id" value={data.id} />
          <input hidden id="boardId" name="boardId" value={data.boardId} />
          <FormInput
            ref={inputRef}
            onBlur={onBlur}
            id="percent"
            placeholder="Enter list percent.."
            defaultValue={String(percent)}
            className="text-sm/13px px-[7px] py-1 h-7 font-medium border-transparent hover:border-input focus:border-input transition truncate bg-transparent focus:bg-white"
          />
          <button type="submit" hidden />
        </form>
      ) : (
        <div
          onClick={enableEditing}
          className="w-[80%] text-sm px-2.5 py-1 h-7 font-medium border-transparent"
        >
          Progress @ {percent}%
          {/* {numberVar}% */}
        </div>
      )}
     
    </div>
  );
};
