'use client';

import { AiFillDelete, AiOutlineDelete } from "react-icons/ai";
import { SafeUser } from "@/app/types";


import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface PrivacyButtonProps {
  deleteId: string,
  url:string
}

const DeleteButton: React.FC<PrivacyButtonProps> = ({ 
  deleteId,
  url
}) => {
 
  const router = useRouter();
  const deletePermanently =async()=>{
  let request;
    try {
      request = () => axios.delete(`${url}/${deleteId}`);
      await request();
      router.refresh();
      toast.success('Deleted Successfully');
      //console.log("result:", request)
    } catch (error) {
      //toast.error('Something went wrong.');
    }finally{
      
    }
   }

  return (
    <div 
      onDoubleClick={()=>deletePermanently()}
      className="
        relative
        hover:opacity-80
        transition
        cursor-pointer
      "
    >
      <AiOutlineDelete
        size={28}
        className="
          fill-white
          absolute
          -top-[2px]
          -right-[2px]
        "
      />
      <AiFillDelete
        size={24}
        className={ 'fill-rose-500'
        }
      />
      <div className="opacity-0 hover:opacity-100 
                        duration-300 absolute top-[20px] left-[-20px] z-10 
                        flex text-[9px] text-white font-semibold">Double Click to DELETE</div>
    </div>
   );
}
 
export default DeleteButton;