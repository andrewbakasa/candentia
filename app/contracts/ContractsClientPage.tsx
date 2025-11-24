'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
    ArrowUpRight, 
    Search, 
    ChevronLeft, 
    ChevronRight,
    Tag,
    DollarSign,
    Calendar
} from 'lucide-react';
// Assuming ContractListModel is defined in a separate file
import { ContractListModel } from './_components/types/contract'; 
import { useAction } from '@/hooks/use-action';
import { cn } from '@/lib/utils';
import { SafeUser } from '../types';
import { updatePagSize } from '@/actions/update-user-pagesize';
import { toast } from 'sonner';
import { redirect } from 'next/navigation';

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

      const allowedRoles: string[] = ['admin', 'executive'];

    const hasRequiredRole = useMemo(() => {
        if (!currentUser) {
            return false;
        }

        // Check 1: Is the user a global system admin?
        const isGlobalAdmin = currentUser.isAdmin === true;

        // Check 2: Does the user have a required role in their roles array?
        const hasRoleAccess = currentUser.roles 
            && currentUser.roles.some(role => 
                allowedRoles.includes(role.toLowerCase())
            );

        // Access is granted if they are a global admin OR they have one of the required roles
        return isGlobalAdmin || hasRoleAccess;

    }, [currentUser]);


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
        // Reduced vertical padding (py-0.5) and text size (text-xs -> text-[10px]) for compactness
        const base = "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm whitespace-nowrap";
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
        
        // 2. Page Size Selector 
        if (showPageSize) {
            buttons.push(
                <select
                    className={cn('h-9 px-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden sm:block')} // Hidden on very small screens for space
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
                className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`, "transition")}
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
                className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`, "transition")}
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
   // Redirect unallowed users
    if (!hasRequiredRole) {
        // NOTE: Redirect to a 'denied' or 'home' page if access is denied
        return redirect('/denied'); 
    }
    
    return (
        <div className="container mx-auto p-2 sm:p-4 lg:p-6"> {/* Increased container padding for better desktop look */}
            
            {/* 1. Header and Action Button - Optimized for space */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white py-3 px-0 sm:py-2 sm:px-0 border-b border-gray-200 mb-4"> 
                {/* Left side: Title and Description */}
                <div className="flex flex-col mb-3 sm:mb-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        Contract Register
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-sm">
                        Overview of all active and historical contracts.
                    </p>
                </div>
                
                {/* Right side: New Contract Button */}
                <Link 
                    href="/contracts/new" 
                    className="bg-indigo-600 text-white flex items-center gap-2 px-5 py-1.5 rounded-lg shadow-md hover:bg-indigo-700 transition transform hover:scale-[1.01] active:scale-95 font-semibold text-sm w-full sm:w-auto justify-center"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    New Contract
                </Link>
            </div>
            
            {/* 2. Search and Filter Bar - Optimized for space */}
            <div className="flex flex-col md:flex-row gap-3 mb-6"> {/* Increased overall bottom margin */}
                
                {/* Search Input */}
                <div className="relative flex-grow md:w-8/12">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Title or Counterparty..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        // Reduced py-3 to py-2 for a tighter fit, added hover ring
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400 transition shadow-sm"
                    />
                </div>
                
                {/* Status Filter */}
                <div className="relative md:w-4/12">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                        // Reduced py-3 to py-2 for a tighter fit. rounded-xl to rounded-lg
                        className="w-full appearance-none py-2 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400 transition shadow-sm cursor-pointer"
                    >
                        <option value="ALL">Filter by Status (All)</option>
                        {ALL_STATUSES.filter(s => s !== 'ALL').map(status => (
                            <option key={status} value={status}>
                                {status.replace('_', ' ')}
                            </option>
                        ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            
            {/* 3. Full Table View (Desktop/Tablet: md and up) */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 border-b border-indigo-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title / Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Counterparty</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Annual Revenue</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expires On</th>
                            <th className="relative px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {contractsToDisplay.map((contract, index) => (
                            <tr key={contract.id} className="hover:bg-indigo-50/20 transition duration-150 ease-in-out">
                                
                                {/* Title / Type (Updated for Hover/Click functionality) */}
                                <td className="px-6 py-3 whitespace-nowrap">
                                    {/* Added 'title' attribute for hover tooltip/full description */}
                                    <Link 
                                        href={`/contracts/${contract.id}`} 
                                        className="block group/title"
                                        title={contract.description} 
                                    >
                                        <div 
                                            className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 transition"
                                        >
                                            {index+1}. {contract.title}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {contract.contractType}
                                        </div>
                                    </Link>
                                </td>
                                
                                {/* Counterparty */}
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                                    {contract.counterpartyName}
                                </td>

                                {/* Status Badge */}
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <span className={getStatusClasses(contract.status)}>
                                        {contract.status.replace('_', ' ')}
                                    </span>
                                </td>

                                {/* Revenue */}
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-gray-800">
                                    {formatCurrency(contract.annualRevenueUsd)}
                                </td>

                                {/* Expiry Date */}
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(contract.expirationDate)}
                                </td>
                                
                                {/* View Action */}
                                <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    <Link 
                                        href={`/contracts/${contract.id}`} 
                                        className="text-indigo-600 hover:text-indigo-800 flex items-center justify-end gap-1 font-semibold"
                                    >
                                       View
                                        {/* Conditional rendering: Only render the <sup> element if the count is > 0 */}
                                        {contract._count.contractActivityModels > 0 && (
                                        <sup className="-ml-0.5 text-xs -top-2">
                                            {contract._count.contractActivityModels}
                                        </sup>
                                        )}
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 4. Card View (Mobile: Default to block, hidden on md and up) */}
            <div className="md:hidden space-y-3"> {/* Increased space-y for better card separation */}
                {contractsToDisplay.map((contract,index) => (
                    <Link 
                        key={contract.id} 
                        href={`/contracts/${contract.id}`} 
                        className="block bg-white p-4 border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition duration-200 relative group" // Reduced rounded-xl to rounded-lg
                        title={contract.description} // Added 'title' attribute for hover tooltip/full description
                    >
                        {/* Header Row */}
                        <div className="flex justify-between items-start mb-2">
                            {/* Removed line-clamp-1 to show full title on mobile card view for immediate visibility */}
                            <h3 className="text-base font-semibold text-indigo-700 pr-6">{index+1}. {contract.title}</h3>
                            <span className={getStatusClasses(contract.status)}>{contract.status.replace('_', ' ')}</span>
                        </div>

                        {/* Counterparty & Type */}
                        <div className="text-sm text-gray-700 mb-3 border-b border-gray-100 pb-2">
                            <span className="font-semibold text-gray-500 flex items-center mb-1"><Tag className="w-4 h-4 mr-1"/> {contract.contractType}</span> 
                            <span className="text-gray-600">— {contract.counterpartyName}</span>
                        </div>

                        {/* Financial/Date Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center">
                                <DollarSign className="w-4 h-4 text-green-500 mr-2"/>
                                <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase">Revenue</div>
                                    <div className="font-mono text-gray-800 font-semibold">{formatCurrency(contract.annualRevenueUsd)}</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end text-right">
                                <Calendar className="w-4 h-4 text-indigo-500 mr-2"/>
                                <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase">Expires On</div>
                                    <div className="text-gray-600 font-semibold">{formatDate(contract.expirationDate)}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* View Icon for visual feedback */}
                        <div className="absolute top-4 right-4 text-indigo-400 group-hover:text-indigo-600 transition">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </Link>
                ))}
            </div>
            
            {/* 5. Pagination Controls - Cleaned up */}
            <div className="mt-6 flex justify-between items-center px-4 py-3 bg-white rounded-lg shadow-md border border-gray-100"> {/* Reduced rounded-xl to rounded-lg */}
                
                {/* Page status text: HIDDEN on mobile, VISIBLE on desktop (md:block) */}
                <div className="text-sm text-gray-500 font-semibold hidden md:block">
                    Page {Math.floor(itemOffset / pageSize) + 1} of {Math.ceil(filteredContracts.length / pageSize)}
                </div>
                {renderPaginationButtons(true)}
            </div>

            {/* 6. Empty State / No Results */}
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