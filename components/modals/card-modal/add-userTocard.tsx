"use client";

import { toast } from "sonner";
import { ElementRef, useRef, useState } from "react";
import { AlignLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { CardWithList2 } from "@/types";
import { useAction } from "@/hooks/use-action";
import { updateCard } from "@/actions/update-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormInput } from "@/components/form/form-input";
import FilterSection from "@/app/components/FilterSection";

import { FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";
import { compareStringArrays, getLabelsAndValuesFromValues2 } from "@/lib/utils";
import { useCardIDToRefreshStore } from "@/hooks/use-refreshedCard";

interface TaggedUsersProps {
  data: CardWithList2;
  boardId:string;
  setActivityViewMode:(value:boolean) => void;
  userNames:any;
}

export const TaggedUsers = ({
  data,
  boardId,
  setActivityViewMode,
  userNames
}: TaggedUsersProps) => {
  const queryClient = useQueryClient()

  const labelsOnlyTagIDs = data?.taggedUsers?.map(item => item.userId)||[];
  const originalA =getLabelsAndValuesFromValues2(userNames, data?.taggedUsers)
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<ElementRef<"form">>(null);
  const [category,setCategory]=useState<string>('');
  const {setCardIDToRefreshState}=useCardIDToRefreshStore();
  
  const { execute, fieldErrors } = useAction(updateCard, {
    onSuccess: (data: { id: string; title: string; }) => {
      queryClient.invalidateQueries({
        queryKey: ["card", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["card-logs", data.id]
      });
      toast.success(`Card "${data?.title}" updated`);
      // 
      setCardIDToRefreshState(data.id);
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSubmit =  (formData: FormData) => {
      const newCategory= category?.length==0?[]: category.split(',');
      const arrayWithOnlyUserIds = data?.taggedUsers?.map(item => item.userId);
      const sameList = compareStringArrays(arrayWithOnlyUserIds,newCategory);
      const updatedList =(sameList==false)
      try {
            if (updatedList){
                  execute({
                    boardId,
                    id: data.id,
                    taggedUsers:newCategory
                  });
            }
        
      }catch(e){
        toast.message(`${e}`)
      }
  };
  const enableEditing = () => {
    setIsEditing(true);
    setActivityViewMode(false)    
  }

  const disableEditing = () => {
    setIsEditing(false);
    setActivityViewMode(true)
  };

  return (
    <div className="flex items-start gap-x-3 w-full">
      <AlignLeft className="h-5 w-5 mt-0.5 text-neutral-700" />
      <div className="w-full">
        <p className="font-semibold text-neutral-700 mb-2">
          Tagged Users
        </p>
        {isEditing ? (
          <form
            id="id1"
            name= "name1"
            action={onSubmit}
            ref={formRef}
            className="flex flex-col space-y-2 "
          >
          <FilterSection
                setCategory={(category) =>{ 
                          setCategory(category?category:'');
                                }}
                productCategories_options={userNames}
                originalList={originalA}
                isDisabled={false}
                placeholder="Add email tags.."
                category={labelsOnlyTagIDs.length>0?Array.from(labelsOnlyTagIDs).join(','):null}          
            /> 
            <div className="flex items-center gap-x-2">
              <FormSubmit>
                Update Tagged Users
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
                 className="static-editor  overflow-x-hidden overflow-y-auto"
                 onClick={enableEditing} 
              >

                <FilterSection
                    setCategory={(category) =>{ 
                              setCategory(category?category:'');
                    }}
                    productCategories_options={userNames}
                    originalList={originalA}
                    isDisabled={true}
                    placeholder="Add email tags..."               
                    category={labelsOnlyTagIDs.length>0?Array.from(labelsOnlyTagIDs).join(','):null}          
                /> 
              </div>
           
              </>
        )}
      </div>
    </div>
  );
};

// TaggedUsers.Skeleton = function HeaderSkeleton() {
//   return (
//     <div className="flex items-start gap-x-3 mb-6">
//       <Skeleton className="h-6 w-6 mt-1 bg-neutral-200" />
//       <div>
//         <Skeleton className="w-24 h-6 mb-1 bg-neutral-200" />
//         <Skeleton className="w-12 h-4 bg-neutral-200" />
//       </div>
//     </div>
//   );
// };

TaggedUsers.Skeleton = function TaggedUsersSkeleton() { // Corrected name
    return (
      <div className="flex items-start gap-x-3 w-full">
        <Skeleton className="h-5 w-5 mt-0.5 bg-neutral-200" /> {/* Icon */}
        <div className="w-full">
          <Skeleton className="w-24 h-6 mb-2 bg-neutral-200" /> {/* Title */}
  
          {/* Mimic FilterSection structure */}
          <div className="flex flex-col space-y-2">
              <Skeleton className="h-8 w-full bg-neutral-200" /> {/* Input/Select */}
              <div className="flex flex-wrap gap-2"> {/* Tag/User display area */}
                  <Skeleton className="h-6 w-20 bg-neutral-200 rounded-md" /> {/* User/Tag 1 */}
                  <Skeleton className="h-6 w-20 bg-neutral-200 rounded-md" /> {/* User/Tag 2 */}
                  <Skeleton className="h-6 w-20 bg-neutral-200 rounded-md" /> {/* User/Tag 3 */}
                  {/* ... more placeholders as needed */}
              </div>
          </div>
  
        </div>
      </div>
    );
  };