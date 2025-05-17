'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineMenu } from "react-icons/ai";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import useLoginModal from "@/app/hooks/useLoginModal";
import useRegisterModal from "@/app/hooks/useRegisterModal";
import useRentModal from "@/app/hooks/useRentModal";
import { SafeUser } from "@/app/types";

import MenuItem from "./MenuItem";
import { usePathname } from "next/navigation";

interface UserMenuProps {
  currentUser?: SafeUser | null;
}

const UserMenuMobile: React.FC<UserMenuProps> = ({ currentUser}) => {
  const router = useRouter();
  const loginModal = useLoginModal();
  const registerModal = useRegisterModal();
  const rentModal = useRentModal();

  return (  
    <div className="flex flex-col cursor-pointer ">
      {currentUser ? (
        <>
          <MenuItem label="All projects" onClick={() => { router.push("/projects");  }} />
          <MenuItem label="My projects" onClick={() => { router.push("/myprojects");  }} />

          {currentUser && (
            <MenuItem
              label="Profile Settings"
              onClick={() => { router.push(`/user/${currentUser.id}`);  }}
            />
          )}

          {currentUser?.isAdmin && (
            <MenuItem label="Users" onClick={() => { router.push("/users");  }} />
          )}
          <hr />
          {currentUser?.isAdmin && (
            <MenuItem label="General Tags" onClick={() => { router.push("/tags");  }} />
          )}

          {currentUser?.isAdmin && (
            <MenuItem label="Enquiries" onClick={() => { router.push("/enquiries");  }} />
          )}

          {currentUser?.isAdmin && (
            <MenuItem label="Product Enquiries" onClick={() => { router.push("/productenquiries");  }} />
          )}
          

          {currentUser?.isAdmin && (
            <MenuItem label="Edit Portfolio" onClick={() => { router.push("/edit-investments");  }} />
          )}

           {currentUser?.isAdmin && (
            <MenuItem label="Edit Jobs" onClick={() => { router.push("/edit-jobs");  }} />
          )}

          {currentUser?.isAdmin && (
            <MenuItem label="Broadcast Boards" onClick={() => { router.push("/boards-list");  }} />
          )}

          <hr />
          <MenuItem label="Logout" onClick={() => { signOut();  }} />
        </>
      ) : (
        <>
          <MenuItem label="Login" onClick={() => { loginModal.onOpen();  }} />
          <MenuItem label="Sign up" onClick={() => { registerModal.onOpen();  }} />
        </>
      )}
    </div>
  );
};

export default UserMenuMobile;
