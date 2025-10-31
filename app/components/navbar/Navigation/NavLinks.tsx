'use client';
import React, { useCallback } from 'react';

/**
 * Simplified SafeUser type for demonstration purposes.
 * In a real application, this would be imported from your project's types.
 */
interface SafeUser {
  id: string;
  email?: string | null;
  isAdmin?: boolean;
  image?: string | null;
}

/**
 * Props for the NavLinks component.
 * @property {() => void} onLinkClick - Callback to close any parent menu (e.g., mobile drawer) after a link is clicked.
 * @property {SafeUser | null} [currentUser] - The currently logged-in user, or null if not authenticated.
 * @property {(href: string) => void} handleNavigate - A function from the parent to handle navigation.
 */
interface NavLinksProps {
  onLinkClick: () => void;
  currentUser?: SafeUser | null;
  handleNavigate: (href: string) => void;
}

/**
 * NavLinks component.
 * Renders the primary navigation links for the application.
 * Adjusts active state based on the current window location.
 */
const NavLinks: React.FC<NavLinksProps> = ({ onLinkClick, currentUser, handleNavigate }) => {
  // Tailwind CSS classes for consistent styling
  const gold = 'text-yellow-600';
  const darkGoldHover = 'hover:text-yellow-800';
  const subtleShadow = 'shadow-sm hover:shadow-md';
  const hoverUnderline = 'group relative after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-[1.5px] after:bg-yellow-600 after:scale-x-0 after:transition-transform after:duration-250 hover:after:scale-x-100';
  const activeUnderline = 'group relative after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-[1.5px] after:bg-yellow-600 after:scale-x-100';
  const linkPadding = 'px-3 py-2 rounded-md';
  // const mobileLinkStyle = 'block w-full py-3 text-left px-4 hover:bg-gray-100'; // Kept for reference but not used below

  // Function to determine if a link is active for styling (using window.location for standalone)
  const isActive = useCallback((href: string) => {
    if (href.startsWith('#')) {
      // For anchor links on the homepage, check both current path and hash
      // We check for '/' as the base path when scrolling to anchors
      return window.location.pathname === '/' && window.location.hash === href;
    }
    // For other paths, direct comparison
    return window.location.pathname === href;
  }, []);

  // Generic link click handler that also triggers the parent's onLinkClick
  const onNavLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault(); // Prevent default link behavior
    handleNavigate(href); // Use the passed handleNavigate for actual navigation
    onLinkClick(); // Call parent callback to close menu
  }, [handleNavigate, onLinkClick]);

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-1">
      
      {/* 1. Vision Link (Replaced #about) */}
      <a
        href="#our-vision"
        onClick={(e) => onNavLinkClick(e, "#our-vision")}
        className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#our-vision') || isActive('/') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
      >
        Vision
      </a>

      {/* 2. Services Link (Replaced #portfolio) */}
      <a
        href="#our-services"
        onClick={(e) => onNavLinkClick(e, "#our-services")}
        className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#our-services') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
      >
        Services
      </a>

      {/* 3. Team Link (Replaced #investments) */}
      <a
        href="#our-team"
        onClick={(e) => onNavLinkClick(e, "#our-team")}
        className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#our-team') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
      >
        Team
      </a>

      {/* 4. Future Link (NEW) */}
      <a
        href="#future-outlook"
        onClick={(e) => onNavLinkClick(e, "#future-outlook")}
        className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#future-outlook') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
      >
        Future
      </a>

      {/* Careers Link (Kept as is) */}
      {/* <a
        href="#careers"
        onClick={(e) => onNavLinkClick(e, "#careers")}
        className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#careers') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
      >
        Careers
      </a> */}
    
      {/* Join as Member Link (Kept as is) */}
      <a
        href="/membership#membership"
        onClick={(e) => onNavLinkClick(e, "/membership#membership")}
        className={`group font-medium ${gold} ${darkGoldHover} ${isActive('/membership#membership') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
      >
        Join as Member
      </a>

      {/* Contact Us Link (Kept as is) */}
      <a
        href="/contact#contact"
        onClick={(e) => onNavLinkClick(e, "/contact#contact")}
        className={`group font-medium ${gold} ${darkGoldHover} ${isActive('/contact#contact') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
      >
        Contact Us
      </a>
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
//   const mobileLinkStyle = 'block w-full py-3 text-left px-4 hover:bg-gray-100'; // Increased padding for mobile touch targets

//   // Function to determine if a link is active for styling (using window.location for standalone)
//   const isActive = useCallback((href: string) => {
//     if (href.startsWith('#')) {
//       // For anchor links on the homepage, check both current path and hash
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
//       {/* About Link */}
//       <a
//         href="#about"
//         onClick={(e) => onNavLinkClick(e, "#about")}
//         className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#about') || isActive('/') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//       >
//         About
//       </a>

//       {/* Learn Link (doesnt - requires login) */}
      
//         <a
//           href="#portfolio"
//           onClick={(e) => onNavLinkClick(e, "#portfolio")}
//           className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#portfolio') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//         >
//           Portfolio
//         </a>

    
//         <a
//           href="#investments"
//           onClick={(e) => onNavLinkClick(e, "#investments")}
//           className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#investments') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//         >
//           Investments
//         </a>
      

     
//         <a
//           href="#careers"
//           onClick={(e) => onNavLinkClick(e, "#careers")}
//           className={`group font-medium ${gold} ${darkGoldHover} ${isActive('#careers') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//         >
//           Careers
//         </a>
    


 
//         <a
//           href="/membership#membership"
//           onClick={(e) => onNavLinkClick(e, "/membership#membership")}
//           className={`group font-medium ${gold} ${darkGoldHover} ${isActive('/membership#membership') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//         >
//           Join as Member
//         </a>


//       {/* Contact Us Link */}
//       <a
//         href="/contact#contact"
//         onClick={(e) => onNavLinkClick(e, "/contact#contact")}
//         className={`group font-medium ${gold} ${darkGoldHover} ${isActive('/contact#contact') ? activeUnderline : hoverUnderline} ${subtleShadow} ${linkPadding} lg:block`}
//       >
//         Contact Us
//       </a>
//     </div>
//   );
// };

// export default NavLinks;
