
"use client";
import { cn, getCardsFromSafeBoard, getLatestCard, isNumber} from "@/lib/utils";
import { SafeBoard, SafeCard, SafeUser } from "@/app/types";
import { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import { TopCard } from "./top-card";
import { CardWithList2, SafeBoard2, SafeCardWithList2 } from "@/types";
import { Currency } from "lucide-react";

interface DeckCardsProps {
  board: SafeBoard2;
  setCategory: (category: string ) => void;
  category:string;
  tagNames:any;
  userNames:any;
  index:string;
  compositeDecorator:any;
  currentUser?:SafeUser |null
  // cardList: SafeCard[]
};

const DeckCards : React.FC<DeckCardsProps> = ({
  board,
  setCategory,
  tagNames,
  currentUser,
  compositeDecorator,
  category,
  // cardList,
  userNames,
  index
}) => {
  useEffect(()=>{

    let cardListLocal =getCardsFromSafeBoard(board)
    setCardList(cardListLocal)
    const latestCard= getLatestCard(cardListLocal)// repetetion in future improve....
    const pagnumberLocal:number= cardListLocal?.findIndex((carditem)=>carditem.id==latestCard.id)
    setPageNumber(pagnumberLocal)
    setCardOnDeck(latestCard)

  },[board])
  
  const [cardList,setCardList]=useState<SafeCardWithList2[]>([])
  const [cardOnDeck, setCardOnDeck]=useState<SafeCardWithList2|null>(null)
  const [pageSize, setPageSize] = useState<number>(1); // view only 1 item  
  const [itemOffset, setItemOffset] = useState(0);

  const [pagnumber, setPageNumber] = useState(0);
  const [lastClickedPage, setLastClickedPage] = useState(-1); // Initialize to -1 to indicate no clicks yet
  const [listOwner, setListOwner]=useState('');
   
    // Function to check if a page click has occurred
    const hasPageClickOccurred = () => {
      return lastClickedPage !== -1;
    };
  


const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * pageSize) % cardList.length;
    setItemOffset(newOffset);
    setLastClickedPage(event.selected); // Update the last clicked page
    setPageNumber(event.selected)

};

const calculatePageSlice = (cardList?: SafeCardWithList2[], itemOffset?: number, pageSize?: number): SafeCardWithList2[] | undefined => {
    if (!cardList|| !pageSize) {
      return undefined;
    }
    const endpoint = Math.min(itemOffset! + pageSize!, cardList.length);
    return cardList.slice(itemOffset!, endpoint);
 };

useEffect(() => {
  const pageSlice = calculatePageSlice(cardList, itemOffset, pageSize);
  if (pageSlice && pageSlice?.length>0){
      setCardOnDeck(pageSlice[0])
  }
}, []);

useEffect(() => {
    const pageSlice = calculatePageSlice(cardList, itemOffset, pageSize);
    if (pageSlice && pageSlice?.length>0){
        setCardOnDeck(pageSlice[0])
    }
    //click latest card if nothing has been click
    if (hasPageClickOccurred()){
      // handlePageClick({ selected: pagnumber??0 });
 
    }
    // console.log('here b',pageSlice,cardOnDeck )
  }, [itemOffset,
    //pagnumber,
    cardOnDeck]);

useEffect(()=>{

  //  setTimeout(() => {
  //       handlePageClick({ selected: pagnumber });
  //       console.log('Simulate page click...',pagnumber,cardOnDeck)

  //  }, 1500);
  
  const parentList = board.lists?.filter(x=>(x.id==cardOnDeck?.listId))
  if (parentList){
    const listOwner =parentList[0]?.userId||''
    setListOwner(listOwner)
  }
},[cardOnDeck])


const renderPaginationButtons = () => {
    const buttons = [];    
    buttons.push(
        <ReactPaginate
                breakLabel="..."
                containerClassName="shadow border pagination text-lg text-blue-500 justify-center mt-1 mb-1 flex flex-row gap-2" // Tailwind CSS classes
                activeClassName="active bg-orange-300 text-white" // Tailwind CSS classes
                previousLabel="«"
                nextLabel="»"
                key={'aqhwtsfadw'}
                onPageChange={handlePageClick}
                pageRangeDisplayed={cardList?.length<100?3:2}
                pageCount={Math.ceil(isNumber(cardList?.length/pageSize)?cardList?.length/pageSize:0)}
                initialPage={pagnumber}
                renderOnZeroPageCount={null}
        />
    );
    
    
    return <div key={index +"s"} className="flex justify-center gap-3">{buttons}</div>;
  };

    return (
         <>
            <div className="float-right shadow-md mt-0" 
              key={index + '1'}
             >
                {cardList && cardList.length > 0 && ( 
                    <div className="mt-0  max-w-9 flex flex-wrap">{renderPaginationButtons()}
                        
                    </div> 
                )} 
                {!cardList && <p>Loading data...</p>} 
                
            </div>
           {cardOnDeck 
           && <TopCard 
                    data={cardOnDeck} index={index}
                    currentUserId={currentUser?.id||''} 
                    boardId={board.id}
                    setCategory={setCategory} 
                    category={category}
                    compositeDecorator={compositeDecorator}
                    tagNames={tagNames}
                    userNames={userNames}
                    listOwner={listOwner}
                    isOwnerOrAdmin={ board?.userId ==currentUser?.id || currentUser?.isAdmin  }
                    currentUser={currentUser}
                    pagnumber ={pagnumber}
            />}
         </> 
     );
  };

export default DeckCards
