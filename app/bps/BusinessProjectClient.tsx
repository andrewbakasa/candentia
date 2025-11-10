'use client'
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SafeUser } from '../types';
import { 
    ChevronLeft, ChevronRight, Search, Zap, CheckCircle, Clock, 
    TrendingUp, DollarSign, Target, RotateCw, BarChart3, ChevronDown, ChevronUp 
} from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { NewProjectTemplate } from './_components/utils';
import { Hint } from '@/components/hint';


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


// --- 1. TYPE DEFINITIONS (ENHANCED with Financial Metrics) ---
type ProjectListItem = {
    id: string;
    title: string;
    progress: ProjectProgress | string; 
    rating: number | null;
    commentCount: number;
    // --- FINANCIAL FIELDS ---
    npv: number | null; // Net Present Value
    irr: number | null; // Internal Rate of Return (as percentage, e.g., 0.15 for 15%)
    roi: number | null; // Return on Investment (as percentage)
    paybackPeriod: number | null; // Payback Period in years/months
    riskScore: number | null;
};

interface ProjectListClientProps {
    projects: ProjectListItem[]; 
    currentUser: SafeUser | null;
}

// --- API Fetch Function (Simulated financial data addition) ---
const fetchProjectsList = async (): Promise<ProjectListItem[]> => {
    const url = `/api/busprojects`; 

    try {
        const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

        if (!response.ok) {
            throw new Error(`Failed to fetch projects (Status: ${response.status})`);
        }
        
        const projects: any[] = await response.json(); 
        
        return projects.map((p) => ({
            id: p.id,
            title: p.title,
            progress: (p.progress || 'PROPOSAL').toUpperCase() as ProjectProgress, 
            rating: p.rating,
            riskScore: p.riskScore,
            commentCount: p._count?.comments || 0,
            // --- SIMULATION: In a real app, these come from the backend ---
            npv: p.npv ?? (Math.random() > 0.3 ? parseFloat((Math.random() * 500000 - 100000).toFixed(2)) : null),
            irr: p.irr ?? (Math.random() > 0.3 ? parseFloat((Math.random() * 0.40).toFixed(4)) : null),
            roi: p.roi ?? (Math.random() > 0.3 ? parseFloat((Math.random() * 3.5).toFixed(2)) : null),
            paybackPeriod: p.paybackPeriod ?? (Math.random() > 0.3 ? parseFloat((Math.random() * 5 + 1).toFixed(1)) : null),
        }));

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

// Helper to determine Risk Score color
const getRiskColor = (value: number | null) => {
    if (value === null) return 'text-gray-600';
    if (value <= 3) return 'text-green-600 font-bold'; // Low Risk
    if (value <= 7) return 'text-yellow-700 font-bold'; // Medium Risk
    return 'text-red-600 font-bold'; // High Risk
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

    if (!hasKeyData) {
        return (
            <tr className="bg-gray-50">
                <td colSpan={5} className="px-6 py-2 text-center text-sm italic text-gray-500 border-t border-gray-200">
                    Detailed metrics not yet calculated for this project.
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

    // Helper to determine NPV color
    const getNPVColor = (value: number | null) => 
        value === null ? 'text-gray-600' : value >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
    
    
    return (
        <React.Fragment>
            {/* Project Details Row (Expanded view) */}
            {isExpanded && (
                <tr className="bg-indigo-50/50 border-t border-indigo-200">
                    <td colSpan={5} className="px-6 py-4">
                        <div className="text-base font-semibold text-gray-700 mb-3 flex items-center">
                            <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                            Key Financial and Risk Details
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                            
                            {/* NPV */}
                            <div className="flex flex-col border-r sm:border-r-0 border-indigo-200/80 pr-2">
                                <span className="text-xs font-medium text-gray-500 flex items-center"><DollarSign className="w-3 h-3 mr-1" /> NPV</span>
                                <span className={cn('text-lg', getNPVColor(project.npv))}>
                                    {formatCurrency(project.npv)}
                                </span>
                            </div>

                            {/* IRR */}
                            <div className="flex flex-col border-r sm:border-r-0 border-indigo-200/80 pr-2">
                                <span className="text-xs font-medium text-gray-500 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> IRR</span>
                                <span className="text-lg text-blue-700">
                                    {formatPercent(project.irr)}
                                </span>
                            </div>

                            {/* ROI */}
                            <div className="flex flex-col border-r sm:border-r-0 border-indigo-200/80 pr-2">
                                <span className="text-xs font-medium text-gray-500 flex items-center"><Target className="w-3 h-3 mr-1" /> ROI</span>
                                <span className="text-lg text-green-700">
                                    {project.roi !== null ? `${project.roi.toFixed(2)}x` : 'N/A'}
                                </span>
                            </div>

                            {/* Payback Period */}
                            <div className="flex flex-col border-r sm:border-r-0 border-indigo-200/80 pr-2">
                                <span className="text-xs font-medium text-gray-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> Payback</span>
                                <span className="text-lg text-yellow-800">
                                    {project.paybackPeriod !== null ? `${project.paybackPeriod} yrs` : 'N/A'}
                                </span>
                            </div>

                             {/* Risk Score */}
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-500 flex items-center"><RotateCw className="w-3 h-3 mr-1" /> Risk Score</span>
                                <span className={cn('text-lg', getRiskColor(project.riskScore))}>
                                    {project.riskScore !== null ? project.riskScore.toFixed(1) : 'N/A'}
                                </span>
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
    
    const handlePageSizeChange = (newPageSize: PageSizeOption) => {
        const numericPageSize = parseInt(newPageSize, 10);
        setPageSize(numericPageSize);
        setItemOffset(0);
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

        // Helper to format currency
        const formatCurrency = (value: number | null) => 
            value !== null ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'N/A';
        
        // Helper to determine NPV color
        const getNPVColor = (value: number | null) => 
            value === null ? 'text-gray-600' : value >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold';


        return (
            <div key={project.id} className="bg-white p-4 mb-4 rounded-lg shadow-md border border-gray-200">
                 <Hint
                    sideOffset={10}
                    description={ "Click here for more details..."}
                >
                    <Link href={`/bp/${project.id}`} className="text-xl font-semibold text-indigo-600 hover:text-indigo-800 block mb-2">
                        {project.title}
                    </Link>
                </Hint>
                <div className="flex justify-between items-center mb-3">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full items-center ${color}`}>
                        {icon}
                        {display}
                    </span>
                    <span className="text-sm text-gray-600">
                        Rating: {project.rating !== null ? `${project.rating.toFixed(1)} ⭐` : 'N/A'}
                    </span>
                </div>

                <div className="flex justify-between items-center border-t pt-3 mt-3">
                   
                     <div className="relative"> 
                            <span className="text-xs font-medium text-gray-500">Comments</span>
                        {project.commentCount>0 && <div 
                            className="absolute top-[-10px] left-[50px] p-2 bg-inherit text-red-400 rounded-full">
                            <span className='text-sm '
                            
                            >{project.commentCount}</span>
                        </div>
                        }
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-gray-500">Key Metric (NPV)</span>
                        <span className={cn('text-lg', getNPVColor(project.npv))}>
                            {formatCurrency(project.npv)}
                        </span>
                    </div>
                </div>

                {/* MOBILE TOGGLE BUTTON */}
                <button
                    onClick={() => handleToggleRow(project.id)}
                    className="w-full mt-3 flex justify-center items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition"
                >
                    {isExpanded ? (
                        <>
                            Hide Project Details <ChevronUp className="w-4 h-4 ml-1" />
                        </>
                    ) : (
                        <>
                            Show Project Details <ChevronDown className="w-4 h-4 ml-1" />
                        </>
                    )}
                </button>

                {/* MOBILE EXPANDED CONTENT (Enhanced with Risk Score) */}
                {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-indigo-200 grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-xs font-medium text-gray-500">IRR</span>
                            <p className="text-base text-blue-700 font-semibold">{project.irr !== null ? `${(project.irr * 100).toFixed(1)}%` : 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-gray-500">ROI</span>
                            <p className="text-base text-green-700 font-semibold">{project.roi !== null ? `${project.roi.toFixed(2)}x` : 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-gray-500">Payback Period</span>
                            <p className="text-base text-yellow-800 font-semibold">{project.paybackPeriod !== null ? `${project.paybackPeriod} yrs` : 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-gray-500">Risk Score</span>
                            <p className={cn('text-base font-semibold', getRiskColor(project.riskScore))}>{project.riskScore !== null ? project.riskScore.toFixed(1) : 'N/A'}</p>
                        </div>
                    </div>
                )}
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
                                                {project.commentCount}
                                            </td>
                                        </tr>
                                        {/* --- EXPANDED DETAILS ROW (RENAMED/UPDATED COMPONENT) --- */}
                                        <ProjectExpansionRow project={project} isExpanded={isExpanded} onToggle={handleToggleRow} />
                                    </React.Fragment>
                                )})}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- Mobile View (Card Layout) --- */}
            {!isRefreshing && !error && filteredProjects.length > 0 && (
                <div className="block md:hidden">
                    {paginatedProjects.map((project) => (
                        <MobileProjectCard key={project.id} project={project} />
                    ))}
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