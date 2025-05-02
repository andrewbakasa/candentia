"use client";

import { toast } from "sonner";
import { List } from "@prisma/client";
import { ElementRef, useRef } from "react";
import { HelpCircle, MoreHorizontal, X } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose
} from "@/components/ui/popover";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { copyList } from "@/actions/copy-list";
import {orderByDate } from "@/actions/order-by-date";
import { deleteList } from "@/actions/delete-list";
import { FormSubmit } from "@/components/form/form-submit";
import { Separator } from "@/components/ui/separator";
import { toggleList } from "@/actions/toggle-list-public";
import { cn } from "@/lib/utils";
import { ListProgress } from "./list-progress";
import { Hint } from "@/components/hint";
//import {useNumberVarStore} from "@/hooks/use-percent-updata";

interface ListOptionsProps {
  data: List;
  onAddCard: () => void;
  setPercent:(value:number) => void;
  percent:number
};

export const ListOptions = ({
  data,
  onAddCard,
  setPercent,
  percent
}: ListOptionsProps) => {
  const closeRef = useRef<ElementRef<"button">>(null);
 // const { numberVar, setNumberVar } = useNumberVarStore();

  // const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const newNumber = Number(event.target.value);
  //   setNumberVar(newNumber);
  // };
  
  const { execute: executeDelete } = useAction(deleteList, {
    onSuccess: (data) => {
      toast.success(`List "${data.title}" deleted`);
      closeRef.current?.click();
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const { execute: executeCopy } = useAction(copyList, {
    onSuccess: (data) => {
      toast.success(`List "${data.title}" copied`);
      closeRef.current?.click();
    },
    onError: (error) => {
      toast.error(error);
    }
  });

   const { execute: executeReOrderByDate } = useAction(orderByDate, {
    onSuccess: (data) => {
      toast.success(`List "${data.title}" re-order by Data`);
      closeRef.current?.click();
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const { execute: executeTogglePrivacy } = useAction(toggleList, {
    onSuccess: (data) => {
      toast.success(`List '${data.title}' updated and is now ${data?.visible? "public":"private"}`);
      closeRef.current?.click();
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const onDelete = (formData: FormData) => {
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;

    executeDelete({ id, boardId });
  };

  const onCopy = (formData: FormData) => {
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;

    executeCopy({ id, boardId });
  };


  const onReorderByDate = (formData: FormData) => {
      const id = formData.get("id") as string;
      const boardId = formData.get("boardId") as string;
      //console.log("......HERE", id, boardId)
      executeReOrderByDate({ id, boardId });
    };

    const onTogglePrivacy = (formData: FormData) => {
      const listId = formData.get("id") as string;
      const boardId = formData.get("boardId") as string;
      //console.log("......HERE", id, boardId)
      executeTogglePrivacy({ listId, boardId });
    };
    
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="h-auto w-auto p-2 text-red-700" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="px-0 pt-3 pb-3" side="bottom" align="start">
        <div className="px-5 truncate text-sm font-medium text-left text-neutral-600 pb-4 max-w-[95%]">
          List actions: {data.title}
        
        </div>
        <PopoverClose ref={closeRef} asChild>
          <Button className="h-auto w-auto p-2 absolute top-2 right-2 text-neutral-600" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </PopoverClose>
        <Button
          onClick={onAddCard}
          className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm"
          variant="ghost"
        >
          Add new card...
        </Button>
        <form  id="id1"
               name= "name1" action={onCopy}>
          <input hidden name="id" id="id" value={data.id} />
          <input hidden name="boardId" id="boardId" value={data.boardId} />
          <FormSubmit
            variant="ghost"
            className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm"
          >
            Copy list...
          </FormSubmit>
        </form>

        <form  id="id2"
               name= "name2"action={onReorderByDate}>
          <input hidden name="id" id="id" value={data.id} />
          <input hidden name="boardId" id="boardId" value={data.boardId} />
          <FormSubmit
            variant="ghost"
            className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm"
          >
            Sort by Date...
          </FormSubmit>
        </form>

        <form  id="id3"
                name= "name3" action={onTogglePrivacy}>
          <input hidden name="id" id="id" value={data.id} />
          <input hidden name="boardId" id="boardId" value={data.boardId} />
          <FormSubmit
            variant="ghost"
            // className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm"
            className={cn("rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm",
            data.visible?"": "bg-rose-200")}
          >
            {/* Check if List is private */}
           {data.visible? 'Toggle to private...': "Toggle to public..."}
          </FormSubmit>
        </form>
        <Separator />
        <form  id="id4"
              name= "name4"
          action={onDelete}
        >
          <input hidden name="id" id="id" value={data.id} />
          <input hidden name="boardId" id="boardId" value={data.boardId} />
          <FormSubmit
            variant="ghost"
            className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm"
          >
            Delete this list
          </FormSubmit>
        </form>

        <Separator />
        <ListProgress
          data={data}
          percent={ percent}
          setPercent={setPercent}
        />
      </PopoverContent>
    </Popover>
  );
};
