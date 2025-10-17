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
//import CardTags from "@/app/mycontent/_components/card-tags";
//import CreatedAtUpdatedAt from "@/app/mycontent/_components/updatedCreated";
import { SafeUser } from "@/app/types";
import Container from "@/app/components/Container";
import { Hint } from "@/components/hint";
import Heading from "@/app/components/Heading";
import { Button } from "@/components/ui/button";
import { AiFillPicture } from "react-icons/ai";
import { useMediaModal } from "@/hooks/use-media-modal";
import Link from "next/link";
import CreatedAtUpdatedAt from "@/app/mycontents/updatedCreated";
import CardTags from "@/app/mycontents/_components/card-tags";
// import Heading from "@/app/components/Heading";
//import Container from "../components/Container";

interface MediaClientProps {
  currentUser?: SafeUser | null,
  media: any[]|undefined,
  tagNames:any;
  userNames:any;
  hasMedia:boolean;
}
const MediaClient: React.FC<MediaClientProps> = ({ currentUser, tagNames, userNames, media,hasMedia
}) => {
  const [category, setCategory] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false); // Add state for feedback

  const [currentCardData, setCurrentCardData] = useState<any | null>(null);
  const [cardMedia, setCardMedia] = useState<any[]>([]);
  const [filteredMediaCount, setFilteredMediaCount] = useState(0);
  const [hasAnyMedia, setHasAnyMedia] = useState(false);
  const [compositeDecorator, setCompositeDecorator] = useState(new CompositeDecorator([]));
  const [sliderIndex, setSliderIndex] = useState(0); // Track slider index


   const mediaModal = useMediaModal();
   
  const { hasFavorited } = useFavorite({
    listingId: currentCardData?.card?.id || "",
    currentUser
  });


 
  const handleCardIdChange = (cardId: string | null, index: number) => {
  
    setSliderIndex(index);
  };

  useEffect(() => {
   
    //console.log("useEffect 1 ran",  sliderIndex); // Debugging log
      setCurrentCardData(media?.[0] || null);
      setFilteredMediaCount(media?.length || 0);
      setCardMedia(media || []);
      setHasAnyMedia(hasMedia || false);
   
  }, []);


  const isLoading = false;
  const [currentURL, setCurrentURL] = useState('');

  useEffect(() => {
    setCurrentURL(window.location.href); // Get current URL on mount and update if it changes
  }, []);
  return (  
    <Container>
      <Head>
        <title>{document.title}</title> {/* Dynamic title */}
        <meta name="description" content={currentCardData?.card?.description || "A description of the Media"} /> {/* Dynamic description */}
        {/* Add other meta tags as needed (e.g., Open Graph) */}
        <meta property="og:title" content={document.title} />
        <meta property="og:description" content={currentCardData?.card?.description || "A description of the Media"} />
        {/* Example: <meta property="og:image" content={imageUrl} /> */}
        <link rel="ico" href="/logo.svg" /> {/* Or .png, .svg, etc. */}
    
      </Head>
      {/* <div className="z-51 mt-0  sm:mt-0 flex flex-col  sm:flex-col  justify-between sm:px-1 xs:px-2">
         <Heading
               title={'View Media'}
              subtitle={'View'} 
              isSetBackground={false} 
          /> 
       
       </div> 
       */}
      <div className={cn("mt-0 pb-1 ", 0 == 0 ? "" : "shadow-xl rounded-md p-1 border-yellow-400 border-2")}>
        <div>
          {isLoading ? ( // Show skeleton while loading
            <>
            <Skeleton className="h-[250px] w-full mb-2"/>{/* Adjust height as needed */}
            <Skeleton className="h-4 w-1/4 mb-2"/>
            <Skeleton className="h-4 w-1/2 mb-2"/>
            <Skeleton className="h-4 w-3/4 mb-2"/>
            <Skeleton className="h-4 w-full mb-2"/>
            </>
          ) : (
            <>
              {/* if has no media  dont show <slider> component*/}
              {hasAnyMedia && (
                <Slider
                    mediaList={cardMedia || []}
                    fullView={true}
                    onCardIdChange={handleCardIdChange} 
                    onDescriptionChange={function (mediaId: string, newDescription: string | null): void {
                      throw new Error("Function not implemented.");
                    } }
                     onFileNameChange={function (mediaId: string, newFileName: string | null): void {
                      throw new Error("Function not implemented.");
                    } } 
                    canEdit={false}   
                    sliderIndex={sliderIndex} // Pass sliderIndex
                    filteredMediaCount={filteredMediaCount} // Pass the actual count
                    
                    />
        )}
              <Separator />
              {/* <p className="text-sm text-blue-300 mr-auto">media {sliderIndex+1} of  [{filteredMediaCount}] </p> */}
              {currentCardData && (
                

                  <Link  
                    // key={board.id} 
                    href={`/board/${currentCardData.boardId}`} 
                    className= {cn('cursor-pointer ',   
                    'group hover:underline' // Use group:hover for underline on hover
                    )} 
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

      {isLoading ? ( // Skeleton for Card details
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
                        description="Click to copy link and share" // Static hint text
                      >
                        <h5
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(`${window.location.origin}/m/${currentCardData?.card?.id}`);
                              setCopySuccess(true);
                              setTimeout(() => setCopySuccess(false), 2000);
                            } catch (error) {
                              console.error("Failed to copy:", error);
                            }
                          }}
                          className="text-green-400 text-sm font-bold hover:cursor-pointer inline-flex items-center" // Use inline-flex for alignment
                        >
                          {currentCardData?.title}

                        </h5>
                      </Hint>

                  {copySuccess && <p className="text-green-500">Link copied!</p>} {/* Feedback */}
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
                        {/* View */}
                        {(currentCardData?.card.viewCount != null && Number(currentCardData?.card.viewCount) > 0) && (
                          <Hint
                          sideOffset={20}
                          description={`Number of views is ${currentCardData?.card.viewCount}`}
                        >
                            <span className="relative inline-flex items-center justify-center p-1 cursor-pointer hover:text-blue-600 transition">
                                {/* Count (Badge) - Adjusted positioning to be more "on top" */}
                                <span className="absolute top-[-10px] right-[-5px] bg-red-500 text-white text-[10px] font-semibold h-5 w-auto min-w-[20px] flex items-center justify-center rounded-full p-0.5 z-10">
                                    {currentCardData?.card.viewCount}
                                </span>
                                {/* Eye Icon for Views */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                            </span>
                          </Hint>
                        )}                    
                    <Button
                        onClick={ () => mediaModal.onOpen(currentCardData?.card.id, currentCardData?.boardId, currentUser, true)}
                        className="h-auto w-10 justify-end text-muted-foreground text-[11px] hover:text-sm" // No need for relative here unless you have other absolute elements
                        size="sm"
                        variant="ghost"
                    >
                        {/* Button text wrapped in hint */}
                        <Hint
                            sideOffset={20} // Adjust as needed
                            description={currentCardData?.cardImages?.length>0?`Show Media(Videos, Picture etc) ${currentCardData?.cardImages?.length}`:`No media found. Click to create new media: videos and still pictures`}
                            
                        >
                            {/* Display text */}
                            <div className="flex flex-row gap-1">
                            {currentCardData?.cardImages?.length>0 && <span>{`${currentCardData?.cardImages?.length} `}</span>}
                                <AiFillPicture
                                size={10}
                                className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
                                />
                            </div>
                        </Hint>
                    </Button>
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

