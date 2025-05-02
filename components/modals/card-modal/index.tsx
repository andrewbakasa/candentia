"use client";

import { useQuery } from "@tanstack/react-query";

import { CardWithList2 } from "@/types";
import { fetcher } from "@/lib/fetcher";
import { AuditLog, Tag } from "@prisma/client";
import { useCardModal } from "@/hooks/use-card-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { Header } from "./header";
import { Description } from "./description";
import { Actions } from "./actions";
import { Activity } from "./activity";
import { useState } from "react";
import { useTagLabelValueStore } from "@/hooks/use-tagLabelValue";
import { useUserLabelValueStore } from "@/hooks/use-userLabelValues";
import { TaggedUsers } from "./add-userTocard";
import { Separator } from "@radix-ui/react-separator";
import { TagList } from "./add-tags";
export const CardModal = () => {
  //id not avialable insert a dummy id
  const id = useCardModal((state) => {return state.id? state.id:null });
  const boardId =useCardModal((state) => {return state.boardId? state.boardId:"" });
  const isOpen = useCardModal((state) => state.isOpen);
  const isAll = useCardModal((state) => state.isAll);
  
  const onClose = useCardModal((state) => state.onClose);
  const [activityViewMode,setActivityViewMode]=useState(true)
  const {tagList}=useTagLabelValueStore();
  const {userList}=useUserLabelValueStore();

  
  const { data: cardData  } = useQuery<CardWithList2[]| null>({
    queryKey: ["card", id],
    queryFn: () => 
    id ?  isAll? fetcher(`/api/boardCards/${boardId}`):fetcher(`/api/cards/${id}`): Promise.resolve(null),
    enabled: !!id, // Enable the query only when id is truthy
  });


  const { data: auditLogsData } = useQuery<AuditLog[]>({
    queryKey: ["card-logs", id],
    queryFn: () => id ?fetcher(`/api/cards/${id}/logs`): Promise.resolve(null),
    enabled: !!id, // Enable the query only when id is truthy
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent>
        {!cardData
          ? <Header.Skeleton />
          : <Header data={cardData[0]} boardId={boardId} />
        }
        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-4 max-h-[100vh] overflow-x-hidden overflow-y-auto">
          <div className="col-span-3">
            <div className="w-full space-y-2">
              {!cardData
                ? <Description.Skeleton />
                : <>
                    <Description 
                      data={cardData[0]} 
                      dataList={cardData}
                      boardId={boardId}  
                      setActivityViewMode={setActivityViewMode} 
                    />
                    <Separator/>

                    <TagList
                      data={cardData[0]} 
                      boardId={boardId}  
                      tagNames ={tagList}
                      setActivityViewMode={setActivityViewMode} 
                    />
                    <Separator/>
                    
                    <TaggedUsers
                      data={cardData[0]} 
                      boardId={boardId}  
                      userNames ={userList}
                      setActivityViewMode={setActivityViewMode} 
                    />
                  </>
              }
              {/* Hidden if in mobile */}
              {/*show Log only if not editing  */}
              {activityViewMode  && <div className="hidden md:block ">
                {!auditLogsData
                  ? <Activity.Skeleton />
                  : <Activity items={auditLogsData} />
                }
              </div>}
            </div>
          </div>
          {!cardData
            ? <Actions.Skeleton />
            : <Actions data={cardData[0]} />
          }
        </div>
      </DialogContent>
    </Dialog>
  );
};
