
// MediaModal.tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CardWithList2 } from "@/types"; // Make sure this path is correct
import { fetcher } from "@/lib/fetcher"; // Make sure this path is correct
import { CardImage } from "@prisma/client";
import { useMediaModal } from "@/hooks/use-media-modal"; // Make sure this path is correct
import { Dialog, DialogContent } from "@/components/ui/dialog"; // Make sure this path is correct
import { Header } from "./header"; // Make sure this path is correct
import { Separator } from "@radix-ui/react-separator";
import Slider from "./slider"; // Make sure this path is correct
import EditCardMedia from "./editPage"; // Make sure this path is correct
import { useEffect, useState } from "react";
import { createCardImage } from "@/actions/create-cardImage"; // Make sure this path is correct
import { useAction } from "@/hooks/use-action"; // Make sure this path is correct
import toast from "react-hot-toast";


export const MediaModal = () => {
  const id = useMediaModal((state) => state.id || null);
  const boardId = useMediaModal((state) => state.boardId || "");
  const isOpen = useMediaModal((state) => state.isOpen);
  const currentUser = useMediaModal((state) => state.currentUser); // You might not be using this
  const isAll = useMediaModal((state) => state.isAll); // You might not be using this
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);

  const [filteredMediaCount, setFilteredMediaCount] = useState(0);
  const [sliderIndex, setSliderIndex] = useState(0); // Track slider index

  const handleCardIdChange = (cardId: string | null, index: number) => {
    setCurrentCardId(cardId);
    setSliderIndex(index);
    //console.log("Current Card ID in Parent:", cardId);
  };


 

  const [images, setImages] = useState<File[]>([]); // You might not be using this

  const onClose = useMediaModal((state) => state.onClose);
  const queryClient = useQueryClient();

  const { execute: createCardImageMutation } = useAction(createCardImage, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cardImage", data.id] });
      toast.success(`Media "${data.url}" created`);
      setShowEditCardMedia(false);
    },
    onError: (error) => {
      toast.error(error);
    },
  });


  const { data: cardImages , status, error } = useQuery<CardImage[] | null>({
    queryKey: ["cardImage", id],
    queryFn: () => (id ? fetcher(`/api/cardImages/${id}`) : Promise.resolve(null)).then(
    
    ),
    enabled: !!id,
  
  });

  useEffect(() => {
    setFilteredMediaCount(cardImages?.length || 0); 
}, [cardImages]);
  const { data: cardData } = useQuery<CardWithList2[] | null>({
    queryKey: ["card", id],
    queryFn: () => (id ? fetcher(`/api/cards/${id}`) : Promise.resolve(null)),
    enabled: !!id,
  });

  const [showEditCardMedia, setShowEditCardMedia] = useState(false);
  const toggleEditCardMedia = () => {
    setShowEditCardMedia(!showEditCardMedia);
  };

  const refreshCardImages = () => {
    queryClient.invalidateQueries({ queryKey: ["cardImage", id] });
  };
 

useEffect(() => {
  if (status === 'success') {
      if (!cardImages || cardImages.length === 0) {
          setShowEditCardMedia(true);
      } else {
          setShowEditCardMedia(false);
      }
  }
}, [status, cardImages]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {!cardData ? <Header.Skeleton /> : <Header 
                                                  data={cardData[0]} 
                                                  boardId={boardId}  
                                                  showEditCardMedia={showEditCardMedia} // Pass the state
                                                  toggleEditCardMedia={toggleEditCardMedia} // Pass the toggle function
                                           />}
        <div className="max-h-[90vh] overflow-x-hidden overflow-y-auto">
        
          <div className="w-[80vw]"> {/* Changed to w-full */}
            {/* <Slider mediaList={cardImages || []} fullView={!showEditCardMedia} /> */}
            <Slider mediaList={cardImages|| []} fullView={!showEditCardMedia} onCardIdChange={handleCardIdChange} />
    
            <Separator />
            <p className="px-2 text-sm text-blue-300 mr-auto">media {sliderIndex+1} of  [{filteredMediaCount}] </p>
        
            {
            showEditCardMedia && (
              <EditCardMedia
                newImageList={[]}
                dbImages={cardImages || []}
                cardId={cardData?.[0]?.id || ""}
                createCardImageMutation={createCardImageMutation}
                refreshCardImages={refreshCardImages}
                boardId={boardId} 
                currentUser={currentUser}
              />
            )
            }
        

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};