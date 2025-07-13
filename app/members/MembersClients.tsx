'use client';

import { useCallback, useState, useEffect } from "react";
import { useRouter, redirect } from "next/navigation";
import Link from "next/link";
import { HelpCircle } from "lucide-react";

import { SafeUser } from "../types";
import Heading from "../components/Heading";
import Search from "../components/Search";
import Container from "../components/Container";
import Avatar from "@/app/components/Avatar";
import { cn } from "@/lib/utils";
import { Hint } from "../components/hint";

import { useWindowSize } from "@/hooks/use-screenWidth";
interface MembersClientProps {
  members:any[];
  currentUser?: SafeUser | null;
}

const MembersClient: React.FC<MembersClientProps> = ({
  members,
  currentUser
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(members);
  
  // Update filtered users when search term or member list changes
  useEffect(() => {
    if (searchTerm) {
      const results = members.filter(user =>
        user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(results);
    } else {
      setFilteredUsers(members);
    }
  }, [searchTerm, members]);

  // Define allowed roles for access
  const allowedRoles = ['admin', 'manager'];
  
  // Check if the current user has any of the allowed roles
  const hasRequiredRole = currentUser?.roles?.some(role =>
    allowedRoles.includes(role.toLowerCase())
  );
 const { width } = useWindowSize();
  // Redirect if user is not logged in or lacks the required role
  if (!currentUser) {
    return redirect('/denied');
  }

  if (!hasRequiredRole) {
    return redirect('/denied');
  }

 
  const mobileWidth = 400;
  const isMobile = width < mobileWidth;
  
  const title_ = `Users (${filteredUsers.length} of ${members.length})`;

  return (
    <Container>
      <div className="pt-0 flex flex-col sm:flex-row justify-between">
        <Heading
          title={title_}
          subtitle="Manage your projects and teams online"
        />
        <div className="flex flex-row">
          <Search 
            setSearchTerm={setSearchTerm}
            placeholderText={"Filter Users..."}
            searchTerm={searchTerm}
          />
        </div>
      </div>
      
      <div className="space-y-4 pb-10">
        <div className="flex items-center font-semibold text-lg text-neutral-700">
          Available Users
          <Hint
            description="Users with 'admin' or 'manager' roles have special permissions."
            side={isMobile ? "bottom" : "right"}
            sideOffset={10}
          >
            <HelpCircle className="h-4 w-4 ml-2" />
          </Hint>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <Link
              key={user.id}
              href={`/member/${user.id}`}
            >
              <div 
                className={cn(
                  "aspect-square w-full relative overflow-hidden rounded-xl group relative p-2 shadow-sm transition hover:shadow-lg",
                  currentUser?.id === user.id ? "border-[3px] border-rose-600" : ""
                )}
              >
                {/* Overlay for hover effect */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
                
                {/* User Info */}
                <div className="relative z-10 h-full w-full flex flex-col justify-end items-start p-2 text-white">
                  <Avatar classList="border-[1.5px] border-white mb-2" src={user.image} />
                  <p className="font-semibold text-sm truncate w-full">
                    {user.lastName}
                  </p>
                  <p className="text-xs truncate w-full">
                    {user.userEmail}
                  </p>
                </div>
                
                {/* Admin/Manager Badge */}
                <div 
                  className="
                    absolute top-3 right-3 z-10
                    bg-rose-600 text-white rounded-full
                    px-2 py-1 text-xs font-semibold
                  "
                >
                  {/* {user.roles.includes('admin') ? 'Admin' : (user.roles.includes('manager') ? 'Manager' : '')} */}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Container>
  );
}

export default MembersClient;