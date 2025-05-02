/* eslint-disable @next/next/no-img-element */
'use client';
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SafeBoard, SafeUser } from "../types";
import Heading from "../components/Heading";
import Search from "../components/Search";
import Container from "../components/Container";
import Link from "next/link";
import { FormPopover } from "../components/form/form-popover";
import { Hint } from "../components/hint";
import { HelpCircle, TagsIcon } from "lucide-react";
import PrivacyButton from "../components/PrivacyButton";
import { redirect } from "next/navigation";
import { useWindowSize } from "@/hooks/use-screenWidth";
import ProgressBar from "@ramonak/react-progress-bar";
import Cookies from 'js-cookie';
import SaveExcelMutliple from "../components/SaveExcelMultiple";
import { areDatesSimilar, cn, findLabelByValue, getCardsFromSafeBoard, getColorFromPercent, getDateTodayYesterdayORFormatedDate, 
         getLabelsAndValuesFromValues, 
         getLabelsFromValues, 
         getLatestCard, getValuesFromLabels, isNumber, sortDates } from "@/lib/utils";
import ReactPaginate from "react-paginate";
import TanStackTable from "../components/TanstackTable";
import { createColumnHelper } from "@tanstack/react-table";
import useIsMobile from "../hooks/isMobile";
import { toast } from "sonner";
import { CompositeDecorator, DraftDecorator, Editor, EditorState } from "draft-js";
import { differenceInDays, format, isValid } from "date-fns";
import { useAction } from "@/hooks/use-action";
import { updatePagSize } from "@/actions/update-user-pagesize";
import { useOverdueStore } from "@/hooks/useOverduState";
import { useQueueStore } from "@/hooks/use-QueueState";
import { useCompletedTaskStore } from "@/hooks/use-CompletedTaskState";
import { useInverseStore } from "@/hooks/use-inverseState";
import { uselistStore } from "@/hooks/use-listState";
import FilterSection, { LabelValueType } from "../components/FilterSection";
import { createTag } from "@/actions/create-tag";
import { useInverseTableStore } from "@/hooks/use-inverseTableState";
import { useShowBGImageStore } from "@/hooks/use-showBGImage";
import { useTagLabelValueStore } from "@/hooks/use-tagLabelValue";
import { useUserLabelValueStore } from "@/hooks/use-userLabelValues";
import { SafeBoard2 } from "@/types";
import { PageView } from "./_components/page-view";
import { PageViewTable } from "./_components/page-view-table";
import { useCollapseStore } from "@/hooks/use-collapseState";
import { useShowMobileViewStore } from "@/hooks/use-mobileView";
import { getTextFromEditorSafe, getTextFromEditorSafe2 } from "@/components/modals/card-modal/description";
import { handleSummarize } from "../summarizeText";
import { Button } from "@/components/ui/button";
import { FaFilePdf } from "react-icons/fa";

interface ProjectsClientProps {
  boards: SafeBoard2[],
  currentUser?: SafeUser | null,
  origin: string,
  tagNames:any,
  userNames:any
  // collapsedState?:boolean
}
interface Highlight {
  text: string;
  color: string; // Optional: Customize highlight color
}

export function getFinalStatement(data:any){
  const today = new Date();
  // const formattedDDate =data?.dueDate? format(data?.dueDate||today, 'EEE dd MMMM yyyy'):""; // Customize format as needed
  const daysLeft = data?.dueDate? differenceInDays(data?.dueDate, today):-1;
  const daysAheadofSchedule = data?.dueDate? differenceInDays(data?.dueDate, data?.completedDate):-1;
  
  const overDuestate = data?.dueDate? daysLeft>0?"left":"overdue":"NULL"
  const dayOrDays =Math.abs(daysLeft)==1? 'day': 'days'
  let clapHands=''
  if (daysLeft>0){clapHands='👏'}
  if (daysAheadofSchedule>=0){clapHands='👏👏👏'}
  // const finalStatement =data?.dueDate?data.progress=='complete'?"Completed" :`[${Math.abs(daysLeft)} ${dayOrDays} ${overDuestate}]`:"N/A"
  const finalStatement =data?.progress=='complete'?`✅Completed ${clapHands}` :data?.dueDate?`[${Math.abs(daysLeft)} ${dayOrDays} ${overDuestate}]`:"N/A"
  return finalStatement
}

const ProjectsClient: React.FC<ProjectsClientProps> = ({
              boards,
              currentUser,
              origin,
              tagNames,
              userNames,
             // collapsedState=false

            }) => {

        // console.log("First boards:",boards[0].views._count)
  let recentDays=currentUser?.recentDays?currentUser.recentDays:7 
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(''); 
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBoards, setFilteredBoards] = useState(boards);
  const [pageSize, setPageSize] = useState<number>(currentUser? currentUser.pageSize:8); // Adjust as needed
  const [pageCount, setPageCount] = useState(8); // Adjust as needed
  const [itemOffset, setItemOffset] = useState(0);
  const isMobile =  useIsMobile();
  const [fList,setFList]=useState(boards);
  const [fListPage,setFListPage]=useState(boards);//page display
  const [compositeDecorator,setCompositeDecorator] = useState(new CompositeDecorator([]))
  const {overdueState}= useOverdueStore();
  const {recentQ}= useQueueStore();
  const {inverseState}= useInverseStore();
  const {inverseTableState}= useInverseTableStore();

  const {completedTasks} =useCompletedTaskStore();
  const {listState }= uselistStore();
  const {showBGImage }= useShowBGImageStore();
  const  [uniqueBoardId, setUniqueBoardId]=useState('')
  
  const {collapseState}= useCollapseStore();
//state with collapse tagged project
  const [initialCollapseState, setInitialCollapsedState]=useState(origin=='taggedprojects'?collapseState:collapseState)
  const {showMobileView}=useShowMobileViewStore();
  
  const [isCollapsed, setIsCollapsed] = useState(initialCollapseState);
  // let originalA =getLabelsAndValuesFromValues(tagNames, [])
//
const handleToggleSelectUniqueBoard = (id:string)=>{
 //filter only on
  if (uniqueBoardId?.length==0){//(filteredBoards.length==1){//change logic
    //toggle to full....
    // setFilteredBoards(boards)
    //clear all previous search
    setSearchTerm('')
    setUniqueBoardId(id)
    // setUniqueSelection(false)
  }else{
    //---filter only this
    // const uniqueBoard = boards?.filter(x=>(x.id==id))
    // setFilteredBoards(uniqueBoard)
    setUniqueBoardId('')
  }
};

  const [category,setCategory]=useState<string>('')//x==''?null:x)//tag);
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
  const { execute, fieldErrors } = useAction(updatePagSize, {
    onSuccess: (data) => {
      toast.success(`PageSize for ${data.email} updated to ${data.pageSize}`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });  
let personalColor='text-orange-100';
let personalBgColor='bg-sky-100';


const { execute:executeTag } = useAction(createTag, {
  onSuccess: (data) => {
    toast.success(`Tag "${data.name}" created`);
    //formRef.current?.reset();
  },
  onError: (error) => {
    toast.error(error);
  },
});

const columnHelper = createColumnHelper<SafeBoard2>()
// toast.message(`is collapsed:?:${collapseState}`)
const columns = [  
  ...((inverseTableState==true) && (collapseState==false)?
        [
          columnHelper.accessor('imageThumbUrl', {
                cell: (info) =>{
                    const id=info?.table.getRow(info.row.id).original.id 
                    const title=info?.table.getRow(info.row.id).original.title;
                    const progressStatus=info?.table.getRow(info.row.id).original.progressStatus;
                    const percent=info?.table.getRow(info.row.id).original.percent ;
                    const board =info?.table.getRow(info.row.id).original
                return (
                  <>
                   < div
                        className="flex flex-col bg-no-repeat bg-cover bg-center rounded-sm"
                        style={showBGImage ? { backgroundImage: `url(${info?.getValue()})` } : undefined}
                    >
                        
                          <div className="flex gap-1">
                           
                              <img
                                  src={info?.getValue()}
                                  alt={'...'}
                                  className="rounded-full w-10 h-10 object-cover"
                                  onClick={()=>{handleToggleSelectUniqueBoard(id)}}
                                />
                            <div
                              key={id}
                              className="flex flex-col"
                            >
                              <Link  
                                 key={id}
                                 href={`/board/${id}`}
                                 className="cursor-pointer"
                              >
                                <h2 className={cn("font-bold text-xl text-white bg-black mix-blend-difference ")}>{title}</h2>
                              </Link>

                              <span className="text-[10px] px-2 text-white bg-black mix-blend-difference ">{progressStatus}</span>
                              
                            </div>
                                   
                        
                          </div>
                        
                          <div className="mt-2 flex flex-row gap-1">
                              <div 
                                className="w-[150px]"
                              >
                                    <ProgressBar 
                                        height={'3px'}
                                        isLabelVisible={false}  
                                        bgColor={getColorFromPercent(Number(percent))}  
                                        completed={Number(percent)} 
                                    />
                              </div>
                              <div className='flex gap-1 mt-[-10px]'>
                              
                                    <div className="flex flex-row">
                                      <span className="text-white bg-black mix-blend-difference ">{percent}%</span>
                                    </div>
                                    {currentUser?.id == board?.userId 
                                            && <PrivacyButton 
                                                    boardId={board.id}
                                                    currentState={board.public} 
                                                    currentUser={currentUser}
                                          /> 
                                        }
                                    
                              </div>
                            
                          </div>
                      </div> 
                    </> 
                )
                },
                    header: "Title",
          }),
        ]
    :
    //collapsed state and invesrseTable==Truess
       []
      
      ),

  columnHelper.accessor("imageThumbUrl", {
    cell: (info) => {
      const title=info?.table.getRow(info.row.id).original.title;
      const progressStatus=info?.table.getRow(info.row.id).original.progressStatus;
      const percent=info?.table.getRow(info.row.id).original.percent ;
      const board =info?.table.getRow(info.row.id).original;   
      const id=info?.table.getRow(info.row.id).original.id 
     
    return (
      // show header if false 
        <PageViewTable
          board={board}
          currentUser={currentUser}
          tagNames={tagNames}
          userNames={userNames}
          setCategory={setCategory}
          category={category}
          compositeDecorator={compositeDecorator}
          handleToggleSelectUniqueBoard={handleToggleSelectUniqueBoard}
          initialEditingState={initialCollapseState}
          inverseTableState={inverseTableState}
        />
    )
  },
    header: "Description",
  }),                           
  
   
]


  Cookies.set('originString', origin)  
  
  useEffect(() => {
    // filter
    let boardsPostTag = boards
    if (uniqueBoardId.length>0){
      boardsPostTag = boards?.filter(x=>(x.id==uniqueBoardId.trim()))
    }
    
    if (searchTerm !== "") {
      let arrFirst =searchTerm.split(';');
      const arr = arrFirst.filter(element => element);  // Using arrow function (ES6)
   
     if (category !=='') {
      let xy= category.split(',')
      // toast.message(`${xy}`)
      boardsPostTag = boardsPostTag.map((board) => ({
        ...board,
        //Change lists
        lists:board.lists.map((list)=>({
          ...list,
          //filter cards belonging to list
          cards: list.cards.filter((card)=>
            (
              //Loop thru card tags
             xy.every((s)=>(card?.tagIDs.includes(s.trim())))
            )
          )
        })
        ),
      })
      );
     }
      const results = boardsPostTag.filter((board) =>
          (
            arr.some(
              (x)=>
                (
                  x.split(',').every((s)=>(board.title.toLowerCase().includes(s.trim().toLowerCase())))
                )
            )
          
           ||
             //Search Card Title
            board.lists.some(
              ( x_list)=>(
                     (
                        arr.some(
                          (x)=>
                            (
                              x.split(',').every((s)=>(x_list.title.toLowerCase().includes(s.trim().toLowerCase())))
                            )
                        )

                        ||

                        x_list.cards.some(
                          ( x_card)=>(
                            //Search Card Title
                            arr.some(
                              (x)=>
                                (
                                  x.split(',').every((s)=>(x_card.title.toLowerCase().includes(s.trim().toLowerCase())))
                                  ||
                                  x.split(',').every((s)=>(x_card.description?.toLowerCase().includes(s.trim().toLowerCase())))
                              
                                )
                            )
                          
                          )// Return clossing bracket
                        )
                      )
                  // )
              )// Return clossing bracket
            )
          )
      
       
      );
      setFilteredBoards(results);
      // setFilteredListPage(results)
    } else {
  
      if (category !=='') {
       let xy= category.split(',')
      //  toast.message(`${xy}`)
       boardsPostTag = boardsPostTag.map((board) => ({
         ...board,
         //Change lists
         lists:board.lists.map((list)=>({
           ...list,
           //filter cards belonging to list
           cards: list.cards.filter((card)=>
             (
               //Loop thru card tags
              xy.every((s)=>(card?.tagIDs.includes(s.trim())))
             )
           )
         })
         ),
       })
       );
      }
     
      setFilteredBoards(boardsPostTag);
    }
  }, [boards,category,uniqueBoardId,
     searchTerm //added this....
    ]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const { width, height } = useWindowSize();
  const mobileWidth =400

 let allowedRoles:String[]
 allowedRoles=['employee','admin','visitor', 'manager']
 const isAllowedAccess = currentUser?.roles.filter((role: string) =>
                                          (//Outer bracket ::forEach user role  
                                              //Search Card  within the List
                                              allowedRoles.some((y)=>(// Allowed Roles
                                                  //Search Card Title
                                                  y.toLowerCase().includes(role.toLowerCase())
                                                  
                                                )// Return clossing bracket
                                              )
                                        )// Out bracker
                                    ) 
const popover_content_pos =width?width<mobileWidth?'bottom':'right':'right'

       
 /* ----------------Pagination------------ */
 type PageSizeOption = '1' | '2' | '3' | '4' | '8' | '16' | '24' | '32' | '48' | '60'; // Define valid page size options
 
const handlePageSizeChange = (newPageSize: PageSizeOption) => {
   // Type assertion (optional, but can improve type safety):
   const numericPageSize = parseInt(newPageSize, 10);
   setPageSize(numericPageSize);
   if (currentUser){
        execute({
          id: currentUser?.id,
          pageSize:numericPageSize
        })
  }  
   setItemOffset(Math.min(numericPageSize, Math.ceil(fList?.length / pageSize)));
};
 

 const handlePageClick = (event: { selected: number }) => {
   const newOffset = (event.selected * pageSize) % fList.length;
   setItemOffset(newOffset);
 };
 
 const calculatePageSlice = (fList?: SafeBoard2[], itemOffset?: number, pageSize?: number): SafeBoard2[] | undefined => {
   if (!fList|| !pageSize) {
     return undefined;
   }
   const endpoint = Math.min(itemOffset! + pageSize!, fList.length);
   return fList.slice(itemOffset!, endpoint);
 };
 
 useEffect(() => {
   const pageSlice = calculatePageSlice(fList, itemOffset, pageSize);
   if (pageSlice) {
     setFListPage(pageSlice);
   }

  //  console.log('fListPage',fListPage[0].views.viewCount)
 }, [itemOffset, fList, pageSize]);
 useEffect(() => {
//testing.......................................
  // console.log('fListPage2',fListPage[0].views.viewCount)
}, [fListPage]);
 
 useEffect(() => {
   if (fList && pageSize) {
     const newPageCount = Math.ceil(fList.length / pageSize);
     if (pageCount !== newPageCount) {
       setPageCount(newPageCount);
     } else {
       // Search filter catalog logic
       if (itemOffset > pageSize) {
         setItemOffset(0);
       }
     }
   } else {
     if (itemOffset > pageSize) {
       setItemOffset(0);
     }
   }
 }, [fList, pageSize]);
 
 useEffect(() => {
   setItemOffset(0);
 }, [pageCount]); 
 
  const renderPaginationButtons = () => {
   const buttons = [];    
   buttons.push(
       <ReactPaginate
               breakLabel="..."
               // nextLabel="next >"
               containerClassName="shadow border pagination text-lg text-blue-500 justify-center mt-4 flex flex-row gap-2" // Tailwind CSS classes
               activeClassName="active bg-orange-300 text-white" // Tailwind CSS classes
               previousLabel="«"
               nextLabel="»"
               key={'andgwgw!'}
               onPageChange={handlePageClick}
               pageRangeDisplayed={5}
               pageCount={Math.ceil(isNumber(fList?.length/pageSize)?fList?.length/pageSize:0)}
             
               // previousLabel="< previous"
               renderOnZeroPageCount={null}
       />
   );
   buttons.push(
       <select 
           className='border-gray-300 rounded border text-rose-500' 
           value={pageSize} 
           key={'abanansgd'}
           onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
       >
           <option value="1" >1 per Page</option>
           <option value="2">2 per Page</option>
           <option value="3">3 per Page</option>
           <option value="4">4 per Page</option>
           <option value="8">8 per Page</option>
           <option value="16">16 per Page</option>
           <option value="24">24 per Page</option>
           <option value="32">32 per Page</option>
           <option value="48">48 per Page</option>
           <option value="60">60 per Page</option>
       </select>
 
   );
   return <div  className="flex justify-center gap-3">{buttons}</div>;
 };
 
useEffect(() => {
  if (fList && pageSize) {
    const newPageCount = Math.ceil(fList.length / pageSize);
    if (pageCount !== newPageCount) {
      setPageCount(newPageCount);
    } else {
      // Search filter catalog logic
      if (itemOffset > pageSize) {
        setItemOffset(0);
      }
    }
  } else {
    if (itemOffset > pageSize) {
      setItemOffset(0);
    }
  }
}, [fList, pageSize]);

useEffect(() => {
  setItemOffset(0);
}, [pageCount]);

useEffect(()=>{  
  let boardListFilterCard: SafeBoard2[];
  let arrFirst =searchTerm.split(';');
  const arr = arrFirst.filter(element => element);  // Using arrow function (ES6)
  if (searchTerm !== "") {
    let boardListCardOverdue = filteredBoards.map((board) => ({
      ...board,
      //Change lists
      lists:board.lists.map((list)=>({
          ...list,
          //filter cards belonging to list
          cards: list.cards.filter((card)=>{
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
           
          })
      })
      ),
     }));
     //removes the cards that dont fall inside
     boardListCardOverdue= boardListCardOverdue.filter((board) => (board.lists.length>0))
  
     // Keep board that meet criteria
      const keepBoardMeetingCriterion = boardListCardOverdue.filter((board) =>
          ( // Board Title
            arr.some(
              (x)=>
                (
                  x.split(',').every((s)=>(board.title.toLowerCase().includes(s.trim().toLowerCase())))
                )
            )
          
           ||
            //Keep board with  list title, or card title or card description that meet condition
            board.lists.some(
              ( x_list)=>(
                     (// List Title
                        arr.some(
                          (x)=>
                            (
                              x.split(',').every((s)=>(x_list.title.toLowerCase().includes(s.trim().toLowerCase())))
                            )
                        )

                        ||

                        x_list.cards.some(
                          ( x_card)=>(
                            //Search Card Title or card description
                            arr.some(
                              (x)=>
                                (
                                  x.split(',').every((s)=>(x_card.title.toLowerCase().includes(s.trim().toLowerCase())))
                                  ||
                                  x.split(',').every((s)=>(x_card.description?.toLowerCase().includes(s.trim().toLowerCase())))
                              
                                )
                            )
                          
                          )// Return clossing bracket
                        )
                      )
                  // )
              )// Return clossing bracket
            )
          )
       
      );
      // keep list that meet criterion
      const boardFilterList = keepBoardMeetingCriterion.map((board) => ({
        ...board,
        //Change lists
        lists:board.lists.filter((list)=>
            (
              (
                  arr.some(
                    (x)=>
                    (
                      x.split(',').every((s)=>(list.title.toLowerCase().includes(s.trim().toLowerCase())))
                  
                    )
                  )
                
                  ||

                  //Search Card Title
                  list.cards.some(
                    ( x_card)=>(
                        arr.some(
                          (x)=>
                          (
                            x.split(',').every((s)=>(x_card.title.toLowerCase().includes(s.trim().toLowerCase())))
                            ||
                            x.split(',').every((s)=>(x_card.description?.toLowerCase().includes(s.trim().toLowerCase())))
                
                          )
                        )
                    )// Return clossing bracket
                  )
              )  
            )
        )
      })
      );
       // keep cards tha meet criterion.
      boardListFilterCard = boardFilterList.map((board) => ({
        ...board,
        //Change lists
        lists:board.lists.map((list)=>({
          ...list,
          //filter cards belonging to list
          cards: list.cards.filter((card)=>
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
        ),
      })
      );
    
      const boardListCardFinal= boardListFilterCard.map((board) => ({
        ...board,
        //remov empty list
        lists:board.lists.filter((list)=>( list.cards.length>0)),
       }));
          
          if (listState==true){
            setFList(sortDates(boardListCardFinal));
          }else{
            const boardListCardFinal2= boardListCardFinal.filter((board) => (board.lists.length>0))
            setFList(sortDates(boardListCardFinal2));
          } 
   
  } else {
      const boardListCardOverdue = filteredBoards.map((board) => ({
       ...board,
       //Change lists
       lists:board.lists.map((list)=>({
           ...list,
           //filter cards belonging to list
           cards: list.cards.filter((card)=>{

            let overdueBooleen=true;
            //A:Overdue or all
            //B: Non overdue or ALL
            if (inverseState==true){
              if (overdueState==true){
                // all those that are not overdue
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
        
           })
       })),
      }));
      const boardListCardFinal= boardListCardOverdue.map((board) => ({
        ...board,
        //remov empty list
        lists:board.lists.filter((list)=>( list.cards.length>0)),
       }));
          //  keep boards which matches board title.....
    if (listState==true){
      setFList(sortDates(boardListCardFinal));
    }else{
      const boardListCardFinal2= boardListCardFinal.filter((board) => (board.lists.length>0))
      setFList(sortDates(boardListCardFinal2));
    } 

  }

},[filteredBoards,overdueState,recentQ,completedTasks, inverseState, searchTerm,listState])


const getSummary= ()=>{
 
  const improvedCode = (): string => {
    return fList.map((board) => {
      const boardTitle = board.title; 
      return `${boardTitle}\n${board.lists.map((innerList) => {
        return innerList.cards.map((card) => {
          return ` ${card.title} ${getTextFromEditorSafe(card)}`; 
        }).join('\n'); 
      }).join('\n')}`; 
    }).join('\n\n'); 
  };
  // Assuming you have a handleSummarize function that takes a string
let summarizedContent: string = '';
const dbResult= improvedCode()

handleSummarize(dbResult) // Call improvedCode with fList
  .then((summary) => {
    summarizedContent = summary;
    console.log('Summary=====>:',summarizedContent)
  })
  .catch((error) => {
    console.error('Error summarizing content:', error);
  });
  
 
};

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

let title_= `Personal Projects ${fList.length} of ${boards.length}`

 let subtitle_="Projects boards created by you" //"Manage your projects and teams online"

 if (origin!=='myprojects'){
   if (origin=='pinnedprojects'){
    title_= `Pinned Projects ${fList.length} of ${boards.length}`
    subtitle_="Pinned Cards"
    // collapsedState===
  
   }else if(origin=='taggedprojects'){
    title_= `Tagged Projects ${fList.length} of ${boards.length}`
    subtitle_="Tagged Cards"
    // collapsedState=true
  
   }
   else{
     title_= `Projects ${fList.length} of ${boards.length}`
     subtitle_="Available Projects"
   }
 }

// Note: these aren't very good regexes, don't use them!
 if (isAllowedAccess?.length==0) return redirect('/denied') 
 if(!currentUser)return redirect('/denied')

  return (
    <Container >
     <div className="z-51 mt-[-40px] flex flex-col  sm:flex-col  justify-between sm:px-1 xs:px-2">          
        <Heading
          title={uniqueBoardId.length==0?title_:'Project View mode. To exit, either click here or on the project image.'}
          subtitle={subtitle_} 
          isSetBackground={uniqueBoardId?.length>0||(origin=='pinnedprojects')||(origin=='taggedprojects')}
          setUniqueBoardId={setUniqueBoardId}
        />
     
        <div className={cn("flex gap-1 z-51", isMobile ? 'flex-col' : 'flex-row justify-between items-start')}> {/* items-start added */}
            <div className="flex flex-row">
                <Button
                    variant="ghost"
                    onClick={() => { getSummary() }}
                    className="rounded-none h-[41px] w-[41px] sm:mt-9 justify-start font-normal text-lg"
                >
                    <FaFilePdf size={40} />
                </Button>
                <SaveExcelMutliple data={fList} disabled={false} fileName={`${origin}_${currentUser.email}_`} />
                <Search
                    setSearchTerm={setSearchTerm}
                    searchTerm={searchTerm}
                />
            </div>
            <div className={cn("flex w-full mt-1 z-51 sm:mt-10 rounded-lg mr-auto", isMobile ? 'py-2' : '')}> {/* No changes here */}
                <FilterSection
                    setCategory={(category) => {
                        setCategory(category ? category : '');
                    }}
                    productCategories_options={tagNames}
                    category={category.length > 0 ? category : null}
                    isFullwidth={isMobile ? true : false}
                    placeholder="Filter by tags"
                    isDisabled={false}
                />
            </div>
        </div>




        
     </div>
     <div className={cn("mt-1 pb-5",uniqueBoardId.length==0?'':'shadow-xl rounded-md p-1 border-yellow-400 border-2')}>{/* space-y-4 pb-10*/}
        <div>
          {
            // (isMobile || showMobileView==true)?
            ( 
              <div 
                  className={cn(
                    // "grid grid-cols-2 lg:grid-cols-4 gap-4",
                    isMobile?'grid grid-cols-1':'grid grid-cols-1'
                  )}
                >
                  {fListPage.map((board, index) => (
                            <div 
                              className=""       
                              key={ board.id   }
                            >
                                <PageView 
                                  board={board}
                                  currentUser={currentUser}
                                  index={index}
                                  tagNames={tagNames}
                                  userNames={userNames}
                                  setCategory={setCategory}
                                  category={category}
                                  compositeDecorator={compositeDecorator}
                                  handleToggleSelectUniqueBoard={handleToggleSelectUniqueBoard}
                                  initialEditingState={initialCollapseState}
                                />
                            </div>
                    ))}
                  <FormPopover sideOffset={isMobile?-125:10} side={popover_content_pos }>
                    <div
                      role="button"
                      className="mt-1 aspect-video relative h-[75px] w-[200px] bg-muted rounded-sm flex flex-col gap-y-1 items-center justify-center hover:opacity-75 transition"
                    >
                      <p className="text-sm">Create new project board</p>
                      <span className="text-xs"></span>
                      <Hint
                        sideOffset={40}
                        description={`Create project board here.`}
                      >
                        <HelpCircle
                          className="absolute bottom-2 right-2 h-[14px] w-[14px]"
                        />
                      </Hint>
                    </div>
                  </FormPopover>
                  <div>
                      {fList && fList.length > 0 && ( 
                          <div className="mt-4  max-w-9 flex flex-wrap  gap-1">{renderPaginationButtons()}
                                
                          </div> 
                        )} 
                      {!fList && <p>Loading data...</p>} 
                        
                  </div>
              </div>
            )
            // :
            // (
            //   <>
            //     <TanStackTable  
            //         data={fList} columns={columns} 
            //         userPageSize={Number(pageSize)} 
            //         currentUser={currentUser}
            //         setPageSize= {setPageSize}
            //     /> 
            //     <FormPopover sideOffset={10} side={popover_content_pos }>
            //         <div
            //           role="button"
            //           className="aspect-video relative h-[75px] w-[200px] bg-muted rounded-sm flex flex-col gap-y-1 items-center justify-center hover:opacity-75 transition"
            //         >
            //           <p className="text-sm">Create new project board</p>
            //           <span className="text-xs"></span>
            //           <Hint
            //             sideOffset={40}
            //             description={`Create project board here.`}
            //           >
            //             <HelpCircle
            //               className="absolute bottom-2 right-2 h-[14px] w-[14px]"
            //             />
            //           </Hint>
            //         </div>
            //     </FormPopover>
            //   </>    
            // ) 

          }      
        </div>
     </div>  
    </Container>
   );
}
 
export default ProjectsClient;


