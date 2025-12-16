"use client"
import { useCallback, useEffect, useMemo, useState } from "react";
import NavLinks from "./NavLinks";
import UserMenu from "./UserMenu";
import { SafeUser } from "@/app/types";
import Image from "next/image";
import { useInboxCountVarStore } from "@/hooks/use-inbox-count";


interface NavbarProps { 
    currentUser?: SafeUser | null;
    enquiries:any[]
}

const NavBar: React.FC<NavbarProps> = ({ currentUser, enquiries  }) => {
    const [top, setTop] = useState<boolean>(true);
    const [isNavMenuOpen, setIsNavMenuOpen] = useState<boolean>(false);
    const {setUnreadMessages}=useInboxCountVarStore();
    

    const unreadEnquiries = useMemo(() => {
        const x = enquiries.filter(r => !r.isRead).length;
        setUnreadMessages(x)
        return x
    }, [enquiries, setUnreadMessages]);

    useEffect(() => {
        const scrollHandler = () => {
            window.pageYOffset > 10 ? setTop(false) : setTop(true);
        };
        window.addEventListener('scroll', scrollHandler);
        scrollHandler();
        return () => window.removeEventListener('scroll', scrollHandler);
    }, []);

    const handleNavigate = useCallback((href: string) => {
        if (href.startsWith('#')) {
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            } else {
                // Fallback for anchor links if on a different page
                window.location.href = '/' + href; 
            }
        } else {
            window.location.href = href;
        }
        setIsNavMenuOpen(false);
    }, []);

    const toggleNavMenu = useCallback(() => {
        setIsNavMenuOpen((prev) => !prev);
    }, []);

    const closeNavMenu = useCallback(() => {
        setIsNavMenuOpen(false);
    }, []);

    // Hamburger Icon
    const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg className="h-6 w-6 fill-neutral-700" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
          <path fillRule="evenodd" clipRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
        </svg>
    );

    // Close/X Icon
    const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg className="h-6 w-6 fill-neutral-700" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
          <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z" />
        </svg>
    );

    return (
        <nav
            className={`fixed top-0 w-full z-30 transition-all duration-300 ease-in-out ${
                !top ? 'bg-white shadow-lg' : 'bg-transparent'
            }`}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-3 flex items-center justify-between">
                {/* Logo / Brand */}
                <div className="flex items-center">
                    <a
                        href="#hero"
                        onClick={(e) => {
                            e.preventDefault();
                            handleNavigate("#hero");
                        }}
                        className="focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 rounded-md"
                        aria-label="Navigate to home section"
                    >
                        <Image
                            src="/horizon.png"
                            alt="Company Logo"
                            height={48} 
                            width={80} 
                            className="cursor-pointer opacity-100 shadow-md h-10 w-16 md:h-11 md:w-18 lg:h-12 lg:w-20"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/80x48/FBBF24/ffffff?text=LOGO'; }}
                        />
                    </a>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex space-x-4 items-center">
                    <NavLinks onLinkClick={closeNavMenu} currentUser={currentUser} handleNavigate={handleNavigate} />
                    <UserMenu currentUser={currentUser} handleNavigate={handleNavigate} />
                </div>

                {/* Mobile Menu Button and UserMenu on mobile */}
                <div className="flex lg:hidden items-center gap-2">
                    {/* User Menu for mobile (positioned relative to the right edge) */}
                    <UserMenu currentUser={currentUser} handleNavigate={handleNavigate} />

                    {/* Mobile Main Navigation Button */}
                    <button
                        className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 text-neutral-700 hover:text-neutral-900 transition duration-200"
                        onClick={toggleNavMenu}
                        aria-expanded={isNavMenuOpen}
                        aria-controls="mobile-menu"
                        aria-label={isNavMenuOpen ? 'Close main menu' : 'Open main menu'}
                    >
                        {isNavMenuOpen ? (
                            <CloseIcon />
                        ) : (
                            <MenuIcon />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Main Navigation Menu (Full-screen drawer) */}
            <div
                id="mobile-menu"
                className={`fixed top-0 left-0 w-full h-full bg-white z-40 transform transition-transform duration-300 ease-in-out ${
                    isNavMenuOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:hidden overflow-y-auto`}
            >
                <div className="py-4 px-4 sm:px-6">
                    {/* Drawer Header (Logo and Close Button) */}
                    <div className="flex items-center justify-between mb-6 border-b pb-4">
                        <a
                            href="/#hero"
                            onClick={(e) => { e.preventDefault(); handleNavigate("#hero"); closeNavMenu(); }}
                            className="focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 rounded-md"
                            aria-label="Navigate to home section"
                        >
                            <h1 className="font-extrabold text-2xl text-yellow-700">Horizon21</h1>
                        </a>
                        <button
                            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 text-gray-600 hover:text-gray-800 transition duration-200"
                            onClick={toggleNavMenu}
                            aria-label="Close menu"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                    {/* Mobile Nav Links */}
                    <NavLinks onLinkClick={closeNavMenu} currentUser={currentUser} handleNavigate={handleNavigate} />
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
// "use client"
// import { useCallback, useEffect, useMemo, useState } from "react";
// import NavLinks from "./NavLinks";
// import UserMenu from "./UserMenu";
// import { SafeUser } from "@/app/types";
// import Image from "next/image";
// import { useInboxCountVarStore } from "@/hooks/use-inbox-count";


// /**
//  * Props for the main NavBar component.
//  * @property {SafeUser | null} [currentUser] - The currently logged-in user, or null if not authenticated.
//  */
// interface NavbarProps { // Correctly defined here, before its use in NavBar FC
//   currentUser?: SafeUser | null;
//   enquiries:any[]
//  //handleNavigate: (href: string) => void;
// }

 
// const NavBar: React.FC<NavbarProps> = ({ currentUser, enquiries  }) => {
//   const [top, setTop] = useState<boolean>(true);
//   const [isNavMenuOpen, setIsNavMenuOpen] = useState<boolean>(false);
//   const {setUnreadMessages}=useInboxCountVarStore();
    

//   const unreadEnquiries = useMemo(() => {
//       const x = enquiries.filter(r => !r.isRead).length;
//       setUnreadMessages(x)
//       return x
//     }, [enquiries, setUnreadMessages]);

//   useEffect(() => {
//     const scrollHandler = () => {
//       window.pageYOffset > 10 ? setTop(false) : setTop(true);
//     };
//     window.addEventListener('scroll', scrollHandler);
//     scrollHandler();
//     return () => window.removeEventListener('scroll', scrollHandler);
//   }, []);

//   const handleNavigate = useCallback((href: string) => {
//     if (href.startsWith('#')) {
//       const targetId = href.substring(1);
//       const targetElement = document.getElementById(targetId);
//       if (targetElement) {
//         targetElement.scrollIntoView({ behavior: 'smooth' });
//       } else {
//         window.location.href = '/' + href;
//       }
//     } else {
//       window.location.href = href;
//     }
//     setIsNavMenuOpen(false);
//   }, []);

//   const toggleNavMenu = useCallback(() => {
//     setIsNavMenuOpen((prev) => !prev);
//   }, []);

//   const closeNavMenu = useCallback(() => {
//     setIsNavMenuOpen(false);
//   }, []);

//   const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
//       <path fillRule="evenodd" clipRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
//     </svg>
//   );

//   const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
//       <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z" />
//     </svg>
//   );

//   return (
//     <nav
//       className={`fixed top-0 w-full z-30 transition-all duration-300 ease-in-out ${
//         !top ? 'bg-white shadow-md' : 'bg-transparent'
//       }`}
//     >
//       <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-3 flex items-center justify-between">
//         {/* Logo / Brand */}
//         <div className="flex items-center">
//           <a
//             href="#hero"
//             onClick={(e) => {
//               e.preventDefault();
//               handleNavigate("#hero");
//             }}
//             className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-md"
//             aria-label="Navigate to home section"
//           >
//             {/* Replaced h1 with img tag for logo */}
//             <Image
//               src="/horizon.png"
//               alt="Company Logo"
              
//               height={35} // Increased height for better visibility
//               width={55}  // Increased width for better visibility
//               className="cursor-pointer opacity-100 shadow-lg  h-10 w-13 md:h-11 md:w-16 lg:h-12 lg:w-20" // Responsive sizing
//               onError={(e) => { e.currentTarget.src = 'https://placehold.co/60x60/cccccc/ffffff?text=Err'; }} // Fallback on error
//             />
//           </a>
//         </div>

//         {/* Desktop Navigation */}
//         <div className="hidden lg:flex space-x-3 items-center">
//           {/* NavLinks Component for desktop navigation */}
//           <NavLinks onLinkClick={closeNavMenu} currentUser={currentUser} handleNavigate={handleNavigate} />
//           {/* UserMenu Component for desktop */}
//           <UserMenu currentUser={currentUser} handleNavigate={handleNavigate} />
//         </div>

//         {/* Mobile Menu Button and UserMenu on mobile */}
//         <div className="flex lg:hidden items-center gap-2">
//           {/* User Menu for mobile */}
//           <UserMenu currentUser={currentUser} handleNavigate={handleNavigate} />

//           {/* Mobile Main Navigation Button */}
//           <button
//             className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-blue-900 hover:text-blue-700 transition duration-200"
//             onClick={toggleNavMenu}
//             aria-expanded={isNavMenuOpen}
//             aria-controls="mobile-menu"
//             aria-label={isNavMenuOpen ? 'Close main menu' : 'Open main menu'}
//           >
//             {isNavMenuOpen ? (
//               <CloseIcon />
//             ) : (
//               <MenuIcon />
//             )}
//           </button>
//         </div>
//       </div>

//       {/* Mobile Main Navigation Menu (Full-screen drawer) */}
//       <div
//         id="mobile-menu"
//         className={`fixed top-0 left-0 w-full h-full bg-white z-40 transform transition-transform duration-300 ease-in-out ${
//           isNavMenuOpen ? 'translate-x-0' : '-translate-x-full'
//         } lg:hidden overflow-y-auto`}
//       >
//         <div className="py-3 px-4 sm:px-4">
//           <div className="flex items-center justify-between mb-4">
//             <a
//               href="/#hero"
//               onClick={(e) => { e.preventDefault(); handleNavigate("#hero"); }}
//               className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-md"
//               aria-label="Navigate to home section"
//             >
//               <h1 className="font-extrabold text-2xl text-yellow-900">Horizon21</h1>
//             </a>
//             <button
//               className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-gray-600 hover:text-gray-800 transition duration-200"
//               onClick={toggleNavMenu}
//               aria-label="Close menu"
//             >
//               <CloseIcon />
//             </button>
//           </div>
//           <NavLinks onLinkClick={closeNavMenu} currentUser={currentUser} handleNavigate={handleNavigate} />
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default NavBar;
