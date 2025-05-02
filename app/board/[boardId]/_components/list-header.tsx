"use client";

import { toast } from "sonner";
import { List } from "@prisma/client";
import { useEventListener } from "usehooks-ts";
import { useState, useRef, ElementRef } from "react";

import { useAction } from "@/hooks/use-action";
import { updateList } from "@/actions/update-list";
import { FormInput } from "@/components/form/form-input";

import { ListOptions } from "./list-options";
import { cn } from "@/lib/utils";
//import {useNumberVarStore} from "@/hooks/use-percent-updata";

interface ListHeaderProps {
  data: List;
  onAddCard: () => void;
  
};

export const ListHeader = ({
  data,
  onAddCard,
  
}: ListHeaderProps) => {
  const [title, setTitle] = useState(data.title);
  const [percent, setPercent] = useState(data.percent);
  //const { numberVar, setNumberVar } = useNumberVarStore();
  //set variable
  //setNumberVar(data.percent)
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
      toast.success(`Renamed to "${data.title}"`);
      setTitle(data.title);
      // setNumberVar(data.percent);
      setPercent(data.percent);
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const handleSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;

    if (title === data.title) {
      return disableEditing();
    }

    execute({
      title,
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
    <div className={cn("shadow-sm pt-2 px-2 text-sm/13px  font-semibold flex justify-between items-start- gap-x-2",
                   data.visible?"bg-gray-200": "bg-rose-200")}>
          {/* First div----- */}
          <div className="grow max-w-[220px]">
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
                    id="title"
                    placeholder="Enter list title.."
                    defaultValue={title}
                    className="text-sm/13px px-[7px] py-1 h-7 font-medium border-transparent hover:border-input focus:border-input transition truncate bg-transparent focus:bg-white"
                  />
                  <button type="submit" hidden />
                </form>
              ) : (
                <div
                  onClick={enableEditing}
                  className="flex flex-row justify-between w-full text-sm/13px px-2.5 py-1 h-7 font-medium border-transparent"
                >
                  {/* First div--- */}
                  <div className="truncate grow max-w-[220px]">{title}</div> 
                  {/* Second div */}
                  <span className="flex-shrink text-sm pt-0 text-zinc-400">{percent}%</span>
                </div>
              )}
          </div>

          {/* Second div */}
          <div className="ml-auto">
            <ListOptions
              onAddCard={onAddCard}
              data={data}
              percent={ percent}
              setPercent={setPercent}
          
            />
          </div>
    </div>
  );
};
