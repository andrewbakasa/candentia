"use client";

import { toast } from "sonner";
import { AlignLeft, FormInput } from "lucide-react";
import { redirect, useParams } from "next/navigation";
import { useState, useRef, ElementRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEventListener, useOnClickOutside } from "usehooks-ts";

import { useAction } from "@/hooks/use-action";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";
import { SafeTag, SafeUser } from "@/app/types"; 
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { updateTag } from "@/actions/update-tag";
interface TagDataProps {
  data: SafeTag;
  currentUser?: SafeUser | null;
};

export const TagData = ({
  data,
  currentUser
}: TagDataProps) => {
  const params = useParams();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const formRef = useRef<ElementRef<"form">>(null);
  const textareaRef = useRef<ElementRef<"textarea">>(null);
  const nameInputRef = useRef<ElementRef<"input">>(null);
  // const inputRef = useRef<ElementRef<"input">>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [nameInput, setNameInput] = useState<string>(data.name); // Initial value

  const handleNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value; // Parse to number
      setNameInput(name);
  };
  
  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    });
  }

  const disableEditing = () => {
    setIsEditing(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      disableEditing();
    }
  };

  useEventListener("keydown", onKeyDown);
  useOnClickOutside(formRef, disableEditing);

  const { execute, fieldErrors } = useAction(updateTag, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["tag", data.id],
      });
      toast.success(`Tag  ${data.name}  updated successfully: `);
      //-------
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const userId = params?.userID as string;
    const name = String(formData.get("name"));
    const description = String(formData.get("description"));
   if (description.length>2){
    execute({
      id: data.id,
      name:name,
      description:description
    })
   }else{
        execute({
          id: data.id,
          name:name
        })
   }
  }


let allowedRoles:String[]
allowedRoles=['admin', 'manager']
const isAllowedAccess = currentUser?.roles.filter((role: string) =>
                          (//Outer bracket ::forEach user role  
                              //Search Card  within the List
                              allowedRoles.some((y)=>(// Allowed Roles
                                  //Search Card Title
                                  y.toLowerCase().includes(role.toLowerCase())
                                  
                                )// Return clossing bracket
                              )
                        )// Out bracker
                    ) || []
// not admin and not user record
 if (isAllowedAccess?.length==0 && currentUser?.id!==data.id) return redirect('/denied') 

  return (

    <div className="flex items-start gap-x-3 md:min-w-[700px]">
      <AlignLeft className="h-5 w-5 mt-0.5 text-neutral-700" />
      <div className="w-full">
        <p className="flex flex-row justify-between font-semibold text-neutral-700 mb-2">
           <div className="flex flex-row">
             {'Tag Details'}
           </div>
         
           <Link
            href={`/tags`}
            className="hover:text-sm hover:text-red-700"
            
              >
             Back to <b>Tags List</b>
          </Link>
        </p>

        {isEditing ? (
          <form
            id="id1"
            name= "name1"
            action={onSubmit}
            ref={formRef}
            className="space-y-2"
          >
          
           <div className="flex md:flex-col flex-col justify-between">
                <div className="space-x-2">
                <label htmlFor="name">Name</label>
                  <input 
                      id="name" 
                      name="name"
                      type="text" 
                      ref={nameInputRef} 
                      value={nameInput}
                      className="border w-[70%] pl-5"
                      onChange={handleNameInputChange}
                      />
                </div>


                <div className="space-x-2">
                  <FormTextarea
                      id="description"
                      className="w-full mt-2 min-h-[178px] "
                      placeholder="Add a more detailed description"
                      defaultValue={data?.description || ""  }
                      errors={fieldErrors}
                      ref={textareaRef}
                    /> 
                </div>

                
            </div>
        
            
            <Separator/>
           
            <div className="flex items-center gap-x-2">
              <FormSubmit 
                    className={cn("bg-rose-600" )}
              >
                Save
              </FormSubmit>
              <Button
                type="button"
                onClick={disableEditing}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
              <div
                onClick={enableEditing}
                role="button"
                className="min-h-[178px] bg-neutral-200 text-sm font-medium py-3 px-3.5 rounded-md"
              >
                {data.name || "Add a more detailed description..."}
              </div>
            
              <div className="flex flex-row justify-between">
                <div className="space-x-2">           
                  <label htmlFor="progress">Name</label>
                  <span className="text-rose-500">{data.name} </span> 
                </div>
              </div>
              <div className="flex flex-row justify-between">
                <div className="space-x-2">           
                  <label htmlFor="progress">Description</label>
                  <span className="text-rose-500">{data?.description||' N/A'} </span> 
                </div>
              </div>
           
          </>
        )}
      </div>
    </div>
  );
};


TagData.Skeleton = function TagDataSkeleton() {
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
