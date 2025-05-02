"use client";

import { toast } from "sonner";
import { Search, X } from "lucide-react";
import { 
  forwardRef, 
  useRef, 
  ElementRef, 
  KeyboardEventHandler,
  useState,
} from "react";
import { useParams } from "next/navigation";
import { useEventListener } from "usehooks-ts";

import { useAction } from "@/hooks/use-action";
import { createCard } from "@/actions/create-card";
import { Button } from "@/components/ui/button";
import { FormSubmit } from "@/components/form/form-submit";
import { FormTextarea } from "@/components/form/form-textarea";
import { useOnClickInside,  useOnClickOutsideDelayLay } from "@/hooks/use-OnClickInsideOutside";
import { cn } from "@/lib/utils";

interface CardFormProps {
  listId: string;
  enableEditing: () => void;
  disableEditing: () => void;
  cancelDisableEditing: () => void;
  isEditing: boolean;
  timeoutId: React.MutableRefObject<number | null>
};

export const SearchForm = forwardRef<HTMLTextAreaElement, CardFormProps>(({
  listId,
  enableEditing,
  disableEditing,
  cancelDisableEditing,
  isEditing,
  timeoutId
}, ref) => {
  const params = useParams();
  const formRef = useRef<ElementRef<"form">>(null);
 //const insideRef = useRef<HTMLDivElement>(null);
 const[toggleState,setToggleState] =useState(false)

  const { execute, fieldErrors } = useAction(createCard, {
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" created`);
      formRef.current?.reset();
    },
    onError: (error) => {
      toast.error(error);
    },
  });
  
  //escake trigger
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      disableEditing();
    }
    //console.log("key pressed", e.target)
  };
  
  
  /* Compleex hook */
   // Combining both hooks into a single component
  useOnClickInside(formRef, cancelDisableEditing, timeoutId);
  //delay disabling form
  useOnClickOutsideDelayLay(formRef, disableEditing, 5000, timeoutId); 
  useEventListener("keydown", onKeyDown);

  const onTextareakeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };


  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const listId = formData.get("listId") as string;
    const boardId = params?.boardId as string;
   
    execute({ title, listId, boardId });
  };



  if (isEditing) {
    return (
      <form
        id="id1"
        name= "name1"
        ref={formRef}
        action={onSubmit}
        className="m-1 py-0.5 px-1 space-y-1"
      >
        <FormTextarea
          id="title"
          className={cn("h-[20px] font-sans italic hover:text-amber-900 hover:not-italic",
                  toggleState?"hover:font-mono": "hover:font-mono")}
          onKeyDown={onTextareakeyDown}
          ref={ref}
          placeholder="Enter a title for this card. To save, press [Enter] key"
          errors={fieldErrors}
        />
        <input
          hidden
          id="listId"
          name="listId"
          value={listId}
        />
        <div className="flex items-center gap-x-1 justify-end">
          <FormSubmit className="h-17 w-17" >
            Submit
          </FormSubmit>
          <Button onClick={disableEditing} size="sm" variant="ghost">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="pt-2 px-2 text-[7px]">
      <Button
        onClick={enableEditing}
        className="h-auto px-2 py-1.5 w-full justify-end text-muted-foreground text-[8px] hover:text-sm"
        size="sm"
        variant="ghost"
      >
        <Search className="h-4 w-4 mr-2" />
        Show Search
      </Button>
    </div>
  );
});

SearchForm.displayName = "SearchForm";