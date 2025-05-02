"use client";

import { Expand} from "lucide-react";
import {  
  useEffect,
  useState,
} from "react";

import { cn, getColorFromPercent } from "@/lib/utils";

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

interface PageViewProps {
  board:SafeBoard2;
  currentUser?: SafeUser | null,
  tagNames:any,
  userNames:any;
  setCategory: (category: string ) => void;
  category:string,
  compositeDecorator:any;
  handleToggleSelectUniqueBoard:(id:string)=>void;
  initialEditingState?:boolean;
  inverseTableState:boolean
};

export const PageViewTable : React.FC<PageViewProps> = ({
    board,
    currentUser,
    tagNames,
    userNames,
    setCategory,
    category,
    compositeDecorator,
    handleToggleSelectUniqueBoard,
    initialEditingState=false,
    inverseTableState
  }) => {
  
const [isCollapsed, setIsCollapsed] = useState(initialEditingState);

let personalBgColor='bg-sky-100';

const isMobile =  useIsMobile();



const {collapseState}=useCollapseStore();
// changed here...... 
useEffect(()=>{
setIsCollapsed(collapseState)
},[collapseState])


const {showBGImage }= useShowBGImageStore();

const disableCollapse = () => {
  setIsCollapsed(false);
};


const enableCollapse = () => {
  setIsCollapsed(true);
  
};


  if (!isCollapsed) {
        
        return ( 
            <div 
                className="px-5 flex flex-col gap-1  border-gray-300 shadow-md shadow-gray-500/50 mb-1"
                // onClick={enableCollapse} 
      
                
            >
              {/* Prepended or skip */}
             { (inverseTableState==false)&&
                <div
                    className="flex flex-col bg-no-repeat bg-cover bg-center rounded-sm  max-w-[1800px]"
                    style={showBGImage ? { backgroundImage: `url(${board.imageThumbUrl})` } : undefined}
                >
                    {/* 1. col */}
                    <div className="flex  gap-1">
                       <img
                            src={board.imageThumbUrl}
                            alt={'...'}
                            className="rounded-full w-10 h-10 object-cover"
                            onClick={()=>{handleToggleSelectUniqueBoard(board.id)}}
                       />
                       <div
                            key={board.id}
                            className="flex- flex-col w-full"
                       >
                         
                            <div 
                              className="relative flex flex-row"
                            >   
                                <Link  
                                    //key={board.id}
                                    href={`/board/${board.id}`}
                                    className='cursor-pointer'>  
                                    <h4 className={cn("font-bold text-xl text-white bg-black mix-blend-difference mt-3")}>{board?.title}</h4>
                                </Link>
                         
                                <div className="absolute top-[0px] right-0">
                                    <BiCollapse className="h-5 w-5  text-white"  
                                         onClick={enableCollapse} 
                                    />
                                </div>
                            </div>
                          
                           <span className="text-[10px] px-2 text-white bg-black mix-blend-difference ">{board?.progressStatus}</span>
                      </div>
                   
                    </div>
                    {/*2.  Second...... */}
                    <div className="mt-2 flex flex-row gap-1">
                            
                                  <div 
                                    className="w-[150px]"
                                  >
                                        <ProgressBar 
                                            height={'3px'}
                                            isLabelVisible={false}  
                                            bgColor={getColorFromPercent(Number(board?.percent))}  
                                            completed={Number(board?.percent)} 
                                        />
                                  </div>
                                  <div className='flex gap-1 mt-[-10px]'>
                                          <span className="text-white bg-black mix-blend-difference">{board?.percent}%</span>
                                        {currentUser?.id == board?.userId 
                                                && <PrivacyButton 
                                                        boardId={board.id}
                                                        currentState={board.public} 
                                                        currentUser={currentUser}
                                              /> 
                                            }
                                  </div>
                                
                    </div>
                    {/*3. col */}
                    <CreatedAtUpdatedAt               
                        createdAt={board?.createdAt} 
                        updatedAt={board?.updatedAt}
                    />

                    
                </div>
              }
              <DeckCards
                key={board.id}
                index={board.id}
                board={board} 
                setCategory={setCategory} 
                category={category}
                tagNames={tagNames} 
                userNames={userNames}
                compositeDecorator={compositeDecorator}
                currentUser={currentUser}
              />
                    
            </div>
          )
 };
                  
  return (
    <CollapsedView board={board} expand={disableCollapse} currentUser={currentUser}/>
    );
 }
          