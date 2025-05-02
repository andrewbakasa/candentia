"use client";
import { cn, findLabelByValue, isWithinOneDay,} from "@/lib/utils";
import { useCardModal } from "@/hooks/use-card-modal";
import { Button } from "@/components/ui/button";
import { SafeCard, SafeUser } from "@/app/types";
import CreatedAtUpdatedAt from "./updatedCreated";
import { getTextFromEditor3 } from "@/components/modals/card-modal/description";
import { getFinalStatement } from "../ProjectsClient";
import CardTags from "./card-tags"
import { Editor, EditorState } from "draft-js";
import { AiFillBuild, AiFillEdit, AiFillLock, AiFillPicture, AiOutlineFolderView } from "react-icons/ai";
import { ElementRef, useEffect, useRef, useState } from "react";
import { CardWithList2, SafeCardWithList2 } from "@/types";
import HeartButton from "@/app/components/HeartButton";
import { usePinStateStore } from "@/hooks/use-pinState";
import { toast } from "sonner";
import { useCommentModal } from "@/hooks/use-comment-modal";
import { CommentShow } from "./display-comment";
import { CommentList } from "./display-all-comments";
import moment from "moment";
import useFavorite from "@/app/hooks/useFavorite";
import { useMediaModal } from "@/hooks/use-media-modal";
import { HelpCircle } from "lucide-react";
import { Hint } from "@/components/hint";
import Link from "next/link";
import { FcViewDetails } from "react-icons/fc";

interface TopCardProps {
  data: SafeCardWithList2;
  index: string;
  listOwner?:string;
  isOwnerOrAdmin?:boolean
  currentUserId:string;
  boardId:string;  
  setCategory: (category: string ) => void;
  category:string,
  tagNames:any;
  userNames:any;
  compositeDecorator:any;
  currentUser?:SafeUser | null | undefined;
  pagnumber?:number|null
//   handlePageClick:(options: { selected: number })=> void
 
};

export const TopCard = ({
  data,
  index,
  listOwner='',
  isOwnerOrAdmin,
  currentUserId,
  boardId,
  tagNames,
  userNames,
  setCategory,
  category,
  compositeDecorator,
  currentUser,
  pagnumber
//   handlePageClick
}: TopCardProps) => {

  const cardModal = useCardModal();
  const mediaModal = useMediaModal();
  const commentModal = useCommentModal();
  const editable= (listOwner==currentUserId) //list creator
  ||(data?.userId==currentUserId)  //card creator
  || isOwnerOrAdmin // board creator or admin

  useEffect(()=>{

  },[data])
 
 const editableIcon=editable? <span>
                  <AiFillEdit  
                      size={10} 
                      className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
                  /> 
                </span>: <span>
                  <AiFillLock 
                      size={10} 
                      className="cursor-pointer h-5 w-5 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
                  /> 
                </span>

const getAllIcon=editable? <span>
<AiOutlineFolderView 
    size={10} 
    className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
/> 
</span>: <span>
<AiFillLock 
    size={10} 
    className="cursor-pointer h-5 w-5 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
/> 
</span>
        const iamtagged= data.taggedUsers?.find(x=>x.userId==currentUserId)
        const ihavecomment= data.comments?.find(x=>x.userId==currentUserId)
        const mycommentid =ihavecomment?.id||''
   
const updatedWithADay = (isWithinOneDay(data.updatedAt, moment()))
const { hasFavorited  } = useFavorite({
    listingId:data.id,
    currentUser
   });
     
     return (          
        <div 
        // className="mt-3"
        // className={cn("mt-3 rounded-sm", 
        //            data.visible?updatedWithADay?'bg-yellow-50':'bg-white': "bg-rose-200",
        //            hasFavorited?'text-red-400':''
                  
        //            )}
        className={cn(
                "mt-3 rounded-sm transition-colors duration-300", // Added transition for smooth hover effect
                data.visible
                    ? updatedWithADay
                    ? "bg-yellow-50 hover:bg-yellow-200" // Yellow with darker hover
                    : "bg-white hover:bg-gray-200" // White with light gray hover
                    : "bg-rose-200 hover:bg-rose-300", // Rose with slightly darker hover
                hasFavorited ? "text-red-400 hover:text-red-600" : "" // Red with darker red hover
                )}           
                
        >  
            {/*Headings....  */}
            <div 
                className="relative"
            >   
                <div className="         
                    absolute
                    top-[-15px]
                    right-0
                ">
                    <HeartButton 
                        listingId={data.id} 
                        currentUser={currentUser}
                    />
                </div>
            </div>
            <h5 
                key={index +'2'} 
                className='flex gap-2 text-sm font-bold '>{pagnumber!==null?`${Number(pagnumber)+1}. `:""}{data?.title}</h5> 

            <CreatedAtUpdatedAt 
                createdAt={data?.createdAt} 
                updatedAt={data?.updatedAt}/>

            <CardTags 
                index2={String(index +'4')}  
                card={data} 
                setCategory={setCategory} 
                category={category}
                tagNames={tagNames}
            />

            <div 
                className={cn(
                    "px-2 static-editor max-h-[50vh] overflow-x-hidden shadow-md mb-1 rounded-sm",
                )}
                key={index+"3"}
            >
            {/* Contents */}
                <div className="flex flex-col gap-1 mt-2">
                   <div className="flex gap-1 shadow-md justify-between">
                   
                        <div className="flex gap-1 shadow-md justify-start">
                        {
                        //Column 1..... Edit Records.....
                        editable? 
                            <div className="px-2 relative text-[11px]">
                                <Button
                                    onClick={() =>{ cardModal.onOpen(data.id, boardId, false);}}
                                    className="absolute top-[-1px]  left-[-15px] h-auto  w-10 justify-end text-muted-foreground text-[11px] hover:text-sm"
                                    size="sm"
                                    variant="ghost"
                                >
                                    { editableIcon}                   
                                </Button>
                            </div>
                        :
                            <div className="px-2 relative text-[11px]">
                                <Button
                                    onClick={() =>{}}
                                    className="absolute top-[-1px]  left-[-15px] h-auto  w-10 justify-end text-muted-foreground text-[11px] hover:text-sm"
                                    size="sm"
                                    variant="ghost"
                                >
                                    { editableIcon}                   
                                </Button>
                            </div>
                        } 
                        {/* 2. column */}
                        <div className=" flex gap-1">
                            <span className='flex gap-2 text-sm text-blue-500 '>Due-Status:</span> 
                            <span className='flex gap-2 text-sm text-blue-500 '>{getFinalStatement(data)}</span> 
                        </div>
                        {/* for all---- */}
                        <div className="px-2 relative text-[11px]">
                            <Button
                                onClick={editable? () =>{ cardModal.onOpen(data.id, boardId, true);}: ()=>{}}
                                className="absolute top-[-1px]  left-[-15px] h-auto  w-10 justify-end text-muted-foreground text-[11px] hover:text-sm"
                                size="sm"
                                variant="ghost"
                            >
                                { getAllIcon}                   
                            </Button>
                        </div>
                     
                        </div>  
                        {/* picture view end/ */}

                        <div className="flex gap-1 shadow-md justify-start">
                   
                            <div className="text-[11px]">                      
                                <Link
                                    // href={`/media?cardId=${data.id}`}
                                    href={`/m/${data.id}`}
                                    className="h-auto w-10 justify-end text-muted-foreground text-[11px] hover:text-sm" // No need for relative here unless you have other absolute elements
                            
                                >
                                    {/* Button text wrapped in hint */}
                                    <Hint
                                        sideOffset={20} // Adjust as needed
                                        description={data?.cardImages?.length>0?`View Media ${data?.cardImages?.length}`:`Open View Media`}
                                        
                                    >
                                        {/* Display text */}
                                        <div className="flex flex-row gap-1">
                                        {/* {data?.cardImages?.length>0 && <span>{`${data?.cardImages?.length} `}</span>} */}
                                            <FcViewDetails
                                            size={10}
                                            className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
                                            />
                                        </div>
                                    </Hint>
                                </Link>
                            </div> 

                            <div className="text-[11px]">                      
                                <Button
                                    onClick={ () => mediaModal.onOpen(data.id, boardId, currentUser, true)}
                                    className="h-auto w-10 justify-end text-muted-foreground text-[11px] hover:text-sm" // No need for relative here unless you have other absolute elements
                                    size="sm"
                                    variant="ghost"
                                >
                                    {/* Button text wrapped in hint */}
                                    <Hint
                                        sideOffset={20} // Adjust as needed
                                        description={data?.cardImages?.length>0?`Show Media(Videos, Picture etc) ${data?.cardImages?.length}`:`No media found. Click to create new media: videos and still pictures`}
                                        
                                    >
                                        {/* Display text */}
                                        <div className="flex flex-row gap-1">
                                        {data?.cardImages?.length>0 && <span>{`${data?.cardImages?.length} `}</span>}
                                            <AiFillPicture
                                            size={10}
                                            className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
                                            />
                                        </div>
                                    </Hint>
                                </Button>
                            </div> 
                        </div>
                   </div>    
                    {/* 3. Column */}
                    <Editor 
                        editorState={EditorState.createWithContent(getTextFromEditor3(data),    compositeDecorator)} 
                        readOnly 
                        onChange={() => {}} // Empty dummy function
                    />
                    {/* 4. column */}
                    {editable && data.taggedUsers.length>0 &&
                    <div>
                        <h2 className='flex gap-2 text-sm '>Tagged Users:</h2> 
                        <div className="flex flex-wrap gap-2 mt-3 mb-2" 
                        key={index +'6'}>
                        
                        {
                            data.taggedUsers?.map((tag, index) => {
                                return (
                                <span 
                                    className="bg-gray-300 md:bg-gray-400 rounded-sm text-white text-[11px]" key={index}
                                    // onClick={()=>{ setCategory(tag); }}
                                > 
                                {/* for large dataset this is practically heavy */}
                                {/* finally remove userNames........ */}
                                {  tag?.userEmail? tag.userEmail: findLabelByValue(userNames, tag.userId)}
                                </span>
                                )
                            })
                            }  
                        </div>
                    </div>

                    }
                    {/*5 &6 Column Show and edit comment */}
                    {
                    //  !editable && .... the owner of card is allowed to comment on his card....
                    //.... limit in taggUser on card updata...remove is before selection of FilterSelection or on saving into database
                      iamtagged && <div className="flex flex-col gap-1">
                            <span className="text-sm text-orange-640 rounded-sm  bg-blue-400 text-white mb-3">I am tagged</span>
                            {/* Add or Edit */}
                            {!ihavecomment &&<span className="text-sm text-orange-640 rounded-sm  bg-blue-400 text-white mb-3"
                                      onClick={() => commentModal.onOpen(mycommentid,data.id, boardId)}
                                      >{'Add Comment'}</span>}
                            {/* Show comment  */}
                            { ihavecomment && <CommentShow data={ihavecomment} cardId={data.id} boardId={boardId} /> }    
                          
                    </div>
                    }
                    {/*7. I am the owner  */}
                    {editable && data.comments?.length>0 &&
                        <div className="flex w-full gap-2 mt-1 mb-2" 
                                key={index +'7'}
                        >
                                <CommentList data={data.comments} userNames={userNames} /> 
                        </div>
                      }
                                              
                </div>
            </div>
        </div>
  
  );
};