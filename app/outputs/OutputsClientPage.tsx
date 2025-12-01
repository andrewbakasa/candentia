'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    ArrowUpRight, 
    Search, 
    ChevronLeft, 
    ChevronRight,
    Tag,
    DollarSign,
    AlertCircle,
    User,
    CheckCircle, // For completed
    Clock,       // For Attention Needed (No date/In progress)
    AlertTriangle // For Past Due
} from 'lucide-react';
// Assuming SafeUser, useAction, toast, and cn imports are correct based on the original code
import { SafeUser } from '../types';
import { useAction } from '@/hooks/use-action';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { updatePagSize } from '@/actions/update-user-pagesize';


// --- TYPE DEFINITIONS & CONSTANTS ---

type OutputStatusCategory = 'ALL' | 'COMPLETED' | 'PAST_DUE' | 'ATTENTION_NEEDED';

interface StrategyOutputListModel {
    id: string;
    title: string;
    description: string | null;
    responsible: string | null;
    ouputType: string;
    costEstimate: number | null; 
    // New fields based on requirements:
    isCompleted: boolean;
    completionDate: string | null; // ISO string
    dueDate: string | null;         // ISO string
    _count: {
        activities: number;
    }
}

const DEFAULT_PAGE_SIZE = 8;
const PAGE_SIZE_OPTIONS = [4, 8, 16, 24];
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0); // Set to midnight for clean comparison

// Tailwind class placeholders (Simplified cn implementation)
const INDIGO_PRIMARY = "text-indigo-600";
const GRAY_ACCENT = "text-gray-500";
const INDIGO_HOVER_BG = "hover:bg-indigo-50";

// --- UI HELPERS ---

const formatCurrency = (amount: number | null) => 
    amount !== null && amount !== undefined 
        ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}` 
        : '—'; 

/**
 * Calculates the current status category of an output.
 * @param output StrategyOutputListModel
 * @returns OutputStatusCategory
 */
const getOutputStatusCategory = (output: StrategyOutputListModel): Exclude<OutputStatusCategory, 'ALL'> => {
    if (output.isCompleted) {
        return 'COMPLETED';
    }

    if (output.dueDate) {
        const dueDate = new Date(output.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < TODAY) {
            return 'PAST_DUE';
        }
    }

    // Default for incomplete items without a due date or items that are not past due
    return 'ATTENTION_NEEDED'; 
};

/**
 * Renders a visual badge for the output status category.
 */
const StatusCategoryBadge: React.FC<{ category: Exclude<OutputStatusCategory, 'ALL'> }> = ({ category }) => {
    const base = "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm whitespace-nowrap flex items-center gap-1";
    let icon;
    let text;
    let classes;

    switch (category) {
        case 'COMPLETED':
            icon = <CheckCircle className="w-3 h-3" />;
            text = 'Completed';
            classes = `${base} bg-green-100 text-green-700 border border-green-200`;
            break;
        case 'PAST_DUE':
            icon = <AlertTriangle className="w-3 h-3" />;
            text = 'Past Due';
            classes = `${base} bg-red-100 text-red-700 border border-red-200`;
            break;
        case 'ATTENTION_NEEDED':
        default:
            icon = <Clock className="w-3 h-3" />;
            text = 'In Progress';
            classes = `${base} bg-yellow-50 text-yellow-700 border border-yellow-200`;
            break;
    }

    return (
        <span className={classes}>
            {icon}
            {text}
        </span>
    );
};

// --- DESKTOP TABLE ROW COMPONENT ---

interface DesktopTableRowProps {
    output: StrategyOutputListModel;
    index: number;
    itemOffset: number;
}

const DesktopTableRow: React.FC<DesktopTableRowProps> = ({ output, index, itemOffset }) => {
    const category = getOutputStatusCategory(output);

    return (
        <tr key={output.id} className="hover:bg-indigo-50/20 transition duration-150 ease-in-out">
            
            {/* Title / Type (Truncated) */}
            <td className="px-6 py-3">
                <a 
                    href={`/outputs/${output.id}`} 
                    className="block group/title"
                    title={output.description || output.title}
                >
                    <div 
                        className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 transition max-w-xs truncate" 
                    >
                        {itemOffset + index + 1}. {output.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                        {output.ouputType}
                    </div>
                </a>
            </td>

            {/* Status Category (NEW COLUMN) */}
            <td className="px-6 py-3 whitespace-nowrap">
                <StatusCategoryBadge category={category} />
            </td>
            
            {/* Cost Estimate */}
            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                <div className="flex items-center">
                    <DollarSign className="w-3 h-3 mr-1 text-red-500" /> 
                    {formatCurrency(output.costEstimate)}
                </div>
            </td>

            {/* Responsible */}
            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 flex items-center">
                <User className="w-3 h-3 mr-1 text-gray-400" />
                {output.responsible || 'Unassigned'}
            </td>

            {/* View Action */}
            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                <a 
                    href={`/outputs/${output.id}`} 
                    className="text-indigo-600 hover:text-indigo-800 flex items-center justify-end gap-1 font-semibold"
                >
                    View
                    {output._count.activities > 0 && (
                    <sup className="-ml-0.5 text-xs -top-2 bg-indigo-100 text-indigo-700 rounded-full px-1 py-0.5">
                        {output._count.activities}
                    </sup>
                    )}
                    <ArrowUpRight className="w-4 h-4" />
                </a>
            </td>
        </tr>
    );
};

// --- MOBILE CARD VIEW COMPONENT ---

const MobileCardView: React.FC<{outputsToDisplay: StrategyOutputListModel[]; itemOffset: number}> = ({ outputsToDisplay, itemOffset }) => (
    <div className="md:hidden space-y-4"> 
        {outputsToDisplay.map((output,index) => {
            const category = getOutputStatusCategory(output);

            return (
                <a 
                    key={output.id} 
                    href={`/outputs/${output.id}`} 
                    className="block bg-white p-4 border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition duration-200 relative group"
                    title={output.description || output.title}
                >
                    {/* Header Row: Title & Status Badge */}
                    
                    {/* <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base font-semibold text-indigo-700 pr-6 max-w-[70%] truncate">
                            {itemOffset + index+1}. {output.title}
                        </h3>
                        <StatusCategoryBadge category={category} /> 
                    </div> */}
                    <div className="flex flex-col justify-between items-start mb-2 ">
                        <h3 className="text-base font-semibold text-indigo-700 pr-6 max-w-[calc(100%-0px)] truncate">
                            {itemOffset + index+1}. {output.title}
                        </h3>
                         <div className="flex items-center space-x-3 mt-2 sm:mt-0 ml-auto sm:ml-0 flex-shrink-0">                                                
                            <StatusCategoryBadge category={category} /> {/* Added Status Badge */}
                        </div>
                    </div>

                    {/* Responsible & Type */}
                    <div className="text-sm text-gray-700 mb-3 border-b border-gray-100 pb-2">
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                            <Tag className="w-3 h-3 mr-1 text-indigo-400"/> 
                            <span className="font-semibold text-gray-600">{output.ouputType}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                            <User className="w-3 h-3 mr-1" />
                            <span className="font-medium text-gray-600">{output?.responsible || 'Unassigned'}</span>
                        </div>
                    </div>

                    {/* Cost Estimate Section */}
                    <div className="flex items-center text-sm text-gray-700">
                        <DollarSign className="w-4 h-4 mr-2 text-red-500" />
                        <span className="font-bold mr-1">Cost Estimate:</span> 
                        {formatCurrency(output.costEstimate)}
                    </div>

                    {/* Activity Count Badge/View Icon */}
                    <div className="absolute ml-auto top-4 right-4 text-indigo-400 group-hover:text-indigo-600 transition">
                        {output._count.activities > 0 && (
                        <sup className="-top-3 -right-3 text-xs bg-indigo-100 text-indigo-700 rounded-full px-1 py-0.5 font-bold absolute shadow-sm">
                            {output._count.activities}
                        </sup>
                        )}
                        <ArrowUpRight className="w-5 h-5" />
                    </div>
                </a>
            );
        })}
    </div>
);


// --- PAGINATION CONTROLS COMPONENT ---
interface PaginationControlsProps {
    filteredOutputsLength: number;
    pageSize: number;
    itemOffset: number;
    handlePageClick: (args: { selected: number }) => void;
    handlePageSizeChange: (newPageSize: string) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    filteredOutputsLength,
    pageSize,
    itemOffset,
    handlePageClick,
    handlePageSizeChange,
}) => {
    if (filteredOutputsLength === 0) return null;
        
    const currentPageIndex = Math.floor(itemOffset / pageSize);
    const totalPages = Math.ceil(filteredOutputsLength / pageSize);
    const startRange = itemOffset + 1;
    const endRange = Math.min(itemOffset + pageSize, filteredOutputsLength);
    const paginationSummary = `${startRange}-${endRange} of ${filteredOutputsLength}`;
    
    return (
        <div className="mt-6 flex justify-between items-center px-4 py-3 bg-white rounded-xl shadow-md border border-gray-100">
            
            <div className="text-sm text-gray-500 font-semibold hidden md:block">
                Page {currentPageIndex + 1} of {totalPages}
            </div>

            <div className="flex items-center">
                <div key="summary" className={cn("text-sm mr-2 sm:mr-4", INDIGO_PRIMARY, "font-semibold", GRAY_ACCENT)}>
                    {paginationSummary}
                </div>
                
                <select
                    className={cn('h-9 px-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden sm:block', "bg-white")}
                    value={pageSize}
                    key={'pagesize-selector'}
                    onChange={(e) => handlePageSizeChange(e.target.value)}
                > 
                    {PAGE_SIZE_OPTIONS.map(size => (
                        <option key={size} value={size}>{size} per page</option>
                    ))}
                </select>

                <button 
                    key="prev"
                    onClick={() => handlePageClick({ selected: currentPageIndex - 1 })} 
                    disabled={itemOffset === 0}
                    className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`, "transition")}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <button 
                    key="next"
                    onClick={() => handlePageClick({ selected: currentPageIndex + 1 })}
                    disabled={endRange >= filteredOutputsLength}
                    className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`, "transition")}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

interface OuputListClientProps {
    currentUser: SafeUser | null;
}
    
const OutputsListPage: React.FC<OuputListClientProps> = ({
    currentUser 
}) => {
    const [outputs, setOutputs] = useState<StrategyOutputListModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState<string | null>(null);

    // --- Search & Filter State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OutputStatusCategory>('ALL'); // NEW Filter State
    const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE); 
    const [itemOffset, setItemOffset] = useState(0); 
    const allowedRoles: string[] = ['admin', 'executive'];

    const hasRequiredRole = useMemo(() => {
        if (!currentUser) {
            return false;
        }
        const isGlobalAdmin = currentUser.isAdmin === true;
        const hasRoleAccess = currentUser.roles 
            && currentUser.roles.some((role: string) => 
                allowedRoles.includes(role.toLowerCase())
            );
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
        async function fetchOutputs() {
            try {
                // NOTE: The API MUST now return the new fields (isCompleted, completionDate, dueDate)
                const response = await fetch('/api/outputs'); 
                if (!response.ok) {
                    throw new Error('Failed to load outputs list.');
                }
                const data: StrategyOutputListModel[] = await response.json();
                setOutputs(data);
                if (currentUser && currentUser.pageSize) {
                    setPageSize(currentUser.pageSize);
                }
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchOutputs();
    }, [currentUser]);

    // --- Filtering and Pagination Logic ---
    const filteredOutputs = useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return outputs.filter(output => {
            
            // 1. Search Filtering
            const matchesSearch = 
                output.title.toLowerCase().includes(lowerSearchTerm); 
                
            // 2. Status Category Filtering
            if (statusFilter === 'ALL') {
                return matchesSearch;
            }
            
            const category = getOutputStatusCategory(output);
            const matchesStatus = category === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [outputs, searchTerm, statusFilter]);

    const paginatedOutputs = useMemo(() => {
        const endpoint = Math.min(itemOffset + pageSize, filteredOutputs.length);
        return filteredOutputs.slice(itemOffset, endpoint);
    }, [filteredOutputs, itemOffset, pageSize]);
    
    // Reset offset when filters or page size change
    useEffect(() => {
        setItemOffset(0);
    }, [searchTerm, pageSize, statusFilter]); 

    // --- PAGINATION HANDLERS (FIXED) ---
    
    const handlePageClick = useCallback(({ selected }: { selected: number }) => {
        // Calculate the total number of pages. Ensure at least 1 page for an empty list.
        const totalPages = Math.max(1, Math.ceil(filteredOutputs.length / pageSize));
        
        // 1. Clamp the selected index to be within [0, totalPages - 1].
        // This is the fix: it prevents the index from being negative (e.g., -1) 
        // or exceeding the list bounds when the next/prev buttons are clicked.
        const clampedSelected = Math.min(Math.max(0, selected), totalPages - 1);
        
        // 2. Calculate the new offset based on the clamped index
        const newOffset = clampedSelected * pageSize;
        
        setItemOffset(newOffset);
    }, [pageSize, filteredOutputs.length]);

    const handlePageSizeChange = useCallback((newPageSize: string) => {
        const numericPageSize = parseInt(newPageSize, 10);
        setPageSize(numericPageSize);
        
        if (currentUser) {
            execute({ id: currentUser?.id, pageSize: numericPageSize });
        }
        setItemOffset(0); 
    }, [currentUser, execute]); 
    
    // --- Render Guards ---

    if (!hasRequiredRole) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="p-10 m-6 max-w-lg mx-auto text-center text-red-700 border border-red-300 bg-red-50 rounded-lg shadow-md">
                    <AlertCircle className="w-10 h-10 mx-auto mb-4 text-red-500" />
                    <h3 className="font-bold text-xl mb-2">Access Denied</h3>
                    <p className="text-sm">You do not have the required role (Admin or Executive) to view the Output Register.</p>
                </div>
            </div>
        ); 
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <div className="p-4 text-lg font-medium text-gray-600">Loading Outputs...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 m-6 max-w-xl mx-auto text-red-700 border border-red-300 bg-red-50 rounded-lg shadow-md">
                <h3 className="font-bold mb-2">Error Loading Data</h3>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    const outputsToDisplay = paginatedOutputs;
    
    // --- MAIN RENDER ---
    
    return (
        <div className="container mx-auto p-2 sm:p-4 lg:p-6 font-[Inter]"> 
            
            {/* Mock Toast Notification */}
            {showToast && (
                <div className={cn("fixed top-4 right-4 z-50 p-3 rounded-lg shadow-xl text-sm font-medium", 
                    showToast.startsWith("SUCCESS") ? "bg-green-500 text-white" : "bg-red-500 text-white")}>
                    {showToast}
                </div>
            )}

            {/* Header and Action Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white py-3 px-0 sm:py-2 sm:px-0 border-b border-gray-200 mb-4"> 
                <div className="flex flex-col mb-3 sm:mb-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        Strategy Output Register
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-sm">
                        Overview of all active and historical outputs.
                    </p>
                </div>
                
            </div>
            
            {/* Search and Filter Bar (UPDATED LAYOUT) */}
            <div className="flex flex-col md:flex-row gap-3 mb-6"> 
                
                {/* Search Input (Takes 2/3 width on md) */}
                <div className="relative flex-grow md:w-8/12">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400 transition shadow-sm"
                    />
                </div>
                
                {/* Status Filter (Takes 1/3 width on md) */}
                <div className="relative md:w-4/12">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as OutputStatusCategory)}
                        className="w-full appearance-none py-2 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400 transition shadow-sm cursor-pointer"
                    >
                        <option value="ALL">Filter by Status Category (All)</option>
                        <option value="COMPLETED">Completed 🟢</option>
                        <option value="PAST_DUE">Past Due 🔴</option>
                        <option value="ATTENTION_NEEDED">In Progress / Attention Needed 🟡</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            
            {/* Full Table View (Desktop/Tablet: md and up) */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 border-b border-indigo-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title / Type</th>
                            {/* NEW Column Header */}
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status Category</th> 
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost Estimate (USD)</th> 
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Responsible</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Activities</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {outputsToDisplay.map((output, index) => (
                            <DesktopTableRow 
                                key={output.id} 
                                output={output} 
                                index={index} 
                                itemOffset={itemOffset} 
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Card View (Mobile: Default to block, hidden on md and up) */}
            <MobileCardView outputsToDisplay={outputsToDisplay} itemOffset={itemOffset} />
            
            {/* Pagination Controls */}
            <PaginationControls
                filteredOutputsLength={filteredOutputs.length}
                pageSize={pageSize}
                itemOffset={itemOffset}
                handlePageClick={handlePageClick}
                handlePageSizeChange={handlePageSizeChange}
            />

            {/* Empty States */}
            {filteredOutputs.length === 0 && !isLoading && searchTerm.length > 0 && (
                <div className="mt-6 p-10 text-center bg-yellow-50 rounded-xl border border-yellow-200">
                    <h3 className="text-xl font-semibold text-gray-700">No Results Found</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your search term or status filter.</p>
                </div>
            )}

            {outputs.length === 0 && !isLoading && filteredOutputs.length === 0 && (
                <div className="mt-12 p-10 text-center bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-700">No Outputs Found</h3>
                    <p className="text-gray-500 mt-2">Start by creating your first strategic output.</p>
                </div>
            )}
        </div>
    );
}

export default OutputsListPage;