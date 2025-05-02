'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";

import { cn} from "@/lib/utils";
import { SafeUser } from "@/app/types";
interface NavbarProps {
  currentUser?: SafeUser | null;
}

const Logo: React.FC<NavbarProps> = ({
  currentUser,
}) => {
  const router = useRouter();

  return ( 
    <Image
      onClick={() => router.push('/')}
      className={
        cn("cursor-pointer shadow-lg",
       // currentUser?.isAdmin  ? "hidden md:block" : "",
      )}
      //src="/images/logo.png" 
      src="/images/vertex.png"
      height="60" 
      width="60" 
      alt="Logo" 
    />
   );
}
 
export default Logo;
