'use client';

import { MdPushPin } from "react-icons/md";

import useFavorite from "@/app/hooks/useFavorite";
import { SafeUser } from "@/app/types";

interface HeartButtonProps {
  listingId: string
  currentUser?: SafeUser | null;
  // handlePageClick?:(options: { selected: number })=>void;
 
}

const HeartButton: React.FC<HeartButtonProps> = ({ 
  listingId,
  currentUser,
  // handlePageClick
}) => {
  const { hasFavorited, toggleFavorite  } = useFavorite({
    listingId,
    currentUser
   });


  return (
    <div 
      onClick={toggleFavorite}
      className="
        relative
        hover:opacity-80
        transition
        cursor-pointer
      "
    >
     {/* <BsPin
        size={28}
        className="
          fill-white
          absolute
          -top-[1px]
          -right-[2px]
        "
      />  */}
      <MdPushPin
        size={26}
        className={
          hasFavorited ? 'fill-rose-500' : 'fill-neutral-500/70'
        }
      />
    </div>
   );
}
 
export default HeartButton;