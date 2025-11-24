'use client';
import { useCallback, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SafeUser } from "../types";
import Heading from "../components/Heading";
import Search from "../components/Search";
import Container from "../components/Container";
import Link from "next/link";
import { Hint } from "../components/hint";
import { User, Shield, UserCog, ChevronLeft, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { useWindowSize } from "@/hooks/use-screenWidth";
import Avatar from "@/app/components/Avatar";
import { cn } from "@/lib/utils";
import { updatePagSize } from "@/actions/update-user-pagesize";
import { useAction } from "@/hooks/use-action";
import { toast } from "sonner";

// NOTE: Added Pagination component for better separation and cleaner main render
interface UsersClientProps {
  users: SafeUser[],
  currentUser?: SafeUser | null,
}

// --- Pagination Constants ---
const DEFAULT_PAGE_SIZE = 12;
type PageSizeOption = '4' | '8' | '12' | '16' | '24';
const INDIGO_PRIMARY = 'text-indigo-600';
const INDIGO_HOVER_BG = 'hover:bg-indigo-50';
const GRAY_ACCENT = 'text-gray-500';

// --- User Card Component (Unchanged) ---
const UserCard = ({ user, isCurrentUser }: { user: SafeUser, isCurrentUser: boolean }) => {
    const AdminIcon = user.isAdmin ? (
      <Hint description="Admin User" side="top" sideOffset={10}>
        <Shield className="h-5 w-5 text-red-500 fill-red-100" />
      </Hint>
    ) : (
      <Hint description="Standard User" side="top" sideOffset={10}>
          <UserCog className="h-5 w-5 text-gray-400" />
      </Hint>
    );

    return (
      <Link
        key={user.id}
        href={`/user/${user.id}`}
        className={cn(
          "flex flex-col p-3 border rounded-xl shadow-sm transition hover:shadow-lg hover:border-blue-500 cursor-pointer bg-white",
          isCurrentUser ? "border-[3px] border-rose-600 bg-rose-50/50" : "border-neutral-200"
        )}
      >
        <div className="flex justify-between items-start mb-2">
            <div className="relative">
                <Avatar classList="border-2 border-neutral-300 h-10 w-10" src={user.image} />
                {isCurrentUser && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-600 ring-2 ring-white" title="This is you"></div>
                )}
            </div>
            {AdminIcon}
        </div>
        <div className="space-y-0.5">
            <p className="text-base font-semibold text-neutral-800 truncate">
                {user.name}
            </p>
            <p className="text-xs text-neutral-500 truncate">
                {user.email}
            </p>
            {user.roles && user.roles.length > 0 && (
                <div className="flex flex-wrap pt-1 gap-1">
                    {user.roles.map((role, index) => (
                        <span key={index} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                    ))}
                </div>
            )}
        </div>
      </Link>
    );
};

// --- Pagination Controls Component (Extracted for Cleanliness) ---
interface PaginationControlsProps {
  fList: SafeUser[];
  itemOffset: number;
  pageSize: number;
  handlePageSizeChange: (newPageSize: PageSizeOption) => void;
  handlePageClick: ({ selected }: { selected: number }) => void;
  showPageSize: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  fList,
  itemOffset,
  pageSize,
  handlePageSizeChange,
  handlePageClick,
  showPageSize,
}) => {
  if (fList.length === 0) return null;

  const currentPageIndex = Math.floor(itemOffset / pageSize);
  const startRange = itemOffset + 1;
  const endRange = Math.min(itemOffset + pageSize, fList.length);
  const paginationSummary = `${startRange}-${endRange} of ${fList.length}`;
  const pageCount = Math.ceil(fList.length / pageSize);

  return (
    <div className="flex items-center space-x-2">
      <div className={cn("text-sm sm:mr-2", INDIGO_PRIMARY, "font-semibold", GRAY_ACCENT)}>
        {paginationSummary}
      </div>

      {showPageSize && (
        <select
          className={cn('h-9 px-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 cursor-pointer', INDIGO_PRIMARY)}
          value={pageSize}
          key={'pagesize-selector'}
          onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
        > 
          <option value="4">4 per page</option>
          <option value="8">8 per page</option>
          <option value="12">12 per page</option>
          <option value="16">16 per page</option>
          <option value="24">24 per page</option>
        </select>
      )}

      {/* Previous button */}
      <button 
        key="prev"
        onClick={() => handlePageClick({ selected: currentPageIndex - 1 })} 
        disabled={itemOffset === 0}
        className={cn("p-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`)}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      {/* Next button */}
      <button 
        key="next"
        onClick={() => handlePageClick({ selected: currentPageIndex + 1 })}
        disabled={endRange >= fList.length}
        className={cn("p-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`)}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};


// --- Main Client Component ---
const UsersClient: React.FC<UsersClientProps> = ({
  users,
  currentUser
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [fList, setFList] = useState(users); 
  const [pageSize, setPageSize] = useState<number>(
    currentUser && currentUser.pageSize ? currentUser.pageSize : DEFAULT_PAGE_SIZE
  ); 
  const [itemOffset, setItemOffset] = useState(0); 

  const { execute } = useAction(updatePagSize, {
    onSuccess: (data) => {
      toast.success(`PageSize for ${data?.email} updated to ${data.pageSize}`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // --- FILTERING LOGIC ---
  useEffect(() => {
    let results = users;
    if (searchTerm !== "") {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      results = users.filter((user) =>
        user?.email?.toLowerCase().includes(lowerSearchTerm) ||
        user?.name?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    setFList(results);
    setItemOffset(0); 
  }, [searchTerm, users]);

  // --- PAGINATION CALCULATIONS ---
  const paginatedUsers = useMemo(() => {
    const endpoint = Math.min(itemOffset + pageSize, fList.length);
    return fList.slice(itemOffset, endpoint);
  }, [fList, itemOffset, pageSize]);

  // Reset offset if the current offset is invalid after filtering or size change
  useEffect(() => {
    if (itemOffset >= fList.length && fList.length > 0) {
      setItemOffset(0);
    } else if (fList.length === 0 && itemOffset !== 0) {
      setItemOffset(0);
    }
  }, [fList.length, pageSize, itemOffset]);

  // --- PAGINATION HANDLERS ---
  const handlePageSizeChange = useCallback((newPageSize: PageSizeOption) => {
    const numericPageSize = parseInt(newPageSize, 10);
    setPageSize(numericPageSize);
    setItemOffset(0); 
    
    if (currentUser) {
      execute({ id: currentUser.id, pageSize: numericPageSize });
    }
  }, [currentUser, execute]);

  const handlePageClick = useCallback(({ selected }: { selected: number }) => {
    const newOffset = (selected * pageSize) % fList.length;
    setItemOffset(newOffset);
  }, [pageSize, fList.length]);

  // --- ACCESS CONTROL ---
  if (!currentUser) return redirect('/denied');
  
  const allowedRoles: String[] = ['admin', 'manager'];
  const isAllowedAccess = currentUser?.roles.some(role => 
    allowedRoles.some(allowed => allowed.toLowerCase() === role.toLowerCase())
  );

  if (!isAllowedAccess) return redirect('/denied'); 

  const title_ = `Users (${fList.length} of ${users.length})`;

  return (
    <Container>
      
      {/* NEW IMPROVED HEADER: 
        - Flexbox for alignment on large screens.
        - Flex-wrap on the combined controls group (Search + Pagination) 
          to stack gracefully on small screens.
        - pt-4 pb-6 border-b remains for structure.
      */}
      <div className="pt-4 pb-6 flex flex-col xl:flex-row justify-between items-start xl:items-end border-b">
        
        {/* Title/Subtitle */}
        <div className="mb-4 xl:mb-0">
          <Heading
            title={title_}
            subtitle="View and manage the accounts of registered users."
          />
        </div>

        {/* Search and Pagination Controls Group */}
        <div className="flex flex-wrap items-end w-full xl:w-auto gap-4">
          {/* Search Bar (Full width on smaller screens, auto-width on large) */}
          <div className="w-full sm:w-80 xl:w-auto order-1"> 
            <Search 
              setSearchTerm={setSearchTerm}               
              placeholderText={"Filter by Name or Email..."}
              searchTerm={searchTerm} 
            /> 
          </div>

          {/* Desktop Pagination Controls (Order 2 on smaller screens, always visible for MD+) */}
          <div className="flex items-center order-2 w-full sm:w-auto justify-start xl:justify-end">
            <PaginationControls 
              fList={fList} 
              itemOffset={itemOffset} 
              pageSize={pageSize} 
              handlePageSizeChange={handlePageSizeChange} 
              handlePageClick={handlePageClick}
              showPageSize={true} // Always show page size on desktop/header
            />
          </div>

        </div>
      </div>
      
      {/* User Grid */}
      <div className="space-y-4 pt-6 pb-20">
        <div className="flex items-center font-semibold text-lg text-neutral-700">
          <User className="h-5 w-5 mr-2" /> 
          {fList.length > 0 ? 'Active User Accounts' : 'No Users Found'}
        </div>
        
        {/* Responsive Grid: 1 column (sm), 2 (md), 3 (lg), 4 (xl) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {paginatedUsers.map((user) => (
            <UserCard 
              key={user.id} 
              user={user} 
              isCurrentUser={currentUser.id === user.id} 
            />
          ))}

          {/* Empty State Handling */}
          {fList.length === 0 && searchTerm !== '' && (
            <div className="col-span-full p-10 text-center bg-white rounded-xl shadow-inner">
              <p className="text-xl font-bold mb-2 text-neutral-700">
                No users match search term: {searchTerm}
              </p>
              <p className="text-gray-500">
                Try adjusting your search query.
              </p>
            </div>
          )}
        </div>
        
        {/* Desktop Footer Pagination (Optional: for pages that scroll heavily) */}
        {/* This div is now only visible on large screens and acts as a secondary/bottom control set */}
        <div className="mt-8 flex justify-center items-center p-4 bg-gray-50 rounded-xl shadow-inner hidden lg:flex">
             <PaginationControls 
              fList={fList} 
              itemOffset={itemOffset} 
              pageSize={pageSize} 
              handlePageSizeChange={handlePageSizeChange} 
              handlePageClick={handlePageClick}
              showPageSize={true}
            />
        </div>

      </div>

      {/* MOBILE FOOTER PAGINATION: Sticky at bottom, hidden on medium/large screens */}
      <div className="fixed bottom-0 left-0 w-full lg:hidden bg-white border-t border-gray-200 p-2 z-50 shadow-2xl">
          <div className="flex justify-center">
              <PaginationControls 
                fList={fList} 
                itemOffset={itemOffset} 
                pageSize={pageSize} 
                handlePageSizeChange={handlePageSizeChange} 
                handlePageClick={handlePageClick}
                showPageSize={false} // Hide page size selector on mobile footer for simplicity
              />
          </div>
      </div>
    </Container>
  );
}
  
export default UsersClient;
// 'use client';
// import { useCallback, useState, useEffect, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import { SafeUser } from "../types";
// import Heading from "../components/Heading";
// import Search from "../components/Search";
// import Container from "../components/Container";
// import Link from "next/link";
// import { Hint } from "../components/hint";
// import { User, Shield, UserCog, ChevronLeft, ChevronRight } from "lucide-react";
// import { redirect } from "next/navigation";
// import { useWindowSize } from "@/hooks/use-screenWidth";
// import Avatar from "@/app/components/Avatar";
// import { cn } from "@/lib/utils";
// import { updatePagSize } from "@/actions/update-user-pagesize";
// import { useAction } from "@/hooks/use-action";
// import { toast } from "sonner";
// // NOTE: Assuming Separator, FormPopover, HelpCircle are not needed for core functionality.

// interface UsersClientProps {
//   users: SafeUser[],
//   currentUser?: SafeUser | null,
// }


// const UsersClient: React.FC<UsersClientProps> = ({
//   users,
//   currentUser
// }) => {
//   const router = useRouter();
//   const [searchTerm, setSearchTerm] = useState("");
  
//   // Renaming original 'filterUsers' to 'fList' for clearer pagination separation
//   const [fList, setFList] = useState(users); 
//   const [fListPage, setFListPage] = useState<SafeUser[]>([]); 

//   // --- Pagination Constants ---
//   const DEFAULT_PAGE_SIZE = 12; // Adjusted to 12 for better grid visibility
//   type PageSizeOption = '4' | '8' | '12' | '16' | '24'; // Updated options
//   const INDIGO_PRIMARY = 'text-indigo-600';
//   const INDIGO_HOVER_BG = 'hover:bg-indigo-50';
//   const GRAY_ACCENT = 'text-gray-500';

//   // --- PAGINATION STATE ---
//   const [pageSize, setPageSize] = useState<number>(
//     currentUser && currentUser.pageSize ? currentUser.pageSize : DEFAULT_PAGE_SIZE
//   ); 
//   const [itemOffset, setItemOffset] = useState(0); 

//    const { execute, fieldErrors } = useAction(updatePagSize, {
//           onSuccess: (data) => {
//               toast.success(`PageSize for ${data?.email} updated to ${data.pageSize}`);
//           },
//           onError: (error) => {
//               toast.error(error);
//           },
//       });

//   // --- FILTERING LOGIC (Using original searchTerm) ---
//   useEffect(() => {
//     let results = users;
//     if (searchTerm !== "") {
//       const lowerSearchTerm = searchTerm.toLowerCase().trim();
//       results = users.filter((user) =>
//         user?.email?.toLowerCase().includes(lowerSearchTerm) ||
//         user?.name?.toLowerCase().includes(lowerSearchTerm)
//       );
//     }
//     // Update the full filtered list and reset the offset to 0
//     setFList(results);
//     setItemOffset(0); 
//   }, [searchTerm, users]);
  
//   // --- PAGINATION CALCULATIONS ---

//   const pageCount = useMemo(() => {
//     return Math.ceil(fList.length / pageSize);
//   }, [fList.length, pageSize]);

//   // Logic for slicing the array for the current page
//   const paginatedUsers = useMemo(() => {
//     const endpoint = Math.min(itemOffset + pageSize, fList.length);
//     return fList.slice(itemOffset, endpoint);
//   }, [fList, itemOffset, pageSize]);

//   // Update fListPage when pagination parameters change
//   useEffect(() => {
//       setFListPage(paginatedUsers);
//   }, [paginatedUsers]);


//   // Reset offset if the current offset is invalid after filtering or size change
//   useEffect(() => {
//     if (itemOffset >= fList.length && fList.length > 0) {
//       setItemOffset(0);
//     } else if (fList.length === 0 && itemOffset !== 0) {
//       setItemOffset(0);
//     }
//   }, [fList.length, pageSize, itemOffset]);

//   // --- PAGINATION HANDLERS ---
  
//   // Handle page size change (The 'execute' action for persistence is commented out/removed as it's not defined here)
//   const handlePageSizeChange = useCallback((newPageSize: PageSizeOption) => {
//     const numericPageSize = parseInt(newPageSize, 10);
//     setPageSize(numericPageSize);
//     setItemOffset(0); // Reset to the first page when page size changes
    
//     // NOTE: Uncomment and define `execute` if you want to persist pageSize to the DB
    
//     if (currentUser) {
//       execute({ id: currentUser?.id, pageSize: numericPageSize });
//     }
    
//   }, []);

//   // Handle page navigation click (Prev/Next/Page Number)
//   const handlePageClick = useCallback(({ selected }: { selected: number }) => {
//     const newOffset = (selected * pageSize) % fList.length;
//     setItemOffset(newOffset);
//   }, [pageSize, fList.length]);

//   // --- ACCESS CONTROL ---
//   const { width } = useWindowSize();
//   const mobileWidth = 400; 
  
//   if (!currentUser) return redirect('/denied');
  
//   const allowedRoles: String[] = ['admin', 'manager'];
//   const isAllowedAccess = currentUser?.roles.some(role => 
//     allowedRoles.some(allowed => allowed.toLowerCase() === role.toLowerCase())
//   );

//   if (!isAllowedAccess) return redirect('/denied'); 

//   const title_ = `Users (${fList.length} of ${users.length})`;

//     const UserCard = ({ user, isCurrentUser }: { user: SafeUser, isCurrentUser: boolean }) => {
//     // Determine the icon based on isAdmin status
//     const AdminIcon = user.isAdmin ? (
//       <Hint description="Admin User" side="top" sideOffset={10}>
//         <Shield className="h-5 w-5 text-red-500 fill-red-100" />
//       </Hint>
//     ) : (
//       <Hint description="Standard User" side="top" sideOffset={10}>
//          <UserCog className="h-5 w-5 text-gray-400" />
//       </Hint>
//     );

//     return (
//       <Link
//         key={user.id}
//         href={`/user/${user.id}`}
//         className={cn(
//           "flex flex-col p-3 border rounded-xl shadow-sm transition hover:shadow-lg hover:border-blue-500 cursor-pointer bg-white",
//           isCurrentUser ? "border-[3px] border-rose-600 bg-rose-50/50" : "border-neutral-200"
//         )}
//       >
//         <div className="flex justify-between items-start mb-2">
//             {/* Avatar and Indicator */}
//             <div className="relative">
//                 <Avatar classList="border-2 border-neutral-300 h-10 w-10" src={user.image} />
//                 {isCurrentUser && (
//                     <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-600 ring-2 ring-white" title="This is you"></div>
//                 )}
//             </div>

//             {/* Admin/Role Status Icon */}
//             {AdminIcon}
//         </div>

//         {/* User Details */}
//         <div className="space-y-0.5">
//             <p className="text-base font-semibold text-neutral-800 truncate">
//                 {user.name}
//             </p>
//             <p className="text-xs text-neutral-500 truncate">
//                 {user.email}
//             </p>
//             {user.roles && user.roles.length > 0 && (
//                 <div className="flex flex-wrap pt-1 gap-1">
//                     {user.roles.map((role, index) => (
//                         <span key={index} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
//                             {role.charAt(0).toUpperCase() + role.slice(1)}
//                         </span>
//                     ))}
//                 </div>
//             )}
//         </div>
//       </Link>
//     );
//   };

//    const renderPaginationButtons = (showPageSize = true) => {
//     if (fList.length === 0) return null;
    
//     const buttons = [];
//     const currentPageIndex = Math.floor(itemOffset / pageSize);
//     const startRange = itemOffset + 1;
//     const endRange = Math.min(itemOffset + pageSize, fList.length);
//     const paginationSummary = `${startRange}-${endRange} of ${fList.length}`;

//     buttons.push(
//       <div key="summary" className={cn("text-sm mr-2 sm:mr-4", INDIGO_PRIMARY, "font-semibold", GRAY_ACCENT)}>
//         {paginationSummary}
//       </div>
//     );
    
//     if (showPageSize) {
//       buttons.push(
//         <select
//           className={cn('h-9 px-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden sm:block', INDIGO_PRIMARY)}
//           value={pageSize}
//           key={'pagesize-selector'}
//           onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
//         > 
//           <option value="4">4 per page</option>
//           <option value="8">8 per page</option>
//           <option value="12">12 per page</option>
//           <option value="16">16 per page</option>
//           <option value="24">24 per page</option>
//         </select>
//       );
//     }

//     // Previous button
//     buttons.push(
//       <button 
//         key="prev"
//         onClick={() => handlePageClick({ selected: currentPageIndex - 1 })} 
//         disabled={itemOffset === 0}
//         className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`)}
//       >
//         <ChevronLeft className="w-5 h-5" />
//       </button>
//     );
    
//     // Next button
//     buttons.push(
//       <button 
//         key="next"
//         onClick={() => handlePageClick({ selected: currentPageIndex + 1 })}
//         disabled={endRange >= fList.length}
//         className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`)}
//       >
//         <ChevronRight className="w-5 h-5" />
//       </button>
//     );
    
//     return <div className="flex items-center">{buttons}</div>;
//   };


//   return (
//     <Container>
      
//       {/* Header, Title, and Search */}
//       <div className="pt-4 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b">
//         <Heading
//           title={title_}
//           subtitle="View and manage the accounts of registered users."
//         />
//         <div className="flex flex-col md:flex-row items-end sm:items-center mt-4 sm:mt-0 w-full sm:w-auto space-y-4 sm:space-y-0 sm:space-x-4">
//           <Search 
//             setSearchTerm={setSearchTerm}               
//             placeholderText={"Filter by Name or Email..."}
//             searchTerm={searchTerm} 
            
//           /> 
//           {/* Desktop Pagination Controls (including Page Size) */}
//           <div className="hidden md:block">
//             {renderPaginationButtons(true)}
//           </div>
//         </div>
//       </div>
      
//       {/* User Grid */}
//       <div className="space-y-4 pt-6 pb-20">
//         <div className="flex items-center font-semibold text-lg text-neutral-700">
//           <User className="h-5 w-5 mr-2" /> 
//           {fListPage.length > 0 ? 'Active User Accounts' : 'No Users Found'}
//         </div>
        
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
//           {fListPage.map((user) => (
//             <UserCard 
//               key={user.id} 
//               user={user} 
//               isCurrentUser={currentUser?.id === user.id} 
//             />
//           ))}

//           {/* Empty State Handling */}
//           {fList.length === 0 && searchTerm !== '' && (
//             <div className="col-span-full p-10 text-center bg-white rounded-xl shadow-inner">
//               <p className="text-xl font-bold mb-2 text-neutral-700">
//                 No users match search term: {searchTerm}
//               </p>
//               <p className="text-gray-500">
//                 Try adjusting your search query.
//               </p>
//             </div>
//           )}
//         </div>
        
//         {/* Fallback pagination for smaller screens if the filter list is populated */}
//         <div className="mt-8 flex justify-center items-center p-4 bg-gray-50 rounded-xl shadow-inner hidden md:flex">
//              {renderPaginationButtons(true)} 
//         </div>

//       </div>

//       {/* MOBILE FOOTER PAGINATION */}
//       <div className="fixed bottom-0 left-0 w-full md:hidden bg-white border-t border-gray-200 p-2 z-50 shadow-2xl">
//           <div className="flex justify-center">
//               {renderPaginationButtons(false)} {/* Don't show page size selector on mobile footer */}
//           </div>
//       </div>
//     </Container>
//   );
// }
//  
// export default UsersClient;