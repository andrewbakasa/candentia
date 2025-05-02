'use client';
import useIsMobile from "../hooks/isMobile";
import { cn } from "@/lib/utils";
interface HeadingProps {
  title: string;
  subtitle?: string;
  center?: boolean;
  isSetBackground?:boolean
  setUniqueBoardId?:(value:string)=>void;

}

const Heading: React.FC<HeadingProps> = ({ 
  title, 
  subtitle,
  center,
  isSetBackground=false,
  setUniqueBoardId
}) => {  
  const isMobile =  useIsMobile();

  const handleOnclick = () => {
   
    if (isSetBackground && setUniqueBoardId) {
      setUniqueBoardId('');
    }
  };
  return ( 
    <div 
       className={center ? 'mb-0 text-center' : 'mb-0 text-start'}
       onClick={()=>handleOnclick()}
    >
      <div 
        className={cn("hidden md:block text-2xl font-bold",
                      isSetBackground?"bg-orange-400 border cursor-pointer text-white text-lg rounded-md":"")}
      >
        {title}
       
      </div>
      <div 
          className={cn(
                      "font-light text-neutral-500 mt-1",
                      isMobile? isSetBackground?"bg-orange-400 border rounded text-white text-lg":"text-2xl font-bold"
                      :"",
                      
                     )}
          >
        {isMobile?title:subtitle}
      </div>
    </div>
   );
}
 
export default Heading;