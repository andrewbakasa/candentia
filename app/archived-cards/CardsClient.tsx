'use client';

import { toast } from "react-hot-toast";
import axios from "axios";
import { useCallback, useState, useEffect } from "react";

import { redirect, useRouter } from "next/navigation";

import { SafeCardWithBoard, SafeUser } from "../types";

import Heading from "../components/Heading";
import Search from "../components/Search";
import Container from "../components/Container";
import Link from "next/link";
import { useAction } from "@/hooks/use-action";
import DeleteButton from "../components/DeleteButton";
import { activateCard } from "@/actions/activate-card";

interface CardsClientProps {
  cards: SafeCardWithBoard[],
  currentUser?: SafeUser | null,
}

const CardsClient: React.FC<CardsClientProps> = ({
  cards,
  currentUser
}) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(''); 
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCards, setFilteredCards] = useState(cards);

//  console.log(filteredCards)
  // 24 January 2024  Prisma search nested models
  useEffect(() => {
    if (searchTerm !== "") {
      const results = cards.filter((x_card) =>
                //Search Card Title
                x_card.title.toLowerCase().includes(searchTerm.toLowerCase())
                ||
                // OR Select card Description if exist
                x_card.description?.toLowerCase().includes(searchTerm.toLowerCase())

                ||
                x_card.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
              );// Return clossing bracket
      setFilteredCards(results);
    } else {
      setFilteredCards(cards);
    }
  }, [searchTerm, cards]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  

  const { execute:executeActivate, isLoading } = useAction(activateCard, {
    onSuccess: (data) => {
      toast.success(`Card restored`);
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
        Your Archived Projects cards 
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredCards.map((card) => (

          <>
              <div 
                className="
                  aspect-square 
                  w-full 
                  relative 
                  overflow-hidden 
                  rounded-xl
                  group relative aspect-video bg-no-repeat bg-center bg-cover bg-sky-700 rounded-sm h-full w-full p-2 overflow-hidden"
                style={{ backgroundImage: `url(${card.imageThumbUrl})` }}
              >
                      <Link
                            key={card.id}
                            href={`#`}
                            onDoubleClick={() => {handleDClick(card.id)}}
                          
                          >
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
                            <p className="relative font-semibold text-white">
                            <span className="text-[9px]">Card Title :</span> {card.title} 
                            </p>
                            <p className="relative font-semibold text-white">
                            <span className="text-[9px]">List Title :</span> {card.list_title} 
                            </p>
                            <p className="relative font-semibold text-white">
                              <span className="text-[9px]">Board Title :</span> {card.board_title}
                            </p>
                            <p className="relative font-semibold text-white">
                              <span className="text-[9px]">Createdby :</span> {card.owner_email}
                            </p>
                          
                        </Link>
                      
                    
                      <div className="
                        absolute
                        top-3
                        right-3
                      ">
                    <DeleteButton 
                        deleteId={card.id}
                        url={'/api/deleteCard'} 
                      /> 
                      </div> 
                        {/*  Hover to display action to user*/}
                      <div className="opacity-0 hover:opacity-100 
                                duration-300 absolute insert-0 z-10 
                                flex text-[9px] text-white font-semibold">Double click Anywhere to restore the card
                      </div>
         
              </div>
            
          </>

     
        ))}
       
      </div>
    </div>
  
     </Container>
   );
}
 
export default CardsClient;