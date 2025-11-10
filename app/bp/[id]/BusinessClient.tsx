'use client'

import { SafeUser } from '@/app/types';
import { BusinessProjectModel } from '@prisma/client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // 👈 Import Link

// --- Type Definitions ---

// Simplified Comment structure with user details
interface ProjectCommentDisplay {
    id: string;
    content: string;
    userId: string;
    timestamp: string;
    user: { id: string; email: string };
}

// Simplified Rating structure
interface ProjectRatingDisplay {
    id: string;
    projectId: string;
    userId: string;
    rate: number;
    createdAt: string;
    updatedAt: string;
}

// Combined Project Details for the client view
interface ProjectDetails extends BusinessProjectModel {
    comments: ProjectCommentDisplay[];
    projectToUserRatings: ProjectRatingDisplay[];
    rating: number | null;
}

// Component Props
interface ProjectDetailsClientProps {
    project: ProjectDetails; 
    currentUser: SafeUser | null;
}

// --- Main Component ---

const ProjectDetailPage: React.FC<ProjectDetailsClientProps> = ({
    project,
    currentUser,
}) => {
    
    // Use local state initialized with server props for data that will be mutated
    const [localProject, setLocalProject] = useState<ProjectDetails>(project);

    // State for client-side interactions
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [mutationError, setMutationError] = useState<string | null>(null);
    const [showComments, setShowComments] = useState(true);
    // Track the current user's rating, initialized in useEffect
    const [myRating, setMyRating] = useState<number | null>(null);

    // Function to fetch the LATEST project data from the API to update local state
    const refreshProjectData = useCallback(async () => {
        const projectId = localProject?.id;
        if (!projectId) return;

        setIsRefreshing(true);
        setMutationError(null);
        try {
            // Correct API path: Fetch the details for this specific project ID
            const response = await fetch(`/api/busprojects/${projectId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch updated project data.');
            }

            const freshProjectData: ProjectDetails = await response.json();
            setLocalProject(freshProjectData); // Update the main project state

            // Update the user's current rating from the fresh data
            const userRating = freshProjectData.projectToUserRatings.find(r => r.userId === currentUser?.id);
            setMyRating(userRating?.rate || null);

        } catch (err: any) {
            console.error('Refresh error:', err);
            setMutationError(err.message || 'Could not update project data.');
        } finally {
            setIsRefreshing(false);
        }
    }, [localProject?.id, currentUser?.id]);
    
    // Initial setup effect (runs once on mount and when initial props change)
    useEffect(() => {
        // Set initial user rating from the prop data
        const userRating = localProject.projectToUserRatings.find(r => r.userId === currentUser?.id);
        setMyRating(userRating?.rate || null);
    }, [localProject, currentUser?.id]);


    const handleRate = async (rate: number) => {
        const projectId = localProject?.id;

        if (!projectId || !currentUser?.id || isRefreshing) {
            setMutationError(currentUser ? "Please wait for current operation to complete." : "You must be logged in to rate.");
            return;
        }
        
        // Optimistic update
        const previousRating = myRating;
        setMyRating(rate); 
        setMutationError(null);

        try {
            // API call to submit rating
            const response = await fetch(`/api/busprojects/${projectId}/rating`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rate }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit rating.');
            }
            
            // Refresh project data to get the new calculated average rating
            await refreshProjectData(); 

        } catch(err: any) {
            console.error('Rating failed:', err);
            setMutationError(err.message || 'Rating failed.');
            // Revert optimistic update on failure
            setMyRating(previousRating);
        }
    };

    const handleCommentSubmit = async (content: string) => {
        const projectId = localProject?.id;

        if (!projectId || !currentUser?.id) {
            setMutationError("You must be logged in to post a comment.");
            return;
        }
        
        setMutationError(null);
        try {
            // Corrected API URL to include project ID
            const response = await fetch(`/api/busprojects/${projectId}/addComment`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                // Only send content. User ID is determined server-side from session/cookie.
                body: JSON.stringify({ content }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit comment.');
            }

            // On success, reload project to show new comment and ensure the section is visible
            await refreshProjectData(); 
            setShowComments(true); 

        } catch(err: any) {
             console.error('Comment submission failed:', err);
             setMutationError(err.message || 'Comment submission failed.');
        }
    };

    if (!localProject) return <div className="p-8 text-center text-xl text-red-500 font-semibold">Error: Project data is missing or failed to load.</div>;

    // --- RENDER COMPONENT ---
    return (
        <div className="container mx-auto p-4 max-w-4xl">
            
            {/* 👈 ADDED: Link back to the main projects list */}
            <Link 
                href="/bps/" 
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6 font-medium transition duration-150 ease-in-out"
            >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Projects List
            </Link>
            {/* ------------------------------------------------ */}

            <h1 className="text-4xl font-extrabold mb-2 text-gray-900">{localProject.title}</h1>
            <p className="text-sm text-gray-500 mb-4">Proposed: {new Date(localProject.createdAt).toLocaleDateString()}</p>

            {isRefreshing && <p className="text-blue-600 mb-4 font-medium animate-pulse">Updating data...</p>}
            {mutationError && <p className="text-red-700 mb-4 font-semibold p-3 bg-red-100 rounded-lg border border-red-300 shadow-sm">Error: {mutationError}</p>}

            {/* Rating/Vote Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-5 bg-yellow-50 rounded-xl border border-yellow-200 shadow-md">
                <span className="text-xl font-bold text-gray-800 mb-3 sm:mb-0">
                    Overall Rating: <span className="text-yellow-600">{(localProject.rating || 0).toFixed(2)} ⭐</span>
                    <span className="text-sm text-gray-500 ml-2">({localProject.projectToUserRatings.length} votes)</span>
                </span>
                
                <UserRatingComponent myRating={myRating} onRate={handleRate} />
            </div>

            {/* Project Details */}
            <h2 className="text-2xl font-semibold mb-3 border-b pb-1 text-gray-700">Project Description</h2>
            <p className="mb-4 text-sm">Status: <span className={`font-bold uppercase ${localProject.progress === 'proposal' ? 'text-indigo-600' : 'text-green-600'}`}>{localProject.progress}</span></p>
            
            {/* Displaying the description. Assuming description is simple text or HTML content from a rich text editor. */}
            <div className="prose max-w-none border p-5 rounded-xl bg-white shadow-inner text-gray-800" >
                {localProject.description} 
                {/* Note: If localProject.description contains HTML/Markdown, you would need dangerouslySetInnerHTML={{ __html: localProject.description }} */}
            </div>
            
            <hr className="my-10 border-gray-200" />

            {/* Comments Section (Collapsible) */}
            <h2 className="text-2xl font-semibold mb-3 cursor-pointer flex items-center justify-between text-gray-700" onClick={() => setShowComments(!showComments)}>
                <span>Discussion ({localProject.comments.length})</span> 
                <span className="text-gray-500 transition-transform duration-300 transform">{showComments ? '▼' : '►'}</span>
            </h2>
            
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showComments ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                
                <CommentEditor onSubmit={handleCommentSubmit} />

                <div className="mt-8 space-y-5">
                    {localProject.comments
                        .slice() 
                        // Sort by newest first
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((comment) => (
                        <CommentDisplay 
                            key={comment.id} 
                            comment={comment} 
                            isEditable={comment.userId === currentUser?.id} 
                        />
                    ))}
                    {localProject.comments.length === 0 && (
                        <p className="text-gray-500 p-4 border rounded-lg bg-gray-50 text-center">No comments yet. Be the first to start the discussion!</p>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- UTILITY COMPONENTS (Unchanged) ---

// Simple Star Rating Component
const UserRatingComponent: React.FC<{ myRating: number | null, onRate: (rate: number) => void }> = ({ myRating, onRate }) => (
    <div className="flex items-center space-x-1">
        <span className="text-sm font-medium mr-2 text-gray-700 hidden sm:block">Rate this Project:</span>
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                onClick={() => onRate(star)}
                className={`text-3xl transition-transform duration-150 ease-in-out hover:scale-110 ${myRating !== null && star <= myRating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                aria-label={`Rate ${star} star`}
            >
                ★
            </button>
        ))}
        {myRating !== null && <span className="text-sm ml-3 text-gray-600">({myRating} / 5)</span>}
    </div>
);

// Simple Comment Editor
const CommentEditor: React.FC<{ onSubmit: (content: string) => void }> = ({ onSubmit }) => {
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            onSubmit(content);
            setContent('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-5 border border-indigo-100 rounded-xl bg-indigo-50 shadow-lg">
            <h4 className="font-semibold mb-3 text-indigo-700">Add to the Discussion</h4>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Share your feedback, suggest improvements, or ask a question..."
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none shadow-sm"
            />
            <button type="submit" className="mt-3 bg-indigo-600 text-white p-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-md">Post Comment</button>
        </form>
    );
};

// Comment Display
const CommentDisplay: React.FC<{ comment: any, isEditable: boolean }> = ({ comment, isEditable }) => (
    <div className="border-l-4 border-indigo-500 pl-4 py-3 bg-white rounded-r-xl shadow-md">
        <p className="text-base text-gray-800 mb-2">{comment.content}</p>
        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
            <span>By <span className="font-bold text-gray-700">{comment.user.email}</span> on {new Date(comment.timestamp).toLocaleString()}</span>
            {isEditable && (
                <button className="text-blue-500 hover:text-blue-700 ml-2 font-semibold transition">Edit</button>
            )}
        </div>
    </div>
);

export default ProjectDetailPage;
// 'use client'

// import { SafeUser } from '@/app/types';
// import { BusinessProjectModel } from '@prisma/client';
// import React, { useState, useEffect, useCallback } from 'react';

// // --- Type Definitions ---

// // Simplified Comment structure with user details
// interface ProjectCommentDisplay {
//     id: string;
//     content: string;
//     userId: string;
//     timestamp: string; // Changed to string for serialization safety
//     user: { id: string; email: string };
// }

// // Simplified Rating structure
// interface ProjectRatingDisplay {
//     id: string;
//     projectId: string;
//     userId: string;
//     rate: number;
//     createdAt: string; // Changed to string for serialization safety
//     updatedAt: string; // Changed to string for serialization safety
// }

// // Combined Project Details for the client view
// interface ProjectDetails extends BusinessProjectModel {
//     comments: ProjectCommentDisplay[];
//     projectToUserRatings: ProjectRatingDisplay[];
//     rating: number | null;
// }

// // Component Props
// interface ProjectDetailsClientProps {
//     project: ProjectDetails; 
//     currentUser: SafeUser | null;
// }

// // --- Main Component ---

// const ProjectDetailPage: React.FC<ProjectDetailsClientProps> = ({
//     project,
//     currentUser,
// }) => {
    
//     // Use local state initialized with server props for data that will be mutated
//     const [localProject, setLocalProject] = useState<ProjectDetails>(project);

//     // State for client-side interactions
//     const [isRefreshing, setIsRefreshing] = useState(false);
//     const [mutationError, setMutationError] = useState<string | null>(null);
//     const [showComments, setShowComments] = useState(true);
//     // Track the current user's rating, initialized in useEffect
//     const [myRating, setMyRating] = useState<number | null>(null);

//     // Function to fetch the LATEST project data from the API to update local state
//     const refreshProjectData = useCallback(async () => {
//         const projectId = localProject?.id;
//         if (!projectId) return;

//         setIsRefreshing(true);
//         setMutationError(null);
//         try {
//             // Correct API path: Fetch the details for this specific project ID
//             const response = await fetch(`/api/busprojects/${projectId}`);
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to fetch updated project data.');
//             }

//             const freshProjectData: ProjectDetails = await response.json();
//             setLocalProject(freshProjectData); // Update the main project state

//             // Update the user's current rating from the fresh data
//             const userRating = freshProjectData.projectToUserRatings.find(r => r.userId === currentUser?.id);
//             setMyRating(userRating?.rate || null);

//         } catch (err: any) {
//             console.error('Refresh error:', err);
//             setMutationError(err.message || 'Could not update project data.');
//         } finally {
//             setIsRefreshing(false);
//         }
//     }, [localProject?.id, currentUser?.id]);
    
//     // Initial setup effect (runs once on mount and when initial props change)
//     useEffect(() => {
//         // Set initial user rating from the prop data
//         const userRating = localProject.projectToUserRatings.find(r => r.userId === currentUser?.id);
//         setMyRating(userRating?.rate || null);
//     }, [localProject, currentUser?.id]);


//     const handleRate = async (rate: number) => {
//         const projectId = localProject?.id;

//         if (!projectId || !currentUser?.id || isRefreshing) {
//             setMutationError(currentUser ? "Please wait for current operation to complete." : "You must be logged in to rate.");
//             return;
//         }
        
//         // Optimistic update
//         const previousRating = myRating;
//         setMyRating(rate); 
//         setMutationError(null);

//         try {
//             // API call to submit rating
//             const response = await fetch(`/api/busprojects/${projectId}/rating`, { 
//                 method: 'POST', 
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ rate }), 
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to submit rating.');
//             }
            
//             // Refresh project data to get the new calculated average rating
//             await refreshProjectData(); 

//         } catch(err: any) {
//             console.error('Rating failed:', err);
//             setMutationError(err.message || 'Rating failed.');
//             // Revert optimistic update on failure
//             setMyRating(previousRating);
//         }
//     };

//     const handleCommentSubmit = async (content: string) => {
//         const projectId = localProject?.id;

//         if (!projectId || !currentUser?.id) {
//             setMutationError("You must be logged in to post a comment.");
//             return;
//         }
        
//         setMutationError(null);
//         try {
//             // Corrected API URL to include project ID
//             const response = await fetch(`/api/busprojects/${projectId}/addComment`, { 
//                 method: 'POST', 
//                 headers: { 'Content-Type': 'application/json' },
//                 // Only send content. User ID is determined server-side from session/cookie.
//                 body: JSON.stringify({ content }), 
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to submit comment.');
//             }

//             // On success, reload project to show new comment and ensure the section is visible
//             await refreshProjectData(); 
//             setShowComments(true); 

//         } catch(err: any) {
//              console.error('Comment submission failed:', err);
//              setMutationError(err.message || 'Comment submission failed.');
//         }
//     };

//     if (!localProject) return <div className="p-8 text-center text-xl text-red-500 font-semibold">Error: Project data is missing or failed to load.</div>;

//     // --- RENDER COMPONENT ---
//     return (
//         <div className="container mx-auto p-4 max-w-4xl">
//             <h1 className="text-4xl font-extrabold mb-2 text-gray-900">{localProject.title}</h1>
//             <p className="text-sm text-gray-500 mb-4">Proposed: {new Date(localProject.createdAt).toLocaleDateString()}</p>

//             {isRefreshing && <p className="text-blue-600 mb-4 font-medium animate-pulse">Updating data...</p>}
//             {mutationError && <p className="text-red-700 mb-4 font-semibold p-3 bg-red-100 rounded-lg border border-red-300 shadow-sm">Error: {mutationError}</p>}

//             {/* Rating/Vote Section */}
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-5 bg-yellow-50 rounded-xl border border-yellow-200 shadow-md">
//                 <span className="text-xl font-bold text-gray-800 mb-3 sm:mb-0">
//                     Overall Rating: <span className="text-yellow-600">{(localProject.rating || 0).toFixed(2)} ⭐</span>
//                     <span className="text-sm text-gray-500 ml-2">({localProject.projectToUserRatings.length} votes)</span>
//                 </span>
                
//                 <UserRatingComponent myRating={myRating} onRate={handleRate} />
//             </div>

//             {/* Project Details */}
//             <h2 className="text-2xl font-semibold mb-3 border-b pb-1 text-gray-700">Project Description</h2>
//             <p className="mb-4 text-sm">Status: <span className={`font-bold uppercase ${localProject.progress === 'proposal' ? 'text-indigo-600' : 'text-green-600'}`}>{localProject.progress}</span></p>
            
//             {/* Displaying the description. Assuming description is simple text or HTML content from a rich text editor. */}
//             <div className="prose max-w-none border p-5 rounded-xl bg-white shadow-inner text-gray-800" >
//                 {localProject.description} 
//                 {/* Note: If localProject.description contains HTML/Markdown, you would need dangerouslySetInnerHTML={{ __html: localProject.description }} */}
//             </div>
            
//             <hr className="my-10 border-gray-200" />

//             {/* Comments Section (Collapsible) */}
//             <h2 className="text-2xl font-semibold mb-3 cursor-pointer flex items-center justify-between text-gray-700" onClick={() => setShowComments(!showComments)}>
//                 <span>Discussion ({localProject.comments.length})</span> 
//                 <span className="text-gray-500 transition-transform duration-300 transform">{showComments ? '▼' : '►'}</span>
//             </h2>
            
//             <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showComments ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                
//                 <CommentEditor onSubmit={handleCommentSubmit} />

//                 <div className="mt-8 space-y-5">
//                     {localProject.comments
//                         .slice() 
//                         // Sort by newest first
//                         .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
//                         .map((comment) => (
//                         <CommentDisplay 
//                             key={comment.id} 
//                             comment={comment} 
//                             isEditable={comment.userId === currentUser?.id} 
//                         />
//                     ))}
//                     {localProject.comments.length === 0 && (
//                         <p className="text-gray-500 p-4 border rounded-lg bg-gray-50 text-center">No comments yet. Be the first to start the discussion!</p>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };


// // --- UTILITY COMPONENTS ---

// // Simple Star Rating Component
// const UserRatingComponent: React.FC<{ myRating: number | null, onRate: (rate: number) => void }> = ({ myRating, onRate }) => (
//     <div className="flex items-center space-x-1">
//         <span className="text-sm font-medium mr-2 text-gray-700 hidden sm:block">Rate this Project:</span>
//         {[1, 2, 3, 4, 5].map((star) => (
//             <button
//                 key={star}
//                 onClick={() => onRate(star)}
//                 className={`text-3xl transition-transform duration-150 ease-in-out hover:scale-110 ${myRating !== null && star <= myRating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
//                 aria-label={`Rate ${star} star`}
//             >
//                 ★
//             </button>
//         ))}
//         {myRating !== null && <span className="text-sm ml-3 text-gray-600">({myRating} / 5)</span>}
//     </div>
// );

// // Simple Comment Editor
// const CommentEditor: React.FC<{ onSubmit: (content: string) => void }> = ({ onSubmit }) => {
//     const [content, setContent] = useState('');

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (content.trim()) {
//             onSubmit(content);
//             setContent('');
//         }
//     };

//     return (
//         <form onSubmit={handleSubmit} className="p-5 border border-indigo-100 rounded-xl bg-indigo-50 shadow-lg">
//             <h4 className="font-semibold mb-3 text-indigo-700">Add to the Discussion</h4>
//             <textarea
//                 value={content}
//                 onChange={(e) => setContent(e.target.value)}
//                 rows={4}
//                 placeholder="Share your feedback, suggest improvements, or ask a question..."
//                 className="w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none shadow-sm"
//             />
//             <button type="submit" className="mt-3 bg-indigo-600 text-white p-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-md">Post Comment</button>
//         </form>
//     );
// };

// // Comment Display
// const CommentDisplay: React.FC<{ comment: any, isEditable: boolean }> = ({ comment, isEditable }) => (
//     <div className="border-l-4 border-indigo-500 pl-4 py-3 bg-white rounded-r-xl shadow-md">
//         <p className="text-base text-gray-800 mb-2">{comment.content}</p>
//         <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
//             <span>By <span className="font-bold text-gray-700">{comment.user.email}</span> on {new Date(comment.timestamp).toLocaleString()}</span>
//             {isEditable && (
//                 <button className="text-blue-500 hover:text-blue-700 ml-2 font-semibold transition">Edit</button>
//             )}
//         </div>
//     </div>
// );

// export default ProjectDetailPage;