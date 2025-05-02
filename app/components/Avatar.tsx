'use client';

import Image from "next/image";
import { cn } from "@/lib/utils";
interface AvatarProps {
  src: string | null | undefined;
  classList: string | null
}

const Avatar: React.FC<AvatarProps> = ({ src, classList }) => {
  return ( 
    <Image 
      className={cn(
        "rounded-full",
        classList,
      )}
      height="30" 
      width="30" 
      alt="Avatar" 
      src={src || '/images/placeholder.jpg'}
    />
   );
}
 
export default Avatar;