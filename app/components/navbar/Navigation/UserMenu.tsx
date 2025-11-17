'use client';
import useLoginModal from '@/app/hooks/useLoginModal';
import useRegisterModal from '@/app/hooks/useRegisterModal';
import { signOut } from 'next-auth/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar } from './Avatar';
import { MenuItem } from './MenuItem';
import { useInboxCountVarStore } from '@/hooks/use-inbox-count';
import { SafeUser } from '@/app/types';

/**
 * Props for the UserMenu component.
 * @property {SafeUser | null} [currentUser] - The currently logged-in user, or null if not authenticated.
 * @property {(href: string) => void} handleNavigate - A function to handle external navigation.
 */
interface UserMenuProps {
  currentUser?: SafeUser | null;
  handleNavigate: (href: string) => void;
}


/**
 * UserMenu component.
 * Displays a dropdown menu for user-related actions.
 */
const UserMenu: React.FC<UserMenuProps> = ({ currentUser, handleNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const loginModal = useLoginModal();
  const registerModal = useRegisterModal();
  const { unreadMessages } = useInboxCountVarStore();

  const allowedRolesContracts = ['admin', 'executive'];
  
  /**
   * Determine authorization for the Contracts link.
   * True if the user is an admin OR if their roles array contains 'admin' or 'executive'.
   */
  const isAuthorizedContracts = currentUser?.isAdmin || 
    currentUser?.roles?.some(role => allowedRolesContracts.includes(role.toLowerCase()));

  // Handle click outside to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen((value) => !value);
  }, []);

  
  /**
   * Handles a menu item click, triggers navigation, and closes the menu.
   * @param {string} path - The URL path to navigate to.
   */
  const handleMenuItemClickWithNav = useCallback((path: string) => {
    handleNavigate(path); 
    setIsOpen(false); 
  }, [handleNavigate]);

  // Inline SVG for Menu Icon
  const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
    </svg>
  );

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex flex-row items-center gap-3">
        {/* User email display (Desktop only) */}
        {currentUser && (
          <div className="shadow-lg hidden md:block text-sm font-semibold py-3 px-4 rounded-full transition cursor-default text-gray-700 bg-white">
            {currentUser?.email}
          </div>
        )}

        {/* User Menu Toggle Button (Avatar and Menu Icon) */}
        <div
          onClick={toggleOpen}
          className="
            p-2 md:py-1 md:px-2 border-[1px] border-neutral-200 
            flex flex-row items-center gap-3 rounded-full cursor-pointer 
            hover:shadow-md transition
          "
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label="User menu"
        >
          <MenuIcon className="hidden md:block h-6 w-6" />
          <Avatar classList={""} src={currentUser?.image || 'https://placehold.co/40x40/555555/FFFFFF?text=P'} />
        </div>
      </div>

      {/* User Menu Dropdown Content */}
      {isOpen && (
        <div
          className="
            absolute rounded-xl shadow-md min-w-[200px] md:w-3/4
            bg-white overflow-hidden right-0 top-12 text-sm z-50
          "
        >
          <div className="flex flex-col cursor-pointer">
            {currentUser ? (
              <>
                <MenuItem
                  label="All Content"
                  onClick={() => handleMenuItemClickWithNav(`/contents`)}
                />
                
                {currentUser?.isAdmin && (
                  <MenuItem label="Broadcast Content" onClick={() => handleMenuItemClickWithNav("/boards-list")} />
                )}
                
                <hr className="my-1" />
                
                {/* --- Admin Investment Links --- */}
                {currentUser?.isAdmin && (
                  <MenuItem label="Investment Options" onClick={() => handleMenuItemClickWithNav("/financing")} />
                )}
                {currentUser?.isAdmin && (
                  <MenuItem label="Manage Investments" onClick={() => handleMenuItemClickWithNav("/edit-investments")} />
                )}

                <hr className="my-1" />
                
                {/* --- Admin Careers Link --- */}
                {currentUser?.isAdmin && (
                  <MenuItem label="Careers" onClick={() => handleMenuItemClickWithNav("/edit-jobs")} />
                )}

                <MenuItem label="Business Proposals" onClick={() => handleMenuItemClickWithNav("/bps")} /> 
                
                {/* --- Contracts (Roles Conditional) --- */}
                {isAuthorizedContracts && (
                  <MenuItem 
                    label="Contracts" 
                    onClick={() => handleMenuItemClickWithNav("/contracts")} 
                  />
                )}
                
                <hr className="my-1" />
                
                {/* --- User/Member Links --- */}
                <MenuItem
                  label="Profile Settings"
                  onClick={() => handleMenuItemClickWithNav(`/user/${currentUser.id}`)}
                />
                <MenuItem
                  label="My Member Profile"
                  onClick={() => handleMenuItemClickWithNav(`/member-profile`)}
                />
                
                {/* --- Admin Member/User Management Links --- */}
                {currentUser?.isAdmin && (
                  <MenuItem label="All Members" onClick={() => handleMenuItemClickWithNav("/members")} />
                )}
                <hr className="my-1" />
                {currentUser?.isAdmin && (
                  <MenuItem label="Users" onClick={() => handleMenuItemClickWithNav("/users")} />
                )}
                
                {/* --- Admin Enquiries and Traffic --- */}
                {currentUser?.isAdmin && (
                    <div className="relative"> 
                        <MenuItem label={`General Enquiries`} onClick={() => handleMenuItemClickWithNav("/enquiries")} />
                        {unreadMessages > 0 && 
                          <div className="absolute top-[-10px] left-[110px] p-2 bg-inherit text-red-500 rounded-full">
                            <span className='text-sm'>{unreadMessages}</span>
                          </div>
                        }
                    </div>
                )}
                {currentUser?.isAdmin && (
                  <MenuItem label="Website Traffic" onClick={() => handleMenuItemClickWithNav("/views")} />
                )}
                
                {/* --- Admin Tags/Media --- */}
                {currentUser?.isAdmin && (
                  <MenuItem label="Tags" onClick={() => handleMenuItemClickWithNav("/tags")} />
                )}
                <MenuItem label="General Media" onClick={() => handleMenuItemClickWithNav("/media")} />
                
                <hr className="my-1" />
                <MenuItem label="Logout" onClick={() => signOut()} />
              </>
            ) : (
              <>
                {/* Guest User Menu Items */}
                <MenuItem label="Login" onClick={loginModal.onOpen} />
                <MenuItem label="Sign up" onClick={registerModal.onOpen} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
// 'use client';
// import useLoginModal from '@/app/hooks/useLoginModal';
// import useRegisterModal from '@/app/hooks/useRegisterModal';
// import { signOut } from 'next-auth/react';
// import React, { useCallback, useEffect, useRef, useState } from 'react';
// import { Avatar } from './Avatar';
// import { MenuItem } from './MenuItem';
// import { useInboxCountVarStore } from '@/hooks/use-inbox-count';
// import { SafeUser } from '@/app/types';

// /**
//  * Simplified SafeUser type for demonstration purposes.
//  * In a real application, this would be imported from your project's types.
//  */
// // interface SafeUser {
// //   id: string;
// //   email?: string | null;
// //   isAdmin?: boolean;
// //   image?: string | null;
// //   empId?: string | null;
// // }

// /**
//  * Props for the UserMenu component.
//  * @property {SafeUser | null} [currentUser] - The currently logged-in user, or null if not authenticated.
//  * @property {(href: string) => void} handleNavigate - A function from the parent (NavBar) to handle navigation.
//  */
// interface UserMenuProps {
//   currentUser?: SafeUser | null;
//   handleNavigate: (href: string) => void;
// }


// /**
//  * UserMenu component.
//  * Displays a dropdown menu for user-related actions (e.g., profile settings, logout, admin links).
//  * Manages its own open/close state and closes when clicked outside.
//  */
// const UserMenu: React.FC<UserMenuProps> = ({ currentUser, handleNavigate }) => {
//   const [isOpen, setIsOpen] = useState(false); // Internal state for UserMenu dropdown
//   const menuRef = useRef<HTMLDivElement>(null); // Ref for click-outside detection
//   const loginModal = useLoginModal();
//   const registerModal = useRegisterModal();

//   const {unreadMessages}=useInboxCountVarStore();
// const allowedRolesContracts=['admin', 'executive']
//   // Define the authorization check once
//   const isAuthorizedContracts = currentUser?.isAdmin ||  currentUser?.roles.filter((role: string) =>
//                           (//Outer bracket ::forEach user role  
//                               //Search Card  within the List
//                               allowedRolesContracts.some((y)=>(// Allowed Roles
//                                   //Search Card Title
//                                   y.toLowerCase().includes(role.toLowerCase())
                                  
//                                 )// Return clossing bracket
//                               )
//                         )// Out bracker
//                     ) || []

//   // Handle click outside to close the menu
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   const toggleOpen = useCallback(() => {
//     setIsOpen((value) => !value);
//   }, []);

  
//   /**
//    * Handles a menu item click, triggers navigation, and closes the menu.
//    * @param {string} path - The URL path to navigate to.
//    */
//   const handleMenuItemClickWithNav = useCallback((path: string) => {
//     handleNavigate(path); // Use the passed handleNavigate for actual navigation
//     setIsOpen(false); // Close menu after navigation
//   }, [handleNavigate]);

//   // Inline SVG for Menu Icon (used as a visual indicator in the user menu toggle)
//   const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
//       <path fillRule="evenodd" clipRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
//     </svg>
//   );

//   return (
//     <div className="relative" ref={menuRef}>
//       <div className="flex flex-row items-center gap-3">
//         {/* User email display (Desktop only) */}
//         {currentUser && (
//           <div
//             className={`shadow-lg hidden md:block text-sm font-semibold py-3 px-4 rounded-full transition cursor-default text-gray-700 bg-white`}
//           >
//             {currentUser?.email}
//           </div>
//         )}

//         {/* User Menu Toggle Button (Avatar and optional Menu Icon) */}
//         <div
//           onClick={toggleOpen}
//           className="
//             p-2
//             md:py-1
//             md:px-2
//             border-[1px]
//             border-neutral-200
//             flex
//             flex-row
//             items-center
//             gap-3
//             rounded-full
//             cursor-pointer
//             hover:shadow-md
//             transition
//           "
//           aria-haspopup="true"
//           aria-expanded={isOpen}
//           aria-label="User menu"
//         >
//           <MenuIcon className="hidden md:block h-6 w-6" /> {/* Only menu icon on desktop */}
//           <Avatar classList={""} src={currentUser?.image || '/images/placeholder.jpg'} />
//         </div>
//       </div>

//       {/* User Menu Dropdown Content */}
//       {isOpen && (
//         <div
//           className="
//             absolute
//             rounded-xl
//             shadow-md
//             w-max-content
//             min-w-[200px]
//             md:w-3/4
//             bg-white
//             overflow-hidden
//             right-0
//             top-12
//             text-sm
//             z-50
//           "
//         >
//           <div className="flex flex-col cursor-pointer">
//             {currentUser ? (
//               <>
              
//                 <MenuItem
//                   label="All Content"
//                   onClick={() => handleMenuItemClickWithNav(`/contents`)}
//                 />
                
//                 {/* {currentUser?.isAdmin && (
//                   <MenuItem label="My Content" onClick={() => handleMenuItemClickWithNav("/mycontents")} />
//                 )} */}
//                 {currentUser?.isAdmin && (
//                   <MenuItem label="Broadcast Content" onClick={() => handleMenuItemClickWithNav("/boards-list")} />
//                 )}
//                 <hr className="my-1" />
//                 {currentUser?.isAdmin && (
//                   <MenuItem label="Investment Options" onClick={() => handleMenuItemClickWithNav("/financing")} />
//                 )}
//                  {currentUser?.isAdmin && (
//                   <MenuItem label="Manage Investments" onClick={() => handleMenuItemClickWithNav("/edit-investments")} />
//                 )}

//                   <hr className="my-1" />
//                 {currentUser?.isAdmin && (
//                   <MenuItem label="Careers" onClick={() => handleMenuItemClickWithNav("/edit-jobs")} />
//                 )}

//                   {/* {currentUser?.isAdmin  && (
//                   <MenuItem label="All Job Applications" onClick={() => handleMenuItemClickWithNav("/jobapplications")} />
//                 )} */}

 
//                 {/* <MenuItem label="My Job Applications" onClick={() => handleMenuItemClickWithNav("/myjobapplications")} />
//                <hr className="my-1" /> */}
//                 <MenuItem label="Business Proposals" onClick={() => handleMenuItemClickWithNav("/bps")} />      
//                {/* This is the conditional rendering block.
//                   The <MenuItem> will only be rendered if isAuthorized is true. 
//                 */}
//                 {isAuthorizedContracts && (
//                   <MenuItem 
//                     label="Contracts" 
//                     onClick={() => handleMenuItemClickWithNav("/contracts")} 
//                   />
//                 )}
//                  <hr className="my-1" />
//                 <MenuItem
//                   label="Profile Settings"
//                   onClick={() => handleMenuItemClickWithNav(`/user/${currentUser.id}`)}
//                 />
//                 <MenuItem
//                   label="My Member Profile"
//                   onClick={() => handleMenuItemClickWithNav(`/member-profile`)}
//                 />
//                {currentUser?.isAdmin && (
//                   <MenuItem label="All Members" onClick={() => handleMenuItemClickWithNav("/members")} />
//                 )}
//                    <hr className="my-1" />
//                 {currentUser?.isAdmin && (
//                   <MenuItem label="Users" onClick={() => handleMenuItemClickWithNav("/users")} />
//                 )}
//                 {currentUser?.isAdmin && (
//                   // <MenuItem label={`General Enquiries`} onClick={() => handleMenuItemClickWithNav("/enquiries")} />
//                        <div className="relative"> 
//                             <MenuItem label={`General Enquiries`} onClick={() => handleMenuItemClickWithNav("/enquiries")} />
//                            {unreadMessages>0 && <div 
//                              className="absolute top-[-10px] left-[110px] p-2 bg-inherit text-red-400 rounded-full">
//                                 <span className='text-sm '
                             
//                                 >{unreadMessages}</span>
//                             </div>
//                          }
//                       </div>
//                     )}
//                 {currentUser?.isAdmin && (
//                   <MenuItem label="Website Traffic" onClick={() => handleMenuItemClickWithNav("/views")} />
//                 )}
                
//                  {currentUser?.isAdmin && (
//                   <MenuItem label="Tags" onClick={() => handleMenuItemClickWithNav("/tags")} />
//                 )}
             
//                 <MenuItem label="General Media" onClick={() => handleMenuItemClickWithNav("/media")} />
//                 <hr className="my-1" />
//                 <MenuItem label="Logout" onClick={() => signOut()} />
//               </>
//             ) : (
//               <>
//                 {/* Guest User Menu Items */}
//                 <MenuItem label="Login" onClick={loginModal.onOpen} />
//                 <MenuItem label="Sign up" onClick={registerModal.onOpen} />
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default UserMenu;

