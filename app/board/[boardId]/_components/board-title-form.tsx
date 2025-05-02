"use client";

import { toast } from "sonner";
import { ElementRef, useEffect, useRef, useState } from "react";
import { Board } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { updateBoard } from "@/actions/update-board";
import { useAction } from "@/hooks/use-action";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

interface BoardTitleFormProps {
  data: Board;
  setPercent:(value:number) => void;
  percent:number;
  ownerImage:string;
};

export const BoardTitleForm = ({
  data,
  setPercent,
  percent,
  ownerImage
}: BoardTitleFormProps) => {
  const { execute } = useAction(updateBoard, {
    onSuccess: (data) => {
      toast.success(`Board "${data.title}" updated!`);
      setTitle(data.title);
      setPercent(data.percent);
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const formRef = useRef<ElementRef<"form">>(null);
  const inputRef = useRef<ElementRef<"input">>(null);

  const [title, setTitle] = useState(data?.title);

  // setPercent(data.percent)// initial
  /* Maximum update depth exceeded. This can happen when a component repeatedly calls setState 
  inside componentWillUpdate or componentDidUpdate. 
  React limits the number of nested updates to prevent infinite loops.
  ----- I replace this code  with the UseEffect down  on this datw Wednesdasy 08 January 2025 @1308hrs in Workshopes Enggeer Office Mutare NRZ
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
    const title = formData.get("title") as string;
    // if no change dont persist to Db
    if (title === data.title) {
      return disableEditing();
    }
    execute({
      title,
      id: data.id,
    });
  };

  const onBlur = () => {
    formRef.current?.requestSubmit();
  };

  if (isEditing) {
    return (
      <div className="flex flex-row justify-between gap-2">
        {/* 1...... */}
       
        <div className="truncate flex flex-row gap-1">
            {/* 1.1...... */}
            <Avatar 
              className="h-10 w-10 z-50"
            >
              <AvatarImage src={ownerImage.length>0 ?  ownerImage : data?.imageThumbUrl}/>
            </Avatar>
            {/* 1.2....... */}
            <form action={onSubmit} ref={formRef} className="flex items-center gap-x-2">
              <FormInput
                ref={inputRef}
                id="title"
                onBlur={onBlur}
                defaultValue={title}
                className="text-sm font-bold md:text-lg px-[7px] py-1 h-auto w-[290px] md:w-[500px]  lg:w-[700px] xl:w-[800px] bg-transparent focus-visible:outline-none focus-visible:ring-transparent border-none flex-grow"
              />
            </form>
        </div> 
        {/* 2nd.... */}
        <span className="ml-8 mt-1 px-2 flex-shrink relative top-2  text-xs sm:text-sm text-zinc-200">{percent}%</span>
      </div>
    )
  }
  
  return (
   
  <div className="truncate flex flex-row justify-between gap-1 ">
      {/*1... First div--- */}
      <div className="truncate flex flex-row">
          {/*1a...1st component  */}
          <Avatar 
            className="h-10 w-10 z-50"
          >
            <AvatarImage src={ownerImage.length>0 ?  ownerImage : data?.imageThumbUrl}/>
          </Avatar>
          {/*1b....2nd component */}
          <Button
              onClick={enableEditing}
              variant="transparent"
              className="truncate font-bold text-sm sm:text-lg h-auto w-auto p-1 px-2 "
          >
              <div  className="truncate">{title}</div> 
          </Button>
      </div>
      {/*2...... Second div */}
      <span className="mt-1 px-2 flex-shrink relative top-2  text-xs sm:text-sm text-zinc-200">{percent}%</span>
  </div>
  );
};
