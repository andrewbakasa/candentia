'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { CompositeDecorator, DraftDecorator } from "draft-js";
import Head from "next/head";
import { useAction } from "@/hooks/use-action";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { SafeUser } from "@/app/types";
import Container from "@/app/components/Container";
import Slider from "@/components/modals/media-modal/slider";
//import Slider from "@/components/modals/drawing-media-modal/slider";

// Define the EmblaCarouselAPI type, matching what's exposed by Slider
interface EmblaCarouselAPI {
  scrollNext: () => void;
  scrollPrev: () => void;
  scrollTo: (index: number, jump?: boolean) => void;
  selectedScrollSnap: () => number;
}

interface MediaClientProps {
  currentUser?: SafeUser | null | undefined,
    //   drawingItem: Drawing & {
    //     boqItem: BOQItemWithParent | null;
    //   };
    drawingItem: any;
    id:string
}

const MediaClient: React.FC<MediaClientProps> = ({ currentUser, drawingItem , id}) => {
  // Create a single-item array from the drawingItem prop to pass to the slider.
  const [localDrawingsForSlider] = useState<any[]>([drawingItem]);
  const sliderRef = useRef<EmblaCarouselAPI | null>(null);
  // Use useAction for updating drawing description
  const { execute: updateDrawingDescriptionMutation } = useAction(updateDrawingDescription, {
    onSuccess: (data) => {
      toast.success("Description updated successfully!");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: updateDrawingFileNameMutation } = useAction(updateDrawingFileName, {
    onSuccess: (data) => {
      toast.success("Filename updated successfully!");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleDescriptionChange = useCallback((mediaId: string, newDescription: string | null) => {
    if (!mediaId) {
      toast.error("Media ID is missing for description update.");
      return;
    }
    updateDrawingDescriptionMutation({ id: mediaId, description: newDescription });
  }, [updateDrawingDescriptionMutation]);

  const handleFileNameChange = useCallback((mediaId: string, newFileName: string | null) => {
    if (!mediaId) {
      toast.error("Media ID is missing for filename update.");
      return;
    }
    updateDrawingFileNameMutation({ id: mediaId, fileName: newFileName });
  }, [updateDrawingFileNameMutation]);

  // Callback to get the Embla API from the Slider component
  const handleEmblaApiInit = useCallback((api: EmblaCarouselAPI) => {
    sliderRef.current = api;
  }, []);

  return (
    <Container>
      <Head>
        <title>View Media</title>
        <link rel="icon" href="/logo.svg" />
      </Head>
      <div className="z-51 mt-[-50px] sm:mt-[-80px] flex flex-col sm:flex-col justify-between sm:px-1 xs:px-2">
        <div className={cn("flex w-full mt-1 z-51 sm:mt-10 rounded-lg", false ? 'py-1' : '')}>
          {/* Header or other elements if needed */}
        </div>
      </div>
      <div className={cn("mt-0 pb-1 ", 0 === 0 ? "" : "shadow-xl rounded-md p-1 border-yellow-400 border-2")}>
        <div>
          {localDrawingsForSlider.length > 0 ? (
            <>
              <Slider
                mediaList={localDrawingsForSlider}
                fullView={true}
                onDescriptionChange={handleDescriptionChange}
                onFileNameChange={handleFileNameChange}
                // onEmblaApiInit={handleEmblaApiInit}
                canEdit={currentUser?.isAdmin || currentUser?.roles.some(role => ['admin', 'manager'].includes(role.toLowerCase())) || false}
             
                filteredMediaCount={1} sliderIndex={0} 
                // canEdit={false}  
                 urlsource={`${window.location.origin}/drawing/${id}`}    
                //  urlsourceDrawing={`${window.location.origin}/drawing/${id}`} 
                // urlsourceBoqItem={`${window.location.origin}/boqmedia/${id}`}        
              />
              <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-2 mx-auto">
                <div className="flex flex-row gap-1">
                  <h2 className="text-2xl font-semibold text-gray-700 mb-4">Associated BOQ Item</h2>
                  
                </div>
                {drawingItem.boqItem ? (
                  <BoqItemDetails
                    currentItem={drawingItem.boqItem}
                    searchTerm={""}
                    currentUser={null}
                    boqId={drawingItem.boqItem.id}
                    parentItem={undefined}
                  />
                ) : (
                  <div className="text-center text-gray-600 p-6 border border-gray-200 rounded-md bg-gray-50">
                    No BOQ Item is currently associated with the selected media.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg shadow-inner text-gray-600 text-center min-h-[300px]">
              <p className="text-2xl font-semibold mb-4">No media found.</p>
              <p className="text-md">This page requires a drawing item to display.</p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default MediaClient;
