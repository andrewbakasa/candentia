'use client';
import React, { useCallback } from 'react';

// Simplified SafeUser type for demonstration purposes.
interface SafeUser {
    id: string;
    email?: string | null;
    isAdmin?: boolean;
    image?: string | null;
}

interface NavLinksProps {
    onLinkClick: () => void;
    currentUser?: SafeUser | null;
    handleNavigate: (href: string) => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ onLinkClick, currentUser, handleNavigate }) => {
    // Consolidated and cleaner Tailwind CSS classes
    const textPrimary = 'text-yellow-700';
    const hoverEffect = 'hover:text-yellow-900 transition duration-300';
    const underlineBase = 'relative after:absolute after:bottom-[-6px] after:left-1/2 after:w-0 after:h-[2px] after:bg-yellow-600 after:transition-all after:duration-300 after:ease-in-out';
    const hoverUnderline = `${underlineBase} hover:after:w-full hover:after:left-0`;
    const activeUnderline = `${underlineBase} after:w-full after:left-0`;
    const linkStyle = `font-semibold ${textPrimary} ${hoverEffect} py-2 px-3 rounded-md`;


    const isActive = useCallback((href: string) => {
        if (href.startsWith('#')) {
            // Check if on the home page and hash matches
            return window.location.pathname === '/' && (window.location.hash === href || (href === '#our-vision' && window.location.hash === ''));
        }
        return window.location.pathname === href;
    }, []);

    const onNavLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        handleNavigate(href);
        onLinkClick();
    }, [handleNavigate, onLinkClick]);

    const renderLink = (href: string, label: string) => {
        const active = isActive(href);
        const underlineClass = active ? activeUnderline : hoverUnderline;
        
        return (
            <a
                href={href}
                onClick={(e) => onNavLinkClick(e, href)}
                className={`${linkStyle} ${underlineClass}`}
            >
                {label}
            </a>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-1 lg:gap-3">
            
            {renderLink("#our-vision", "Vision")}
            {renderLink("#our-services", "Services")}
            {renderLink("#our-team", "Team")}
            {renderLink("#future-outlook", "Future")}
            {renderLink("#why-partner-with-us", "Why Partner")}
            {renderLink("/membership#membership", "Membership")}
            
            {/* Contact Us Link: Often better as a primary button on the NavBar */}
            {/* <a
                href="/contact#contact"
                onClick={(e) => onNavLinkClick(e, "/contact#contact")}
                className="lg:ml-4 bg-yellow-600 text-white font-semibold py-2 px-4 rounded-full hover:bg-yellow-700 transition duration-300"
            >
                Contact Us
            </a> */}
        </div>
    );
};

export default NavLinks;
// 'use client';
// import React, { useCallback } from 'react';

// /**
//  * Simplified SafeUser type for demonstration purposes.
//  * In a real application, this would be imported from your project's types.
//  */
// interface SafeUser {
//   id: string;
//   email?: string | null;
//   isAdmin?: boolean;
//   image?: string | null;
// }

// /**
//  * Props for the NavLinks component.
//  * @property {() => void} onLinkClick - Callback to close any parent menu (e.g., mobile drawer) after a link is clicked.
//  * @property {SafeUser | null} [currentUser] - The currently logged-in user, or null if not authenticated.
//  * @property {(href: string) => void} handleNavigate - A function from the parent to handle navigation.
//  */
// interface NavLinksProps {
//   onLinkClick: () => void;
//   currentUser?: SafeUser | null;
//   handleNavigate: (href: string) => void;
// }

// /**
//  * NavLinks component.
//  * Renders the primary navigation links for the application.
//  * Adjusts active state based on the current window location.
//  */
// const NavLinks: React.FC<NavLinksProps> = ({ onLinkClick, currentUser, handleNavigate }) => {
//   // Tailwind CSS classes for consistent styling
//   const gold = 'text-yellow-600';
//   const darkGoldHover = 'hover:text-yellow-800';
//   const subtleShadow = 'shadow-sm hover:shadow-md';
//   const hoverUnderline = 'group relative after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-[1.5px] after:bg-yellow-600 after:scale-x-0 after:transition-transform after:duration-250 hover:after:scale-x-100';
//   const activeUnderline = 'group relative after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-[1.5px] after:bg-yellow-600 after:scale-x-100';
//   const linkPadding = 'px-3 py-2 rounded-md';
//   // const mobileLinkStyle = 'block w-full py-3 text-left px-4 hover:bg-gray-100'; // Kept for reference but not used below

//   // Function to determine if a link is active for styling (using window.location for standalone)
//   const isActive = useCallback((href: string) => {
//     if (href.startsWith('#')) {
//       // For anchor links on the homepage, check both current path and hash
//       // We check for '/' as the base path when scrolling to anchors
//       return window.location.pathname === '/' && window.location.hash === href;
//     }
//     // For other paths, direct comparison
//     return window.location.pathname === href;
//   }, []);

//   // Generic link click handler that also triggers the parent's onLinkClick
//   const onNavLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
//     e.preventDefault(); // Prevent default link behavior
//     handleNavigate(href); // Use the passed handleNavigate for actual navigation
//     onLinkClick(); // Call parent callback to close menu
//   }, [handleNavigate, onLinkClick]);

//   return (
//     <div className="flex flex-col lg:flex-row items-start lg:items-center gap-1">
      
//       {/* 1. Vision Link (Replaced #about) */}
//       <a
//         href="#our-vision"
//         onClick={(e) => onNavLinkClick(e, "#our-vision")}
//         className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#our-vision') || isActive('/') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//       >
//         Vision
//       </a>

//       {/* 2. Services Link (Replaced #portfolio) */}
//       <a
//         href="#our-services"
//         onClick={(e) => onNavLinkClick(e, "#our-services")}
//         className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#our-services') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//       >
//         Services
//       </a>

//       {/* 3. Team Link (Replaced #investments) */}
//       <a
//         href="#our-team"
//         onClick={(e) => onNavLinkClick(e, "#our-team")}
//         className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#our-team') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//       >
//         Team
//       </a>

//       {/* 4. Future Link (NEW) */}
//       <a
//         href="#future-outlook"
//         onClick={(e) => onNavLinkClick(e, "#future-outlook")}
//         className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#future-outlook') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//       >
//         Future
//       </a>
//   <a
//         href="#why-partner-with-us"
//         onClick={(e) => onNavLinkClick(e, "#why-partner-with-us")}
//         className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#why-partner-with-us') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//       >
//         Why Partner With Us
//       </a>
     
//       <a
//         href="/membership#membership"
//         onClick={(e) => onNavLinkClick(e, "/membership#membership")}
//         className={`group font-medium ${gold} ${darkGoldHover} ${isActive('/membership#membership') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//       >
//         Membership
//       </a>

//       {/* Contact Us Link (Kept as is) */}
//       {/* <a
//         href="/contact#contact"
//         onClick={(e) => onNavLinkClick(e, "/contact#contact")}
//         className={`group font-medium ${gold} ${darkGoldHover} ${isActive('/contact#contact') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//       >
//         Contact Us
//       </a> */}
//     </div>
//   );
// };

// export default NavLinks;