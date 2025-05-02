"use client";
 import { toast } from "sonner";
 import { AlignLeft } from "lucide-react";
 import { redirect, useParams } from "next/navigation";
 import { useState, useRef, ElementRef } from "react";
 import { useQueryClient } from "@tanstack/react-query";
 import { useAction } from "@/hooks/use-action";
 import Link from "next/link";
 import { Skeleton } from "@/components/ui/skeleton";
 import { FormTextarea } from "@/components/form/form-textarea";
 import { FormSubmit } from "@/components/form/form-submit";
 import { Button } from "@/components/ui/button";
 import { SafeUser } from "@/app/types";
 import { cn } from "@/lib/utils";
 import { Board } from "@prisma/client";
 import { updateBoardPublicity } from "@/actions/update-board-publicity";

 interface BoardDataProps {
  data: Board;
  currentUser?: SafeUser | null;
 };

 export const BoardData = ({
  data,
  currentUser
 }: BoardDataProps) => {
  const params = useParams();
  const queryClient = useQueryClient();
  const [IsCheckedPublic, setIsCheckedPublic] = useState(data.public||false); // Default checked

  const handleCheckboxShowPublicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
   setIsCheckedPublic(event.target.checked);
  };


 
  const formRef = useRef<ElementRef<"form">>(null);
  const textareaRef = useRef<ElementRef<"textarea">>(null);
  const checkboxShowPublicRef = useRef<ElementRef<"input">>(null);

  const { execute, fieldErrors } = useAction(updateBoardPublicity, {
   onSuccess: (data) => {
    queryClient.invalidateQueries({
     queryKey: ["board", data.id],
    });
    queryClient.invalidateQueries({
     queryKey: ["board-logs", data.id]
    });
    toast.success(`Board ${data.title}  updated successfully: `);
   },
   onError: (error) => {
    toast.error(error);
   },
  });

  const onSubmit = (formData: FormData) => {
   //const userId = params?.userID as string;
   const public_var= Boolean(formData.get("public"));

   execute({
    id: data.id,
    public:public_var,
   })

  }

  return (
   <div className="flex items-start gap-x-3 md:min-w-[700px]">
      <AlignLeft className="h-5 w-5 mt-0.5 text-neutral-700" />
      <div className="w-full">
      <p className="flex flex-row justify-between font-semibold text-neutral-700 mb-2">
        <div className="flex flex-row">
      
        {'Board Details'}
        </div>

        {<Link
          href={`/boards-list`}
          className="hover:text-sm hover:text-red-700"

          >
          Back to <b>Boards List</b>
        </Link>}
      </p>

        <form
        id="id1"
        name= "name1"
        action={onSubmit}
        ref={formRef}
        className="space-y-2"
        >
            <FormTextarea
              id="title"
              className="w-full mt-2 min-h-[178px] "
              placeholder="Add a more detailed description"
              defaultValue={data?.title || "HHH"  }
              errors={fieldErrors}
              ref={textareaRef}
            />
            <div className="flex md:flex-row flex-col justify-between">

              <div className="space-x-2">
              <input
                id="public"
                name="public"
                type="checkbox"
                ref={checkboxShowPublicRef}
                checked={IsCheckedPublic}
                onChange={handleCheckboxShowPublicChange}
                //disabled={false} 
                />
              <label htmlFor="checkbox">Public</label>
              </div>

            </div>

            <div className="flex items-center gap-x-2">
              <FormSubmit
                  className={cn(
                    "",
                  // isCurrentLogInUserRecord  ? "bg-rose-600" : "",
                  )}
                  >
                  Save
                  </FormSubmit>
              <Button
              type="button"
              size="sm"
              variant="ghost"
              >
              Cancel
              </Button>
            </div>
        </form>
      
      </div>
    </div>
  );
 };

 BoardData.Skeleton = function BoardDataSkeleton() {
  return (
   <div className="flex items-start gap-x-3 w-full">
    <Skeleton className="h-6 w-6 bg-neutral-200" />
    <div className="w-full">
     <Skeleton className="w-24 h-6 mb-2 bg-neutral-200" />
     <Skeleton className="w-full h-[98px] bg-neutral-200" />
    </div>
   </div>
  );
 };
