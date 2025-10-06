'use client';
import { useState, useEffect } from "react";
import Slider from "@/components/modals/media-modal/slider";
import { Separator } from "@radix-ui/react-separator";
import { cn, isWithinOneDay, truncateString } from "@/lib/utils";
import { CompositeDecorator, DraftDecorator, Editor, EditorState } from "draft-js";
import { getTextFromEditor3_2 } from "@/components/modals/card-modal/description";
import moment from "moment";
import Head from "next/head";
import { Skeleton } from "@/components/ui/skeleton";
import useFavorite from "@/app/hooks/useFavorite";
import { SafeUser } from "@/app/types";
import Container from "@/app/components/Container";
import { Hint } from "@/components/hint";
import Heading from "@/app/components/Heading";
import { Button } from "@/components/ui/button";
import { AiFillBook, AiFillDashboard, AiFillPicture } from "react-icons/ai";
import { useMediaModal } from "@/hooks/use-media-modal";
import Link from "next/link";
import CreatedAtUpdatedAt from "@/app/mycontents/updatedCreated";
import CardTags from "@/app/mycontents/_components/card-tags";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Keep this
import { useAction } from "@/hooks/use-action";
import { updateCardMediaDescription } from '@/app/actions/update-cardMedia-descriptions';
import { updateCardMediaFileName } from '@/app/actions/update-cardMedia-filename';
import { CardImage } from "@prisma/client";
import { fetcher } from "@/lib/fetcher";

// Assuming 'any' structure for media is consistent with CardImage extended with card/board info
interface MediaItem {
  cardId: string;
  boardId: string;
  boardTitle: string;
  title: string;
  card: {
    id: string;
    description: string;
    updatedAt: string;
    visible: boolean;
    // Add other fields from your card model
  };
  cardImages?: CardImage[]; // Add CardImages if not part of the main media object
  // Add other fields from your media object
}

interface MediaClientProps {
  currentUser?: SafeUser | null,
  media: any[]|undefined,
  tagNames: any;
  userNames: any;
  hasMedia: boolean;
  cardId: string; // <-- ESSENTIAL ADDITION for useQuery key
}

const MediaClient: React.FC<MediaClientProps> = ({ 
  currentUser, tagNames, userNames, media, hasMedia, cardId 
}) => {
  const [category, setCategory] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentCardData, setCurrentCardData] = useState<any | null>(null);
  const [cardMedia, setCardMedia] = useState<CardImage[]>([]); // Changed to CardImage[] for clarity
  const [filteredMediaCount, setFilteredMediaCount] = useState(0);
  const [hasAnyMedia, setHasAnyMedia] = useState(false);
  const [compositeDecorator] = useState(new CompositeDecorator([]));
  const [sliderIndex, setSliderIndex] = useState(0);
  const queryClient = useQueryClient();
 
  // Define allowed roles for editing permissions
  const allowedRoles: string[] = ['admin', 'manager'];
  const canEdit = currentUser?.isAdmin || currentUser?.roles?.some(role =>
    allowedRoles.includes(role.toLowerCase())
  ) || false;
  const mediaModal = useMediaModal();
  
  const { hasFavorited } = useFavorite({
    listingId: currentCardData?.card?.id || "",
    currentUser
  });
 
  // 1. ACTIVATE TanStack Query for data fetching
  // This query will be automatically refetched when invalidated
  const { data: cardImages, status, error } = useQuery<CardImage[] | null>({
    queryKey: ["cardImage", cardId], // <--- KEY MATCHES INVALIDATE CALLS
    queryFn: () => (cardId ? fetcher(`/api/cardImages/${cardId}`) : Promise.resolve(null)),
    enabled: !!cardId,
    // Ensure initial data is sorted by the 'order' field
    select: (data) => data ? [...data].sort((a, b) => a.order - b.order) : null,
  });

  // useAction hook for updating card image description
  const { execute: updateCardImageDescriptionMutation } = useAction(updateCardMediaDescription, {
    onSuccess: (data) => {
      // 2. CORRECT REFRESH: Invalidate the specific query key
      queryClient.invalidateQueries({ queryKey: ["cardImage", data.cardId] }); 
      toast.success("Description updated successfully!");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // useAction hook for updating card image filename
  const { execute: updateCardImageFilenameMutation } = useAction(updateCardMediaFileName, {
    onSuccess: (data) => {
      // 3. CORRECT REFRESH: Invalidate the specific query key
      queryClient.invalidateQueries({ queryKey: ["cardImage", data.cardId] });
      toast.success("Filename updated successfully!");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Handler for description change
  const handleDescriptionChange = (mediaId: string, newDescription: string | null) => {
    if (!mediaId) {
      toast.error("Media ID is missing for description update.");
      return;
    }
    updateCardImageDescriptionMutation({ id: mediaId, description: newDescription });
  };

  // Handler for filename change
  const handleFileNameChange = (mediaId: string, newFileName: string | null) => {
    if (!mediaId) {
      toast.error("Media ID is missing for filename update.");
      return;
    }
    updateCardImageFilenameMutation({ id: mediaId, fileName: newFileName });
  };
  
  const handleCardIdChange = (newCardId: string | null, index: number) => {
    // Note: The newCardId here refers to the CardImage ID, not the Card ID.
    // We only track the slider index for display purposes in this component.
    setSliderIndex(index); 
  };

  // 4. Update state when initial props or fetched data changes
  useEffect(() => {
    // Initialize component with card data from props (media[0] contains card details)
    setCurrentCardData(media?.[0] || null);

    // Use the fetched cardImages data (from TanStack Query) to populate the media slider
    const finalMedia = cardImages || [];
    setFilteredMediaCount(finalMedia.length || 0);
    setCardMedia(finalMedia);
    setHasAnyMedia(finalMedia.length > 0 || hasMedia || false);

  }, [media, cardImages, hasMedia]); // Dependency on cardImages is crucial for refresh

  const isLoading = status === 'pending';
  const [currentURL, setCurrentURL] = useState('');

  useEffect(() => {
    setCurrentURL(window.location.href);
  }, []);

  return (  
    <Container>
      <Head>
        <title>{currentCardData?.title || "Media View"}</title>
        <meta name="description" content={currentCardData?.card?.description || "A description of the Media"} />
        <meta property="og:title" content={currentCardData?.title || "Media View"} />
        <meta property="og:description" content={currentCardData?.card?.description || "A description of the Media"} />
        <link rel="ico" href="/logo.svg" />
      </Head>
      
      <div className={cn("mt-0 pb-1 ", 0 == 0 ? "" : "shadow-xl rounded-md p-1 border-yellow-400 border-2")}>
        <div>
          {isLoading ? (
            <>
            <Skeleton className="h-[250px] w-full mb-2"/>
            <Skeleton className="h-4 w-1/4 mb-2"/>
            <Skeleton className="h-4 w-1/2 mb-2"/>
            <Skeleton className="h-4 w-3/4 mb-2"/>
            <Skeleton className="h-4 w-full mb-2"/>
            </>
          ) : (
            <>
              {hasAnyMedia && (
                <Slider
                    mediaList={cardMedia} // Use the state updated by useQuery
                    fullView={true}
                    onCardIdChange={handleCardIdChange} 
                    onDescriptionChange={handleDescriptionChange}
                    onFileNameChange={handleFileNameChange}
                    canEdit={canEdit}   
                    sliderIndex={sliderIndex}
                    filteredMediaCount={filteredMediaCount}
                    mediaUrl={`${window.location.origin}/m/${cardId}`}
                />
              )}
              <Separator />
              {currentCardData && (
                  <Link  
                    href={`/board/${currentCardData.boardId}`} 
                    className= {cn('cursor-pointer ', 'group hover:underline')} 
                  > 
                      <h4 
                          className={cn(
                              "text-red-400 hover:cursor-pointer inline-flex items-center", 
                          )}
                          >
                          {currentCardData?.boardTitle}
                      </h4>         
                  </Link>
              )}
            </>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <Skeleton className="h-12 w-full mt-3"/>
      ) : (
        currentCardData && (
          <div className={cn(
            "p-2 rounded-sm transition-colors duration-300",
            currentCardData.card?.visible
              ? isWithinOneDay(currentCardData?.card?.updatedAt || "", moment())
                ? "bg-yellow-50 hover:bg-yellow-200"
                : "bg-white hover:bg-gray-200"
              : "bg-rose-200 hover:bg-rose-300",
            hasFavorited ? "text-red-400 hover:text-red-600" : ""
          )}>
            <div className="shadow-sm">
              <Hint
                sideOffset={20}
                description="Click to copy link and share"
              >
                <h5
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(currentURL);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    } catch (error) {
                      console.error("Failed to copy:", error);
                    }
                  }}
                  className="text-green-400 text-sm font-bold hover:cursor-pointer inline-flex items-center"
                >
                  {currentCardData?.title}
                </h5>
              </Hint>
              {copySuccess && <p className="text-green-500">Link copied!</p>}
            </div>
            
            <CreatedAtUpdatedAt 
              createdAt={currentCardData?.card?.createdAt} 
              updatedAt={currentCardData?.card?.updatedAt}/>

            <CardTags 
              index2={String('4')}  
              card={currentCardData?.card} 
              setCategory={setCategory} 
              category={category}
              tagNames={tagNames}
            />
            <div className="flex gap-1 shadow-md justify-end">
              <div className="text-[11px]">                      
                <Button
                  onClick={ () => mediaModal.onOpen(currentCardData?.card.id, currentCardData?.boardId, currentUser, true)}
                  className="h-auto w-10 justify-end text-muted-foreground text-[11px] hover:text-sm"
                  size="sm"
                  variant="ghost"
                >
                  <Hint
                    sideOffset={20}
                    description={cardMedia?.length>0?`Show Media(Videos, Picture etc) ${cardMedia?.length}`:`No media found. Click to create new media: videos and still pictures`}
                  >
                    <div className="flex flex-row gap-1">
                    {cardMedia?.length>0 && <span>{`${cardMedia?.length} `}</span>}
                        <AiFillPicture
                        size={10}
                        className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
                        />
                    </div>
                  </Hint>
                </Button>
              </div>

              <div className="text-[11px]">                      
               
                <Link  
                    key={currentCardData?.boardId} 
                    href={`/board/${currentCardData?.boardId}`} 
                    className= {cn('cursor-pointer ',   
                    'group hover:underline' // Use group:hover for underline on hover
                    )} 
                > 
                      <Hint
                        sideOffset={20}
                        description={`Update Data`}
                      >
                        <div className="flex flex-row gap-1">                        
                            <AiFillDashboard
                            size={10}
                            className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
                            />
                        </div>
                      </Hint>           
                  </Link>
              </div>

             
            </div>
            <Editor
              editorState={EditorState.createWithContent(getTextFromEditor3_2(currentCardData?.card), compositeDecorator)}
              readOnly
              onChange={() => { }}
            />
          </div>
        )
      )}
    </Container>
  );
};

export default MediaClient;