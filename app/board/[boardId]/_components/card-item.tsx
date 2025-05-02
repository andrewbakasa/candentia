"use client";

import { Card } from "@prisma/client";
import { Draggable } from "@hello-pangea/dnd";
import { cn, findLabelByValue, getTextAreaHeight, getTextAreaRow} from "@/lib/utils";
import {checkStringFromStringArray} from "@/lib/utils";
import { useCardModal } from "@/hooks/use-card-modal";
import { useEffect, useState } from "react";
import { AiFillEdit, AiFillLock} from "react-icons/ai";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { getTextFromEditor, getTextFromEditor2 } from "@/components/modals/card-modal/description";
import { CompositeDecorator, DraftDecorator, Editor, EditorState } from "draft-js";

import { useStringVarStore } from "@/hooks/use-search-value";
import moment from "moment";
import { useCardReadModeStore } from "@/hooks/use-cardReadMode";
import { CardWithList2 } from "@/types";
import { useCommentModal } from "@/hooks/use-comment-modal";
import { CommentShow } from "@/app/myprojects/_components/display-comment";
import { CommentList } from "@/app/myprojects/_components/display-all-comments";

interface CardItemProps {
  data: CardWithList2;
  index: number;
  dragMode:boolean;
  listOwner:string;
  isOwnerOrAdmin:boolean
  currentUserId:string;
  cardReadMode:  boolean;
  cardYscroll:  boolean;
  cardShowTitle: boolean;
  boardId:string;
  tagNames:any;
  userNames:any;
  setCategory: (category: string | null) => void;
  
};

export const CardItem = ({
  data,
  index,
  dragMode,
  listOwner,
  isOwnerOrAdmin,
  currentUserId,
  cardReadMode,
  cardYscroll,
  cardShowTitle,
  boardId,
  tagNames,
  userNames,
  setCategory
}: CardItemProps) => {

  let hoverdummy = false;
  const cardModal = useCardModal();
  const commentModal = useCommentModal();
 // Gett user setting
  const [toggle, setToggle] = useState(cardReadMode);
  const {stringVar,setStringVar}=useStringVarStore()
  
  const {readMode,setReadModeState}= useCardReadModeStore();
  
  useEffect(()=>{
      setToggle(readMode)
  },[readMode])

  const [compositeDecorator,setCompositeDecorator] = useState(new CompositeDecorator([]))
  const actionText =cardShowTitle==true? data.title: "[Drag-drop to re-order. Click to collapse]"

  const formattedDDate =data?.dueDate? format(data?.dueDate, 'dd MMM yyy'):""; 

  const editable= (listOwner==currentUserId) //list creator
                  ||(data.userId==currentUserId)  //card creator
                  || isOwnerOrAdmin // board creator or admin

  const editableIcon=editable? <span>
                        <AiFillEdit  
                            size={10} 
                            className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
                        /> 
                      </span>: <span>
                        <AiFillLock 
                            size={10} 
                            className="cursor-pointer h-4 w-4 hover:h-[18px] hover:w-[18px] hover:text-blue-600"
                        /> 
                      </span>


    const editableIconStatic= editable?
    <span>
      <AiFillEdit  size={10} className="h-6 w-4 "/> 
    </span>  
    : <span>
    <AiFillLock  size={10} className="h-6 w-4 "/> 
  </span>  
             

  const descript = data?.description !== null? getTextFromEditor(data):null
  // const editorState = EditorState.createWithContent(getTextFromEditor2(data)) 

  useEffect(()=>{
    // let arrFirst =searchTerm.split(';');
    let arrFirst =stringVar.split(';');
      
    const subLists = arrFirst.filter(element => element);  // Using arrow function (ES6)
    // Combine elements from sub-lists into a single list
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
  },[stringVar])

  const relativeCreatedDate ="cre: " + moment(data.createdAt).fromNow();
  const relativeUpdatedDate =", upd: " + moment(data.updatedAt).fromNow();
  const notSameDate = moment(data.createdAt).fromNow()!== moment(data.updatedAt).fromNow()
  const iamtagged= data?.taggedUsers?.find(x=>x.userId==currentUserId)
   
const ihavecomment= data?.comments?.find(x=>x.userId==currentUserId)
const mycommentid =ihavecomment?.id||''
  //console.log("dragMode state here:", dragMode)  
  return (
    //make toggle based on user
    <Draggable isDragDisabled={!dragMode}  draggableId={data.id} index={index}>
      {(provided) => (
        <div
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              ref={provided.innerRef}
              role="button"
             
            
              className={cn(
                `border-2 border-transparent py-2 px-3 text-sm rounded-md shadow-sm
                transition duration-200 ease-in-out truncate`,
                toggle ? 'border-black w-full' : '',
                !toggle? "truncate":"",// truncate text only when not scrolling....03 August 2024 added to both
                checkStringFromStringArray(data?.progress || "",['complete', 'release','done']) ? "text-green-500" : 
                        checkStringFromStringArray(data?.progress || "",['wip', 'work in progress']) ? "text-blue-600":
                        checkStringFromStringArray(data?.progress || "",['stabbled', 'stabled']) ? "text-orange-400":
                        "text-black",
                        descript && toggle ?  `h-[${getTextAreaHeight(Number(descript.length))}px]`: 
                        data?.title?.length > 0 &&  toggle ?`h-[${getTextAreaHeight(Number(data?.title.length))}px]`:"",
                        data.visible?"bg-white": "bg-rose-200"// // if card is private make darker
                )}
         
        >
         {/* First Option  closed card*/}
          {!toggle &&  
              <div 
                className="flex flex-row h-full"
              > 
                  <div>{editableIconStatic}</div> 
                  <div className="relative bg-gray-100  w-full hover:bg-gray-200  font-sans truncate flex flex-row gap-1">
                    <div className="italic absolute top-[-6px] right-1 text-[9px] text-blue-500 flex flex-row gap-1"> 
                        <span >{relativeCreatedDate}</span>
                        {notSameDate && <span >{relativeUpdatedDate}</span>}
                    </div>
                    <span 
                          onClick={() => setToggle(!toggle)}

                        className="absolute *:bg-gray-100 top-1 text-[14px] w-full truncate"
                    >{data?.title}</span>
                  </div> 
              </div>
          }
          {/* Second Option open with description */}
          {toggle && descript!==null &&
              <div className ='flex flex-col h-full'>
                  <div className ='flex flex-row justify-between'>
                     
                      <div className="relative bg-gray-100  w-full hover:bg-gray-200 text-rose-500 italic font-sans truncate text-ellipsis flex flex-row gap-1">
                        <div className="italic absolute top-[-6px] right-1 text-[9px] text-blue-500 flex flex-row gap-1">
                          <span >{relativeCreatedDate}</span>
                          {notSameDate && <span >{relativeUpdatedDate}</span>}
                        </div>
                        <span 
                            className="absolute bg-gray-100 top-[10px] text-[11px] w-full truncate"
                            onClick={() => setToggle(!toggle)}

                          >{actionText}</span>
                      </div>
                     { editable?  <div className="text-[11px]">
                        <Button
                          onClick={() => cardModal.onOpen(data.id, boardId)}
                          className="h-auto px-2 py-1.5 w-full justify-end text-muted-foreground text-[11px] hover:text-sm"
                          size="sm"
                          variant="ghost"
                      >
                       { editableIcon}                   
                        </Button>
                      </div>:<div className="text-[11px]">
                        <Button
                          onClick={() =>{}}
                          className="h-auto px-2 py-1.5 w-full justify-end text-muted-foreground text-[11px] hover:text-sm"
                          size="sm"
                          variant="ghost"
                      >
                       { editableIcon}                   
                        </Button>
                      </div>
                    }
                  </div>
                 { 
                  data?.tagIDs?.length>0 && 
                    <div className="flex flex-wrap gap-1 mt-1"> 
                      {
                        data.tagIDs?.map((tag, index) => {
                          return (
                            <span className="bg-orange-300 rounded-sm text-white" key={index}
                            onClick={()=>{setCategory(tag)}}
                            > {findLabelByValue(tagNames, tag)}</span>
                            )
                          
                        })
                      }
                    </div>
                  }
                  <div 
                      className={cn(
                        "static-editor max-h-[50vh] overflow-x-hidden ",
                         cardYscroll? "overflow-y-auto" : "overflow-y-hidden" 
                      )}
                  >
                      <Editor 
                        editorState={EditorState.createWithContent(getTextFromEditor2(data),compositeDecorator)} 
                        readOnly 
                        onChange={() => {}} // Empty dummy function
                      /> {editable && data.taggedUsers.length>0 &&
                        <div>
                            <h2 className='flex gap-2 text-lg '>Tagged Users:</h2> 
                            <div className="flex flex-wrap gap-2 mt-3 mb-2" 
                            key={index +'6'}>
                            
                            {
                                data.taggedUsers?.map((tag, index) => {
                                    return (
                                    <span 
                                        className="bg-gray-400 md:bg-gray-500 rounded-sm text-white text-xs" key={index}
                                        // onClick={()=>{ setCategory(tag); }}
                                    > 
                                        {findLabelByValue(userNames, tag.userId)}
                                    </span>
                                    )
                                })
                                }  
                            </div>
                        </div>
    
                        }
                         {/* Show and edit comment */}
                    {
                     !editable && iamtagged && <div className="flex flex-col gap-1">
                            <span className="text-sm text-orange-640 rounded-sm  bg-blue-400 text-white mb-3">I am tagged</span>
                            {/* Add or Edit */}
                            {!ihavecomment &&<span className="text-sm text-orange-640 rounded-sm  bg-blue-400 text-white mb-3"
                                      onClick={() => commentModal.onOpen(mycommentid,data.id, boardId)}
                                      >{'Add Comment'}</span>}
                            {/* Show comment  */}
                            { ihavecomment && <CommentShow data={ihavecomment} cardId={data.id} boardId={boardId} /> }    
                          
                    </div>
                    }
                    {/* I am the owner */}
                      {editable && data.comments?.length>0 &&
                    <div>
                        <div className="flex flex-wrap gap-2 mt-3 mb-2" 
                        key={index +'7'}>
                        
                        <CommentList data={data?.comments} userNames={userNames} /> 
                        </div>
                    </div>

                  }
                     
                         
                  </div>
              </div>
            }
            {/* Third Option */}
          {toggle && descript==null && 
         
            <div className ='flex flex-col h-full'>
                <div className ='flex flex-row justify-between'>
                      <div className="relative bg-gray-100 text-[11px] w-full hover:bg-gray-200 text-rose-500 italic font-sans truncate text-ellipsis">
                        <div className="italic absolute top-[-6px] right-1 text-[9px] text-blue-500 flex flex-row gap-1">
                          <span >{relativeCreatedDate}</span>
                          {notSameDate && <span >{relativeUpdatedDate}</span>}
                        </div>
                       
                        <span 
                          className="absolute bg-gray-100 top-[10px] text-[11px] w-full truncate"
                          onClick={() => setToggle(!toggle)}

                          >{actionText}</span>
                      </div>
                     
                      { editable ? <div className="text-[11px]">
                        <Button
                          onClick={() => cardModal.onOpen(data.id,boardId)}
                          className="h-auto px-2 py-1.5 w-full justify-end text-muted-foreground text-[11px] hover:text-sm"
                          size="sm"
                          variant="ghost"
                      >
                          {editableIcon}
                        </Button>
                      </div>:<div className="text-[11px]">
                        <Button
                          onClick={() => {}}
                          className="h-auto px-2 py-1.5 w-full justify-end text-muted-foreground text-[11px] hover:text-sm"
                          size="sm"
                          variant="ghost"
                      >
                          {editableIcon}
                        </Button>
                      </div>
                     }
                  </div>
                <textarea  disabled={true}  style={{ resize: 'none' }}
                  className={cn(
                    "w-full  h-full outline-width: 0px;",
                  )}
                >
                  { data?.title}
                </textarea>
              
            </div>
            
            }
           
        </div>
      )}
    </Draggable>

    
  );
};
