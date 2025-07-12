"use client";

import { toast } from "sonner";
import { ElementRef, useRef, useState } from "react";
import { Layout } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { CardWithList } from "@/types";
import { useAction } from "@/hooks/use-action";
import { updateCard } from "@/actions/update-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormInput } from "@/components/form/form-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  data: CardWithList;
  boardId:string;
  showEditCardMedia: boolean; // Add this prop
  toggleEditCardMedia: () => void; // Add this prop
}

export const Header = ({
  data,
  boardId,
  showEditCardMedia,
  toggleEditCardMedia,
}: HeaderProps) => {
  const queryClient = useQueryClient();
 
  const { execute } = useAction(updateCard, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["card", data.id]
      });

      queryClient.invalidateQueries({
        queryKey: ["card-logs", data.id]
      });

      toast.success(`Renamed to "${data.title}"`);
      setTitle(data.title);
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const inputRef = useRef<ElementRef<"input">>(null);
  const [title, setTitle] = useState(data?.title);

  const onBlur = () => {
    inputRef.current?.form?.requestSubmit();
  };

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    //if no changes detected pass DB persistence
    if (title === data?.title) {
      return;
    }

    execute({
      title,
      boardId,
      id: data.id,
    });
  }

  return (
    <div className="flex items-start mb-1 gap-x-3 w-full">
    <Layout className="h-5 w-5 mt-1 text-neutral-700" />
    <div className="flex-grow">
        <div className="flex flex-row justify-between items-start">
            <div className="flex-grow">
                <form id="id1" name="name1" action={onSubmit} className="w-full">
                    <FormInput
                        ref={inputRef}
                        onBlur={onBlur}
                        id="title"
                        defaultValue={title}
                        disabled={true}
                        className="font-semibold text-xl px-1 text-neutral-700 bg-transparent border-transparent relative -left-1.5 w-full focus-visible:bg-white focus-visible:border-input mb-0.5 truncate overflow-hidden whitespace-nowrap text-ellipsis" 
                    />
                </form>
                <p className="text-sm text-muted-foreground break-words">
                    in list <span className="underline">{data?.list.title}</span>
                </p>
            </div>
            <div className="mr-8 shrink-0">
                <Button
                    className={cn("p-2", showEditCardMedia ? 'text-blue-700 border-blue-700' : 'border-gray-800')}
                    onClick={toggleEditCardMedia}
                    variant="outline"
                >
                    {showEditCardMedia ? 'Hide Edit Media' : 'Show Edit Media'}
                </Button>
            </div>
        </div>
    </div>
</div>
  );
};

Header.Skeleton = function HeaderSkeleton() {
  return (
    <div className="flex items-start gap-x-3 mb-6">
      <Skeleton className="h-4 w-12 mt-1 bg-neutral-200  mb-2" />
      <Skeleton className="h-4 w-12 mt-1 bg-neutral-200  mb-2" />
    </div>
   
  );
};
