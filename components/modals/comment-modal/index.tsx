"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { Comment } from "@prisma/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CommentText } from "./comment";
import { useState } from "react";
import { Separator } from "@radix-ui/react-separator";
import { useCommentModal } from "@/hooks/use-comment-modal";
import { NewComment } from "./createNewComment";
export const CommentModal = () => {
  //id not avialable insert a dummy id
  const id = useCommentModal((state) => {return state.id? state.id: null });
  const cardId =useCommentModal((state) => {return state.cardId? state.cardId:null });
  const boardId =useCommentModal((state) => {return state.boardId? state.boardId:null });
  
  const isOpen = useCommentModal((state) => state.isOpen);
  const onClose = useCommentModal((state) => state.onClose);
  const [activityViewMode,setActivityViewMode]=useState(true)
  

  const { data: commentData, isLoading, error } = useQuery<Comment | null>({
    queryKey: ["comment", id],
    queryFn: () => 
      id ? fetcher(`/api/comments/${id}`) : Promise.resolve(null),
    enabled: !!id, // Enable the query only when id is truthy
  });


  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent>
        {/* {!cardData
          ? <Header.Skeleton />
          : <Header data={cardData} boardId={boardId} />
        } */}
        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-3 max-h-[100vh] overflow-x-hidden overflow-y-auto">
          <div className="col-span-3">
            <div className="w-full space-y-2">
              {id==null?<NewComment
                      cardId={cardId?cardId:""} 
                      boardId={boardId?boardId:""}
                      setActivityViewMode={setActivityViewMode} 
                    />:! commentData
                ? <CommentText.Skeleton />
                : <>
                 {/* <CommentText.Skeleton /> */}
                
                     <CommentText 
                      data={commentData} 
                      cardId={cardId?cardId:""} 
                      boardId={boardId?boardId:""}
                      setActivityViewMode={setActivityViewMode} 
                    />
                    <Separator/> 

                  </>
              }
              {/* Hidden if in mobile */}
              {/*show Log only if not editing  */}
              {/* {activityViewMode  && <div className="hidden md:block ">
                {!auditLogsData
                  ? <Activity.Skeleton />
                  : <Activity items={auditLogsData} />
                }
              </div>} */}
            </div>
          </div>
          {/* {!commentData
            ? <Actions.Skeleton />
            : <Actions data={commentData} />
          } */}
        </div>
      </DialogContent>
    </Dialog>
  );
};
