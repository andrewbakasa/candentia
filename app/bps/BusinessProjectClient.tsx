'use client'
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SafeUser } from '../types';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'; 
// Assuming cn utility function is available or you define a basic one
const cn = (...classes: (string | boolean | undefined)[]): string => classes.filter(Boolean).join(' ');


// --- Type Definitions (Kept the same) ---
type ProjectListItem = {
    id: string;
    title: string;
    progress: 'proposal' | 'active' | 'complete' | string; // Narrowing the progress type for the filter
    rating: number | null;
    commentCount: number;
};

interface ProjectListClientProps {
    projects: ProjectListItem[]; 
    currentUser: SafeUser | null;
}

// --- API Fetch Function (Unchanged) ---
const fetchProjectsList = async (): Promise<ProjectListItem[]> => {
    // ... (fetchProjectsList implementation is unchanged) ...
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
            progress: p.progress,
            rating: p.rating,
            commentCount: p._count?.comments || 0,
        }));

    } catch (err: any) {
        console.error(`Error fetching projects:`, err);
        throw err;
    }
};

// --- Pagination Constants ---
const DEFAULT_PAGE_SIZE = 8;
type PageSizeOption = '4' | '8' | '16' | '24';
const INDIGO_PRIMARY = 'text-indigo-600';
const INDIGO_HOVER_BG = 'hover:bg-indigo-50';
const GRAY_ACCENT = 'text-gray-500';


// --- Main Client Component (Handles List View & Pagination/Filtering) ---

const ProjectListPage: React.FC<ProjectListClientProps> = ({
    projects: initialProjects,
    currentUser,
}) => {
    const [projects, setProjects] = useState<ProjectListItem[]>(initialProjects);
    const [isRefreshing, setIsRefreshing] = useState(false); 
    const [error, setError] = useState<string | null>(null); 
    const [isAddingNew, setIsAddingNew] = useState(false);

    // --- FILTER STATE ---
    const [filterTerm, setFilterTerm] = useState(''); // For title search
    const [filterProgress, setFilterProgress] = useState<'all' | ProjectListItem['progress']>('all'); // For dropdown filter
    // You could add a [filterRating, setFilterRating] state here for min rating, e.g., useState<number | null>(null)

    // --- PAGINATION STATE ---
    const [pageSize, setPageSize] = useState<number>(
        currentUser && currentUser.pageSize ? currentUser.pageSize : DEFAULT_PAGE_SIZE
    ); 
    const [itemOffset, setItemOffset] = useState(0); 

    // --- FILTERED PROJECTS MEMOIZATION ---
    const filteredProjects = useMemo(() => {
        const lowerFilterTerm = filterTerm.toLowerCase().trim();

        return projects.filter(project => {
            // 1. Filter by Title/Search Term
            const matchesTitle = project.title.toLowerCase().includes(lowerFilterTerm);

            // 2. Filter by Progress/Status
            const matchesProgress = 
                filterProgress === 'all' || 
                project.progress === filterProgress;

            // 3. (Optional) Filter by Rating
            // const matchesRating = !filterRating || (project.rating && project.rating >= filterRating);

            return matchesTitle && matchesProgress; // && matchesRating;
        });
    }, [projects, filterTerm, filterProgress]); // Add filterRating here if used
    
    // --- PAGINATION LOGIC DEPENDENT ON FILTERED PROJECTS ---
    const pageCount = useMemo(() => {
        return Math.ceil(filteredProjects.length / pageSize);
    }, [filteredProjects.length, pageSize]);

    // The current page slice
    const paginatedProjects = useMemo(() => {
        const endpoint = Math.min(itemOffset + pageSize, filteredProjects.length);
        return filteredProjects.slice(itemOffset, endpoint);
    }, [filteredProjects, itemOffset, pageSize]);
    

    // Effect 1: Recalculate total pages whenever the project list or page size changes
    useEffect(() => {
        // Reset offset to 0 whenever the filtered list changes 
        // (to prevent showing a blank page if the current page no longer exists)
        if (itemOffset >= filteredProjects.length && filteredProjects.length > 0) {
            setItemOffset(0);
        } else if (filteredProjects.length === 0) {
            setItemOffset(0);
        }
    }, [filteredProjects.length, pageSize]);
    
    // --- PAGINATION HANDLERS (Unchanged) ---
    const handlePageSizeChange = (newPageSize: PageSizeOption) => {
        const numericPageSize = parseInt(newPageSize, 10);
        setPageSize(numericPageSize);
        setItemOffset(0); // Reset to page 1
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

        // ... (Pagination button rendering logic is unchanged) ...
        buttons.push(
            <div key="summary" className={cn("text-sm mr-2 sm:mr-4", INDIGO_PRIMARY, "font-semibold", GRAY_ACCENT)}>
                {paginationSummary}
            </div>
        );
        
        // Page Size Selector (Optional)
        if (showPageSize) {
            buttons.push(
                <select
                    className={cn('h-9 px-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden sm:block', INDIGO_PRIMARY)}
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

        // Previous button
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
        // Next button
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


    // Callback to perform the client-side refresh (Unchanged logic)
    const refreshProjects = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);
        try {
            const data = await fetchProjectsList();
            setProjects(data);
            setFilterTerm(''); // Clear filters on full refresh for clarity
            setFilterProgress('all');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during refresh.');
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // ... handleNewProjectSubmit (Unchanged) ...
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
            // On successful POST, trigger a client-side refresh of the list
            refreshProjects(); 
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.message);
        }
    };


    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">🤝 Project Collaboration Portal</h1>
            
            <button 
                onClick={() => setIsAddingNew(!isAddingNew)} 
                className="bg-indigo-600 text-white p-3 rounded-lg mb-6 shadow-md hover:bg-indigo-700 transition"
            >
                {isAddingNew ? 'Close Template' : '➕ Add New Project Proposal'}
            </button>

            {isAddingNew && (
                <NewProjectTemplate onSubmit={handleNewProjectSubmit} />
            )}

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">Current Projects ({projects.length})</h2>
            
            {/* --- FILTER UI CONTROLS --- */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-white shadow-sm">
                
                {/* Search Filter by Title */}
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Title..."
                        value={filterTerm}
                        onChange={(e) => {
                            setFilterTerm(e.target.value);
                            setItemOffset(0); // Reset pagination on filter change
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                {/* Filter by Progress/Status Dropdown */}
                <select
                    value={filterProgress}
                    onChange={(e) => {
                        setFilterProgress(e.target.value as ProjectListItem['progress'] | 'all');
                        setItemOffset(0); // Reset pagination on filter change
                    }}
                    className="sm:w-48 py-2 px-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="all">All Statuses</option>
                    <option value="proposal">Proposal</option>
                    <option value="active">Active</option>
                    <option value="complete">Complete</option>
                    {/* Add other progress statuses if needed */}
                </select>
                
                {/* You could add a Rating filter here, e.g., a button group or a slider */}
                
            </div>
            {/*  */}

            {/* Error and Loading Feedback */}
            {isRefreshing && <p className="text-blue-500 italic">Refreshing project list...</p>}
            {error && <p className="text-red-700 font-semibold p-3 bg-red-100 border border-red-300 rounded-lg shadow-sm">Error: {error}</p>}
            
            {/* Empty State */}
            {!isRefreshing && !error && projects.length === 0 && (
                <p className="text-gray-500 p-4 border rounded-lg bg-white">No projects found. Be the first to propose one!</p>
            )}

            {/* Filtered Empty State */}
            {!isRefreshing && !error && projects.length > 0 && filteredProjects.length === 0 && (
                <p className="text-gray-500 p-4 border rounded-lg bg-yellow-50">No projects match the current filter criteria.</p>
            )}
            
            {/* Project List Table */}
            {!isRefreshing && !error && filteredProjects.length > 0 && (
                <>
                    <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden shadow-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Progress</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Comments</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* --- Use paginatedProjects (the current filtered/sliced list) here --- */}
                            {paginatedProjects.map((project) => (
                                <tr key={project.id} className="hover:bg-indigo-50 transition duration-150 ease-in-out">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link href={`/bp/${project.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold">
                                            {project.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm 
                                            ${project.progress === 'proposal' 
                                                ? 'bg-yellow-100 text-yellow-800' 
                                                : project.progress === 'active'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'}`}>
                                            {project.progress}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {project.rating !== null ? `${project.rating.toFixed(1)} ⭐` : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                        {project.commentCount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {/* --- Footer Pagination Controls (Always visible when needed) --- */}
                    {filteredProjects.length > pageSize && (
                        <div className="mt-6 flex justify-center items-center p-4 bg-gray-50 rounded-lg shadow-inner">
                            {renderPaginationButtons(true)} 
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ... NewProjectTemplate component (Unchanged) ...
const NewProjectTemplate: React.FC<{ onSubmit: (data: { title: string, description: string }) => void }> = ({ onSubmit }) => {
    // ... (NewProjectTemplate implementation is unchanged) ...
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;
        onSubmit({ title, description });
        setTitle('');
        setDescription('');
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 border border-gray-300 rounded-xl mb-6 bg-white shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-indigo-700">New Project Proposal Template</h3>
            
            <div className="mb-4">
                <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                    id="project-title"
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    required 
                    placeholder="E.g., Global E-commerce Platform Integration"
                    className="mt-1 block w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                />
            </div>

            <div className="mb-6">
                <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                <textarea 
                    id="project-description"
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    required 
                    rows={6}
                    placeholder="Describe the problem, solution, and estimated effort..."
                    className="mt-1 block w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-none"
                />
            </div>
            
            <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 ease-in-out shadow-md">
                Submit Proposal
            </button>
        </form>
    );
};

export default ProjectListPage;
// 'use client'
// import React, { useState, useCallback, useMemo } from 'react';
// import Link from 'next/link';
// import { SafeUser } from '../types';

// // --- Type Definitions (Kept the same) ---
// type ProjectListItem = {
//     id: string;
//     title: string;
//     progress: string;
//     rating: number | null;
//     commentCount: number;
// };

// interface ProjectListClientProps {
//     projects: ProjectListItem[]; 
//     currentUser: SafeUser | null;
// }

// // --- API Fetch Function (Kept the same, still fetches ALL data) ---
// // Note: For large datasets, server-side pagination is recommended. 
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
//             progress: p.progress,
//             rating: p.rating,
//             commentCount: p._count?.comments || 0,
//         }));

//     } catch (err: any) {
//         console.error(`Error fetching projects:`, err);
//         throw err;
//     }
// };

// // --- Pagination Constants ---
// const PROJECTS_PER_PAGE = 10; 

// // --- Main Client Component (Handles List View & Pagination) ---

// const ProjectListPage: React.FC<ProjectListClientProps> = ({
//     projects: initialProjects,
//     currentUser,
// }) => {
//     const [projects, setProjects] = useState<ProjectListItem[]>(initialProjects);
//     const [isRefreshing, setIsRefreshing] = useState(false); 
//     const [error, setError] = useState<string | null>(null); 
//     const [isAddingNew, setIsAddingNew] = useState(false);

//     // --- Pagination State ---
//     const [currentPage, setCurrentPage] = useState(1);
    
//     // --- Pagination Logic ---
//     const totalPages = useMemo(() => {
//         return Math.ceil(projects.length / PROJECTS_PER_PAGE);
//     }, [projects.length]);

//     const paginatedProjects = useMemo(() => {
//         const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
//         const endIndex = startIndex + PROJECTS_PER_PAGE;
//         return projects.slice(startIndex, endIndex);
//     }, [projects, currentPage]);

//     // Reset to page 1 whenever the project list is updated
//     React.useEffect(() => {
//         setCurrentPage(1);
//     }, [projects.length]);

//     // Callback to perform the client-side refresh
//     const refreshProjects = useCallback(async () => {
//         setIsRefreshing(true);
//         setError(null);
//         try {
//             const data = await fetchProjectsList();
//             setProjects(data);
//             setCurrentPage(1); // Reset page on refresh
//         } catch (err: any) {
//             setError(err.message || 'An unknown error occurred during refresh.');
//         } finally {
//             setIsRefreshing(false);
//         }
//     }, []);

//     // ... handleNewProjectSubmit (kept the same logic, calls refreshProjects) ...
//     const handleNewProjectSubmit = async (data: { title: string, description: string }) => {
//         if (!currentUser) {
//             setError('You must be logged in to propose a project.');
//             return;
//         }

//         setError(null);
//         try {
//             const response = await fetch('/api/busprojects', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(data),
//             });
            
//             if (!response.ok) {
//                 const text = await response.text();
//                 let errorData;
//                 try {
//                     errorData = JSON.parse(text);
//                 } catch {
//                     throw new Error(`Failed to create project (Status: ${response.status}).`);
//                 }
//                 throw new Error(errorData.message || 'Failed to create project.');
//             }

//             console.log('Project created successfully.');
//             setIsAddingNew(false);
//             // On successful POST, trigger a client-side refresh of the list
//             refreshProjects(); 
//         } catch (err: any) {
//             console.error('Submission error:', err);
//             setError(err.message);
//         }
//     };


//     return (
//         <div className="container mx-auto p-4">
//             <h1 className="text-3xl font-bold mb-6 text-gray-800">🤝 Project Collaboration Portal</h1>
            
//             {/* ... New Project Button and Template ... */}
//             <button 
//                 onClick={() => setIsAddingNew(!isAddingNew)} 
//                 className="bg-indigo-600 text-white p-3 rounded-lg mb-6 shadow-md hover:bg-indigo-700 transition"
//             >
//                 {isAddingNew ? 'Close Template' : '➕ Add New Project Proposal'}
//             </button>

//             {isAddingNew && (
//                 <NewProjectTemplate onSubmit={handleNewProjectSubmit} />
//             )}

//             <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">Current Projects ({projects.length})</h2>

//             {/* Error and Loading Feedback */}
//             {isRefreshing && <p className="text-blue-500 italic">Refreshing project list...</p>}
//             {error && <p className="text-red-700 font-semibold p-3 bg-red-100 border border-red-300 rounded-lg shadow-sm">Error: {error}</p>}
            
//             {/* Empty State */}
//             {!isRefreshing && !error && projects.length === 0 && (
//                 <p className="text-gray-500 p-4 border rounded-lg bg-white">No projects found. Be the first to propose one!</p>
//             )}

//             {/* Project List Table */}
//             {!isRefreshing && !error && projects.length > 0 && (
//                 <>
//                     <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden shadow-lg">
//                         <thead className="bg-gray-100">
//                             <tr>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Title</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Progress</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rating</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Comments</th>
//                             </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                             {/* --- Use paginatedProjects here --- */}
//                             {paginatedProjects.map((project) => (
//                                 <tr key={project.id} className="hover:bg-indigo-50 transition duration-150 ease-in-out">
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                                         <Link href={`/bp/${project.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold">
//                                             {project.title}
//                                         </Link>
//                                     </td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm">
//                                         <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm 
//                                             ${project.progress === 'proposal' 
//                                                 ? 'bg-yellow-100 text-yellow-800' 
//                                                 : 'bg-blue-100 text-blue-800'}`}>
//                                             {project.progress}
//                                         </span>
//                                     </td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
//                                         {project.rating !== null ? `${project.rating.toFixed(1)} ⭐` : 'N/A'}
//                                     </td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
//                                         {project.commentCount}
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
                    
//                     {/* --- Pagination Controls --- */}
//                     {totalPages > 1 && (
//                         <div className="flex justify-center items-center space-x-2 mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
//                             <button
//                                 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                                 disabled={currentPage === 1}
//                                 className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-lg shadow-sm hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
//                             >
//                                 Previous
//                             </button>
                            
//                             <span className="text-sm font-medium text-gray-700">
//                                 Page **{currentPage}** of **{totalPages}**
//                             </span>

//                             <button
//                                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                                 disabled={currentPage === totalPages}
//                                 className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-lg shadow-sm hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
//                             >
//                                 Next
//                             </button>
//                         </div>
//                     )}
//                 </>
//             )}
//         </div>
//     );
// };

// // ... NewProjectTemplate component (Kept the same) ...
// const NewProjectTemplate: React.FC<{ onSubmit: (data: { title: string, description: string }) => void }> = ({ onSubmit }) => {
//     const [title, setTitle] = useState('');
//     const [description, setDescription] = useState('');
    
//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!title.trim() || !description.trim()) return;
//         onSubmit({ title, description });
//         setTitle('');
//         setDescription('');
//     };

//     return (
//         <form onSubmit={handleSubmit} className="p-6 border border-gray-300 rounded-xl mb-6 bg-white shadow-lg">
//             <h3 className="text-xl font-bold mb-4 text-indigo-700">New Project Proposal Template</h3>
            
//             <div className="mb-4">
//                 <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
//                 <input 
//                     id="project-title"
//                     type="text" 
//                     value={title} 
//                     onChange={(e) => setTitle(e.target.value)} 
//                     required 
//                     placeholder="E.g., Global E-commerce Platform Integration"
//                     className="mt-1 block w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
//                 />
//             </div>

//             <div className="mb-6">
//                 <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
//                 <textarea 
//                     id="project-description"
//                     value={description} 
//                     onChange={(e) => setDescription(e.target.value)} 
//                     required 
//                     rows={6}
//                     placeholder="Describe the problem, solution, and estimated effort..."
//                     className="mt-1 block w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-none"
//                 />
//             </div>
            
//             <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 ease-in-out shadow-md">
//                 Submit Proposal
//             </button>
//         </form>
//     );
// };

// export default ProjectListPage;
// 'use client'
// import React, { useState, useCallback } from 'react';
// import Link from 'next/link';
// // Assuming SafeUser is defined in '../types'
// import { SafeUser } from '../types';

// // Simplified Project List Item type, matching what the Server Component passes
// type ProjectListItem = {
//     id: string;
//     title: string;
//     progress: string;
//     rating: number | null;
//     commentCount: number;
//     // Removed date fields as they are not used for display here, 
//     // but ensured they are passed from the Server Component if needed elsewhere.
// };

// // Interface for the props received from the Server Component
// interface ProjectListClientProps {
//     projects: ProjectListItem[]; 
//     currentUser: SafeUser | null;
// }

// // --- API Fetch Function for Client-Side Refresh ---
// const fetchProjectsList = async (): Promise<ProjectListItem[]> => {
//     // API path matching the user's specified POST path for consistency
//     const url = `/api/busprojects`; 

//     try {
//         const response = await fetch(url, {
//             method: 'GET',
//             headers: { 'Content-Type': 'application/json' },
//         });

//         if (!response.ok) {
//             throw new Error(`Failed to fetch projects (Status: ${response.status})`);
//         }
        
//         const projects: any[] = await response.json(); 
        
//         // Map the result to match the expected ProjectListItem type
//         return projects.map((p) => ({
//             id: p.id,
//             title: p.title,
//             progress: p.progress,
//             rating: p.rating,
//             commentCount: p._count?.comments || 0, // Ensure comment count is mapped
//         }));

//     } catch (err: any) {
//         console.error(`Error fetching projects:`, err);
//         throw err;
//     }
// };

// // --- Main Client Component (Handles List View) ---

// const ProjectListPage: React.FC<ProjectListClientProps> = ({
//     projects: initialProjects, // Use alias to get initial server data
//     currentUser,
// }) => {
//     // Initialize state with the data passed from the Server Component
//     const [projects, setProjects] = useState<ProjectListItem[]>(initialProjects);
    
//     // Use isRefreshing for client-side loading states
//     const [isRefreshing, setIsRefreshing] = useState(false); 
//     const [error, setError] = useState<string | null>(null); 
//     const [isAddingNew, setIsAddingNew] = useState(false);


//     // Callback to perform the client-side refresh
//     const refreshProjects = useCallback(async () => {
//         setIsRefreshing(true);
//         setError(null);
//         try {
//             const data = await fetchProjectsList();
//             setProjects(data);
//         } catch (err: any) {
//             setError(err.message || 'An unknown error occurred during refresh.');
//         } finally {
//             setIsRefreshing(false);
//         }
//     }, []);


//     const handleNewProjectSubmit = async (data: { title: string, description: string }) => {
//         if (!currentUser) {
//             setError('You must be logged in to propose a project.');
//             return;
//         }

//         setError(null);
//         try {
//             // Using the user's specified POST endpoint: /api/busprojects
//             const response = await fetch('/api/busprojects', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(data),
//             });
            
//             if (!response.ok) {
//                 const text = await response.text();
//                 let errorData;
//                 try {
//                     errorData = JSON.parse(text);
//                 } catch {
//                     throw new Error(`Failed to create project (Status: ${response.status}).`);
//                 }
//                 throw new Error(errorData.message || 'Failed to create project.');
//             }

//             console.log('Project created successfully.');
//             setIsAddingNew(false);
//             // On successful POST, trigger a client-side refresh of the list
//             refreshProjects(); 
//         } catch (err: any) {
//             console.error('Submission error:', err);
//             setError(err.message);
//         }
//     };

//     return (
//         <div className="container mx-auto p-4">
//             <h1 className="text-3xl font-bold mb-6 text-gray-800">🤝 Project Collaboration Portal</h1>
            
//             <button 
//                 onClick={() => setIsAddingNew(!isAddingNew)} 
//                 className="bg-indigo-600 text-white p-3 rounded-lg mb-6 shadow-md hover:bg-indigo-700 transition"
//             >
//                 {isAddingNew ? 'Close Template' : '➕ Add New Project Proposal'}
//             </button>

//             {isAddingNew && (
//                 <NewProjectTemplate onSubmit={handleNewProjectSubmit} />
//             )}

//             <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">Current Projects</h2>

//             {/* Now uses the isRefreshing state for client-side loading feedback */}
//             {isRefreshing && <p className="text-blue-500 italic">Refreshing project list...</p>}
//             {error && <p className="text-red-700 font-semibold p-3 bg-red-100 border border-red-300 rounded-lg shadow-sm">Error: {error}</p>}
            
//             {/* The list rendering condition now uses isRefreshing state */}
//             {!isRefreshing && !error && projects.length === 0 && (
//                 <p className="text-gray-500 p-4 border rounded-lg bg-white">No projects found. Be the first to propose one!</p>
//             )}

//             {!isRefreshing && !error && projects.length > 0 && (
//                 <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden shadow-lg">
//                     <thead className="bg-gray-100">
//                         <tr>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Title</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Progress</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rating</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Comments</th>
//                         </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                         {projects.map((project) => (
//                             <tr key={project.id} className="hover:bg-indigo-50 transition duration-150 ease-in-out">
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                                     <Link href={`/bp/${project.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold">
//                                         {project.title}
//                                     </Link>
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm">
//                                     <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm 
//                                         ${project.progress === 'proposal' 
//                                             ? 'bg-yellow-100 text-yellow-800' 
//                                             : 'bg-blue-100 text-blue-800'}`}>
//                                         {project.progress}
//                                     </span>
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
//                                     {project.rating !== null ? `${project.rating.toFixed(1)} ⭐` : 'N/A'}
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
//                                     {project.commentCount}
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             )}
//         </div>
//     );
// };

// // Component for quick data entry (New Project Proposal) - Used in both files for consistency
// const NewProjectTemplate: React.FC<{ onSubmit: (data: { title: string, description: string }) => void }> = ({ onSubmit }) => {
//     const [title, setTitle] = useState('');
//     const [description, setDescription] = useState('');
    
//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!title.trim() || !description.trim()) return;
//         onSubmit({ title, description });
//         setTitle('');
//         setDescription('');
//     };

//     return (
//         <form onSubmit={handleSubmit} className="p-6 border border-gray-300 rounded-xl mb-6 bg-white shadow-lg">
//             <h3 className="text-xl font-bold mb-4 text-indigo-700">New Project Proposal Template</h3>
            
//             <div className="mb-4">
//                 <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
//                 <input 
//                     id="project-title"
//                     type="text" 
//                     value={title} 
//                     onChange={(e) => setTitle(e.target.value)} 
//                     required 
//                     placeholder="E.g., Global E-commerce Platform Integration"
//                     className="mt-1 block w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
//                 />
//             </div>

//             <div className="mb-6">
//                 <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
//                 <textarea 
//                     id="project-description"
//                     value={description} 
//                     onChange={(e) => setDescription(e.target.value)} 
//                     required 
//                     rows={6}
//                     placeholder="Describe the problem, solution, and estimated effort..."
//                     className="mt-1 block w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-none"
//                 />
//             </div>
            
//             <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 ease-in-out shadow-md">
//                 Submit Proposal
//             </button>
//         </form>
//     );
// };

// // Exporting the list component as the default export of the file
// export default ProjectListPage;