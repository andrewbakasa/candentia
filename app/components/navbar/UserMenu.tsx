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
import Avatar from "../Avatar";
import { useIsClickOut } from "./useIsClickOut";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface UserMenuProps {
  currentUser?: SafeUser | null;
  isOpen: boolean; // Receive isOpen as a prop
  onClose: () => void; // Receive a function to close the menu
  onOpenToggle: () => void; // Receive a function to toggle the menu
}

const UserMenu: React.FC<UserMenuProps> = ({ currentUser, isOpen, onClose, onOpenToggle }) => {
  const router = useRouter();
  const path = usePathname();
  const loginModal = useLoginModal();
  const registerModal = useRegisterModal();
  const rentModal = useRentModal();

  // We now control isOpen from the parent (NavLinks) for mobile
  // const [isOpen, setIsOpen] = useState(false); // Removed local state

  // const toggleOpen = useCallback(() => {
  //   setIsOpen((value) => !value);
  // }, []); // Removed local toggle

  const onLogin = useCallback(() => {
    if (!currentUser) {
      loginModal.onOpen();
      onClose(); // Close the menu after opening login modal
      return;
    }
    if (currentUser && currentUser?.isAdmin) {
      rentModal.onOpen();
      onClose(); // Close the menu after opening rent modal
    }
  }, [loginModal, rentModal, currentUser, onClose]);

  const handleMenuItemClick = useCallback(() => {
    onClose(); // Close the menu when a menu item is clicked
  }, [onClose]);

  // We don't need useIsClickOut to control the mobile menu closing anymore
  // const [eleCallBack] = useIsClickOut(setIsOpen, currentUser);
  //console.log('currentUser?.image', currentUser?.image)

  return (
    <div className="relative">
      <div className="flex flex-row items-center gap-3 ">
        {
          <div
            onClick={onLogin}
            className={cn(
              "shadow-lg hidden md:block text-sm font-semibold py-3 px-4 rounded-full hover:bg-neutral-100 transition ",
              currentUser?.isAdmin
                ? "cursor-pointer bg-orange-100"
                : "cursor-not-allowed opacity-50 aria-disabled"
            )}
          >
            {currentUser?.isAdmin ? currentUser.email : currentUser?.email}
          </div>
        }
        <div
          onClick={onOpenToggle} // Use the prop to toggle
          className="
            p-4
            md:py-1
            md:px-2
            border-[1px]
            border-neutral-200
            flex
            flex-row
            items-center
            gap-3
            rounded-full
            cursor-pointer
            hover:shadow-md
            transition
          "
        >
          <AiOutlineMenu />
          <div className="hidden md:block">
            
            <Avatar classList={""} src={currentUser?.image || '/images/placeholder.jpg'} />
          </div>
        </div>
      </div>
      {isOpen && (
        <div
          className="
            absolute
            rounded-xl
            shadow-md
            w-[40vw]
            md:w-3/4
            bg-white
            overflow-hidden
            right-0
            top-12
            text-sm
          "
        >
          <div className="flex flex-col cursor-pointer ">
            {currentUser ? (
              <>
                <MenuItem label="All projects" onClick={() => { router.push("/projects"); handleMenuItemClick(); }} />
                <MenuItem label="My projects" onClick={() => { router.push("/myprojects"); handleMenuItemClick(); }} />
                <MenuItem label="Financing" onClick={() => { router.push("/financing"); handleMenuItemClick(); }} />

                {currentUser && (
                  <MenuItem
                    label="Profile Settings"
                    onClick={() => { router.push(`/user/${currentUser.id}`); handleMenuItemClick(); }}
                  />
                )}

                {currentUser?.isAdmin && (
                  <MenuItem label="Users" onClick={() => { router.push("/users"); handleMenuItemClick(); }} />
                )}
                <hr />
                {currentUser?.isAdmin && (
                  <MenuItem label="General Tags" onClick={() => { router.push("/tags"); handleMenuItemClick(); }} />
                )}

                {currentUser?.isAdmin && (
                  <MenuItem label="Enquiries" onClick={() => { router.push("/enquiries"); handleMenuItemClick(); }} />
                )}

                {currentUser?.isAdmin && (
                  <MenuItem label="Product Enquiries" onClick={() => { router.push("/productenquiries"); handleMenuItemClick(); }} />
                )}
               
                {currentUser?.isAdmin && (
                  <MenuItem label="Manage Portfolio" onClick={() => { router.push("/edit-investments"); handleMenuItemClick(); }} />
                )}

                 {currentUser?.isAdmin && (
                  <MenuItem label="Manage Jobs" onClick={() => { router.push("/edit-jobs"); handleMenuItemClick(); }} />
                )}

                {currentUser?.isAdmin && (
                  <MenuItem label="Broadcast Boards" onClick={() => { router.push("/boards-list"); handleMenuItemClick(); }} />
                )}

                <hr />
                <MenuItem label="Logout" onClick={() => { signOut(); handleMenuItemClick(); }} />
              </>
            ) : (
              <>
                <MenuItem label="Login" onClick={() => { loginModal.onOpen(); handleMenuItemClick(); }} />
                <MenuItem label="Sign up" onClick={() => { registerModal.onOpen(); handleMenuItemClick(); }} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
