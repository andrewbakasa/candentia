'use client';

import { toast } from "react-hot-toast";
import axios from "axios";
import { useCallback, useState, useEffect } from "react";

import { redirect, useRouter } from "next/navigation";

import { SafeBoard, SafeUser } from "../types";

import Heading from "../components/Heading";
import Search from "../components/Search";
import Container from "../components/Container";
import Link from "next/link";
import { useAction } from "@/hooks/use-action";
// import { activateBoard } from "../../actions/activate-board";
import DeleteButton from "../components/DeleteButton";
import Avatar from "@/app/components/Avatar";
import { activateBoard } from "@/actions/activate-board";
import { SafeBoard2 } from "@/types";

interface ProjectsClientProps {
  boards:any[],// SafeBoard2[],
  currentUser?: SafeUser | null,
}

const ProjectsClient: React.FC<ProjectsClientProps> = ({
  boards,
  currentUser
}) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(''); 
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBoards, setFilteredBoards] = useState(boards);

//  console.log(filteredBoards)
  // 24 January 2024  Prisma search nested models
  useEffect(() => {
    if (searchTerm !== "") {
      // const results = boards.filter((board) =>
      //     (//Outer bracket           
      //         //Select current board title
      //         board.title.toLowerCase().includes(searchTerm.toLowerCase())
      //         ||
      //         //Search List within the board
      //         board.lists.some(
      //           (x_list)=>(
      //             (  // Search List title
      //                 x_list.title.toLowerCase().includes(searchTerm.toLowerCase())
      //                 ||
      //                 //Search Card  within the List
      //                 x_list.cards.some(
      //                   ( x_card)=>(
      //                     //Search Card Title
      //                     x_card.title.toLowerCase().includes(searchTerm.toLowerCase())
      //                     ||
      //                     // OR Select card Description if exist
      //                     x_card.description?.toLowerCase().includes(searchTerm.toLowerCase())
      //                   )// Return clossing bracket
      //                 )
      //             )// Return clossing bracket
      //           )
      //         ) // End of board List
              
      //     )// Out bracker
       
      // );
      setFilteredBoards(boards);//results);
    } else {
      setFilteredBoards(boards);
    }
  }, [searchTerm, boards]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  

  const { execute:executeActivate, isLoading } = useAction(activateBoard, {
    onSuccess: (data) => {
      toast.success(`Board restored`);
      //console.log(data)
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleDClick =(id:string) => {
    executeActivate({ id });
}
 // TESTING>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// console.log('archived:' ,currentUser)
 if (!currentUser?.isAdmin) return redirect('/denied')
  return (
    <Container>
      <div className="flex flex-col  sm:flex-row  justify-between">
        <Heading
          title="Archived Projects"
          subtitle="Click to restore project"
        />
       <Search 
          // handleSearch ={handleSearch}
          setSearchTerm={setSearchTerm}                   
          searchTerm = {searchTerm} />
     </div>
    <div className="space-y-4 ">
      <div className="flex items-center font-semibold text-lg text-neutral-700">
        {/* <User2 className="h-6 w-6 mr-2" /> */}
        Your Archived Projects boards 
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBoards.map((board) => (

          <>
              <div 
                className="
                  aspect-square 
                  w-full 
                  relative 
                  overflow-hidden 
                  rounded-xl
                  group relative aspect-video bg-no-repeat bg-center bg-cover bg-sky-700 rounded-sm h-full w-full p-2 overflow-hidden"
                style={{ backgroundImage: `url(${board.imageThumbUrl})` }}
              >
                     
                     <div className="absolute inset-0 ">
                      <Avatar classList="border-[1.5px] border-white"  src={board?.user_image} />
                    </div>
                      <Link
                            key={board.id}
                            href={`#`}
                            onDoubleClick={() => {handleDClick(board.id)}}
                          
                          >
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
                            <p className="relative font-semibold text-white">
                              {board.title}
                              </p>
                        </Link>
                      
                    
                      <div className="
                        absolute
                        top-3
                        right-3
                      ">
                    <DeleteButton 
                        deleteId={board.id}
                        url={'/api/deleteBoard'} 
                      /> 

                      </div> 
                        {/*  Hover to display action to user*/}
                      <div className="opacity-0 hover:opacity-100 
                                duration-300 absolute insert-0 z-10 
                                flex text-[9px] text-white font-semibold">Double click Anywhere to restore the board
                      </div>
         
              </div>
            
          </>

     
        ))}
       
      </div>
    </div>
  
     </Container>
   );
}
 
export default ProjectsClient;