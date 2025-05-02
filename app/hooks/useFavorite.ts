import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { SafeUser } from "../../app/types";
import useLoginModal from "./useLoginModal";
import { toast } from "sonner";

interface IUseFavorite {
  listingId: string;
  currentUser?: SafeUser | null
}
// const [nowclicked, setNowclicked]=useState(false)
const useFavorite = ({ listingId, currentUser }: IUseFavorite) => {
  const router = useRouter();

  const loginModal = useLoginModal();
  //  const {pinState,setPinState}= usePinStateStore()
  const hasFavorited = useMemo(() => {
    const list = currentUser?.favoriteIds || [];

    return list.includes(listingId);
  }, [currentUser, listingId]);

  // const isClickedRef = useRef(false);
  // setPinState(false)
  const toggleFavorite = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (!currentUser) {
      return loginModal.onOpen();
    }
    
    // isClickedRef.current = true; // Set current value to true
    // toast.message(isClickedRef.current)
    // setPinState(true)
    try {
      let request;

      if (hasFavorited) {
        request = () => axios.delete(`/api/favorites/${listingId}`);
      } else {
        request = () => axios.post(`/api/favorites/${listingId}`);
      }

      await request();
      router.refresh();
      if (hasFavorited)
       toast.success('Removed from Pinned');
      else 
       toast.success('Pinned');
     
    } catch (error) {
      toast.error('Something went wrong.');
    }
  }, 
  [
    currentUser, 
    hasFavorited, 
    listingId, 
    loginModal,
    router
  ]);

  return {
    hasFavorited,
    toggleFavorite,
   // isClicked: pinState//isClickedRef.current, // Access current value
  };
}

export default useFavorite;
