'use client';
import { useCallback, useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import { SafeUser } from "../types";

import Heading from "../components/Heading";
import Search from "../components/Search";
import Container from "../components/Container";
import Link from "next/link";
import { FormPopover } from "../components/form/form-popover";
import { Hint } from "../components/hint";
import { HelpCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { useWindowSize } from "@/hooks/use-screenWidth";
import Avatar from "@/app/components/Avatar";
import { cn } from "@/lib/utils";
interface UsersClientProps {
  users: SafeUser[],
  currentUser?: SafeUser | null,
}


const UsersClient: React.FC<UsersClientProps> = ({
  users,
  currentUser
}) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(''); 
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUsers, setfilterUsers] = useState(users);
  
  
  
  //Cookies.set('originString', 'projects')
  useEffect(() => {
    if (searchTerm !== "") {
      const results = users.filter((user) =>
          (//Outer bracket           
              //Select current user title
              user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
              ||
              user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
             
              
          )// Out bracker
       
      );
      setfilterUsers(results);
    } else {
      setfilterUsers(users);
    }
  }, [searchTerm, users]);
 
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const { width, height } = useWindowSize();
  const mobileWidth =400
  if(!currentUser)return redirect('/denied')
 let allowedRoles:String[]
 allowedRoles=['admin', 'manager']

 // if its empty allow also:
 //this is just testing
  const isAllowedAccess = currentUser?.roles.filter((role: string) =>
                                          (//Outer bracket ::forEach user role  
                                              //Search Card  within the List
                                              allowedRoles.some((y)=>(// Allowed Roles
                                                  //Search Card Title
                                                  y.toLowerCase().includes(role.toLowerCase())
                                                  
                                                )// Return clossing bracket
                                              )
                                        )// Out bracker
                                    ) || []

//console.log('isAllowedAccess' ,isAllowedAccess)

const popover_content_pos =width?width<mobileWidth?'bottom':'right':'right'
//Mobile push bottom

let title_ =  `Users ${filterUsers.length} of ${users.length}`
 if (isAllowedAccess?.length==0) return redirect('/denied') 

  return (
    <Container>
      
     <div className="pt-0 flex flex-col  sm:flex-row  justify-between">
        <Heading
          title={title_}
          subtitle="Manage your projects and teams online"
        />
        <div className="flex flex-row ">
            <Search 
                //handleSearch ={handleSearch} 
                setSearchTerm={setSearchTerm}               
                placeholderText={"Filter Users..."}
                searchTerm = {searchTerm} />  
         
        </div>
     </div>
    <div className="space-y-4 pb-10">
      <div className="flex items-center font-semibold text-lg text-neutral-700">
        {/* <User2 className="h-6 w-6 mr-2" /> */}
      Available Users
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filterUsers.map((user) => (
         <>
            <div 
            className={cn(
              "aspect-square w-full relative overflow-hidden rounded-xl  group relative aspect-video bg-no-repeat bg-center bg-cover bg-sky-700 rounded-sm h-full w-full p-2 overflow-hidden",
              currentUser?.id == user.id  ? "border-[3px] border-rose-600" : "",
            )}
              
              style={{ backgroundImage: `url(${user.image})` }}
            >
                    <div className="absolute inset-0 ">
                      <Avatar classList="border-[1.5px] border-white"  src={user.image} />
                    </div>
                    <Link
                          key={user.id}
                          href={`/user/${user.id}`}
                        
                        >
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
                          <p className="relative font-semibold text-white">
                            {user.name}
                          </p>
                          <p className="relative font-semibold text-white">
                            {user.email}
                          </p>
                    </Link>
                    <div 
                        className="
                        absolute
                        top-3
                        right-3
                        "
                    >
                        {user.isAdmin 
                          &&  <svg className="text-rose-700 cursor-pointer peer peer-hover:text-yellow-400 hover:text-yellow-400 duration-100 " width="23" height="23" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                        </svg>
                        }
                    </div>
            </div>
          </>

        
        ))}
       
      </div>
    </div>
  
     </Container>
   );
}
 
export default UsersClient;


