"use client";

import { toast } from "sonner";
import { Copy, Trash, History} from "lucide-react";
import { useParams } from "next/navigation";

import { CardWithList } from "@/types";
import { useAction } from "@/hooks/use-action";
import { copyCard } from "@/actions/copy-card";
import { Button } from "@/components/ui/button";
import { deleteCard } from "@/actions/delete-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCardModal } from "@/hooks/use-card-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader } from 'lucide-react'
interface ActionsProps {
  data: CardWithList;
};

export const Actions = ({
  data,
}: ActionsProps) => {
  const params = useParams();
  const cardModal = useCardModal();
  const onClose = useCardModal((state) => state.onClose);

  const { 
    execute: executeCopyCard,
    isLoading: isLoadingCopy,
  } = useAction(copyCard, {
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" copied`);
      cardModal.onClose();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { 
    execute: executeDeleteCard,
    isLoading: isLoadingDelete,
  } = useAction(deleteCard, {
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" deleted`);
      cardModal.onClose();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onCopy = () => {
    const boardId = params?.boardId as string;

    executeCopyCard({
      id: data.id,
      boardId,
    });
  };

  const onDelete = () => {
    const boardId = params?.boardId as string;

    executeDeleteCard({
      id: data.id,
      boardId,
    });
  };
  
  return (
    <div className="space-y-1 mt-2 ">
      <p className="text-xs font-semibold">
        Actions
      </p>
      <Button
        onClick={onCopy}
        disabled={isLoadingCopy}
        variant="gray"
        className="w-full justify-start"
        size="inline"
      >
        <Copy className="h-4 w-4 mr-2" />
        Copy
      </Button>
      {/* <Button
        onClick={onDelete}
        disabled={isLoadingDelete}
        variant="gray"
        className="w-full justify-start"
        size="inline"
      >
        <Trash className="h-4 w-4 mr-2" />
        Delete
      </Button> */}


      <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button  variant="gray"   className="w-full justify-start"    size="inline" type="button" disabled={isLoadingDelete} >
                {isLoadingDelete ? <Loader className='animate-spin' /> :  <><Trash  className="h-4 w-4 mr-2" />Delete</>}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Ready to Delete?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Do you really want to delete this card?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className={undefined}>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-gray-200 outline-1 hover:bg-gray-400" onClick={onDelete} >
                         <Trash className="h-4 w-4 mr-2 bg-red-600" /> 
                      </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>


      <Button
        onClick={onClose}
        //disabled={isLoadingDelete}
        variant="gray"
        className="w-full justify-start"
        size="inline"
      >
        <History className="h-4 w-4 mr-2" />
        Close Page
      </Button>
      
    </div>
  );
};

// Actions.Skeleton = function ActionsSkeleton() {
//   return (
//     <div className="space-y-2 mt-2 ">
//       <Skeleton className="w-20 h-4 bg-neutral-200" />
//       <Skeleton className="w-full h-8 bg-neutral-200" />
//       <Skeleton className="w-full h-8 bg-neutral-200" />
//     </div>
//   );
// };
Actions.Skeleton = function ActionsSkeleton() {
    return (
      <div className="space-y-2 mt-2">
        <Skeleton className="w-20 h-4 bg-neutral-200" /> {/* Actions Title */}
        <Skeleton className="w-full h-8 bg-neutral-200" /> {/* Copy Button */}
        <Skeleton className="w-full h-8 bg-neutral-200" /> {/* Delete Button */}
        <Skeleton className="w-full h-8 bg-neutral-200" /> {/* Close Button */}
      </div>
    );
  };