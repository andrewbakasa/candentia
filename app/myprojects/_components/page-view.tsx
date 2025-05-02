"use client";
import {  
    useEffect,
  useState,
} from "react";

import { cn, getCardsFromSafeBoard, getColorFromPercent, getLatestCard, isWithinOneDay } from "@/lib/utils";

import useIsMobile from "@/app/hooks/isMobile";
import DeckCards from "./deck-cards";
import ProgressBar from "@ramonak/react-progress-bar";
import PrivacyButton from "@/app/components/PrivacyButton";
import Link from "next/link";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { SafeUser } from "@/app/types";
import { SafeBoard2 } from "@/types";
import { useShowBGImageStore } from "@/hooks/use-showBGImage";
import { BiCollapse } from "react-icons/bi";
import { useCollapseStore } from "@/hooks/use-collapseState";
import { CollapsedView } from "./collapsed-view";
import CreatedAtUpdatedAt from "./updatedCreated";
import moment from "moment";

interface PageViewProps {
  board:SafeBoard2;
  currentUser?: SafeUser | null,
  index: number,
  tagNames:any,
  userNames:any;
  setCategory: (category: string ) => void;
  compositeDecorator:any;
  category:string;
  handleToggleSelectUniqueBoard:(id:string)=>void;
  initialEditingState?:boolean;
};

export const PageView : React.FC<PageViewProps> = ({
    board,
    currentUser,
    index,
    tagNames,
    userNames,
    setCategory,
    category,
    compositeDecorator,
    handleToggleSelectUniqueBoard,
    initialEditingState=false,
  }) => {
  
const [isCollapsed, setIsCollapsed] = useState(initialEditingState);

let personalBgColor='bg-sky-100';

const isMobile =  useIsMobile();

const {collapseState}=useCollapseStore();

useEffect(()=>{
    setIsCollapsed(collapseState)
},[collapseState])

const {showBGImage }= useShowBGImageStore();

const disableCollapse = () => {
  setIsCollapsed(false);
  //hit database if 
//   if currentUser?.taggedInboxIds.find(x=>x==)
};


const enableCollapse = () => {
  setIsCollapsed(true);
  
};

  if (!isCollapsed) {
        return (
            <div
                className={cn(
                    "p-1 hover:border hover:border-primary rounded-lg ",
                    isMobile?'grid grid-cols-[0%_100%] ':'grid grid-cols-[0%_100%]',
                    
                    // currentUser?.id == board?.userId?'border border-sky-700':'border border-gray-700',
                )}
            
            >
                
                <div
                    key={board.id +'1'}
                    className='cursor-pointer z-50'//this was no visible until ontopdeck 
                    onClick={()=>{handleToggleSelectUniqueBoard(board.id)}}

                > 
                    <Avatar 

                        className="h-10 w-10 z-50"
                    >
                        <AvatarImage src={board?.user_image.length>0 ?  board?.user_image : board?.imageThumbUrl}/>
                    </Avatar>
                </div> 
                {/* <Separator/> */}
                {/* <hr/> */}
                <div className='flex mt-0 flex-col gap-1 shadow-md px-2 bg-white  rounded-md'>
                    
                    <div
                        className={cn("flex flex-col justify-between w-full bg-no-repeat bg-cover bg-center rounded-sm", 
                        //updatedWithADay?'bg-yellow-50':'bg-white'
                        )}
                
                        style={showBGImage ? { backgroundImage: `url(${board.imageThumbUrl})` } : undefined}
                    >
                      
                        {/*1. col First...  */}
                        <div
                            key={board.id}
                            className='flex flex-col' 
                        >
                            <div 
                                className="relative flex flex-row"
                            >   
                                <Link  
                                    key={board.id} 
                                    href={`/board/${board.id}`} 
                                    className= {cn('cursor-pointer ',   
                                    'group hover:underline' // Use group:hover for underline on hover
                                    )} 
                                > 
                                    <h4 
                                        className={cn(
                                            "font-bold text-[16px] text-blue-600 bg-black mix-blend-difference mt-3", 
                                            isMobile ? 'px-9' : 'px-9', 
                                         
                                        )}
                                        
                                        >
                                        {board?.title}
                                    </h4>         
                                </Link>
                         
                                <div className="absolute top-[0px] right-0">
                                    <BiCollapse className="h-6 w-6  text-black cursor-pointer"  
                                         onClick={enableCollapse} 
                                    />
                                </div>
                            </div>
                           <span className="text-[9px] px-9 text-white bg-black mix-blend-difference "> <span className="text-[12px] text-red-500 ">{"views: "}{board.views}</span>{" "}{board.progressStatus}</span>
                 
                        </div>
                        
                        {/*2. col Second.... */}
                        <div className='flex justify-end gap-1'>
                           
                            <span className="text-white bg-black mix-blend-difference">{board.percent}%</span>
                            {currentUser?.id == board?.userId 
                                && <PrivacyButton 
                                        boardId={board.id}
                                        currentState={board.public} 
                                        currentUser={currentUser}
                                    /> 
                            }
                        </div> 
                        {/* 3. col */}
                        <CreatedAtUpdatedAt               
                            createdAt={board?.createdAt} 
                            updatedAt={board?.updatedAt}
                        />

                     
                    </div>
                        
                    <div 
                        className=" w-full"
                    >
                        <ProgressBar 
                            height={'3px'}
                            isLabelVisible={false}  
                            bgColor={getColorFromPercent(Number(board.percent))} 
                            completed={Number(board.percent)} 
                            className="mt-0 h-0.5"
                        />
                    </div>
                    <DeckCards 
                            index ={board.id} 
                            key={index}
                            board={board} 
                            setCategory={setCategory} 
                            category={category}
                            tagNames={tagNames} 
                            userNames={userNames}
                            compositeDecorator={compositeDecorator}
                            currentUser={currentUser}
                    />
                </div>
            </div> 
                    
        )
 };
                  
  return (
    <CollapsedView board={board} expand={disableCollapse} currentUser={currentUser}/>
    );
}
                    
