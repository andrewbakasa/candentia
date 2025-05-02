'use client';
import React, { useState, useEffect } from 'react';
import NavLinks from './NavLinks';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import { SafeUser } from '@/app/types';


interface NavbarProps {
  currentUser?: SafeUser | null;
}

const NavBar: React.FC<NavbarProps> = ({
  currentUser,
  }) => {
  const [top, setTop] = useState<boolean>(!window.scrollY);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This useEffect will run whenever currentUser changes
    //console.log('currentUser updated in Navbar2:', currentUser);
    // You can add any logic here that needs to run when currentUser updates
  }, [currentUser]);

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
    
  };
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = () => {
    setIsOpen(false); // Close the mobile menu after a link is clicked
  };

  useEffect(() => {
    const scrollHandler = () => {
      window.pageYOffset > 10 ? setTop(false) : setTop(true);
    };
    window.addEventListener('scroll', scrollHandler);
    return () => window.removeEventListener('scroll', scrollHandler);
  }, [top]);

  return (
    <nav
      className={`fixed top-0 w-full z-30 transition duration-300 ease-in-out ${
        !top ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-3 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center">
          <Link href="#hero" onClick={(e) => { e.preventDefault(); handleNavigate("#hero"); }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
          <h1 className="font-extrabold text-2xl md:text-3xl text-yellow-900 hover:text-yellow-700 transition duration-200">
            Candentia
          </h1>
          </Link>
       
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <button
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-blue-900 hover:text-blue-700 transition duration-200"
            onClick={handleClick}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isOpen ? (
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex space-x-3">
          <NavLinks onLinkClick={handleLinkClick} currentUser={currentUser} />
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 w-full h-full bg-white z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:hidden`}
      >
        <div className="py-6 px-4 sm:px-6">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/#hero" scroll={false} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
              <h1 className="font-extrabold text-2xl text-yellow-900">Candentia</h1>
            </Link>
            <button
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-gray-600 hover:text-gray-800 transition duration-200"
              onClick={handleClick}
              aria-expanded={isOpen}
              aria-label="Close menu"
            >
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                />
              </svg>
            </button>
          </div>
          {/* Mobile Menu Links */}         
          <div className="flex flex-col space-y-4 sm:space-y-1 ">
            <NavLinks onLinkClick={handleLinkClick} currentUser={currentUser} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;