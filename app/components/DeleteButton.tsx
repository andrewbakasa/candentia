'use client';

import { AiFillDelete, AiOutlineDelete } from "react-icons/ai";
import { SafeUser } from "@/app/types";

import { Button } from "@/components/ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
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
import { Loader, Trash } from 'lucide-react'
//import Button from "./Button";

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
   
   
    <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button  variant="ghost"   className="w-full justify-start hover:bg-white"    size="inline" type="button"  >
            <div 
              className="
                relative
               
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
      {/* <div className="opacity-0 hover:opacity-100 
                        duration-300 absolute top-[20px] left-[-20px] z-10 
                        flex text-[9px] text-white font-semibold">Double Click to DELETE</div> */}
    </div>
      
            </Button>
     
          </AlertDialogTrigger>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Ready to Delete?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Do you really want to delete this card?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className={undefined}>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-gray-200 outline-1 hover:bg-gray-400" onClick={()=>deletePermanently()} >
                         <Trash className="h-4 w-4 mr-2 bg-red-600" /> 
                      </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>


   );
}
 
export default DeleteButton;