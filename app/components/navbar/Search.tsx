'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useOverdueStore } from '@/hooks/useOverduState';
import { cn } from '@/lib/utils';
import { useQueueStore } from '@/hooks/use-QueueState';
import { SafeUser } from "@/app/types";
import { useCompletedTaskStore } from '@/hooks/use-CompletedTaskState';
import { useInverseStore } from '@/hooks/use-inverseState';
import useIsMobile from '@/app/hooks/isMobile';
import { toast } from 'sonner';
import { uselistStore } from '@/hooks/use-listState';
import { Button } from '@/components/ui/button';
import { useAction } from '@/hooks/use-action';
import { updateUser } from '@/actions/update-user';
import { useInverseTableStore } from '@/hooks/use-inverseTableState';
import { useCollapseStore } from '@/hooks/use-collapseState';
import { useShowMobileViewStore } from '@/hooks/use-mobileView';
interface NavbarProps {
  currentUser?: SafeUser | null;
}

const Search: React.FC<NavbarProps> = ({
  currentUser,
}) => {
  const params = useSearchParams();
  const path = usePathname();
  const {overdueState, setOverdueState}= useOverdueStore();
  const {recentQ, setRecentQueueState}= useQueueStore();
  const {completedTasks, setCompletedTaskState}= useCompletedTaskStore();
  const {inverseState ,setInverseState}= useInverseStore();
  const {collapseState,setCollapseState}=useCollapseStore();

  const {inverseTableState ,setInverseTableState}= useInverseTableStore();
  const {showMobileView,setShowMobileViewState}=useShowMobileViewStore();

  const {listState ,setListState}= uselistStore();
  
  const [isloading, setIsLoading]=useState(true);
  const router = useRouter();

  useEffect(() => {
      
    setInverseState(currentUser?.toggleInverse||false)
    
    setInverseTableState(currentUser?.toggleInverseTable||false)
    setRecentQueueState(currentUser?.toggleRecentTaskorAll||false)
    setCompletedTaskState(currentUser?.togglePendingTasksOrAll||false)
    setListState(currentUser?.emptyListShow||false)
    setOverdueState(currentUser?.toggleOverdueorAll||false) 
    //use current setting..... deactivate 11 September 2024 for testing only   
    //setCollapseState(currentUser?.collapseBoards||false)
  }, []); // Empty dependency array ensures fetching on mount

  const isMobile =  useIsMobile();

  
  const { execute, fieldErrors } = useAction(updateUser, {
    onSuccess: (data) => {
       // toast.success(`My profile ${data.name}  email: ${data.email} updated successfully: `);
    
    },
    onError: (error) => {
      toast.error(error);
    },
  });
  const HideStateHandler =()=>{    
    execute({
      id: currentUser?.id ||'056541!`232',
      notificationToaster:false
    })
  }

  
  useEffect(()=>{
   const timeoutID = setTimeout(() => {
     setIsLoading(false);//flash end half a second
   }, 2000);
   return () => clearTimeout(timeoutID);

  },[])

  const prefStateHandler =()=>{
    if(path == '/pinned'){
      router.replace('/')
    
    }else{
      // do nothing
      router.replace('/pinned')
    }
   
  }
  const taggedStateHandler =()=>{
    if(path == '/tagged'){
      router.replace('/')
    
    }else{
      // do nothing
      router.replace('/tagged')
    }
   
  }
  const overdueStateHandler =()=>{
    setOverdueState(!overdueState);
  }
  
  const recentQueueStateHandler =()=>{
    setRecentQueueState(!recentQ);
  }
  const completedTasksStateHandler =()=>{
    setCompletedTaskState(!completedTasks);
  }

  const inverseStateHandler =()=>{
    setInverseState(!inverseState);
  }
  const inverseTableStateHandler =()=>{
    setInverseTableState(!inverseTableState);
  }
  const showMobileViewStateHandler =()=>{
    setShowMobileViewState(!showMobileView);
  }
  const listStateHandler =()=>{
    setListState(!listState);
  }
  const collapseHandler =()=>{
    setCollapseState(!collapseState);
  }
  useEffect(()=>{
    if (isMobile==true && currentUser?.notificationToaster==true){
       toast.success(<span className="font-semibold text-[12px]"> {completedTasks?<span className='underline text-red-800'>{inverseState?'Completed-Tasks':`Pending-Tasks`}</span>:'ALL-Tasks'}
       {',  '}{recentQ ?<span className='underline text-red-800'>{inverseState?'Old-Addition':`Recent-Addition`}{` ${currentUser?.recentDays}`}</span>:'ALL-Addition'}
       {',  '}{overdueState?<span className='underline text-red-800'>{inverseState?'Non-Overdue':'OverDue'}</span>:'All-Time'} 
       {',  '}{listState?<span className='underline text-red-800'>{'Lists-ON'}</span>:'Lists-OFF'}
       {',  '}<Button onClick ={HideStateHandler} className="h-auto w-auto px-1 text-green-700 text-[12px]" variant="outline">Hide</Button>
      </span> )
    }
  },[recentQ,inverseState,completedTasks,overdueState,listState, inverseTableState])
  return ( 
    <div
     
      className="
        w-full 
        md:w-auto 
        py-2 
        rounded-full 
        transition 
        cursor-pointer
      "
      >
        <div 
          className="
            flex 
            flex-row 
            items-center 
            justify-between
          "
          >
            <div 
              className="
                text-sm 
                font-semibold 
                px-2
                md:px-0
              "
            >
              
                    <div className='flex gap-3 items-center'>
                      {
                      isloading==false?
                      (
                        <div className={cn('flex',isMobile?'gap-[0px]':'gap-1')}>
                          <Image 
                            src={completedTasks==true?'/taskAA.svg':'/taskBB.svg'} 
                            width={isMobile?29:35}
                            height={isMobile?29:35} alt='map' 
                            className={cn("h-auto shadow-lg", completedTasks==true?'border bg-gray-100':'' )}                      
                            onClick={completedTasksStateHandler}
                          />
                  
                          <Image 
                            src={recentQ==true?'/addA.svg':'/addB.svg'} 
                            width={isMobile?29:35}
                            height={isMobile?29:35} alt='map' 
                            className={cn("h-auto shadow-lg", recentQ==true?'border bg-gray-100':'' )}                      
                            onClick={recentQueueStateHandler}
                          />
                  
                          <Image 
                            src={overdueState==true?'/timerA.svg':'/timerB.svg'} 
                            width={isMobile?29:35}
                            height={isMobile?29:35} alt='overdue' 
                            className={cn("h-auto shadow-lg",overdueState==true?'border bg-gray-100':'' )}                      
                            onClick={overdueStateHandler}
                          />
                          <Image 
                            src={inverseState==true?'/invertedA.svg':'/invertedB.svg'} 
                            width={isMobile?29:35}
                            height={isMobile?29:35} alt='inverse' 
                            className={cn("h-auto shadow-lg",inverseState==true?'border bg-gray-100':'' )}                      
                            onClick={inverseStateHandler}
                          />
                          <Image 
                            src={listState==true?'/lstA.svg':'/lstB.svg'} 
                            width={isMobile?29:35}
                            height={isMobile?29:35} alt='list' 
                            className={cn("h-auto shadow-lg",listState==true?'border bg-gray-100':'' )}                      
                            onClick={listStateHandler}
                          />
                       
                          <div className="relative"> 
                            <Image 
                              src={path == '/pinned'?'/pinB.svg':'/pinA.svg'} 
                              width={isMobile?29:35}
                              height={isMobile?29:35} alt='likes' 
                              className={cn("h-auto shadow-lg",path == '/pinned'?'border bg-gray-100':'z-50' )}  
                              onClick={prefStateHandler}
                                              
                          />
                         
                            <div 
                             className="absolute top-[-10px] right-[-10px] p-2 bg-inherit text-red-400 rounded-full">
                                <span className='text-sm '
                                 onClick={prefStateHandler}
                             
                                >{currentUser?.favoriteIds.length}</span>
                            </div>
                          </div>
                       {/* not true */}

                       <div className="relative"> 
                            <Image 
                              src={path == '/tagged'?'/mailB.svg':'/mailA.svg'} 
                              width={isMobile?29:35}
                              height={isMobile?29:35} alt='likes' 
                              className={cn("h-auto shadow-lg",path == '/tagged'?'border bg-gray-100':'z-50' )}  
                              onClick={taggedStateHandler}
                                              
                          />
                      <div 
                             className="absolute top-[-10px] right-[-10px] p-2 bg-inherit text-red-400 rounded-full">
                                <span className='text-sm '
                                 onClick={taggedStateHandler}
                             
                                >{currentUser?.taggedInboxIds.length}</span>
                            </div>
                          </div>
                       
                       {isMobile!==true && showMobileView!==true && <Image 
                            src={inverseTableState==true?'/filterA.svg':'/filterB.svg'} 
                            width={isMobile?29:35}
                            height={isMobile?29:35} alt='inverse' 
                            className={cn("h-auto shadow-lg ",inverseTableState==true?'border bg-gray-100':'' )}                      
                            onClick={inverseTableStateHandler}
                          />
                       }
                       {isMobile!==true  && <Image 
                            src={showMobileView==true?'/mobileA.svg':'/mobileB.svg'} 
                            width={isMobile?29:35}
                            height={isMobile?29:35} alt='inverse' 
                            className={cn("h-auto shadow-lg ",inverseTableState==true?'border bg-gray-100':'' )}                      
                            onClick={showMobileViewStateHandler}
                          />
                       }
                      <Image 
                            src={collapseState==true?'/collapse.svg':'/collapseA.svg'} 
                            width={isMobile?29:35}
                            height={isMobile?29:35} alt='list' 
                            className={cn("h-auto shadow-lg",collapseState==true?'border bg-gray-100':'' )}                      
                            onClick={collapseHandler}
                          />
                        </div>
                      )
                      :
                        (
                          <div className='flex gap-1'>
                            {
                              [1,2,3,4,5].map((item,index)=>(
                                <div key={index} 
                                    className={cn("w-[35px]  bg-slate-200 animate-pulse rounded-lg h-[30px] ")}
                                >
                                </div>
                              ))
                            }
                          </div>
                        )
                    
                    }
                      <ul className='hidden md:flex gap-2'>
                          {
                            isloading==false?
                            (
                              <>
                                <li className='hover:text-primary font-medium text-sm cursor-pointer shadow-md' >
                                  {completedTasks?<span className='underline text-red-800'>{inverseState?'Completed-Tasks':`Pending-Tasks`}</span>:'ALL-Tasks'}
                                  {',  '}{recentQ ?<span className='underline text-red-800'>{inverseState?'Old-Addition':`Recent-Addition`}{` ${currentUser?.recentDays}`}</span>:'ALL-Addition'}
                                  {',  '}{overdueState?<span className='underline text-red-800'>{inverseState?'Non-Overdue':'OverDue'}</span>:'All-Time'}
                                  {',  '}{listState?<span className='underline text-red-800'>{'Lists-ON'}</span>:'Lists-OFF'}
                                  {',  '}{showMobileView? 'Mobile-View':inverseTableState?<span className='underline text-red-800'>{'View-Mini'}</span>:'View-Wide'}
                              
                                  {path == '/pinned'?(<>{", "}<span className='underline text-red-800'>{'Pinned'}</span></>):''}
                                  {/* /preference */}
                                </li>
                              </>
                            )
                            :
                            (
                              <div className='hidden md:flex gap-1'>
                                <div  className={cn("w-[150px]  bg-slate-200 animate-pulse rounded-lg h-[30px] ")}>
                                </div>
                                <div  className={cn("w-[100px]  bg-slate-200 animate-pulse rounded-lg h-[30px] ")}>
                                </div>
                              </div>
                            )
                          }
                      </ul>
                    </div>
                  
            </div>
          </div>
    </div>
  );
}
 
export default Search;

{/*

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchInboxMessages } from './api'; // Assuming you have an API for fetching inbox messages

function InboxImageComponent() {
  const [totalInboxMessages, setTotalInboxMessages] = useState(0);

  const { isLoading, isError, data } = useQuery(['inboxMessages'], () => fetchInboxMessages());

  useEffect(() => {
    if (data) {
      setTotalInboxMessages(data.length); // Update total based on fetched data
    }
  }, [data]);

  return (
    <div className="relative">
      <img src="your-image.jpg" alt="Inbox" className="w-full h-auto" />
      <div className="absolute top-0 right-0 p-2 bg-gray-900 text-white rounded-full">
        {isLoading ? (
          <span>Loading...</span>
        ) : isError ? (
          <span>Error fetching inbox messages</span>
        ) : (
          <span>{totalInboxMessages}</span>
        )}
      </div>
    </div>
  );
}

export default InboxImageComponent;*/}