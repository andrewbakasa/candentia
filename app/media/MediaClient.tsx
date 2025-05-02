'use client';
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SafeUser } from "../types";
import Container from "../components/Container";
import Slider from "@/components/modals/media-modal/slider";
import { Separator } from "@radix-ui/react-separator";
import { cn, isWithinOneDay, truncateString } from "@/lib/utils";
import { CompositeDecorator, DraftDecorator, Editor, EditorState } from "draft-js";
import { getTextFromEditor3_2 } from "@/components/modals/card-modal/description";
import moment from "moment";
import useFavorite from "../hooks/useFavorite";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import Head from "next/head";
import { Skeleton } from "@/components/ui/skeleton";
import CardTags from "../myprojects/_components/card-tags";
import CreatedAtUpdatedAt from "../myprojects/_components/updatedCreated";
import { NO_FILTER_SEARCH_CODE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Search from "../components/Search";
import { BsViewStacked } from "react-icons/bs";
import { Hint } from "@/components/hint";

interface MediaClientProps {
 // media: any[],
  currentUser?: SafeUser | null,
  origin: string,
  tagNames:any;
  userNames:any;
}

const MediaClient: React.FC<MediaClientProps> = ({ currentUser, tagNames, userNames, origin }) => {
  const [category, setCategory] = useState<string>('');
  const searchParams = useSearchParams();
  //const cardIdFromUrl = searchParams?.get("cardId");
  const searchFromUrl = searchParams?.get("search");

  const [currentCardData, setCurrentCardData] = useState<any | null>(null);
  const [cardMedia, setCardMedia] = useState<any[]>([]);
  const [filteredMediaCount, setFilteredMediaCount] = useState(0);
  const [hasAnyMedia, setHasAnyMedia] = useState(false);

 // const [searchingMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [compositeDecorator, setCompositeDecorator] = useState(new CompositeDecorator([]));
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [sliderIndex, setSliderIndex] = useState(0); // Track slider index
  const router = useRouter();
  const { hasFavorited } = useFavorite({
    listingId: currentCardData?.card?.id || "",
    currentUser
  });

  useEffect(()=>{
    let arrFirst =searchTerm.split(';');
    const subLists = arrFirst.filter(element => element);  // Using arrow function (ES6)
    //Combine elements from sub-lists into a single list
    const highlightText = subLists.flatMap(subList => subList.split(','));  
    const customHighlightDecorator: DraftDecorator = {
      strategy: (block, callback, contentState) => {
        const text = block.getText();
        const currentSelection = contentState.getSelectionBefore();  
        for (let i = 0; i < highlightText.length; i++) {
          const word = highlightText[i];
          const startIndex = text.toLocaleLowerCase().indexOf(word.toLocaleLowerCase());  
          if (startIndex !== -1) {
            const endIndex = startIndex + word.length;
            // console.log('nnn', word, text)
            // Check if the highlighted word overlaps with the current selection
            const isWithinSelection = currentSelection.getStartOffset() <= startIndex &&
                                      currentSelection.getEndOffset() >= endIndex;  
            const style = isWithinSelection ? 'HIGHLIGHTED_SELECTED' : 'HIGHLIGHTED';  
            callback(startIndex, endIndex);
          }
        }
      },
    
      component: ({ children, style }) => {
        return <span style={style} className="bg-yellow-400 ">{children}</span>;
      },
      
    };
    setCompositeDecorator(new CompositeDecorator([customHighlightDecorator]));
  },[searchTerm])
  
  useEffect(() => {
    let title = "View Media";
    let description = "View and manage media";

    
      title = `Search Results for "${searchFromUrl}"`;
      description = `Search results for "${searchFromUrl}"`;
   
    document.title = title;
  }, [currentCardData, searchFromUrl]);


  const { data: searchCardWithImageList, status: searchStatus, error: searchError, isFetching: isSearchFetching } = useQuery({
    queryKey: ["cardImageSearch", searchFromUrl],
    queryFn: async () => {
      //if (searchFromUrl) {
        //setSearchMode(true);
        const encodedSearchTerm = searchFromUrl?encodeURIComponent(searchFromUrl):encodeURIComponent(NO_FILTER_SEARCH_CODE);
        const data = await fetcher(`/api/cardImagesSearch/${encodedSearchTerm}`);
        console.log('data:' , data)
        return data || null;
      // } else {
      //   return null;
      // }
    },
    enabled: true//!!searchFromUrl,
  });

  const handleCardIdChange = (cardId: string | null, index: number) => {
    setCurrentCardId(cardId);
    setSliderIndex(index);
  };

 

  useEffect(() => {
  
    if (searchStatus === "success" && searchCardWithImageList?.data) {
      if (!currentCardId && searchFromUrl) {
        setCurrentCardId(searchFromUrl);
        setCurrentCardData(searchCardWithImageList.data[0] || null);
      } else if (currentCardId && searchCardWithImageList.data){ // Update if currentCardId exists
        const foundMedia = searchCardWithImageList.data.find((item: { cardId: string; }) => item.cardId === currentCardId);
        setCurrentCardData(foundMedia || null);
      }
      setFilteredMediaCount(searchCardWithImageList.data.length || 0);
      setCardMedia(searchCardWithImageList.data || []);
      setHasAnyMedia(searchCardWithImageList?.hasMedia || false);
    } else if (searchStatus === "error") {
      setCurrentCardData(null);
      setCardMedia([]);
      setFilteredMediaCount(0);
      setHasAnyMedia(false);
      setCurrentCardId(null);
    }
  }, [searchStatus, searchFromUrl, searchCardWithImageList?.data, currentCardId, sliderIndex]);


  const isLoading =  isSearchFetching;

  return (  
    <Container>
      <Head>
        <title>{document.title}</title> {/* Dynamic title */}
        <meta name="description" content={currentCardData?.card?.description || "A description of the Media"} /> {/* Dynamic description */}
        {/* Add other meta tags as needed (e.g., Open Graph) */}
        <meta property="og:title" content={document.title} />
        <meta property="og:description" content={currentCardData?.card?.description || "A description of the Media"} />
        {/* Example: <meta property="og:image" content={imageUrl} /> */}
        <link rel="icon" href="/logo.svg" /> {/* Or .png, .svg, etc. */}
      </Head>
      <div className="z-51 mt-[-50px]  sm:mt-[-80px] flex flex-col  sm:flex-col  justify-between sm:px-1 xs:px-2">
         
          <div className={cn("flex gap-1 z-51",true?'flex-col':'flex-row justify-between')}>
         { currentUser && <div className="flex flex-row gap-1 justify-end">
                   {currentCardData && <Button
                        className="md:mt-12 sm:mt-6 h-auto px-2 py-1.5 w-16 justify-end  text-[8px] hover:text-sm"
                        size="sm"
                        variant="ghost"
                        onClick={()=>router.push(`/m/${currentCardData?.card?.id}`)}
                      > 
                        <Hint
                            sideOffset={20} // Adjust as needed
                            description={`Exportable Page`}
                        >                         
                         <BsViewStacked className="h-4 w-4 mr-2" />
                        </Hint>
                      
                      
                      </Button>               
                  }

                 

                   <Search 
                      setSearchTerm={setSearchTerm} 
                        searchTerm = {searchTerm}
                        debounce={1500}  //Custom debounce of 1500ms
                        placeholderText="filter records..."
                    />
                </div> }
                <div   
                  className={cn("flex w-full mt-1 z-51 sm:mt-10 rounded-lg" ,true?'py-1':'')}
                >                   
                </div>
          </div>
         
       </div>
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
                  mediaList={cardMedia|| []}
                  fullView={true}
                  onCardIdChange={handleCardIdChange}
                />
        )}
              <Separator />
              <p className="text-sm text-blue-300 mr-auto">media {sliderIndex+1} of  [{filteredMediaCount}] </p>
              {currentCardData && (
                <div className="shadow-sm">
                  <h2 className="text-red-300">{currentCardData?.boardTitle}</h2>
                </div>
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
              
               <Hint
                  sideOffset={20}
                  description="Go to view page" // Static hint text
                >
                  <h5 
                    className='text-sm font-bold text-green-500 hover:cursor-pointer '
                    onClick={()=>router.push(`/m/${currentCardData?.card?.id}`)}
                  >
                    {currentCardData?.title}
                  </h5> 
              </Hint>
             <CreatedAtUpdatedAt 
                createdAt={currentCardData?.card?.createdAt} 
                updatedAt={currentCardData?.card?.updatedAt}/>

            <CardTags 
                index2={String('1')}  
                card={currentCardData?.card} 
                setCategory={setCategory} 
                category={category}
                tagNames={tagNames}
            />

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

