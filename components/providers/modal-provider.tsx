"use client";

import { useEffect, useState } from "react";
import { MediaModal } from "@/components/modals/media-modal";
import { CardModal } from "@/components/modals/card-modal";
import { ProModal } from "@/components/modals/pro-modal";
import { CommentModal } from "../modals/comment-modal";
import { JobMediaModal } from "../modals/jobmedia-modal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <> 
      <CommentModal/>
       <JobMediaModal />
      <MediaModal />
      <CardModal />
      <ProModal />
      {/* <UserSettingsModal /> */}
    </>
  )
}