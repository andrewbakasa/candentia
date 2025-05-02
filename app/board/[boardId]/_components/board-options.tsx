"use client";
import { toast } from "sonner";
import { Loader, MoreHorizontal, Plus, Search, Trash, X } from "lucide-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { createList } from "@/actions/create-list";
import { deleteBoard } from "@/actions/delete-board";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { myBoard } from "@/actions/project-redirect";
import { Separator } from "@radix-ui/react-separator";
import { SafeBoard } from "@/app/types";
import SaveExcel from "@/app/components/SaveExcel"

import {AiFillEdit } from "react-icons/ai";
import Cookies from 'js-cookie';
import { toggleBoard } from "@/actions/toggle-board-public";
import { cn, findLabelByValue } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
//import { BoardPercentForm } from "./board-PERCENT-form";
import { Board } from "@prisma/client";
import { BoardPercentForm } from "./board-percent-form";
import { toggleBoardDraggable } from "@/actions/toggle-board-draggable";

interface BoardOptionsProps {
  id: string;
  userId:string;
  cardReadModeBase:boolean
  data:SafeBoard,
  data2:Board,
  isOwner: Boolean,
  useremail:string,
  setPercent:(value:number) => void;
  percent:number,
  userNames:any;
  userImages:any;
  boardViewCreatedAt:any
  };

  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { useBoardStore } from "@/hooks/use-boardProp";
import { useSearchOpenStore } from "@/hooks/use-searchOpenState";
import { uselistStore } from "@/hooks/use-listState";
import { useCardReadModeStore } from "@/hooks/use-cardReadMode";
import { updateUser } from "@/actions/update-user";
import { useRouter } from "next/navigation";
import { useTriggerCopyStore } from "@/hooks/use-triggerCopy";
import { useClipBoardCopytore } from "@/hooks/use-clipboardCopy";
import { useCardsOrderedStore } from "@/hooks/use-boardOrderedList";
import { useCardModal } from "@/hooks/use-card-modal";
import getUserNames from "@/app/actions/getUserNames";

export const BoardOptions = ({ id ,data, userId, 
                             data2,isOwner ,cardReadModeBase,
                            useremail , setPercent,  percent,
                            userNames, userImages, boardViewCreatedAt
                          }: BoardOptionsProps) => {

 
 
  let url:string
  let title_:string 
  
  const cardModal = useCardModal();
  const [processingMode, setProcessingMode] = useState(false); 
  const [processingModeDraggable, setProcessingModeDraggable] = useState(false);
  const {openState,setOpenState}= useSearchOpenStore();
  const {cardsOrdered,setCardsOrderedState}= useCardsOrderedStore();
  
  const {setTriggeredState}=useTriggerCopyStore();
  const {setCopyState,copiedState}=useClipBoardCopytore();
 
  const {readMode,setReadModeState}= useCardReadModeStore();

  const {listState ,setListState}= uselistStore();
  const [newdata, setNewData] = useState(data2); 
  const {boardState}=useBoardStore();  
  const router = useRouter();
  
  if (Cookies.get('originString')){
    url= Cookies.get('originString')|| "projects"
    title_= url=="myprojects"?  "My Projects": "All Projects"
  }else {
    url= Cookies.get('originString')|| "projects"
    title_ ="All Projects"
  }

  const { execute:executeReadMode} = useAction(updateUser, {
    onSuccess: (data) => {
  
    },
    onError: (error) => {
      toast.error(error);
    },
  });
  const { execute:executeDelete, isLoading: loadingDeleteBoard } = useAction(deleteBoard, {
    onError: (error) => {
     // console.log(isLoading)
      toast.error(error);
    }
  });

  const onDelete = () => {
    //console.log("whau is id:" ,id)
    executeDelete({id});
  };

  const onNavProject = () => {
    executeRedirect({url});

  };
  

 
  const onDownloadBoardReport = () => {
    executeDownload({ url });

  };
  const { execute:executeList,isLoading: loadingCreateList } = useAction(createList, {
    onSuccess: (data) => {
      toast.success(`List "${data.title}" created`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

    const { execute: executeDownload } = useAction(myBoard, {
    
    onError: (error) => {
      toast.error(error);
    }
  });
  const { execute: executeRedirect } = useAction(myBoard, {
    
    onError: (error) => {
      toast.error(error);
    }
  });


  const { execute: executeToggleBoard , isLoading:isLoadingToggleBoard} = useAction(toggleBoard, {
    
    onSuccess: (data) => {
      toast.success(`Successfully set Publcity to ${data.public}`)
      setNewData(data)
      //when error trrigger end processing to enable buttons
      //wait for 1.5secs
      setTimeout(() => {
        setProcessingMode(false)
      }, 1500);
    },
    onError: (error) => {
      toast.error(error);
     
    }
  });

  const { execute: executeToggleBoardDraggable , isLoading:isLoadingToggleBoardDraggble} = useAction(toggleBoardDraggable, {
    
    onSuccess: (data) => {
      setNewData(data)
      toast.success(`Successfully set dragMode to ${data.dragMode}`)
      setTimeout(() => {
        setProcessingModeDraggable(false)
      }, 1500);
    },
    onError: (error) => {
      toast.error(error);
      //when error trrigger end processing to enable buttons
      //wait for 1.5secs     
    }
  });

  const togglePrivacy = () => {
    executeToggleBoard({id});

  };

  
  const toggleReadMode = () => {
   // executeToggleBoard({id});
   const x =!readMode;
   setReadModeState(!readMode)
   //update db
   executeReadMode({
    id: userId,
    cardReadMode:x,
   })
  };

  
  const toggleCardsOrdered = () => {

    if (cardsOrdered==false){
      //if order is false this will become true soon
      setProcessingModeDraggable(false)
    }
    setCardsOrderedState(!cardsOrdered)
    
   };

  const onClipBoardCopy =async ()=>{
  
    setTriggeredState(true);
   };
    
  const toggleDraggable = () => {
    executeToggleBoardDraggable({id});

  };
  
  //end isLoading when database updates
  useEffect(() => {
    setProcessingMode(false)
  }, [data.public]); // Empty dependency array ensures fetching only once

  //end isLoading when database updates
  useEffect(() => {
      setProcessingModeDraggable(false)
  }, [data?.dragMode]); // Empty dependency array ensures fetching only once
  
    

  useEffect(() => {
    if (isLoadingToggleBoard ){
     setProcessingMode(true)
    }
  }, [isLoadingToggleBoard]);//,privacyChangedState

  useEffect(() => {
    if (isLoadingToggleBoardDraggble ){
       setProcessingModeDraggable(true)
    }
  }, [isLoadingToggleBoardDraggble]);//,privacyChangedState

 

  const [progressOption, setProgressOption] = useState('select')
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setProgressOption(event.target.value);
        if (data.lists?.length==0){
          if (event.target.value=='basis'){
            basic()
          }else if(event.target.value=='equip_maintenance'){
            equip_maintenance()
          }else if(event.target.value=='asset_mgt'){
            asset_mgt()
          }else if(event.target.value=='fmea'){
            fmea()
          }else{
            basic()
          }
        }
  };

 /* 1. Option */ 
 const basic =()=>{  
      const boardId :string =id
      let title ='Backlog'
      setProcessingMode(true)
      executeList({title, boardId});
      title='In-Progress'
      executeList({title, boardId});
      title='Review'
      executeList({title, boardId});
      title='Done'
      executeList({title, boardId});

      setTimeout(() => {
        setProcessingMode(false)
      }, 1500);

      // mark visible..... when new list is added
      if (listState ==false){
        setListState(true);
      }
}
  /* 2. Option */ 
  const fmea =()=>{  
    const boardId :string =id

    let title ='Failure & Symptoms'
    setProcessingMode(true)

    executeList({title, boardId});

    title='Failure Mode'
    executeList({title, boardId});

    title='Failure Effects'
    executeList({title, boardId});

    title='Frequency'
    executeList({title, boardId});

    
    setTimeout(() => {
      setProcessingMode(false)
    }, 1500);

    // mark visible..... when new list is added
    if (listState ==false){
      setListState(true);
    }
 }
 /* 3. Option */ 
 const asset_mgt =()=>{  
  const boardId :string =id

  let title ='Asset Details'
  setProcessingMode(true)

  executeList({title, boardId});

  title='Purchasing Details'
  executeList({title, boardId});

  title='Specifications'
  executeList({title, boardId});

  title='Maintenance & Costing'
  executeList({title, boardId});

  setTimeout(() => {
    setProcessingMode(false)
  }, 1500);

  // mark visible..... when new list is added
  if (listState ==false){
    setListState(true);
  }
 }
 /* 4. Option */ 
 const equip_maintenance =()=>{  
  const boardId :string =id

  let title ='Failure & Symptoms'
  setProcessingMode(true)

  executeList({title, boardId});

  title='Failure Analysis & Root Cause Investigation'
  executeList({title, boardId});

  title='Maintenance & Reliability'
  executeList({title, boardId});

  title='Continuous Improvement'
  executeList({title, boardId});

  title='Repair Works'
  executeList({title, boardId});

  setTimeout(() => {
    setProcessingMode(false)
  }, 1500);

  // mark visible..... when new list is added
  if (listState ==false){
    setListState(true);
  }
 }
 
  return (
    <div className="flex flex-row gap-0 sm:gap-2">
      {/* 1st Item */}
      {
        
        data.userslist.length>0 &&  
          <div className="mt-2 cursor-pointer" onClick={()=>{toast.message(
            <p>
                {data.userslist.map((user) => (
                  <div key={user} className="px-1 text-xs">            
                      <div className="truncate flex flex-row gap-1">
                        {/*1a...1st component  */}
                        <Avatar 
                          className="h-6 w-6 z-50"
                        >
                          <AvatarImage src={findLabelByValue(userImages,user) || '/images/placeholder.jpg'}/>
                        </Avatar>
                        {/*1b....2nd component */}
                        <div className="mt-1">{findLabelByValue(userNames,user)}</div>
                        <span className="mt-1 text-blue-400">{findLabelByValue(boardViewCreatedAt,user)}</span>
                      </div>
                  </div>
                ))}
            </p>
            )}}>
            <h4 className="mt-1 text-xs flex flex-row sm:text-sm"><span className="hidden sm:block">{'Views:'}</span><span>{data.views}</span></h4>
          </div>
      }
      {/* 2nd Item */}
      <Popover >
        <PopoverTrigger asChild>
          <Button className="h-auto w-auto p-2 mt-1" variant="transparent">
            <MoreHorizontal className="h-4 w-4" />
              {
              isOwner==true && 
                  <span>
                    <AiFillEdit  size={24} /> 
                  </span>
              }
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="px-0 pt-3 pb-3" 
          side="bottom" 
          align="start"
        >
          <div className="text-sm font-medium text-center text-neutral-600 pb-4">
            Board actions
          </div>
          <PopoverClose asChild>
            <Button 
              className="h-auto w-auto p-2 absolute top-2 right-2 text-neutral-600"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </PopoverClose>

          <Button
            variant="ghost"
            onClick={onNavProject}
            disabled={isLoadingToggleBoard || loadingDeleteBoard ||processingMode || processingModeDraggable }
            className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm"
          >
          Dashboard [{title_}] 
          </Button>

          {/* Download Board details */}
          <SaveExcel data={boardState}   disabled={isLoadingToggleBoard || loadingDeleteBoard ||processingMode || processingModeDraggable} fileName={`${data.title}_` }/>
          {/* if no list : Get--select templates*/}
        
        { isOwner==true && <Button
              variant="ghost"
              onClick={()=>togglePrivacy()}
              disabled={isLoadingToggleBoard || loadingDeleteBoard ||processingMode|| processingModeDraggable}
              className={cn("rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm",
                    newdata.public?"": "text-blue-500")}
            >
            {processingMode? "Processing...": newdata?.public?"Toggle to private":"Toggle to public"}
            </Button>
          }

          { isOwner==true && <Button
              variant="ghost"
              onClick={()=>toggleDraggable()}
              disabled={isLoadingToggleBoard || loadingDeleteBoard ||processingMode || processingModeDraggable}
              className={cn("rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm",
              newdata.dragMode?"": "text-blue-500")}
            >
            {processingModeDraggable? "Processing...": newdata?.dragMode?"Toggle to draggable OFF":"Toggle to draggable ON"}
            </Button>
          }
          <Separator />
        
            {isOwner==true && <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button  variant="ghost" 
                disabled={isLoadingToggleBoard || loadingDeleteBoard ||processingMode || processingModeDraggable}
                className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm"
          
                >
                    {isLoadingToggleBoard ? <Loader className='animate-spin' /> :  <><Trash  className="h-4 w-4 mr-2" />Delete this board</>}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Ready to Delete?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Do you really want to delete this board?
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className={undefined}>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-gray-200 outline-1 hover:bg-gray-400" onClick={onDelete} >
                            <Trash className="h-4 w-4 mr-2 bg-red-600" /> 
                          </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
          }
            <div className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm text-rose-700">
                <span>Created by {useremail}</span>
            </div>

          <Separator />
          
        <BoardPercentForm 
                data={data2} 
                setPercent={setPercent}
                percent={percent} />  
        <Separator />
        <Button
              variant="ghost"
              onClick={()=>toggleReadMode()}
              disabled={isLoadingToggleBoard || loadingDeleteBoard ||processingMode|| processingModeDraggable}
              className={cn("rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm",
                    !readMode?"text-rose-600": "text-blue-500")}
            >
            {processingMode? "Processing...": !readMode ?"Toggle to ReadMode":"Toggle to OFF-ReadMode"}
        </Button>

          <Button
              variant="ghost"
              onClick={()=>toggleCardsOrdered()}
              disabled={isLoadingToggleBoard || loadingDeleteBoard ||processingMode|| processingModeDraggable}
              className={cn("rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm",
                    !readMode?"text-rose-600": "text-blue-500")}
            >
            {processingMode? "Processing...": !cardsOrdered ?"Toggle to Ordered- Cards":"Toggle to OFF-Ordered-Card"}
        </Button>
        
   
        {
          <div className="text-sm mt-1 ml-4 py-1">
              <select disabled={data.lists?.length!==0 || loadingCreateList|| processingMode} id="progress" name="progress" value={progressOption} onChange={handleSelectChange}>
                    {/* Dynamically populate options based on your data model:future */}
                    <option value="">Select Category Plan</option> 
                    <option value="basic">Basic Project</option>
                    <option value="equip_maintenance">Equip Maintenance</option>
                    <option value="asset_mgt">Asset Management</option>
                    <option value="fmea" >FMEA</option>
                    <option value="advanced" disabled>Advanced</option>
                    {/* ...other options */}
              </select>
          </div>
          }
         <Button
            variant='ghost'
            className={cn("rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm")}
            onClick={()=>{cardModal.onOpen(data.id, id, true);}}
         >
            {/* {copiedState ? 'Copied!✅' : 'Copy to Clipboard'} */}
           Retrieve All
          </Button>             
          <Separator/>
         <Button
            variant='ghost'
            className={cn("rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm")}
            onClick={()=>{onClipBoardCopy()}}
         >
            {copiedState ? 'Copied!✅' : 'Copy to Clipboard'}
    
          </Button> 

        </PopoverContent>
      

      </Popover>
      {/* 3rd Item */}
      <div className=""  
        onClick={()=>{
          // setOnState(!onState);    
          setOpenState(!openState)
         }
        }
      > 
         {openState && <X 
              className=" mt-2"   
            />
         }
           {!openState && <Search
              className="mt-2"   
            />
         }
      </div>
    </div>
  );
};
