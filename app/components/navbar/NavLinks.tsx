'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { SafeUser } from '@/app/types';
import useIsMobile from '@/app/hooks/isMobile';
import useLoginModal from '@/app/hooks/useLoginModal';
import useRegisterModal from '@/app/hooks/useRegisterModal';
import UserMenu from './UserMenu';
import { signOut } from "next-auth/react";

interface NavLinksProps {
  onLinkClick?: () => void;
  currentUser?: SafeUser | null;
}

const NavLinks: React.FC<NavLinksProps> = ({ currentUser, onLinkClick }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isHovering, setIsHovering] = useState('');
  const [isUserMenuOpenMobile, setIsUserMenuOpenMobile] = useState(false);
  const loginModal = useLoginModal();
  const registerModal = useRegisterModal();

  const handleNavigate = (href: string) => {
    if (href.startsWith('#')) {
      if (pathname === '/') {
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        router.push('/' + href);
      }
    } else {
      router.push(href);
    }
    onLinkClick?.();
    setIsHovering('');
  };

  const gold = 'text-yellow-600';
  const goldAccent = 'bg-yellow-200';
  const darkGoldHover = 'hover:text-yellow-800';
  const subtleShadow = 'shadow-sm hover:shadow-md';
  const hoverUnderline = 'group relative after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-[1.5px] after:bg-yellow-600 after:scale-x-0 after:transition-transform after:duration-250 hover:after:scale-x-100';
  const linkPadding = 'px-3 py-2 rounded-md';
  const mobileLinkStyle = 'block w-full py-2 text-left px-4 hover:bg-gray-100';
  const mobileUserMenuWrapper = 'relative z-50';

  const toggleMobileUserMenu = useCallback(() => {
    setIsUserMenuOpenMobile((prev) => !prev);
  }, []);

  const closeMobileUserMenu = useCallback(() => {
    setIsUserMenuOpenMobile(false);
  }, []);

  return (
    <>
      <div className={`flex ${isMobile ? 'flex-col items-start' : 'flex-row items-center'} gap-1 ${isMobile ? 'py-1' : 'py-1'}`}>
        <Link
          href="#about"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("#about");
          }}
          onMouseEnter={() => setIsHovering('about')}
          onMouseLeave={() => setIsHovering('')}
          className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${isMobile ? mobileLinkStyle : ''} ${isHovering === 'about' ? goldAccent : ''}`}
        >
          About
        </Link>
        <Link
          href="#services"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("#services");
          }}
          onMouseEnter={() => setIsHovering('services')}
          onMouseLeave={() => setIsHovering('')}
          className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${isMobile ? mobileLinkStyle : ''} ${isHovering === 'services' ? goldAccent : ''}`}
        >
          Services
        </Link>
        <Link
          href="#portfolio"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("#portfolio");
          }}
          onMouseEnter={() => setIsHovering('portfolio')}
          onMouseLeave={() => setIsHovering('')}
          className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${isMobile ? mobileLinkStyle : ''} ${isHovering === 'portfolio' ? goldAccent : ''}`}
        >
          Portfolio
        </Link>
        <Link
          href="#investments"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("#investments");
          }}
          onMouseEnter={() => setIsHovering('investments')}
          onMouseLeave={() => setIsHovering('')}
          className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${isMobile ? mobileLinkStyle : ''} ${isHovering === 'investments' ? goldAccent : ''}`}
        >
          Investments
        </Link>
        <Link
          href="#careers"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("#careers");
          }}
          onMouseEnter={() => setIsHovering('careers')}
          onMouseLeave={() => setIsHovering('')}
          className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${isMobile ? mobileLinkStyle : ''} ${isHovering === 'careers' ? goldAccent : ''}`}
        >
          Career
        </Link>
        <Link
          href="/contact#contact"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("/contact#contact");
          }}
          onMouseEnter={() => setIsHovering('contact')}
          onMouseLeave={() => setIsHovering('')}
          className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${isMobile ? mobileLinkStyle : ''} ${isHovering === 'contact' ? goldAccent : ''}`}
        >
          Contact Us
        </Link>
        <Link
          href="/demo#demo"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("/demo#demo");
          }}
          onMouseEnter={() => setIsHovering('demo')}
          onMouseLeave={() => setIsHovering('')}
          className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${isMobile ? mobileLinkStyle : ''} ${isHovering === 'demo' ? goldAccent : ''}`}
        >
          Products Demo
        </Link>

        {!isMobile && <UserMenu
          currentUser={currentUser}
          isOpen={isUserMenuOpenMobile}
          onClose={closeMobileUserMenu}
          onOpenToggle={toggleMobileUserMenu}
        />}

        {isMobile &&
          <>
            {currentUser ? (
              <div className='z-50 overflow-y-auto max-h-screen w-full'>
                <button onClick={() => { signOut(); }}
                  onMouseEnter={() => setIsHovering('logout')}
                  onMouseLeave={() => setIsHovering('')}
                  className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${mobileLinkStyle} ${isHovering === 'logout' ? goldAccent : ''}`}
                >
                  Logout
                </button>
                <hr />

                <Link
                  href="/myprojects"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate("/myprojects");
                  }}
                  onMouseEnter={() => setIsHovering('myprojects')}
                  onMouseLeave={() => setIsHovering('')}
                  className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${mobileLinkStyle} ${isHovering === 'myprojects' ? goldAccent : ''}`}
                >
                  My projects
                </Link>

                <Link
                  href="/financing"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate("/financing");
                  }}
                  onMouseEnter={() => setIsHovering('financing')}
                  onMouseLeave={() => setIsHovering('')}
                  className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${mobileLinkStyle} ${isHovering === 'financing' ? goldAccent : ''}`}
                >
                  Financing
                </Link>

                <hr />

                {currentUser?.isAdmin && (
                  <Link
                    href="/enquiries"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/enquiries");
                    }}
                    onMouseEnter={() => setIsHovering('enquiries')}
                    onMouseLeave={() => setIsHovering('')}
                    className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${mobileLinkStyle} ${isHovering === 'enquiries' ? goldAccent : ''}`}
                  >
                    Enquiries
                  </Link>
                )}

                {currentUser?.isAdmin && (
                  <Link
                    href="/productenquiries"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/productenquiries");
                    }}
                    onMouseEnter={() => setIsHovering('productenquiries')}
                    onMouseLeave={() => setIsHovering('')}
                    className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${mobileLinkStyle} ${isHovering === 'productenquiries' ? goldAccent : ''}`}
                  >
                    Product Enquiries
                  </Link>
                )}

                {currentUser?.isAdmin && (
                  <Link
                    href="/edit-investments"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/edit-investments");
                    }}
                    onMouseEnter={() => setIsHovering('edit-investments')}
                    onMouseLeave={() => setIsHovering('')}
                    className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${mobileLinkStyle} ${isHovering === 'edit-investments' ? goldAccent : ''}`}
                  >
                    Manage Portfolios
                  </Link>
                )}

                {currentUser?.isAdmin && (
                  <Link
                    href="/boards-list"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/boards-list");
                    }}
                    onMouseEnter={() => setIsHovering('boardbroadcast')}
                    onMouseLeave={() => setIsHovering('')}
                    className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${mobileLinkStyle} ${isHovering === 'boardbroadcast' ? goldAccent : ''}`}
                  >
                    Broadcast Boards
                  </Link>
                )}
                {currentUser?.isAdmin && (
                  <Link
                    href="/tags"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/tags");
                    }}
                    onMouseEnter={() => setIsHovering('tags')}
                    onMouseLeave={() => setIsHovering('')}
                    className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${mobileLinkStyle} ${isHovering === 'tags' ? goldAccent : ''}`}
                  >
                    General Tags
                  </Link>
                )}

                {currentUser && (
                  <Link
                    href={`/user/${currentUser.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate(`/user/${currentUser.id}`);
                    }}
                    onMouseEnter={() => setIsHovering('user')}
                    onMouseLeave={() => setIsHovering('')}
                    className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${mobileLinkStyle} ${isHovering === 'user' ? goldAccent : ''}`}
                  >
                    Profile Settings
                  </Link>
                )}

                <Link
                  href="/projects"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate("/projects");
                  }}
                  onMouseEnter={() => setIsHovering('allprojects')}
                  onMouseLeave={() => setIsHovering('')}
                  className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${mobileLinkStyle} ${isHovering === 'allprojects' ? goldAccent : ''}`}
                >
                  All projects
                </Link>

                {currentUser?.isAdmin && (
                  <Link
                    href="/users"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/users");
                    }}
                    onMouseEnter={() => setIsHovering('users')}
                    onMouseLeave={() => setIsHovering('')}
                    className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${mobileLinkStyle} ${isHovering === 'users' ? goldAccent : ''}`}
                  >
                    Users
                  </Link>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => { loginModal.onOpen(); }}
                  onMouseEnter={() => setIsHovering('login')}
                  onMouseLeave={() => setIsHovering('')}
                  className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${isMobile ? mobileLinkStyle : ''} ${isHovering === 'login' ? goldAccent : ''}`}
                >
                  Login
                </button>
                <button onClick={() => { registerModal.onOpen(); }}
                  onMouseEnter={() => setIsHovering('signup')}
                  onMouseLeave={() => setIsHovering('')}
                  className={`group font-medium ${gold} ${darkGoldHover} ${hoverUnderline} ${subtleShadow} ${linkPadding} ${isMobile ? mobileLinkStyle : ''} ${isHovering === 'signup' ? goldAccent : ''}`}
                >
                  Sign up
                </button>
              </>
            )}
          </>
        }
      </div>
    </>
  );
};

export default NavLinks;