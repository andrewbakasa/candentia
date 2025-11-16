'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowUpRight, 
  Search, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
// Assuming ContractListModel is defined in a separate file
import { ContractListModel } from './_components/types/contract'; 
import { useAction } from '@/hooks/use-action';
import { cn } from '@/lib/utils';
import { SafeUser } from '../types';
import { updatePagSize } from '@/actions/update-user-pagesize';
import { toast } from 'sonner';

// --- TYPE DEFINITIONS ---
type PageSizeOption = '4' | '8' | '16' | '24';
type FilterStatus = 'ALL' | 'ACTIVE' | 'DRAFT' | 'TERMINATED' | 'EXPIRED' | 'PENDING_APPROVAL';

// --- CONFIGURATION CONSTANTS ---
const DEFAULT_PAGE_SIZE = 8;
const ALL_STATUSES: FilterStatus[] = [
  'ALL', 
  'ACTIVE', 
  'DRAFT', 
  'TERMINATED', 
  'EXPIRED', 
  'PENDING_APPROVAL'
];

// Tailwind class placeholders
const INDIGO_PRIMARY = "text-indigo-600";
const GRAY_ACCENT = "text-gray-500";
const INDIGO_HOVER_BG = "hover:bg-indigo-50";

interface ContractListClientProps {
    currentUser: SafeUser | null;
}
    
const ContractsListPage: React.FC<ContractListClientProps> = ({
        currentUser,
    }) => {
  const [contracts, setContracts] = useState<ContractListModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Search & Pagination State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE); 
  const [itemOffset, setItemOffset] = useState(0); 

   const { execute } = useAction(updatePagSize, {
          onSuccess: (data) => {
              toast.success(`PageSize for ${data?.email} updated to ${data.pageSize}`);
          },
          onError: (error) => {
              toast.error(error);
          },
      });

  // --- Data Fetching Effect ---
  useEffect(() => {
    async function fetchContracts() {
      try {
        const response = await fetch('/api/contracts');
        if (!response.ok) {
          throw new Error('Failed to load contracts list.');
        }
        const data: ContractListModel[] = await response.json();
        setContracts(data);
        if (currentUser && currentUser.pageSize) {
            setPageSize(currentUser.pageSize);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContracts();
  }, [currentUser]);

  // --- Filtering and Pagination Logic ---
  const filteredContracts = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    return contracts.filter(contract => {
      const matchesSearch = 
        contract.title.toLowerCase().includes(lowerSearchTerm) || 
        contract.counterpartyName.toLowerCase().includes(lowerSearchTerm);
      const matchesStatus = 
        statusFilter === 'ALL' || 
        contract.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  const paginatedContracts = useMemo(() => {
    const endpoint = Math.min(itemOffset + pageSize, filteredContracts.length);
    return filteredContracts.slice(itemOffset, endpoint);
  }, [filteredContracts, itemOffset, pageSize]);
  
  useEffect(() => {
      setItemOffset(0);
  }, [searchTerm, statusFilter, pageSize]);


  // --- PAGINATION HANDLERS ---
  
  const handlePageClick = useCallback(({ selected }: { selected: number }) => {
    const newOffset = selected * pageSize;
    const maxOffset = Math.max(0, filteredContracts.length - pageSize);
    setItemOffset(Math.min(newOffset, maxOffset));
  }, [pageSize, filteredContracts.length]);

  const handlePageSizeChange = useCallback((newPageSize: PageSizeOption) => {
    const numericPageSize = parseInt(newPageSize, 10);
    setPageSize(numericPageSize);
    
    if (currentUser) {
        execute({ id: currentUser?.id, pageSize: numericPageSize });
    }
    setItemOffset(0); 
  }, [currentUser, execute]);
  
  // --- UI Helper Functions ---

  const formatCurrency = (amount: number | null) => 
    amount !== null && amount !== undefined 
      ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}` 
      : '—'; 

  const formatDate = (dateString: string | null) => 
    dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const getStatusClasses = (status: string) => {
    const base = "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm";
    switch (status) {
      case 'ACTIVE':
        return `${base} bg-green-100 text-green-700 border border-green-200`;
      case 'DRAFT':
        return `${base} bg-yellow-50 text-yellow-700 border border-yellow-200`;
      case 'TERMINATED':
      case 'EXPIRED':
        return `${base} bg-red-100 text-red-700 border border-red-200`;
      case 'PENDING_APPROVAL':
        return `${base} bg-blue-100 text-blue-700 border border-blue-200`;
      default:
        return `${base} bg-gray-100 text-gray-700 border border-gray-200`;
    }
  };

  const renderPaginationButtons = (showPageSize = true) => {
    if (filteredContracts.length === 0) return null;
    
    const buttons = [];
    const currentPageIndex = Math.floor(itemOffset / pageSize);
    const startRange = itemOffset + 1;
    const endRange = Math.min(itemOffset + pageSize, filteredContracts.length);
    const paginationSummary = `${startRange}-${endRange} of ${filteredContracts.length}`;

    // 1. Summary (Visible on all screens)
    buttons.push(
        <div key="summary" className={cn("text-sm mr-2 sm:mr-4", INDIGO_PRIMARY, "font-semibold", GRAY_ACCENT)}>
            {paginationSummary}
        </div>
    );
    
    // 2. Page Size Selector (Hidden on mobile)
    if (showPageSize) {
        buttons.push(
            <select
                className={cn('h-9 px-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden md:block', INDIGO_PRIMARY)}
                value={pageSize}
                key={'pagesize-selector'}
                onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
            > 
                <option value="4">4 per page</option>
                <option value="8">8 per page</option>
                <option value="16">16 per page</option>
                <option value="24">24 per page</option>
            </select>
        );
    }

    // 3. Previous Button
    buttons.push(
        <button 
            key="prev"
            onClick={() => handlePageClick({ selected: currentPageIndex - 1 })} 
            disabled={itemOffset === 0}
            className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`)}
        >
            <ChevronLeft className="w-5 h-5" />
        </button>
    );
    
    // 4. Next Button
    buttons.push(
        <button 
            key="next"
            onClick={() => handlePageClick({ selected: currentPageIndex + 1 })}
            disabled={endRange >= filteredContracts.length}
            className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`)}
        >
            <ChevronRight className="w-5 h-5" />
        </button>
    );
    
    return <div className="flex items-center">{buttons}</div>;
};

  if (isLoading) {
    return <div className="p-10 text-center text-lg font-medium text-gray-600">Loading contracts...</div>;
  }

  if (error) {
    return (
        <div className="p-6 m-6 max-w-xl mx-auto text-red-700 border border-red-300 bg-red-50 rounded-lg shadow-md">
            <h3 className="font-bold mb-2">Error Loading Data</h3>
            <p className="text-sm">{error}</p>
        </div>
    );
  }

  const contractsToDisplay = paginatedContracts;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Header and Action Button: Adjust for better mobile spacing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-800">Contract Register</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Overview of all active and historical contracts.
            </p>
        </div>
        <Link 
          href="/contracts/new" 
          className="bg-indigo-600 text-white flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition transform hover:scale-[1.02] active:scale-95 font-semibold text-sm w-full sm:w-auto justify-center"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          New Contract
        </Link>
      </div>

    {/* --- Search and Filter Bar: Using flex for responsive stacking --- */}
    <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-grow md:w-8/12">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Title or Counterparty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
          />
        </div>
        
        {/* Status Filter */}
        <div className="relative md:w-4/12">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="w-full appearance-none py-3 px-4 border border-gray-300 rounded-xl bg-white text-gray-700 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm cursor-pointer"
          >
            <option value="ALL">Filter by Status (All)</option>
            {ALL_STATUSES.filter(s => s !== 'ALL').map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

    {/* 1. Full Table View (Desktop/Tablet: md and up) - RESTORED ORIGINAL CLICK BEHAVIOR */}
    <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-2xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 border-b-2 border-indigo-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title / Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Counterparty</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Annual Revenue</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expires On</th>
              <th className="relative px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
             {contractsToDisplay.map((contract) => (
              <tr key={contract.id} className="hover:bg-indigo-50/20 transition duration-150 ease-in-out">
                {/* Title / Type */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/contracts/${contract.id}`} className="block">
                    <div className="text-sm font-bold text-indigo-700 hover:text-indigo-900 transition">
                      {contract.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {contract.contractType}
                    </div>
                  </Link>
                </td>
                
                {/* Counterparty */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {contract.counterpartyName}
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusClasses(contract.status)}>
                    {contract.status.replace('_', ' ')}
                  </span>
                </td>

                {/* Revenue */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-800">
                  {formatCurrency(contract.annualRevenueUsd)}
                </td>

                {/* Expiry Date */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(contract.expirationDate)}
                </td>
                
                {/* View Action */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                   <Link 
                      href={`/contracts/${contract.id}`} 
                      className="text-indigo-600 hover:text-indigo-800 flex items-center justify-end gap-1"
                    >
                      View <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    {/* 2. Card View (Mobile: Default to block, hidden on md and up) - MAINTAINED MOBILE VIEW */}
    <div className="md:hidden space-y-4">
        {contractsToDisplay.map((contract) => (
            <Link 
                key={contract.id} 
                href={`/contracts/${contract.id}`} 
                className="block bg-white p-4 border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition duration-200 relative group"
            >
                {/* Header Row */}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-bold text-indigo-700 line-clamp-1 pr-6">{contract.title}</h3>
                    <span className={getStatusClasses(contract.status)}>{contract.status.replace('_', ' ')}</span>
                </div>

                {/* Counterparty & Type */}
                <div className="text-sm text-gray-700 mb-3 border-b border-gray-100 pb-2">
                    <span className="font-semibold text-gray-500">Counterparty:</span> {contract.counterpartyName}
                    <div className="text-xs text-gray-500 mt-0.5">{contract.contractType}</div>
                </div>

                {/* Financial/Date Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <div className="text-xs font-medium text-gray-500 uppercase">Revenue</div>
                        <div className="font-mono text-gray-800 font-semibold">{formatCurrency(contract.annualRevenueUsd)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-medium text-gray-500 uppercase">Expires On</div>
                        <div className="text-gray-600">{formatDate(contract.expirationDate)}</div>
                    </div>
                </div>
                
                {/* View Icon for visual feedback */}
                <div className="absolute top-4 right-4 text-indigo-400 group-hover:text-indigo-600 transition">
                    <ArrowUpRight className="w-5 h-5" />
                </div>
            </Link>
        ))}
    </div>
  	   
      {/* --- Pagination Controls --- */}
    {/* Ensure pagination bar is always full width and visible below the list/table */}
    <div className="mt-6 flex justify-between items-center px-4 py-3 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="text-xs text-gray-500 font-semibold md:hidden">
            Page {Math.floor(itemOffset / pageSize) + 1} of {Math.ceil(filteredContracts.length / pageSize)}
        </div>
        {renderPaginationButtons(true)}
    </div>

      
      {/* Empty State / No Results */}
      {contractsToDisplay.length === 0 && !isLoading && filteredContracts.length > 0 && (
         <div className="mt-6 p-10 text-center bg-yellow-50 rounded-xl border border-yellow-200">
            <h3 className="text-xl font-semibold text-gray-700">No Results Found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search term or status filter.</p>
        </div>
      )}

      {contracts.length === 0 && !isLoading && (
        <div className="mt-12 p-10 text-center bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700">No Contracts Found</h3>
            <p className="text-gray-500 mt-2">Start by creating your first business contract.</p>
            <Link 
                href="/contracts/new" 
                className="inline-block mt-4 text-indigo-600 font-medium hover:underline"
            >
                Create New Contract
            </Link>
        </div>
      )}
    </div>
  );
}


export default ContractsListPage;
// 'use client';

// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import Link from 'next/link';
// import { 
//   ArrowUpRight, 
//   Search, 
//   ChevronLeft, 
//   ChevronRight 
// } from 'lucide-react';
// // Assuming ContractListModel is defined in a separate file
// import { ContractListModel } from './_components/types/contract'; 
// import { useAction } from '@/hooks/use-action';
// import { cn } from '@/lib/utils';
// import { SafeUser } from '../types';
// import { updatePagSize } from '@/actions/update-user-pagesize';
// import { toast } from 'sonner';

// // --- TYPE DEFINITIONS (REQUIRED FOR THE PAGINATION LOGIC) ---
// // Since we don't have access to your full project setup, we define placeholder types.
// type PageSizeOption = '4' | '8' | '16' | '24';
// type FilterStatus = 'ALL' | 'ACTIVE' | 'DRAFT' | 'TERMINATED' | 'EXPIRED' | 'PENDING_APPROVAL';

// // --- CONFIGURATION CONSTANTS ---
// const DEFAULT_PAGE_SIZE = 8;
// const ALL_STATUSES: FilterStatus[] = [
//   'ALL', 
//   'ACTIVE', 
//   'DRAFT', 
//   'TERMINATED', 
//   'EXPIRED', 
//   'PENDING_APPROVAL'
// ];



// // Tailwind class placeholders used in original snippets
// const INDIGO_PRIMARY = "text-indigo-600";
// const GRAY_ACCENT = "text-gray-500";
// const INDIGO_HOVER_BG = "hover:bg-indigo-50";

// interface ContractListClientProps {
//     currentUser: SafeUser | null;
// }
//     // --- Main Client Component ---
// const ContractsListPage: React.FC<ContractListClientProps> = ({
       
//         currentUser,
//     }) => {
//   const [contracts, setContracts] = useState<ContractListModel[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // --- Search & Pagination State ---
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
//   // Replaced currentPage with itemOffset for seamless integration with previous pagination logic
//   const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE); 
//   const [itemOffset, setItemOffset] = useState(0); 

//   // Mock server action hook initialization
//  // const currentUser = currentUserPlaceholder; 


//    const { execute, fieldErrors } = useAction(updatePagSize, {
//           onSuccess: (data) => {
//               toast.success(`PageSize for ${data?.email} updated to ${data.pageSize}`);
//           },
//           onError: (error) => {
//               toast.error(error);
//           },
//       });

//   // --- Data Fetching Effect (Unchanged) ---
//   useEffect(() => {
//     async function fetchContracts() {
//       try {
//         const response = await fetch('/api/contracts');
//         if (!response.ok) {
//           throw new Error('Failed to load contracts list.');
//         }
//         const data: ContractListModel[] = await response.json();
//         setContracts(data);
//         // Initialize pageSize from user settings if available
//         if (currentUser && currentUser.pageSize) {
//             setPageSize(currentUser.pageSize);
//         }
//       } catch (err) {
//         setError((err as Error).message);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     fetchContracts();
//   }, []);

//   // --- Filtering and Pagination Logic ---

//   // 1. Filter contracts based on search term and status filter
//   const filteredContracts = useMemo(() => {
//     const lowerSearchTerm = searchTerm.toLowerCase().trim();

//     return contracts.filter(contract => {
//       // Search by title or counterparty name
//       const matchesSearch = 
//         contract.title.toLowerCase().includes(lowerSearchTerm) || 
//         contract.counterpartyName.toLowerCase().includes(lowerSearchTerm);

//       // Filter by status
//       const matchesStatus = 
//         statusFilter === 'ALL' || 
//         contract.status === statusFilter;

//       return matchesSearch && matchesStatus;
//     });
//   }, [contracts, searchTerm, statusFilter]);

//   // 2. Calculate pagination details
//   const pageCount = useMemo(() => {
//     return Math.ceil(filteredContracts.length / pageSize);
//   }, [filteredContracts.length, pageSize]);

//   // 3. Get the contracts for the current page
//   const paginatedContracts = useMemo(() => {
//     const endpoint = Math.min(itemOffset + pageSize, filteredContracts.length);
//     return filteredContracts.slice(itemOffset, endpoint);
//   }, [filteredContracts, itemOffset, pageSize]);
  
//   // Reset page offset when filters change
//   useEffect(() => {
//       setItemOffset(0);
//   }, [searchTerm, statusFilter, pageSize]);


//   // --- PAGINATION HANDLERS ---
  
//   const handlePageClick = useCallback(({ selected }: { selected: number }) => {
//     // Calculate the new starting index (offset) for the data slice.
//     // 'selected' is the zero-based index of the page clicked (e.g., 0 for page 1).
//     const newOffset = selected * pageSize;
    
//     // Ensure the offset does not exceed the total number of items
//     const maxOffset = Math.max(0, filteredContracts.length - 1);
//     setItemOffset(Math.min(newOffset, maxOffset));
//   }, [pageSize, filteredContracts.length]);

//   const handlePageSizeChange = useCallback((newPageSize: PageSizeOption) => {
//     const numericPageSize = parseInt(newPageSize, 10);
//     setPageSize(numericPageSize);
    
//     if (currentUser) {
        
//         execute({
//             id: currentUser?.id,
//             pageSize: numericPageSize
//         });
//     }
//     // IMPORTANT: Reset to the first page (offset 0) when page size changes
//     setItemOffset(0); 
//   }, [currentUser, execute]);
  
//   // --- UI Helper Functions ---

//   const formatCurrency = (amount: number | null) => 
//     amount !== null && amount !== undefined 
//       ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}` 
//       : '—'; 

//   const formatDate = (dateString: string | null) => 
//     dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

//   const getStatusClasses = (status: string) => {
//     const base = "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm";
//     switch (status) {
//       case 'ACTIVE':
//         return `${base} bg-green-100 text-green-700 border border-green-200`;
//       case 'DRAFT':
//         return `${base} bg-yellow-50 text-yellow-700 border border-yellow-200`;
//       case 'TERMINATED':
//       case 'EXPIRED':
//         return `${base} bg-red-100 text-red-700 border border-red-200`;
//       case 'PENDING_APPROVAL':
//         return `${base} bg-blue-100 text-blue-700 border border-blue-200`;
//       default:
//         return `${base} bg-gray-100 text-gray-700 border border-gray-200`;
//     }
//   };

//   const renderPaginationButtons = (showPageSize = true) => {
//     if (filteredContracts.length === 0) return null;
    
//     const buttons = [];
//     const currentPageIndex = Math.floor(itemOffset / pageSize);
//     const startRange = itemOffset + 1;
//     const endRange = Math.min(itemOffset + pageSize, filteredContracts.length);
//     const paginationSummary = `${startRange}-${endRange} of ${filteredContracts.length}`;

//     // 1. Summary
//     buttons.push(
//         <div key="summary" className={cn("text-sm mr-2 sm:mr-4", INDIGO_PRIMARY, "font-semibold", GRAY_ACCENT)}>
//             {paginationSummary}
//         </div>
//     );
    
//     // 2. Page Size Selector
//     if (showPageSize) {
//         buttons.push(
//             <select
//                 className={cn('h-9 px-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden sm:block', INDIGO_PRIMARY)}
//                 value={pageSize}
//                 key={'pagesize-selector'}
//                 onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
//             > 
//                 <option value="4">4 per page</option>
//                 <option value="8">8 per page</option>
//                 <option value="16">16 per page</option>
//                 <option value="24">24 per page</option>
//             </select>
//         );
//     }

//     // 3. Previous Button
//     buttons.push(
//         <button 
//             key="prev"
//             // Use handlePageClick with the previous index
//             onClick={() => handlePageClick({ selected: currentPageIndex - 1 })} 
//             disabled={itemOffset === 0}
//             className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`)}
//         >
//             <ChevronLeft className="w-5 h-5" />
//         </button>
//     );
    
//     // 4. Next Button
//     buttons.push(
//         <button 
//             key="next"
//              // Use handlePageClick with the next index
//             onClick={() => handlePageClick({ selected: currentPageIndex + 1 })}
//             disabled={endRange >= filteredContracts.length}
//             className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`)}
//         >
//             <ChevronRight className="w-5 h-5" />
//         </button>
//     );
    
//     return <div className="flex items-center">{buttons}</div>;
// };

//   if (isLoading) {
//     return <div className="p-10 text-center text-lg font-medium text-gray-600">Loading contracts...</div>;
//   }

//   if (error) {
//     return (
//         <div className="p-6 m-6 max-w-xl mx-auto text-red-700 border border-red-300 bg-red-50 rounded-lg shadow-md">
//             <h3 className="font-bold mb-2">Error Loading Data</h3>
//             <p className="text-sm">{error}</p>
//         </div>
//     );
//   }

//   const contractsToDisplay = paginatedContracts;

//   return (
//     <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      
//       {/* Header and Action Button */}
//       <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-lg shadow-lg border border-gray-100">
//         <div className="flex flex-col">
//             <h1 className="text-4xl font-extrabold text-gray-800">Contract Register</h1>
//             <p className="text-gray-500 mt-1">
//                 Overview of all active and historical contracts.
//             </p>
//         </div>
//         <Link 
//           href="/contracts/new" 
//           className="bg-indigo-600 text-white flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition transform hover:scale-[1.02] active:scale-95 font-semibold"
//         >
//           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
//           New Contract
//         </Link>
//       </div>

//       {/* --- Search and Filter Bar --- */}
//       <div className="mb-6">
//         <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
//           {/* Search Input */}
//           <div className="relative md:col-span-8">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search by Title or Counterparty..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
//             />
//           </div>
          
//           {/* Status Filter */}
//           <div className="relative md:col-span-4">
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
//               className="w-full appearance-none py-3 px-4 border border-gray-300 rounded-xl bg-white text-gray-700 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm cursor-pointer"
//             >
//               <option value="ALL">Filter by Status (All)</option>
//               {ALL_STATUSES.filter(s => s !== 'ALL').map(status => (
//                 <option key={status} value={status}>
//                   {status.replace('_', ' ')}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Contract Table Container */}
//       <div className="overflow-x-auto bg-white rounded-xl shadow-2xl border border-gray-200">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50 border-b-2 border-indigo-100">
//             <tr>
//               <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title / Type</th>
//               <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Counterparty</th>
//               <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Annual Revenue</th>
//               <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expires On</th>
//               <th className="relative px-6 py-4"></th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-100">
//             {contractsToDisplay.map((contract) => (
//               <tr key={contract.id} className="hover:bg-indigo-50/20 transition duration-150 ease-in-out">
//                 {/* Title / Type */}
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <Link href={`/contracts/${contract.id}`} className="block">
//                     <div className="text-sm font-bold text-indigo-700 hover:text-indigo-900 transition">
//                       {contract.title}
//                     </div>
//                     <div className="text-xs text-gray-500 mt-0.5">
//                       {contract.contractType}
//                     </div>
//                   </Link>
//                 </td>
                
//                 {/* Counterparty */}
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                     {contract.counterpartyName}
//                 </td>

//                 {/* Status Badge */}
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={getStatusClasses(contract.status)}>
//                     {contract.status.replace('_', ' ')}
//                   </span>
//                 </td>

//                 {/* Revenue */}
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-800">
//                   {formatCurrency(contract.annualRevenueUsd)}
//                 </td>

//                 {/* Expiry Date */}
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                   {formatDate(contract.expirationDate)}
//                 </td>
                
//                 {/* View Action */}
//                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                    <Link 
//                       href={`/contracts/${contract.id}`} 
//                       className="text-indigo-600 hover:text-indigo-800 flex items-center justify-end gap-1"
//                     >
//                       View <ArrowUpRight className="w-4 h-4" />
//                   </Link>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
      
//       {/* --- Pagination Controls --- */}
//       <div className="mt-6 flex justify-end items-center px-4 py-3 bg-white rounded-xl shadow-md border border-gray-100">
//         {renderPaginationButtons(true)}
//       </div>

      
//       {/* Empty State / No Results */}
//       {contractsToDisplay.length === 0 && !isLoading && filteredContracts.length > 0 && (
//          <div className="mt-6 p-10 text-center bg-yellow-50 rounded-xl border border-yellow-200">
//             <h3 className="text-xl font-semibold text-gray-700">No Results Found</h3>
//             <p className="text-gray-500 mt-2">Try adjusting your search term or status filter.</p>
//         </div>
//       )}

//       {contracts.length === 0 && !isLoading && (
//         <div className="mt-12 p-10 text-center bg-gray-50 rounded-xl border border-gray-200">
//             <h3 className="text-xl font-semibold text-gray-700">No Contracts Found</h3>
//             <p className="text-gray-500 mt-2">Start by creating your first business contract.</p>
//             <Link 
//                 href="/contracts/new" 
//                 className="inline-block mt-4 text-indigo-600 font-medium hover:underline"
//             >
//                 Create New Contract
//             </Link>
//         </div>
//       )}
//     </div>
//   );
// }


// export default ContractsListPage;