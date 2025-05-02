"use client";

import { toast } from "sonner";
import { ElementRef, useEffect, useRef, useState } from "react";
import { Board } from "@prisma/client";
import { FormInput } from "@/components/form/form-input";
import { updateBoard } from "@/actions/update-board-percent";
import { useAction } from "@/hooks/use-action";

interface BoardPercentFormProps {
  data: Board;
  setPercent:(value:number) => void;
  percent:number
};

export const BoardPercentForm = ({
  data,
  setPercent,
  percent
}: BoardPercentFormProps) => {
  const { execute } = useAction(updateBoard, {
    onSuccess: (data) => {
      //toast.success(`Board "${data.percent}" updated!`);
      toast.success(`Board percentage progress updated to "${data.percent}%"`);
      setPercent(data.percent);
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const formRef = useRef<ElementRef<"form">>(null);
  const inputRef = useRef<ElementRef<"input">>(null);

  //const [percent, setPercent] = useState(data.percent);
  // setPercent(data.percent)// initial 
  /* Maximum update depth exceeded. This can happen when a component repeatedly calls setState 
  inside componentWillUpdate or componentDidUpdate. 
  React limits the number of nested updates to prevent infinite loops.
  ----- I replace this code  with the UseEffect down  on this datw Wednesdasy 08 January 2025 @1308hrs in Workshopes Enggeer Office
  */
  useEffect(() => {
    setPercent(data.percent);
  }, [data.percent]);
  const [isEditing, setIsEditing] = useState(false);

  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
     inputRef.current?.focus();
     inputRef.current?.select(); 
    })
  };

  const disableEditing = () => {
    setIsEditing(false);
  };

  const onSubmit = (formData: FormData) => {
    const percent1 = formData.get("percent") as string;
    const percent= Number(percent1)

    if (percent === data.percent) {
      return disableEditing();
    }
    execute({
      percent,
      id: data.id,
    });
  };

  const onBlur = () => {
    formRef.current?.requestSubmit();
  };

  if (isEditing) {
    return (
      <div className="pt-2 px-2 text-sm/13px  font-semibold flex justify-between items-start- gap-x-2">

        <form action={onSubmit} ref={formRef} className="flex items-center gap-x-2">
          <FormInput
            ref={inputRef}
            id="percent"
            onBlur={onBlur}
            defaultValue={String(percent)}
            // className="text-lg font-bold px-[7px] py-1 h-7 bg-transparent focus-visible:outline-none focus-visible:ring-transparent border-none"
            className="text-sm/13px px-[7px] py-1 h-7 font-medium border-transparent hover:border-input focus:border-input transition truncate bg-transparent focus:bg-white"
          
          />
        </form>
      </div>
    )
  }
  
  return (
 
  <div className="pt-2 px-2 text-sm/13px  font-semibold flex justify-between items-start- gap-x-2">
      <div
        onClick={enableEditing}
        className="w-full text-sm px-2.5 py-1 h-7 font-medium border-transparent"
        >
        Progress @ {percent} %
    </div>
  </div>
  );
};
// function useEffect(arg0: () => void, arg1: number[]) {
//   throw new Error("Function not implemented.");
// }

