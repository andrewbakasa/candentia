
import { SafeUser } from "@/app/types";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { cn, truncateString } from "@/lib/utils";
import { BsLock, BsUnlock, BsUnlockFill } from "react-icons/bs";

interface PrivacyButtonProps {
  boardId: string;
  currentState: Boolean;
  currentUser?: SafeUser | null;
}

const PrivacyButton: React.FC<PrivacyButtonProps> = ({ boardId, currentState, currentUser }) => {
  const [isPublic, setIsPublic] = useState(currentState);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // New state to track loading

  const togglePrivacy = async () => {
    setIsLoading(true); // Set loading to true before request
    let request;

    try {
      if (currentState === true) {
        //if public make private
        request = () => axios.delete(`/api/privacyToggle/${boardId}`);
      } else {
        // make private
        request = () => axios.post(`/api/privacyToggle/${boardId}`);
      }

      const data = await request();

      router.refresh();
      toast.success(<span className={cn("", data?.data?.public ? " text-fuchsia-500" : "")}>
        <span className="text-red-700">{` ${truncateString(data.data.title, 25)} `}</span> is now {(data?.data?.public === false) ?
          <span className="font-bold">private</span> :
          <span className="font-bold">public. It is visible to everyone!</span>}</span>);
    } catch (error) {
      toast.error('Something went wrong.');
    } finally {
      setIsPublic(currentState => !currentState); // Update state after successful request
      setIsLoading(false); // Set loading to false after request finishes
    }
  };

  return (
    <div
      onClick={isLoading ? () => {} : togglePrivacy} // Disable click if loading
      className="btn-reset btn-link relative hover:opacity-80 transition cursor-pointer"
    >
      {!isPublic ? <BsLock size={20} />
       : 
       <BsUnlock size={20} className={isPublic ? 'fill-rose-500' : 'fill-neutral-500/70'} />}
      <div className="opacity-0 hover:opacity-100 transition-opacity 
         duration-300 absolute inset-0 top-[20px] left-[-20px] z-10 flex text-[11px]
          text-white font-semibold animate-fly-in">
        {isPublic ? 'Public' : 'Private'}
      </div>
    </div>
  );
};

export default PrivacyButton;
