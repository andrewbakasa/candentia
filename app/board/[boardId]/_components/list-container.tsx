"use client";

import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";

import { ListWithCards, ListWithCards2, SafeListWithCards3 } from "@/types";
import { useAction } from "@/hooks/use-action";
import { updateListOrder } from "@/actions/update-list-order";
import { updateCardOrder } from "@/actions/update-card-order";

import { ListForm } from "./list-form";
import { ListItem } from "./list-item";
import { differenceInDays } from "date-fns";
import { useOverdueStore } from "@/hooks/useOverduState";
import { useQueueStore } from "@/hooks/use-QueueState";
import { useCompletedTaskStore } from "@/hooks/use-CompletedTaskState";
import { useInverseStore } from "@/hooks/use-inverseState";
import { useBoardStore } from "@/hooks/use-boardProp";
import { uselistStore } from "@/hooks/use-listState";
import { useStringVarStore } from "@/hooks/use-search-value";
import SearchTextForm from "./seartText-form";
import { useSearchResultStore } from "@/hooks/use-searchResultString";
import useIsMobile from "@/app/hooks/isMobile";
import { useRadiusStore } from "@/hooks/use-radius";
import { getCardsFromSafeBoard, getCardsFromLists, getTotal, getGreatThanZeroOrEmptyStr, getProgressStatus, getLabelsAndValuesFromValues, getOrderedListWithCards } from "@/lib/utils";
// import { useEmailLink } from "@clerk/nextjs";
import { useCardReadModeStore } from "@/hooks/use-cardReadMode";
import { useRouter } from "next/navigation";
import { useClipBoardCopytore } from "@/hooks/use-clipboardCopy";
import { getTextFromEditor, getTextFromEditor2, getTextFromEditorSafe, getTextFromEditorSafe2 } from "@/components/modals/card-modal/description";
import { useTriggerCopyStore } from "@/hooks/use-triggerCopy";
import FilterSection from "@/app/components/FilterSection";
import { useSearchOpenStore } from "@/hooks/use-searchOpenState";
import { useTagLabelValueStore } from "@/hooks/use-tagLabelValue";
import { useCardsOrderedStore } from "@/hooks/use-boardOrderedList";
import { useUserLabelValueStore } from "@/hooks/use-userLabelValues";
import axios from "axios";

interface ListContainerProps {
  data: ListWithCards2[];
  boardId: string;
  dragMode:boolean;
  isOwnerOrAdmin:boolean,
  currentUserId:string,
  cardReadMode:boolean,
  cardYscroll:boolean,
  // showBGImage:boolean,
  cardShowTitle:boolean;
  recentDays:number;
  boardProgressStatus:string;  
  tagNames:any;
  userNames:any
};

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};


export const ListContainer = ({
  data,
  boardId,
  dragMode,
  isOwnerOrAdmin,
  currentUserId,
  cardReadMode,
  cardYscroll,
  cardShowTitle,
  recentDays,
  boardProgressStatus,
  tagNames,
  userNames
  // showBGImage
}: ListContainerProps) => {
  
  const {readMode,setReadModeState}= useCardReadModeStore();
  const {cardsOrdered}= useCardsOrderedStore();
  
  const{setCopyState,copiedState}=useClipBoardCopytore();
  const{setTriggeredState,triggeredState}=useTriggerCopyStore();

  const router = useRouter();
  const [orderedData, setOrderedData] = useState(data);
  const [orderedDataSpliced, setOrderedDataSpliced] = useState(data);
  const [totalCards,setTotalCards]=useState(0);
  const {overdueState}= useOverdueStore();
  const {recentQ}= useQueueStore();
  const {completedTasks}= useCompletedTaskStore();
  const {inverseState }= useInverseStore();
  const {setBoardState}=useBoardStore();  
  const {listState }= uselistStore();
  const {stringVar}=useStringVarStore()
  const {resultString,setResultString }= useSearchResultStore();
  const isMobile =  useIsMobile();
  const{radiusVar, setRadiusVar}=useRadiusStore();
  let originalA =getLabelsAndValuesFromValues(tagNames, [])
  
  const [category,setCategory]=useState<string|null>('')//x==''?null:x)//tag);
  
 

  const { execute: executeUpdateListOrder } = useAction(updateListOrder, {
    onSuccess: () => {
      toast.success("List reordered");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeUpdateCardOrder } = useAction(updateCardOrder, {
    onSuccess: () => {
      toast.success("Card reordered");
    },
    onError: (error) => {
      toast.error(error);
    },
  });
  useEffect(()=>{
    // wherever data from DB changes reset to 100%
    // toast.message('I a m working as designed!')
    setRadiusVar(100)

  },[boardId])// removed data but limited to change in board

  useEffect(() => {
        //filter().map() function
        let dataPostTag = [...data]
     
        if (category !=='') {
          let xy= category?category.split(','):[]
         //  toast.message(`${xy}`)
          dataPostTag= dataPostTag.map((x) => ({
            ...x,
            //Change lists
              //filter cards belonging to list
              cards: x.cards.filter((card)=>
                (
                  //Loop thru card tags
                 xy.every((s)=>(card.tagIDs.includes(s.trim())))
                )
              )
          })
          );
         }
       
      let lists_filter=   dataPostTag?.filter(list =>{ 
         // if the is is visible show it
         // already filter
          return ( list.active); 
        }).map((x)=>({
              ...x,
              //change cards
              userId:x.userId || "",
              cards: x.cards?.filter(card => {
                  
                let overdueBooleen=true;
                //A:Overdue or all
                //B: Non overdue or ALL
                if (inverseState==true){
                  if (overdueState==true){
                    const today = new Date();             
                    const daysLeft = card?.dueDate? differenceInDays(card?.dueDate, today):1;
                    const pending_ =card?.progress?card.progress=='complete'?false:true:false
                    if ((daysLeft < 0) && pending_==true) {
                        //.....overdue
                        overdueBooleen=false;
                    }else{
                      // not overdue
                       overdueBooleen=true;
                    }
                  }
              
                }else{
                  if (overdueState==true){
                    /* 1....Due Date variables    Yes✓    False
                       2. ...Due date pass        True✓   False
                       3. ...Progress variable    Yes✓     NO
                       4..... Progress Not complete True✓   False
                       5.   Overdue== 1&2&3&4
                       6  if overdue return true other return false
                    */
                    const today = new Date(); 
                    //diffenceInDay(LaterDate, today)   >> 0 , negative == overdue        
                    const daysLeft = card?.dueDate? differenceInDays(card?.dueDate, today):1;
                    const pending_ =card?.progress?card.progress=='complete'?false:true:false
                    if ((daysLeft < 0) && pending_==true) {
                        //.....overdue
                        overdueBooleen=true;
                    }else{
                      // not overdue
                       overdueBooleen=false;
                    }
                  }
                }

                let recentQBooleen=true;
                // A: get all recent cards or All cards
                // B: gell all old cards or All cards
                if (recentQ==true){
                  const today = new Date();             
                  const dateA = new Date(card.updatedAt);
                  const daysLeft =  differenceInDays(dateA, today)
                  if (inverseState==true){
                    if (daysLeft <  -recentDays)  {
                      recentQBooleen=true;
                    }else{
                      recentQBooleen=false
                    }

                  }else{
                    if (daysLeft >  -recentDays)  {
                        recentQBooleen=true;
                      }else{
                        recentQBooleen=false
                      }
                    }
                  }

                  let taskBoolean=true;
                  //filter out completed tasks and those without tages
                  //A: completed tasks or ALL
                  //B: uncomplted tasks or ALL
                  if (inverseState==true){
                    if (completedTasks==true){
                      //B state
                      const CompleteStatus =card?.progress?card.progress=='complete'?true:false:false
                      if (CompleteStatus ==false)  {
                        //remove all that are uncompleted
                        taskBoolean=false;
                      }
                    }
                  }else{
                    if (completedTasks==true){
                      const completeStatus =card?.progress?card.progress=='complete'?true:false:true
                      if (completeStatus ==true)  {
                        //remove allbthatvare completed
                        taskBoolean=false;
                      }
                    }
                  }
  
                  return ( card.active && overdueBooleen && recentQBooleen && taskBoolean)
            
              }).map((card)=>({
                  ...card,
                  userId:card.userId || ""
                })
              ),
          })      
        )

       if (stringVar!=='') {  
        let arrFirst =stringVar.split(';');
        const arr = arrFirst.filter(element => element);  // Using arrow function (ES6)
        //Change lists
        lists_filter=lists_filter?.map((list)=>({
            ...list,
            //filter cards belonging to list
            cards: list?.cards?.filter((card)=>
              (
                //Search Card Title
                arr.some(
                  (x)=>
                  (
                    x.split(',').every((s)=>(card.title.toLowerCase().includes(s.trim().toLowerCase())))
                      ||
                    x.split(',').every((s)=>(card.description?.toLowerCase().includes(s.trim().toLowerCase())))
          
                  )
                )
            

              )
            )
          })
        );
       }
      if (listState==false){//default dont show....
         lists_filter= lists_filter?.filter((list)=>( list.cards.length>0));
      }
     const b = getTotal(lists_filter);
     const a = getTotal(data);
     setTotalCards(a.cardCount);
   
     const completedStr= getGreatThanZeroOrEmptyStr(b.completed,`, comp=${b.completed}(${Math.round(b.completed*100/b.cardCount)}%)`)  
     const wipStr= getGreatThanZeroOrEmptyStr(b.wip,`, wip=${b.wip}`)  
     const untaggedStr= getGreatThanZeroOrEmptyStr(b.untagged,`, utg=${b.untagged}`)  
     const stabbledStr= getGreatThanZeroOrEmptyStr(b.stabbled,`, sta=${b.stabbled}`)  
     if (isMobile){
       setResultString(`${b.listCount}/${a.listCount}; ${b.cardCount}/${a.cardCount} ${completedStr}  ${wipStr} ${untaggedStr} ${stabbledStr}`)
     }else{
       setResultString(`${b.listCount}/${a.listCount}; ${b.cardCount}/${a.cardCount} ${completedStr}  ${wipStr} ${untaggedStr} ${stabbledStr}`)
     }
  
    if (cardsOrdered==true){
      const copyData =[...lists_filter]
      lists_filter =getOrderedListWithCards(copyData)
    } 
  setOrderedData(lists_filter);
  setBoardState(lists_filter);
  setOrderedDataSpliced(lists_filter)

    // console.log('listfilter',lists_filter)
  }, [data, overdueState,recentQ, completedTasks,inverseState,listState,stringVar,category, cardsOrdered]);

useEffect(()=>{
  const all_cards=getCardsFromLists(orderedData,(inverseState==true));
   let keepCards= all_cards?.slice(0,all_cards.length*radiusVar/100)
   const ids= keepCards?.map(item=>(item.id))
  //  console.log('ids',ids)
  let filteredData = orderedData?.map((list)=>({
                          ...list,
                         cards: list.cards?.filter(card=> {return ids.includes(card.id)})  
                         }))
                         
  if (listState==false){//default dont show....
    filteredData= filteredData?.filter((list)=>( list.cards.length>0));
  }
  const b = getTotal(filteredData);
  const a = getTotal(data);
  setTotalCards(a.cardCount);
  
  const completedStr= getGreatThanZeroOrEmptyStr(b.completed,`, comp=${b.completed}(${Math.round(b.completed*100/b.cardCount)}%)`)  
  const wipStr= getGreatThanZeroOrEmptyStr(b.wip,`, wip=${b.wip}`)  
  const untaggedStr= getGreatThanZeroOrEmptyStr(b.untagged,`, utg=${b.untagged}`)  
  const stabbledStr= getGreatThanZeroOrEmptyStr(b.stabbled,`, sta=${b.stabbled}`)  

  
  if (isMobile){
    setResultString(`${b.listCount}/${a.listCount}; ${b.cardCount}/${a.cardCount} ${completedStr} ${wipStr} ${untaggedStr} ${stabbledStr}`)
  }else{
    setResultString(`${b.listCount}/${a.listCount}; ${b.cardCount}/${a.cardCount} ${completedStr} ${wipStr} ${untaggedStr} ${stabbledStr}`)
  }
    setOrderedDataSpliced(filteredData)

},[radiusVar, orderedData])
 

  const onDragEnd = (result: any) => {
    const { destination, source, type } = result;

    if (!destination) {
      return;
    }

    // if dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
   try {
        // User moves a list
        if (type === "list") {
          const items = reorder(
            orderedData,
            source.index,
            destination.index,
          ).map((item, index) => ({ ...item, order: index }));

          setOrderedData(items);
          executeUpdateListOrder({ items, boardId });
        }

        // User moves a card
        if (type === "card") {
          let newOrderedData = [...orderedData];

          // Source and destination list
          const sourceList = newOrderedData.find(list => list.id === source.droppableId);
          const destList = newOrderedData.find(list => list.id === destination.droppableId);

          if (!sourceList || !destList) {
            return;
          }

          // Check if cards exists on the sourceList
          if (!sourceList.cards) {
            sourceList.cards = [];
          }

          // Check if cards exists on the destList
          if (!destList.cards) {
            destList.cards = [];
          }

          // Moving the card in the same list
          if (source.droppableId === destination.droppableId) {
            const reorderedCards = reorder(
              sourceList.cards,
              source.index,
              destination.index,
            );

            reorderedCards.forEach((card, idx) => {
              card.order = idx;
            });

            sourceList.cards = reorderedCards;

            setOrderedData(newOrderedData);
            executeUpdateCardOrder({
              boardId: boardId,
              items: reorderedCards,
            });
            // User moves the card to another list
          } else {
            // Remove card from the source list
            const [movedCard] = sourceList.cards.splice(source.index, 1);

            // Assign the new listId to the moved card
            movedCard.listId = destination.droppableId;

            // Add card to the destination list
            destList.cards.splice(destination.index, 0, movedCard);

            sourceList.cards.forEach((card, idx) => {
              card.order = idx;
            });

            // Update the order for each card in the destination list
            destList.cards.forEach((card, idx) => {
              card.order = idx;
            });

            setOrderedData(newOrderedData);
            executeUpdateCardOrder({
              boardId: boardId,
              items: destList.cards,
            });
          }
        }
      } catch (error) {
        return {
          error: "Failed to re-order."
        }
      }
  }
useEffect(()=>{
  let textToCopy = '';
  
  const onClipBoardCopy =async ()=>{
    orderedDataSpliced.map((list) => {
      list.cards.map((card)=>{        
        const card_description = getTextFromEditorSafe2(card).replace(/\n/g, " ")
        const card_title = card?.title
        textToCopy= textToCopy + card_title +  " " + card_description;                       
      })
      })
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyState(true);
      // Optionally, set a timeout to reset isCopied state
      setTimeout(() => setCopyState(false), 1500);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  if (triggeredState==true){
    onClipBoardCopy();
    setTriggeredState(false)
  }
},[triggeredState])

const {openState }= useSearchOpenStore();
const {tagList,setTagList}=useTagLabelValueStore();
const {userList, setUserList}=useUserLabelValueStore();

 useEffect(() => {
      const newTagList = Array.from(tagNames);
      if (JSON.stringify(newTagList) !== JSON.stringify(tagList)) {
        setTagList( Array.from(tagNames));    
      }

      const newUserList = Array.from(userNames);
      if (JSON.stringify(newUserList) !== JSON.stringify(userList)) {
        setUserList( Array.from(userNames));    
      }
}, []);

useEffect(() => {
  // Flag to track if the function has already been executed
  // const hasRun = useRef(false);

  // if (!hasRun.current) {
  //   hasRun.current = true; // Set the flag to true to prevent future executions

    const upDataBoadViews = async () => {
      let request;
      try {
        request = () => axios.post(`/api/updateBoardViews/${boardId}`);
        const data = await request();
        //console.log('data......:', data);
      } catch (error) {
        // toast.error('Something went wrong.');
      } finally {
      }
    };

    upDataBoadViews();
  //whenever data changes view increases
}, [data]);

  return (
  <div className="flex flex-col gap-1">   
   <div className="flex flex-col gap-1 sm:flex-row" >    
    <SearchTextForm totalCards={totalCards}/>
    { openState==true && <FilterSection
      setCategory={(category) =>{ 
        setCategory(category?category:'');
              }}
      productCategories_options={tagNames}
      originalList={originalA}
      placeholder="Filter by tags" 
      isDisabled={false}  
      category={category}    
    /> }
   </div>         
    <DragDropContext onDragEnd={onDragEnd} >
      <Droppable droppableId="lists" type="list" direction="horizontal" >
        {(provided) => (
          <ol 
            {...provided.droppableProps}
            ref={provided.innerRef} 
            className="flex gap-x-3  min-h-[73vh] h-full"
            
          >
            {orderedDataSpliced?.map((list, index) => {
              return (
                <ListItem
                  key={list.id}
                  index={index}
                  data={list}
                  dragMode={dragMode}
                  isOwnerOrAdmin={isOwnerOrAdmin}
                  currentUserId={currentUserId}
                  cardReadMode={cardReadMode}
                  cardYscroll={cardYscroll}
                  cardShowTitle={cardShowTitle}
                  // showBGImage={showBGImage}
                  // setCardReadMode={setCardReadMode}
                  isOrdered={cardsOrdered}
                  setCategory={setCategory}
                  tagNames={tagNames}
                  userNames={userNames}
                />
              )
            })}
            {provided.placeholder}
            <ListForm />
            <div className="flex-shrink-0 w-1" />
          </ol>
        )}
      </Droppable>
   
    </DragDropContext>
  </div>
    
  );
};
