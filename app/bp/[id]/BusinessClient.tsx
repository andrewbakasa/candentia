'use client'

import { SafeUser } from '@/app/types';
import { BusinessProjectModel } from '@prisma/client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CommentDisplay, CommentEditor, StatBox, timeAgo, UserRatingComponent } from './_components/utility';
import { getTextFromEditor, ProjectEditModal } from './_components/ProjectEditModal';

import { CompositeDecorator, Editor, EditorState } from "draft-js";
interface ProjectCommentDisplay {
    id: string;
    content: string;
    userId: string;
    timestamp: string;
    user: { id: string; email: string };
}
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
    //irr?: number | null;
    //npv?: number | null;
    //riskScore?: number | null;
    //projectRanking?: number | null;
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

    const [compositeDecorator,setCompositeDecorator] = useState(new CompositeDecorator([]))
    // State for client-side interactions
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [mutationError, setMutationError] = useState<string | null>(null);
    const [showComments, setShowComments] = useState(true);
    const [myRating, setMyRating] = useState<number | null>(null);
    
    // 👈 NEW STATE: For project editing modal
    const [isEditingProject, setIsEditingProject] = useState(false);

    // Function to fetch the LATEST project data from the API to update local state
    const refreshProjectData = useCallback(async () => {
        const projectId = localProject?.id;
        if (!projectId) return;

        setIsRefreshing(true);
        setMutationError(null);
        try {
            const response = await fetch(`/api/busprojects/${projectId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch updated project data.');
            }

            const freshProjectData: ProjectDetails = await response.json();
            setLocalProject(freshProjectData); // Update the main project state

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
        const userRating = localProject.projectToUserRatings.find(r => r.userId === currentUser?.id);
        setMyRating(userRating?.rate || null);
    }, [localProject, currentUser?.id]);


    const handleRate = async (rate: number) => {
        const projectId = localProject?.id;

        if (!projectId || !currentUser?.id || isRefreshing) {
            setMutationError(currentUser ? "Please wait for current operation to complete." : "You must be logged in to rate.");
            return;
        }
        
        const previousRating = myRating;
        setMyRating(rate); 
        setMutationError(null);

        try {
            const response = await fetch(`/api/busprojects/${projectId}/rating`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rate }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit rating.');
            }
            
            await refreshProjectData(); 

        } catch(err: any) {
            console.error('Rating failed:', err);
            setMutationError(err.message || 'Rating failed.');
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
            const response = await fetch(`/api/busprojects/${projectId}/addComment`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit comment.');
            }

            await refreshProjectData(); 
            setShowComments(true); 

        } catch(err: any) {
             console.error('Comment submission failed:', err);
             setMutationError(err.message || 'Comment submission failed.');
        }
    };
    
    // 👈 NEW API Handler: Update existing comment
    const handleCommentEdit = useCallback(async (commentId: string, newContent: string) => {
        const projectId = localProject?.id;
        if (!projectId || !currentUser?.id) {
            setMutationError("You must be logged in to edit a comment.");
            return false; // Return false on failure
        }
        
        setMutationError(null);
        try {
            const response = await fetch(`/api/busprojects/${projectId}/addComment/${commentId}`, { 
                method: 'POST', // Use PATCH for update
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to edit comment.');
            }
            
            // Optimistic update of local comments list for snappier UI
            setLocalProject(prev => ({
                ...prev,
                comments: prev.comments.map(c => 
                    c.id === commentId ? { ...c, content: newContent, timestamp: new Date().toISOString() } : c
                )
            }));
            
            // Optionally: await refreshProjectData() here if you need server-side timestamps/user fields, 
            // but the optimistic update is often preferred for comments.
            return true;
        } catch(err: any) {
             console.error('Comment edit failed:', err);
             setMutationError(err.message || 'Comment edit failed.');
             return false;
        }
    }, [localProject?.id, currentUser?.id]);
    
    // 👈 NEW API Handler: Update Project Details
    const handleProjectEdit = useCallback(async (updatedData: Partial<ProjectDetails>) => {
        const projectId = localProject?.id;
        if (!projectId || !currentUser?.id) {
            setMutationError("You must be logged in to edit the project.");
            return;
        }
        
        setIsRefreshing(true);
        setMutationError(null);
        try {
            const response = await fetch(`/api/busprojects/${projectId}`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update project.');
            }

            // Fetch the freshly updated data from the server
            await refreshProjectData(); 
            setIsEditingProject(false); // Close modal on success

        } catch(err: any) {
             console.error('Project edit failed:', err);
             setMutationError(err.message || 'Project edit failed.');
        } finally {
            setIsRefreshing(false);
        }
    }, [localProject?.id, currentUser?.id, refreshProjectData]);


    const allowedRoles = [ 'admin', 'executive'];
    const canEditProject = currentUser?.roles.some(role => 
        allowedRoles.some(allowed => allowed.toLowerCase() === role.toLowerCase())
    );

   

    if (!localProject) return <div className="p-8 text-center text-xl text-red-500 font-semibold">Error: Project data is missing or failed to load.</div>;

    // --- RENDER COMPONENT ---
    return (
        <div className="container mx-auto p-4 max-w-4xl">
            
            <Link 
                href="/bps/" 
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6 font-medium transition duration-150 ease-in-out"
            >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Projects List
            </Link>

            

            {/* Project Title, Edit Button, and Refresh Button */}
            <div className="flex flex-col mb-4 space-y-3">
    
                {/* 👈 Title Row (Always full width on top) */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 leading-tight">{localProject.title}</h1>
                </div>

                {/* 👈 Button Row (Pushed to the right on large screens, or full width row on mobile) */}
                <div className="flex justify-end sm:justify-between items-center">
            
                    {/* Empty spacer div on mobile, or text/info on desktop if needed */}
                    <div className="hidden sm:block"></div> 

                    <div className="flex items-center space-x-2">
                        {/* Edit Project Button */}
                        {canEditProject && (
                            <button
                                onClick={() => setIsEditingProject(true)}
                                className="flex items-center text-sm bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-700 transition duration-150 ease-in-out font-medium shadow-md"
                                disabled={isRefreshing}
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                Edit
                            </button>
                        )}
                        
                        {/* Refresh Button */}
                        <button
                            onClick={refreshProjectData}
                            disabled={isRefreshing}
                            className="flex items-center text-sm bg-gray-100 text-gray-600 border border-gray-300 px-3 py-1 rounded-full hover:bg-gray-200 disabled:opacity-50 transition duration-150 ease-in-out"
                        >
                            <svg className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m15.356-2H15V4m6.582 13a8.001 8.001 0 01-15.356 2H15v-5"></path>
                            </svg>
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>
            </div>
           
           <p 
                className="text-sm text-gray-500 mb-4 font-medium" 
                
            >
                Proposed: 
                <span className="text-gray-700 font-semibold mr-1">
                    {/* Full Short Date */}
                    {new Date(localProject.createdAt).toLocaleDateString(undefined, {
                        weekday: 'short', 
                        day: 'numeric',   
                        month: 'short', 
                        year: 'numeric',
                    })}
                </span>
    
                <span className="text-gray-400">|</span> 

                 <span className="text-blue-600 font-semibold ml-1">
                    {timeAgo(new Date(localProject.createdAt).toLocaleDateString())}
                </span>
            </p>

            {isRefreshing && <p className="text-blue-600 mb-4 font-medium animate-pulse">Updating data...</p>}
            {mutationError && <p className="text-red-700 mb-4 font-semibold p-3 bg-red-100 rounded-lg border border-red-300 shadow-sm">Error: {mutationError}</p>}

            {/* Rating/Vote Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-5 bg-yellow-50 rounded-xl border border-yellow-200 shadow-md">
                

                {/* <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between"> */}
                    <span className="text-xl font-bold text-gray-800 mb-3 sm:mb-0">
                        {/*
                        Label Display Logic:
                        - Default (mobile/small screen): "O/Rating:" (text-lg)
                        - Small screens and up (sm:): "Overall Rating:" (text-xl)
                        */}
                        <span className="sm:hidden text-lg">O/Rating:</span>
                        <span className="hidden sm:inline text-xl">Overall Rating:</span>
                        
                        <span className="text-yellow-600">{(localProject.rating || 0).toFixed(2)} ⭐</span>
                        
                        {/*
                        Vote Count Display Logic:
                        - Default (mobile/small screen): text-xs
                        - Small screens and up (sm:): text-sm
                        */}
                        <span className="text-xs sm:text-sm text-gray-500 ml-2">({localProject.projectToUserRatings.length} votes)</span>
                    </span>
                {/* </div> */}
                
                <UserRatingComponent myRating={myRating} onRate={handleRate} />
            </div>

            {/* Financial/Evaluation Summary Section */}
            <h2 className="text-2xl font-semibold mb-3 border-b pb-1 text-gray-700">Evaluation Summary 📊</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
                <StatBox title="IRR" value={localProject.irr !== null && localProject.irr !== undefined ? `${(localProject.irr * 100).toFixed(1)}%` : 'N/A'} color="green" />
                <StatBox title="NPV" value={localProject.npv !== null && localProject.npv !== undefined ? `$${localProject.npv.toLocaleString()}` : 'N/A'} color="indigo" />
                <StatBox title="Risk Score" value={localProject.riskScore !== null && localProject.riskScore !== undefined ? `${localProject.riskScore.toFixed(1)}/5` : 'N/A'} color="red" />
                <StatBox title="Ranking" value={localProject.projectRanking !== null && localProject.projectRanking !== undefined ? `#${localProject.projectRanking}` : 'N/A'} color="blue" />
            </div>

            {/* Project Details */}
            <h2 className="text-2xl font-semibold mb-3 border-b pb-1 text-gray-700">Project Description</h2>
            <p className="mb-4 text-sm">Status: <span className={`font-bold uppercase ${localProject.progress === 'PROPOSAL' ? 'text-indigo-600' : 'text-green-600'}`}>{localProject.progress}</span></p>
            
            <div className="prose max-w-none border p-5 rounded-xl bg-white shadow-inner text-gray-800" >
                <Editor 
                        editorState={EditorState.createWithContent(getTextFromEditor(localProject.description),    compositeDecorator)} 
                        readOnly 
                        onChange={() => {}} // Empty dummy function
            />
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
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((comment) => (
                        // 👈 Added onEdit handler to CommentDisplay
                        <CommentDisplay 
                            key={comment.id} 
                            comment={comment} 
                            isEditable={comment.userId === currentUser?.id} 
                            onEdit={handleCommentEdit}
                        />
                    ))}
                    {localProject.comments.length === 0 && (
                        <p className="text-gray-500 p-4 border rounded-lg bg-gray-50 text-center">No comments yet. Be the first to start the discussion!</p>
                    )}
                </div>
            </div>
            
            {/* 👈 NEW: Project Edit Modal */}
            <ProjectEditModal
                isOpen={isEditingProject}
                onClose={() => setIsEditingProject(false)}
                project={localProject}
                onSave={handleProjectEdit}
                isLoading={isRefreshing}
            />
        </div>
    );
};








export default ProjectDetailPage;