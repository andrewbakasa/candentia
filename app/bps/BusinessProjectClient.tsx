'use client'
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SafeUser } from '../types';
import { 
    ChevronLeft, ChevronRight, Search, Zap, CheckCircle, Clock, 
    TrendingUp, DollarSign, Target, RotateCw, BarChart3, ChevronDown, ChevronUp, 
    Star,
    MessageSquare,
    AlertTriangle
} from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { CommentersModal, NewProjectTemplate } from './_components/utils';
import { Hint } from '@/components/hint';
import { updatePagSize } from '@/actions/update-user-pagesize';
import { useAction } from '@/hooks/use-action';
import { toast } from 'sonner';


// --- Standardized Progress Stages (Aligned with the Prisma Enum) ---
const PROGRESS_STAGES = [
    'PROPOSAL',       // Initial idea submission
    'REVIEW',         // Under Executive Committee Review
    'ADOPTED',        // Approved for implementation
    'DEVELOPMENT',    // Currently being developed/piloted
    'IMPLEMENTATION', // Full rollout
    'COMPLETED',      // Project finished
    'SHELVED',        // Put on hold
    'ABORTED',        // Failed/cancelled
] as const;

type ProjectProgress = typeof PROGRESS_STAGES[number];
type FilterProgress = 'all' | ProjectProgress;



// --- 1. TYPE DEFINITIONS (ENHANCED with Commenters) ---
export type Commenter = {
    email: string | null;
    id: string;
    name: string | null;
    image: string | null; // Useful for showing avatars
};
// --- 1. TYPE DEFINITIONS (ENHANCED with Financial Metrics) ---
export type ProjectListItem = {
    id: string;
    title: string;
    progress: ProjectProgress | string; 
    rating: number | null;
    commentCount: number;
    // --- NEW FIELD ---
    commenters: Commenter[]; // List of users who have left comments
    // --- FINANCIAL FIELDS ---
    npv: number | null; // Net Present Value
    irr: number | null; // Internal Rate of Return (as percentage, e.g., 0.15 for 15%)
    roi: number | null; // Return on Investment (as percentage)
    paybackPeriod: number | null; // Payback Period in years/months
    riskScore: number | null;
    projectRanking: number | null;
};

interface ProjectListClientProps {
    projects: ProjectListItem[]; 
    currentUser: SafeUser | null;
}

// --- API Fetch Function (Simulated financial data addition) ---
// const fetchProjectsList = async (): Promise<ProjectListItem[]> => {
//     const url = `/api/busprojects`; 

//     try {
//         const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

//         if (!response.ok) {
//             throw new Error(`Failed to fetch projects (Status: ${response.status})`);
//         }
        
//         const projects: any[] = await response.json(); 
        
//         return projects.map((p) => ({
//             id: p.id,
//             title: p.title,
//             progress: (p.progress || 'PROPOSAL').toUpperCase() as ProjectProgress, 
//             rating: p.rating,
//             riskScore: p.riskScore,
//             commentCount: p._count?.comments || 0,
//             commenters:p.commenters,

//             // --- SIMULATION: In a real app, these come from the backend ---
//             npv: p.npv ?? (Math.random() > 0.3 ? parseFloat((Math.random() * 500000 - 100000).toFixed(2)) : null),
//             irr: p.irr ?? (Math.random() > 0.3 ? parseFloat((Math.random() * 0.40).toFixed(4)) : null),
//             roi: p.roi ?? (Math.random() > 0.3 ? parseFloat((Math.random() * 3.5).toFixed(2)) : null),
//             paybackPeriod: p.paybackPeriod ?? (Math.random() > 0.3 ? parseFloat((Math.random() * 5 + 1).toFixed(1)) : null),
//             projectRanking: p.projectRanking
//         }));

//     } catch (err: any) {
//         console.error(`Error fetching projects:`, err);
//         throw err;
//     }
// };

// --- API Fetch Function (Simulated financial data addition) ---
const fetchProjectsList = async (): Promise<ProjectListItem[]> => {
    const url = `/api/busprojects`; 

    try {
        const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

        if (!response.ok) {
            throw new Error(`Failed to fetch projects (Status: ${response.status})`);
        }
        
        // 'projects' here contains the raw data from the API, including p.comments[].user
        const projects: any[] = await response.json(); 
        
       return projects.map((p) => {
    
                // Type assertion: Treat the comments array as CommentWithUser[] to access 'user' safely
                const commentsWithUsers = (p.comments || []) as { user: Commenter }[];

                // 1. Extract and de-duplicate the users from the comments array
                // We map over commentsWithUsers, which is now correctly typed.
                const uniqueCommenters: Commenter[] = Array.from(
                    new Map(commentsWithUsers.map(comment => [comment.user.id, comment.user])).values()
                );

                return {
                    id: p.id,
                    title: p.title,
                    progress: (p.progress || 'PROPOSAL').toUpperCase() as ProjectProgress, 
                    rating: p.rating,
                    riskScore: p.riskScore,
                    commentCount: p._count?.comments || 0,
                    
                    // 2. Assign the de-duplicated list to the 'commenters' field
                    commenters: uniqueCommenters, // Type is now correctly inferred as Commenter[]

                    // --- SIMULATION: In a real app, these come from the backend ---
                    npv: p.npv ?? (Math.random() > 0.3 ? parseFloat((Math.random() * 500000 - 100000).toFixed(2)) : null),
                    irr: p.irr ?? (Math.random() > 0.3 ? parseFloat((Math.random() * 0.40).toFixed(4)) : null),
                    roi: p.roi ?? (Math.random() > 0.3 ? parseFloat((Math.random() * 3.5).toFixed(2)) : null),
                    paybackPeriod: p.paybackPeriod ?? (Math.random() > 0.3 ? parseFloat((Math.random() * 5 + 1).toFixed(1)) : null),
                    projectRanking: p.projectRanking
                };
            });

    } catch (err: any) {
        console.error(`Error fetching projects:`, err);
        throw err;
    }
};

// --- Pagination Constants ---
const DEFAULT_PAGE_SIZE = 8;
type PageSizeOption = '2' |'4' | '8' | '16' | '24';
const INDIGO_PRIMARY = 'text-indigo-600';
const INDIGO_HOVER_BG = 'hover:bg-indigo-50';
const GRAY_ACCENT = 'text-gray-500';


// --- Utility Function: Get status badge styling ---
const getStatusBadge = (progress: string) => {
    const lowerProgress = progress.toLowerCase();
    
    switch (lowerProgress) {
        case 'proposal':
            return { icon: <Zap className="w-3 h-3 mr-1" />, color: 'bg-yellow-100 text-yellow-800', display: 'Proposal' };
        case 'review':
        case 'adopted':
            return { icon: <Clock className="w-3 h-3 mr-1" />, color: 'bg-indigo-100 text-indigo-800', display: 'Review/Approved' };
        case 'development':
        case 'implementation':
            return { icon: <Zap className="w-3 h-3 mr-1" />, color: 'bg-blue-100 text-blue-800', display: 'Active' };
        case 'completed':
            return { icon: <CheckCircle className="w-3 h-3 mr-1" />, color: 'bg-green-100 text-green-800', display: 'Completed' };
        case 'shelved':
            return { icon: <Clock className="w-3 h-3 mr-1" />, color: 'bg-gray-200 text-gray-700', display: 'Shelved' };
        case 'aborted':
            return { icon: <Zap className="w-3 h-3 mr-1" />, color: 'bg-red-100 text-red-800', display: 'Aborted' };
        default:
            return { icon: null, color: 'bg-gray-100 text-gray-800', display: progress };
    }
}


// Helper to determine NPV text color
const getNPVColor = (value: number | null) => 
    value === null ? 'text-gray-700' : value >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold';

// Helper to determine Risk Score text color
const getRiskColor = (value: number | null) => {
    if (value === null) return 'text-gray-700';
    if (value >= 4) return 'text-red-700 font-extrabold';
    if (value >= 2.5) return 'text-yellow-700 font-extrabold';
    return 'text-green-700 font-extrabold';
};

// Helper to determine Risk Score container color
const getRiskBackgroundColor = (value: number | null) => {
    if (value === null) return 'bg-gray-100 border-gray-200';
    if (value >= 4) return 'bg-red-50 border-red-300/80'; // High Risk
    if (value >= 2.5) return 'bg-yellow-50 border-yellow-300/80'; // Medium Risk
    return 'bg-green-50 border-green-300/80'; // Low Risk
};


// --- 2. RENAMED COMPONENT: Project Expansion Row (Handles the Dropdown/Expansion) ---
interface ProjectExpansionRowProps {
    project: ProjectListItem;
    isExpanded: boolean;
    onToggle: (id: string) => void;
}

  

const ProjectExpansionRow: React.FC<ProjectExpansionRowProps> = ({ project, isExpanded, onToggle }) => {
    // Check if any key data is present to justify the expansion
    const hasKeyData = project.npv !== null || project.irr !== null || project.riskScore !== null || project.rating !== null;
         // Action to update user page size
    
    if (!hasKeyData) {
        return (
            <tr className="bg-gray-50">
                <td colSpan={5} className="px-6 py-2 text-center text-sm italic text-gray-500 border-t border-gray-200">
                    Detailed financial metrics are not yet calculated for this project.
                </td>
            </tr>
        );
    }
         
      
    // Helper to format currency (full number)
    const formatCurrency = (value: number | null) => 
        value !== null ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'N/A';
    
    // Helper to format percentage
    const formatPercent = (value: number | null) => 
        value !== null ? `${(value * 100).toFixed(1)}%` : 'N/A';
    
    
  


    // return (
    //     <React.Fragment>
          
    //         {isExpanded && (
    //             <tr className="bg-gray-50 border-t border-gray-200 transition-all duration-300 ease-in-out">
    //                 <td colSpan={5} className="px-6 py-5">
    //                     <div className="text-base font-semibold text-gray-700 mb-4 flex items-center">
    //                         <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
    //                         Financial Projections and Risk Assessment
    //                     </div>
                        
    //                     {/* Grid of Financial Cards */}
    //                     <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            
    //                         {/* NPV - Highlighted as critical metric */}
    //                         <div 
    //                             className={cn(
    //                                 "p-4 rounded-xl border shadow-lg transform hover:scale-[1.02] transition duration-200", 
    //                                 project.npv !== null && project.npv >= 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
    //                             )}
    //                         >
    //                             <span className="text-xs font-bold uppercase text-gray-500 flex items-center mb-1">
    //                                 <DollarSign className="w-4 h-4 mr-1 text-gray-500" /> NPV
    //                             </span>
    //                             <span className={cn('text-xl font-extrabold', getNPVColor(project.npv))}>
    //                                 {formatCurrency(project.npv)}
    //                             </span>
    //                         </div>

    //                         {/* IRR */}
    //                         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition duration-200">
    //                             <span className="text-xs font-bold uppercase text-gray-500 flex items-center mb-1">
    //                                 <TrendingUp className="w-4 h-4 mr-1 text-gray-500" /> IRR
    //                             </span>
    //                             <span className="text-xl text-blue-700 font-extrabold">
    //                                 {formatPercent(project.irr)}
    //                             </span>
    //                         </div>

    //                         {/* ROI */}
    //                         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition duration-200">
    //                             <span className="text-xs font-bold uppercase text-gray-500 flex items-center mb-1">
    //                                 <Target className="w-4 h-4 mr-1 text-gray-500" /> ROI
    //                             </span>
    //                             <span className="text-xl text-green-700 font-extrabold">
    //                                 {project.roi !== null ? `${project.roi.toFixed(2)}x` : 'N/A'}
    //                             </span>
    //                         </div>

    //                         {/* Payback Period */}
    //                         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition duration-200">
    //                             <span className="text-xs font-bold uppercase text-gray-500 flex items-center mb-1">
    //                                 <Clock className="w-4 h-4 mr-1 text-gray-500" /> Payback Period
    //                             </span>
    //                             <span className="text-xl text-yellow-800 font-extrabold">
    //                                 {project.paybackPeriod !== null ? `${project.paybackPeriod} yrs` : 'N/A'}
    //                             </span>
    //                         </div>

    //                         {/* Risk Score - Highlighted for risk management visibility */}
    //                         <div 
    //                             className={cn(
    //                                 "p-4 rounded-xl border-2 shadow-lg transform hover:scale-[1.02] transition duration-200", 
    //                                 getRiskBackgroundColor(project.riskScore)
    //                             )}
    //                         >
    //                             <span className="text-xs font-bold uppercase text-gray-500 flex items-center mb-1">
    //                                 <AlertTriangle className="w-4 h-4 mr-1 text-gray-500" /> Risk Score
    //                             </span>
    //                             <span className={cn('text-xl font-extrabold', getRiskColor(project.riskScore))}>
    //                                 {project.riskScore !== null ? project.riskScore.toFixed(1) : 'N/A'}
    //                             </span>
    //                         </div>
                            
    //                     </div>
    //                 </td>
    //             </tr>
    //         )}
    //     </React.Fragment>
    // );
   
// Assuming cn, formatCurrency, formatPercent, getNPVColor, getRiskBackgroundColor, getRiskColor, 
// and the icon components (BarChart3, DollarSign, TrendingUp, Target, Clock, AlertTriangle) are defined elsewhere.

// NOTE: This file is a snippet and assumes required props (isExpanded, project) and
// external functions (cn, formatCurrency, etc.) are available in the scope.

   return (
        <React.Fragment>
            {/* Project Details Row (Expanded view) */}
            {isExpanded && (
                <tr className="bg-white border-t border-gray-200 transition-all duration-300 ease-in-out">
                    <td colSpan={5} className="px-6 py-1">
                        
                        {/* OUTER BORDER CONTAINER (Yellow border applied here) */}
                        <div className="p-5 border-2 border-yellow-100 rounded-xl bg-white shadow-xl">
                            <div className="text-base font-semibold text-gray-700 mb-4 flex items-center">
                                {/* Assuming BarChart3 is an imported icon */}
                                {/* <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" /> */}
                                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                                Financial Projections and Risk Assessment
                            </div>
                            
                            {/* Grid of Financial Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                
                                {/* NPV - Highlighted as critical metric */}
                                <div 
                                    className={cn(
                                        "p-4 rounded-xl border shadow-lg transform hover:scale-[1.02] transition duration-200", 
                                        project.npv !== null && project.npv >= 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
                                    )}
                                >
                                    <span className="text-xs font-bold uppercase text-gray-500 flex items-center mb-1">
                                        {/* <DollarSign className="w-4 h-4 mr-1 text-gray-500" /> NPV */}
                                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        NPV
                                    </span>
                                    <span className={cn('text-xl font-extrabold', getNPVColor(project.npv))}>
                                        {formatCurrency(project.npv)}
                                    </span>
                                </div>

                                {/* IRR - ADDED YELLOW BORDER AND HOVER EFFECT */}
                                <div className="bg-white p-4 rounded-xl border-2 border-yellow-400 shadow-md hover:shadow-lg hover:bg-yellow-50 transition duration-200">
                                    <span className="text-xs font-bold uppercase text-gray-500 flex items-center mb-1">
                                        {/* <TrendingUp className="w-4 h-4 mr-1 text-gray-500" /> IRR */}
                                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8L10 21"></path></svg>
                                        IRR
                                    </span>
                                    <span className="text-xl text-blue-700 font-extrabold">
                                        {formatPercent(project.irr)}
                                    </span>
                                </div>

                                {/* ROI - ADDED YELLOW BORDER AND HOVER EFFECT */}
                                <div className="bg-white p-4 rounded-xl border-2 border-yellow-400 shadow-md hover:shadow-lg hover:bg-yellow-50 transition duration-200">
                                    <span className="text-xs font-bold uppercase text-gray-500 flex items-center mb-1">
                                        {/* <Target className="w-4 h-4 mr-1 text-gray-500" /> ROI */}
                                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM10 10v4m0-4h4m-4 0v4m-4 0h4"></path></svg>
                                        ROI
                                    </span>
                                    <span className="text-xl text-green-700 font-extrabold">
                                        {project.roi !== null ? `${project.roi.toFixed(2)}x` : 'N/A'}
                                    </span>
                                </div>

                                {/* Payback Period - ADDED YELLOW BORDER AND HOVER EFFECT */}
                                <div className="bg-white p-4 rounded-xl border-2 border-yellow-400 shadow-md hover:shadow-lg hover:bg-yellow-50 transition duration-200">
                                    <span className="text-xs font-bold uppercase text-gray-500 flex items-center mb-1">
                                        {/* <Clock className="w-4 h-4 mr-1 text-gray-500" /> Payback Period */}
                                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        Payback Period
                                    </span>
                                    <span className="text-xl text-yellow-800 font-extrabold">
                                        {project.paybackPeriod !== null ? `${project.paybackPeriod} yrs` : 'N/A'}
                                    </span>
                                </div>

                                {/* Risk Score - Highlighted for risk management visibility */}
                                <div 
                                    className={cn(
                                        "p-4 rounded-xl border-2 shadow-lg transform hover:scale-[1.02] transition duration-200", 
                                        getRiskBackgroundColor(project.riskScore)
                                    )}
                                >
                                    <span className="text-xs font-bold uppercase text-gray-500 flex items-center mb-1">
                                        {/* <AlertTriangle className="w-4 h-4 mr-1 text-gray-500" /> Risk Score */}
                                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                        Risk Score
                                    </span>
                                    <span className={cn('text-xl font-extrabold', getRiskColor(project.riskScore))}>
                                        {project.riskScore !== null ? project.riskScore.toFixed(1) : 'N/A'}
                                    </span>
                                </div>
                                
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );

};


// --- Main Client Component ---

const ProjectListPage: React.FC<ProjectListClientProps> = ({
    projects: initialProjects,
    currentUser,
}) => {
    const [projects, setProjects] = useState<ProjectListItem[]>(initialProjects);
    const [isRefreshing, setIsRefreshing] = useState(false); 
    const [error, setError] = useState<string | null>(null); 
    const [isAddingNew, setIsAddingNew] = useState(false);
    
    // --- STATE: Tracks expanded financial rows ---
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // --- FILTER & PAGINATION STATE (Unchanged) ---
    const [filterTerm, setFilterTerm] = useState(''); 
    const [filterProgress, setFilterProgress] = useState<FilterProgress>('all'); 
    const [pageSize, setPageSize] = useState<number>(
        currentUser && currentUser.pageSize ? currentUser.pageSize : DEFAULT_PAGE_SIZE
    ); 
    const [itemOffset, setItemOffset] = useState(0); 

    // --- NEW STATE: Tracks the project whose commenters list is open ---
    const [openCommentersProjectId, setOpenCommentersProjectId] = useState<string | null>(null);

    const { execute, fieldErrors } = useAction(updatePagSize, {
        onSuccess: (data) => {
            toast.success(`PageSize for ${data.email} updated to ${data.pageSize}`);
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // Function to close the modal/popover
    const handleCloseCommenters = () => {
        setOpenCommentersProjectId(null);
    };

    // --- TOGGLE HANDLER (For Project Expansion Details) ---
    const handleToggleRow = useCallback((projectId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) {
                newSet.delete(projectId);
            } else {
                newSet.add(projectId);
            }
            return newSet;
        });
    }, []);

    // --- MEMOIZED/PAGINATED LOGIC (Unchanged) ---
    const filteredProjects = useMemo(() => {
        const lowerFilterTerm = filterTerm.toLowerCase().trim();
        const upperFilterProgress = filterProgress.toUpperCase();

        return projects.filter(project => {
            const projectProgressUpper = (project.progress || 'PROPOSAL').toUpperCase();
            const matchesTitle = project.title.toLowerCase().includes(lowerFilterTerm);
            const matchesProgress = 
                upperFilterProgress === 'ALL' || 
                projectProgressUpper === upperFilterProgress;

            return matchesTitle && matchesProgress;
        });
    }, [projects, filterTerm, filterProgress]); 
    
    const pageCount = useMemo(() => {
        return Math.ceil(filteredProjects.length / pageSize);
    }, [filteredProjects.length, pageSize]);

    const paginatedProjects = useMemo(() => {
        const endpoint = Math.min(itemOffset + pageSize, filteredProjects.length);
        return filteredProjects.slice(itemOffset, endpoint);
    }, [filteredProjects, itemOffset, pageSize]);
    

    // --- PAGINATION HANDLERS (Unchanged) ---
    useEffect(() => {
        if (itemOffset >= filteredProjects.length && filteredProjects.length > 0) {
            setItemOffset(0);
        } else if (filteredProjects.length === 0) {
            setItemOffset(0);
        }
    }, [filteredProjects.length, pageSize]);
    
    // const handlePageSizeChange = (newPageSize: PageSizeOption) => {
    //     const numericPageSize = parseInt(newPageSize, 10);
    //     setPageSize(numericPageSize);
    //     setItemOffset(0);
    // };

    const handlePageSizeChange = (newPageSize: PageSizeOption) => {
        const numericPageSize = parseInt(newPageSize, 10);
        setPageSize(numericPageSize);
        if (currentUser) {
            execute({
                id: currentUser?.id,
                pageSize: numericPageSize
            });
        }
        setItemOffset(0); // Reset to the first page when page size changes
    };


    const handlePageClick = ({ selected }: { selected: number }) => {
        const newOffset = (selected * pageSize) % filteredProjects.length;
        setItemOffset(newOffset);
    };

    const renderPaginationButtons = (showPageSize = true) => {
        if (filteredProjects.length === 0) return null;
        
        const buttons = [];
        const currentPageIndex = Math.floor(itemOffset / pageSize);
        const startRange = itemOffset + 1;
        const endRange = Math.min(itemOffset + pageSize, filteredProjects.length);
        const paginationSummary = `${startRange}-${endRange} of ${filteredProjects.length}`;

        buttons.push(
            <div key="summary" className={cn("text-sm mr-2 sm:mr-4", INDIGO_PRIMARY, "font-semibold", GRAY_ACCENT)}>
                {paginationSummary}
            </div>
        );
        
        if (showPageSize) {
            buttons.push(
                <select
                    className={cn('h-9 px-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden sm:block', INDIGO_PRIMARY)}
                    value={pageSize}
                    key={'pagesize-selector'}
                    onChange={(e) => handlePageSizeChange(e.target.value as PageSizeOption)}
                > 
                    <option value="2">2 per page</option>
                    <option value="4">4 per page</option>
                    <option value="8">8 per page</option>
                    <option value="16">16 per page</option>
                    <option value="24">24 per page</option>
                </select>
            );
        }

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
        buttons.push(
            <button 
                key="next"
                onClick={() => handlePageClick({ selected: currentPageIndex + 1 })}
                disabled={endRange >= filteredProjects.length}
                className={cn("p-1 mx-1 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent", `text-gray-600 ${INDIGO_HOVER_BG}`)}
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        );
        
        return <div className="flex items-center">{buttons}</div>;
    };


    // Callback to perform the client-side refresh (Unchanged)
    const refreshProjects = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);
        try {
            const data = await fetchProjectsList();
            setProjects(data);
            setFilterTerm(''); 
            setFilterProgress('all');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during refresh.');
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // handleNewProjectSubmit (Unchanged logic)
    const handleNewProjectSubmit = async (data: { title: string, description: string }) => {
        if (!currentUser) {
            setError('You must be logged in to propose a project.');
            return;
        }

        setError(null);
        try {
            const response = await fetch('/api/busprojects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                const text = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(text);
                } catch {
                    throw new Error(`Failed to create project (Status: ${response.status}).`);
                }
                throw new Error(errorData.message || 'Failed to create project.');
            }

            console.log('Project created successfully.');
            setIsAddingNew(false);
            refreshProjects(); 
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.message);
        }
    };

    // --- 3. UPDATED COMPONENT: Mobile Card View ---
    const MobileProjectCard: React.FC<{ project: ProjectListItem }> = ({ project }) => {
        const isExpanded = expandedRows.has(project.id);
        const { icon, color, display } = getStatusBadge(project.progress);

        // Helper to format currency (Improved to handle large numbers better)
        const formatCurrency = (value: number | null) => 
            value !== null ? `$${value.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })}` : 'N/A';
        
        // Helper to determine NPV color
        const getNPVColor = (value: number | null) => 
            value === null ? 'text-gray-600' : value >= 0 ? 'text-green-700 font-extrabold' : 'text-red-600 font-extrabold';
        
        // Helper to get text color for IRR
        const getIRRColor = (value: number | null) => {
            if (value === null) return 'text-gray-600';
            return value > 0.1 ? 'text-blue-700' : 'text-gray-700';
        };

        return (
            <div 
                key={project.id} 
                className="bg-white p-4 mb-4 rounded-xl shadow-lg border border-gray-100 transition duration-300 hover:shadow-xl"
            >
                
                {/* 1. HEADER: Title and Primary Status */}
                <div className="flex items-start justify-between">
                    <Hint
                        sideOffset={5}
                        description={"View Project Details & Discussion"}
                    >
                        {/* Title Link */}
                        <Link 
                            href={`/bp/${project.id}`} 
                            className="text-lg font-bold text-indigo-700 hover:text-indigo-800 transition block pr-4"
                        >
                            {project.title}
                        </Link>
                    </Hint>

                    {/* Status Badge */}
                    <span className={`flex-shrink-0 px-3 py-1 text-xs leading-5 font-semibold rounded-full items-center whitespace-nowrap ${color}`}>
                        {icon}
                        {display}
                    </span>
                </div>

                {/* 2. KEY METRICS & SECONDARY INFO */}
                <div className="grid grid-cols-3 gap-2 mt-4 pb-4 border-b border-gray-100">
                    
                    {/* NPV - Most Important Metric */}
                    <div className="flex flex-col items-start col-span-2">
                        <span className="text-xs font-medium text-gray-500 flex items-center mb-0.5">
                            <DollarSign className="w-3 h-3 mr-1" />
                            Net Present Value
                        </span>
                        <span className={cn('text-xl', getNPVColor(project.npv))}>
                            {formatCurrency(project.npv)}
                        </span>
                    </div>

                    {/* Rating */}
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-gray-500 mb-0.5">Rating</span>
                        <span className="text-base text-gray-800 font-bold flex items-center">
                            {project.rating !== null ? project.rating.toFixed(1) : 'N/A'} 
                            <Star className="w-4 h-4 ml-1 text-yellow-500 fill-current" />
                        </span>
                    </div>
                </div>

                {/* 3. COMMENT COUNT & TOGGLE BUTTON */}
                <div className="flex justify-between items-center pt-3">
                    
                    {/* Comments Badge (Cleaned up) */}
                    {/* <div className="flex items-center space-x-1.5 text-sm text-gray-600 font-medium"> 
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        <span>Comments</span>
                        {project.commentCount > 0 && (
                            <span className="text-xs font-bold text-white bg-indigo-600 rounded-full h-5 w-5 flex items-center justify-center -translate-y-1">
                                {project.commentCount}
                            </span>
                        )}
                    </div> */}
                    {/* Comments Badge - WRAPPED IN A BUTTON/CLICKABLE ELEMENT */}
                    {project.commentCount > 0 ? (
                        <button 
                            // Call the handler to open the modal for this project
                            onClick={() => setOpenCommentersProjectId(project.id)} 
                            className="flex items-center space-x-1.5 text-sm text-gray-600 font-medium cursor-pointer hover:text-indigo-600 transition"
                        > 
                            <MessageSquare className="w-4 h-4 text-indigo-500" />
                            <span>Commenters</span>
                            <span className="text-xs font-bold text-white bg-indigo-600 rounded-full h-5 w-5 flex items-center justify-center -translate-y-1">
                                {project.commentCount}
                            </span>
                        </button>
                    ) : (
                        <div className="flex items-center space-x-1.5 text-sm text-gray-500">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            <span>No Comments</span>
                        </div>
                    )}

                    {/* MOBILE TOGGLE BUTTON */}
                    <button
                        onClick={() => handleToggleRow(project.id)}
                        className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition focus:outline-none"
                    >
                        {isExpanded ? (
                            <>
                                Hide Metrics <ChevronUp className="w-4 h-4 ml-1" />
                            </>
                        ) : (
                            <>
                                Show All Metrics <ChevronDown className="w-4 h-4 ml-1" />
                            </>
                        )}
                    </button>
                </div>

                {/* 4. MOBILE EXPANDED CONTENT (Cleaner layout and focus on risk) */}
                {isExpanded && (
                    <div className="mt-4 p-4 border-2 border-yellow-50 rounded-lg grid grid-cols-2 gap-y-4 gap-x-3 text-sm transition-all duration-300 animate-in fade-in">
                        
                        {/* RISK SCORE (Highlight this for visibility) */}
                        <div className="p-2 bg-red-50/50 rounded-lg border border-red-200">
                            <span className="text-xs font-bold text-red-700 block mb-0.5">Risk Score (1-5)</span>
                            <p className={cn('text-lg font-extrabold', getRiskColor(project.riskScore))}>
                                {project.riskScore !== null ? project.riskScore.toFixed(1) : 'N/A'}
                            </p>
                        </div>

                        {/* Project Ranking */}
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <span className="text-xs font-bold text-gray-600 block mb-0.5">Priority Rank</span>
                            <p className="text-lg text-gray-800 font-extrabold">
                                {project.projectRanking!== null ? `#${project.projectRanking}` : 'N/A'}
                            </p>
                        </div>

                        {/* IRR */}
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <span className="text-xs font-bold text-gray-600 block mb-0.5">IRR</span>
                            <p className={cn('text-lg font-extrabold', getIRRColor(project.irr))}>
                                {project.irr !== null ? `${(project.irr * 100).toFixed(1)}%` : 'N/A'}
                            </p>
                        </div>

                        {/* ROI */}
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <span className="text-xs font-bold text-gray-600 block mb-0.5">ROI</span>
                            <p className="text-lg text-green-700 font-extrabold">
                                {project.roi !== null ? `${project.roi.toFixed(2)}x` : 'N/A'}
                            </p>
                        </div>
                        
                        {/* Payback Period */}
                        <div className="col-span-2 p-2 bg-gray-50 rounded-lg">
                            <span className="text-xs font-bold text-gray-600 block mb-0.5">Payback Period</span>
                            <p className="text-lg text-yellow-800 font-extrabold">
                                {project.paybackPeriod !== null ? `${project.paybackPeriod} years` : 'N/A'}
                            </p>
                        </div>
                    </div>
                )}

                {/* --- NEW: Commenters Modal Render --- */}
                {/* {openCommentersProjectId && (
                    <CommentersModal
                        project={projects.find(p => p.id === openCommentersProjectId)!}
                        onClose={handleCloseCommenters}
                    />
                )} */}
            </div>
        )
    }

    const formatCurrencyCompact = (value: number | null) => 
        value !== null ? `$${value.toLocaleString('en-US', { notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 })}` : 'N/A';
    
    const getNPVColor = (value: number | null) => 
        value === null ? 'text-gray-600' : value >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold';


    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            
            {/* --- HEADER (Title & Main Action Button) --- */}
            <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center mb-8 pb-4 border-b border-gray-200">
                
                {/* Title & Count Group */}
                <div className="flex flex-col">
                    <h1 className="text-xl sm:text-4xl  font-extrabold text-gray-900 tracking-tight">
                        🤝 Project Collaboration Portal
                    </h1>
                    {/* Count displayed as a clear subtitle */}
                    <p className="text-sm font-medium text-gray-500 mt-1">
                        Showing <span className="font-bold text-indigo-600">{filteredProjects.length}</span> out of {projects.length} Total Projects
                    </p>
                </div>
                
                {/* Primary Action Button - Enhanced Style */}
                <button 
                    onClick={() => setIsAddingNew(!isAddingNew)} 
                    className="flex-shrink-0 bg-indigo-600 text-white py-3 px-6 rounded-full shadow-xl hover:bg-indigo-700 transition duration-300 font-semibold text-sm transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                >
                    {isAddingNew ? 'Close Proposal Template' : '➕ Propose New Business Project'}
                </button>
            </div>

            {isAddingNew && (
                <NewProjectTemplate onSubmit={handleNewProjectSubmit} />
            )}

            {/* --- FILTER UI CONTROLS (Structured as a Control Bar) --- */}
            <div className="bg-white p-5 rounded-2xl shadow-2xl mb-8 border border-gray-100">
                {/* Use grid for desktop layout control: 2/3 width for search, 1/3 for dropdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    
                    {/* Search Filter by Title */}
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects.."
                            value={filterTerm}
                            onChange={(e) => {
                                setFilterTerm(e.target.value);
                                setItemOffset(0);
                            }}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                        />
                    </div>
                    
                    {/* Filter by Progress/Status Dropdown */}
                    <div className="relative">
                        <select
                            value={filterProgress.toLowerCase()}
                            onChange={(e) => {
                                setFilterProgress(e.target.value.toUpperCase() as FilterProgress); 
                                setItemOffset(0);
                            }}
                            className="w-full appearance-none py-3 px-4 border border-gray-300 rounded-xl bg-white text-gray-700 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm cursor-pointer"
                        >
                            <option value="all" className="text-gray-500">Filter by Status</option>
                            {PROGRESS_STAGES.map(stage => (
                                <option key={stage} value={stage.toLowerCase()}>
                                    {stage.charAt(0) + stage.slice(1).toLowerCase().replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                        {/* Custom chevron to fix default select arrow for better visual consistency */}
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    
                </div>
            </div>
            {/* --- End FILTER UI CONTROLS --- */}

            {/* Error and Loading Feedback */}
            {isRefreshing && <p className="text-blue-500 italic">Refreshing project list...</p>}
            {error && <p className="text-red-700 font-semibold p-3 bg-red-100 border border-red-300 rounded-lg shadow-sm">Error: {error}</p>}
            
            {/* Empty States */}
            {!isRefreshing && !error && projects.length === 0 && (
                <p className="text-gray-500 p-4 border rounded-lg bg-white">No projects found. Be the first to propose one!</p>
            )}
            {!isRefreshing && !error && projects.length > 0 && filteredProjects.length === 0 && (
                <p className="text-gray-500 p-4 border rounded-lg bg-yellow-50">No projects match the current filter criteria.</p>
            )}
            
            {/* --- Project List Table (Desktop View) --- */}
            {!isRefreshing && !error && filteredProjects.length > 0 && (
                <div className="hidden md:block">
                    <table className="min-w-full divide-y divide-gray-200 rounded-2xl overflow-hidden shadow-2xl"> {/* Enhanced shadow and rounding */}
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Progress</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider flex items-center">
                                    Financials (NPV) <BarChart3 className="w-4 h-4 ml-1" />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Comments</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedProjects.map((project) => {
                                const { icon, color, display } = getStatusBadge(project.progress);
                                const isExpanded = expandedRows.has(project.id);
                                
                                return (
                                    <React.Fragment key={project.id}>
                                        <tr className="hover:bg-indigo-50 transition duration-150 ease-in-out">
                                            <Hint
                                                sideOffset={10}
                                                description={ "Click here for more details..."}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap  text-sm font-medium">
                                                    <Link href={`/bp/${project.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold">
                                                        {project.title}
                                                    </Link>
                                                </td>
                                            </Hint>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm items-center ${color}`}>
                                                    {icon}
                                                    {display}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {project.rating !== null ? `${project.rating.toFixed(1)} ⭐` : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <span className={getNPVColor(project.npv)}>
                                                         {/* Changed to use the compact formatter for the main column */}
                                                         {formatCurrencyCompact(project.npv)}
                                                    </span>
                                                    {(project.npv !== null || project.irr !== null || project.roi !== null || project.riskScore !== null) && (
                                                        <button
                                                            onClick={() => handleToggleRow(project.id)}
                                                            className="text-indigo-500 hover:text-indigo-700 p-1 rounded-full transition"
                                                            title={isExpanded ? 'Hide Details' : 'Show Details'}
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                
                                                  {project.commentCount > 0 ? (
                                                        <button 
                                                            // Call the handler to open the modal for this project
                                                            onClick={() => setOpenCommentersProjectId(project.id)} 
                                                            className="flex items-center space-x-1.5 text-sm text-gray-600 font-medium cursor-pointer hover:text-indigo-600 transition"
                                                        > 
                                                            <MessageSquare className="w-4 h-4 text-indigo-500" />
                                                            <span>Commenters</span>
                                                            <span className="text-xs font-bold text-white bg-indigo-600 rounded-full h-5 w-5 flex items-center justify-center -translate-y-1">
                                                                {project.commentCount}
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center space-x-1.5 text-sm text-gray-500">
                                                            <MessageSquare className="w-4 h-4 text-gray-400" />
                                                            <span>No Comments</span>
                                                        </div>
                                                    )}
                                            </td>
                                        </tr>
                                        {/* --- EXPANDED DETAILS ROW (RENAMED/UPDATED COMPONENT) --- */}
                                        <ProjectExpansionRow project={project} isExpanded={isExpanded} onToggle={handleToggleRow} />
                                        
                                    </React.Fragment>
                                )})}
                        </tbody>
                    </table>

                    {/* --- MODAL RENDERING MOVED OUTSIDE OF THE LOOP (Performance Improvement) --- */}
                    {openCommentersProjectId && (
                    <CommentersModal
                        project={projects.find(p => p.id === openCommentersProjectId)!}
                        onClose={handleCloseCommenters}
                    />
                )}
                </div>
            )}

            {/* --- Mobile View (Card Layout) --- */}
            {!isRefreshing && !error && filteredProjects.length > 0 && (
                <div className="block md:hidden">
                    {paginatedProjects.map((project) => (
                        <MobileProjectCard key={project.id} project={project} />
                    ))}

                      {/* --- Improve efficiency here --- */}
                    {openCommentersProjectId && (
                        <CommentersModal
                            project={projects.find(p => p.id === openCommentersProjectId)!}
                            onClose={handleCloseCommenters}
                        />
                    )}
                </div>
            )}

            {/* --- Footer Pagination Controls (Always visible when needed) --- */}
            {filteredProjects.length > 0 && (
                <div className="mt-8 flex justify-center items-center p-4 bg-gray-50 rounded-xl shadow-inner">
                    {renderPaginationButtons(true)} 
                </div>
            )}
        </div>
    );
};


export default ProjectListPage;