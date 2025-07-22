"use client";

import { Expand} from "lucide-react";
import {  
    useEffect,
  useState,
} from "react";

import { cn, getCardsFromSafeBoard, getColorFromPercent, getLatestCard, isWithinOneDay } from "@/lib/utils";


import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { SafeUser } from "@/app/types";
import { SafeBoard2 } from "@/types";
import PrivacyButton from "@/app/components/PrivacyButton";
import CreatedAtUpdatedAt from "./updatedCreated";
import { useShowBGImageStore } from "@/hooks/use-showBGImage";
import useIsMobile from "@/app/hooks/isMobile";
import moment, { now } from "moment";
import { lastDayOfDecade } from "date-fns";

interface PageViewProps {
  board:SafeBoard2;
  currentUser?: SafeUser | null,
  expand:()=>void;
};

export const CollapsedView : React.FC<PageViewProps> = ({
    board,
    currentUser,
    expand,
  }) => {
  
const[ cardListLocal, setCardListLocal] =useState(getCardsFromSafeBoard(board))
const {showBGImage }= useShowBGImageStore();
 
  useEffect(()=>{
    setCardListLocal(getCardsFromSafeBoard(board))
  },[board])  
  
let personalBgColor='border-blue-100';
//getlatestcard and calculate when it was updated if within a day depict a color

let boardCards =getCardsFromSafeBoard(board)
const latestCard= getLatestCard(boardCards);// repetetion in future improve....
//if board has not card make false
const updatedWithADay = latestCard?(isWithinOneDay(latestCard?.updatedAt, moment())):false

//-----------------------

console.log("TimeStamp2222:",board.views)
    
const isMobile =  useIsMobile();           
  return (
    
       <div
                className={cn(
                    "p-1 hover:border hover:border-primary rounded-lg ",
                    'grid grid-cols-[0%_100%] ',
                     updatedWithADay?'bg-yellow-50':'bg-white',
                    // currentUser?.id == board?.userId?'border border-sky-700':'border border-gray-700',
                )}
            
            >
                
                <div
                    key={board.id +'1'}
                    className='cursor-none z-50'//this was no visible until ontopdeck 
                    // onClick={()=>{handleToggleSelectUniqueBoard(board.id)}}

                > 
                    <Avatar 

                        className="h-10 w-10 z-50"
                    >
                        <AvatarImage src={board?.user_image.length>0 ?  board?.user_image : board?.imageThumbUrl}/>
                    </Avatar>
                </div> 
                {/* <Separator/> */}
                {/* <hr/> */}
                <div className={cn('flex mt-0 flex-col gap-1 shadow-md px-2  rounded-md')}>
                    
                    <div
                        className={cn("flex flex-col justify-between w-full bg-no-repeat bg-cover bg-center rounded-sm",
                        // updatedWithADay?'bg-yellow-50':'bg-white'
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
                                <> 
                                 
                                    <h4 className={cn("text-[16px] text-white bg-black mix-blend-difference mt-3",'px-9')}>{board?.title}</h4>
                                
                                </>
                                <div className="absolute top-[1px] right-[18px]">
                                    <Expand    
                                        onClick={expand}
                                        className="h-5 w-5  absolute text-black cursor-pointer"
                                    />
                                </div>
                            </div>
                           <span className="text-[9px] px-9 text-white bg-black mix-blend-difference ">{board.progressStatus}</span>
                 
                        </div>
                        
                        {/*2. col Second.... */}
                        <div className='flex justify-between'>
                           <span className="text-blue-500 text-[12px]">{'Results: '}{boardCards.length}{' found'} <span className="text-red-500">{' views:'}{board.views}</span></span>
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
                        </div> 
                        {/* 3. col */}
                        <CreatedAtUpdatedAt               
                            createdAt={board?.createdAt} 
                            updatedAt={board?.updatedAt}
                        />

                     
                    </div>
                        
               
                </div>
       </div> 
   );
}