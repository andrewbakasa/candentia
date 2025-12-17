'use client';
import useLoginModal from '@/app/hooks/useLoginModal';
import useRegisterModal from '@/app/hooks/useRegisterModal';
import { signOut } from 'next-auth/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar } from './Avatar';
import { MenuItem } from './MenuItem';
import { useInboxCountVarStore } from '@/hooks/use-inbox-count';
import { SafeUser } from '@/app/types';

// --- Icon Definitions ---
const Icon = (d: string, extraClasses = "") => (
    <svg className={`h-4 w-4 mr-2 ${extraClasses}`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d={d} />
    </svg>
);

const UserIcon = () => Icon("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 14.9c-2.67 0-5.48-1.33-6.49-3.41C6.73 14.59 9.13 14 12 14s5.27.59 6.49 2.49c-1.01 2.08-3.82 3.41-6.49 3.41z");
const SettingsIcon = () => Icon("M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.38-1.08-.73-1.69-1l-.38-2.65c-.03-.23-.23-.41-.46-.41h-4c-.23 0-.43.18-.46.41l-.38 2.65c-.61.27-1.17.62-1.69 1l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.12.22-.07.49.12.64l2.11 1.65c-.04.32-.07.64-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.38 1.08.73 1.69 1l.38 2.65c.03.23.23.41.46.41h4c.23 0 .43-.18.46-.41l.38-2.65c.61-.27 1.17-.62 1.69-1l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z");
const BriefcaseIcon = () => Icon("M20 6h-3V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5-2v2H9V4h6zm7 14H4V8h16v10z");
const MailIcon = (unread: number) => Icon("M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z", unread > 0 ? "text-red-500" : "text-gray-600");
const SignOutIcon = () => Icon("M13.5 4.5l-2.6 2.5 1.4 1.4 3-3-3-3-1.4 1.4 2.6 2.5zM17 12V4H7v8H2l10 10 10-10h-5zm-5 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z");

// --- Component Props ---
interface UserMenuProps {
    currentUser?: SafeUser | null;
    handleNavigate: (href: string) => void;
}


const UserMenu: React.FC<UserMenuProps> = ({ currentUser, handleNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const loginModal = useLoginModal();
    const registerModal = useRegisterModal();
    const { unreadMessages } = useInboxCountVarStore();

    // Authorization logic remains the same
    const allowedRolesContracts = ['admin', 'executive'];
    const allowedDefectElimantion = ['admin', 'executive', 'manager', 'engineer'];

    const isAuthorizedContracts = currentUser?.isAdmin || 
        currentUser?.roles?.some(role => allowedRolesContracts.includes(role.toLowerCase()));

    const isAuthorizedDefectElimination = currentUser?.isAdmin || 
        currentUser?.roles?.some(role => allowedDefectElimantion.includes(role.toLowerCase()));

    // Handle click outside
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

    const handleMenuItemClickWithNav = useCallback((path: string) => {
        handleNavigate(path); 
        setIsOpen(false); 
    }, [handleNavigate]);

    // Inline SVG for Menu Icon (Hamburger)
    const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg className="h-6 w-6 fill-neutral-700" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
          <path fillRule="evenodd" clipRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
        </svg>
    );

    return (
        <div className="relative" ref={menuRef}>
            <div className="flex flex-row items-center gap-3">
                {/* User email / Welcome message (Desktop only, improved styling) */}
                {currentUser && (
                    <div className="hidden md:block text-sm font-medium py-2 px-4 rounded-full transition cursor-default text-gray-700 bg-neutral-100 hover:bg-neutral-200">
                        {currentUser.email?.split('@')[0] || 'User'}
                    </div>
                )}

                {/* User Menu Toggle Button (Avatar and Menu Icon) */}
                <button
                    onClick={toggleOpen}
                    className="
                        p-1 md:py-1 md:px-2 border-[1px] border-neutral-300 
                        flex flex-row items-center gap-2 rounded-full cursor-pointer 
                        hover:shadow-lg transition bg-white
                    "
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    aria-label="User menu toggle"
                >
                    <MenuIcon className="h-5 w-5" /> 
                    <Avatar 
                        classList="h-8 w-8 md:h-9 md:w-9" 
                        src={currentUser?.image || 'https://placehold.co/40x40/4F46E5/FFFFFF?text=U'} 
                    />
                </button>
            </div>

            {/* User Menu Dropdown Content - FIXES APPLIED HERE */}
            {isOpen && (
                <div
                    className="
                        absolute rounded-xl shadow-2xl min-w-[280px] w-auto 
                        bg-white right-0 top-12 text-sm z-50
                        
                        /* --- FIX: ADDED SCROLLING AND MAX HEIGHT --- */
                        max-h-[80vh] overflow-y-auto 
                    "
                >
                    <div className="flex flex-col cursor-pointer divide-y divide-neutral-100">
                        {currentUser ? (
                            <>
                                {/* --- GROUP 1: USER ACCOUNT --- */}
                                <div className="p-1">
                                    <MenuItem
                                        icon={<UserIcon />}
                                        label="Profile Settings"
                                        onClick={() => handleMenuItemClickWithNav(`/user/${currentUser.id}`)}
                                    />
                                    <MenuItem
                                        icon={<SettingsIcon />}
                                        label="My Member Profile"
                                        onClick={() => handleMenuItemClickWithNav(`/member-profile`)}
                                    />
                                </div>
                                <hr className="my-1 border-neutral-200" />
                                
                                {/* --- GROUP 2: CORE CONTENT & OPERATION LINKS --- */}
                                <div className="p-1">
                                    <MenuItem
                                        icon={BriefcaseIcon()}
                                        label="All Content"
                                        onClick={() => handleMenuItemClickWithNav(`/contents`)}
                                    />
                                    {isAuthorizedDefectElimination && (
                                        <MenuItem 
                                            icon={Icon("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2z")}
                                            label="Defect Elimination" 
                                            onClick={() => handleMenuItemClickWithNav("/de")} 
                                        />
                                    )}
                                    {isAuthorizedContracts && (
                                        <MenuItem 
                                            icon={Icon("M20 6h-3V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5-2v2H9V4h6zM4 18V8h16v10H4z")}
                                            label="Contracts" 
                                            onClick={() => handleMenuItemClickWithNav("/contracts")} 
                                        />
                                    )}
                                    {isAuthorizedContracts && (
                                        <MenuItem 
                                            icon={Icon("M12 3L2 12h3v8h14v-8h3L12 3zm0 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z")}
                                            label="Strategic Outputs" 
                                            onClick={() => handleMenuItemClickWithNav("/outputs")} 
                                        />
                                    )}
                                </div>
                                
                                {/* --- GROUP 3: ADMINISTRATION LINKS (Admin/Role-Specific) --- */}
                                {(currentUser?.isAdmin || isAuthorizedContracts) && (
                                    <>
                                        <hr className="my-1 border-neutral-200" />
                                        <div className="p-1">
                                            {/* Changed text style to be a bit less aggressive */}
                                            <div className="px-3 py-1 text-xs font-semibold text-yellow-700 uppercase">Administration</div> 
                                            
                                            {currentUser?.isAdmin && (
                                                <MenuItem 
                                                    icon={Icon("M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z")}
                                                    label="Broadcast Content" 
                                                    onClick={() => handleMenuItemClickWithNav("/boards-list")} 
                                                />
                                            )}
                                            {currentUser?.isAdmin && (
                                                <MenuItem 
                                                    icon={Icon("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 17c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z")}
                                                    label="Users & Accounts" 
                                                    onClick={() => handleMenuItemClickWithNav("/users")} 
                                                />
                                            )}
                                            {currentUser?.isAdmin && (
                                                <MenuItem 
                                                    icon={Icon("M14 15.48c-1.47 1.25-3.32 2.02-5.38 2.37-2.31.39-4.8-.46-6.19-2.03-1.57-1.78-.96-4.22 1.41-5.63 2.15-1.28 4.75-1.53 7.02-.75 2.1.72 4.02 2.14 5.3 3.86.38.53.84 1.15 1.32 1.76l-1.3 1.3c-.45-.45-.96-.87-1.46-1.24z")}
                                                    label="All Members" 
                                                    onClick={() => handleMenuItemClickWithNav("/members")} 
                                                />
                                            )}

                                            {/* Inquiries with Badge */}
                                            {currentUser?.isAdmin && (
                                                <div className="relative"> 
                                                    <MenuItem 
                                                        icon={MailIcon(unreadMessages)}
                                                        label={`General Enquiries`} 
                                                        onClick={() => handleMenuItemClickWithNav("/enquiries")} 
                                                    />
                                                    {unreadMessages > 0 && 
                                                        <div className="absolute top-2 right-4 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                                                            <span className='text-xs text-white font-semibold'>{unreadMessages}</span>
                                                        </div>
                                                    }
                                                </div>
                                            )}
                                            {currentUser?.isAdmin && (
                                                <MenuItem 
                                                    icon={Icon("M12 4.5l-1.5 1.5 4 4h-13v2h13l-4 4 1.5 1.5L18 12l-5-7.5z")}
                                                    label="Website Traffic" 
                                                    onClick={() => handleMenuItemClickWithNav("/views")} 
                                                />
                                            )}

                                            {currentUser?.isAdmin && (
                                                <MenuItem 
                                                    icon={Icon("M12 22c5.52 0 10-4.48 10-10s-4.48-10-10-10-10 4.48-10 10 4.48 10 10 10zm-2-14H8v4h2v-4zm4 0h-2v4h2v-4z")}
                                                    label="Tags & Media" 
                                                    onClick={() => handleMenuItemClickWithNav("/tags")} 
                                                />
                                            )}

                                            {isAuthorizedContracts && (
                                                <MenuItem 
                                                    icon={Icon("M17 14.5l-5-5-5 5H17zM17 17.5l-5-5-5 5H17z")}
                                                    label="Accounts Recievable" 
                                                    onClick={() => handleMenuItemClickWithNav("/ar")} 
                                                />
                                            )}
                                            {isAuthorizedContracts && (<MenuItem icon={BriefcaseIcon()} label="Business Proposals" onClick={() => handleMenuItemClickWithNav("/bps")} />)} 
                                            {isAuthorizedContracts && (<MenuItem icon={Icon("M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z")} label="Strategies" onClick={() => handleMenuItemClickWithNav("/strategies")} />)} 
                                        </div>
                                    </>
                                )}
                                
                                {/* --- GROUP 4: LOGOUT --- */}
                                <hr className="my-1 border-neutral-200" />
                                <div className="p-1">
                                    <MenuItem 
                                        icon={SignOutIcon()}
                                        label="Logout" 
                                        onClick={() => signOut()} 
                                        extraClasses="text-red-600 hover:bg-red-50"
                                    />
                                </div>
                            </>
                        ) : (
                            // Guest User Menu Items
                            <div className="p-1">
                                <MenuItem label="Login" onClick={loginModal.onOpen} />
                                <MenuItem label="Sign up" onClick={registerModal.onOpen} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;