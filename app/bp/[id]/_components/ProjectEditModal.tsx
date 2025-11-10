'use client'

import { SafeUser } from '@/app/types';
import { BusinessProjectModel } from '@prisma/client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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


interface ProjectDetails extends BusinessProjectModel {
    comments: ProjectCommentDisplay[];
    projectToUserRatings: ProjectRatingDisplay[];
    rating: number | null;
    //irr?: number | null;
    //npv?: number | null;
    //riskScore?: number | null;
    //projectRanking?: number | null;
}
// New Utility Component: Project Edit Modal
export const ProjectEditModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    project: ProjectDetails; 
    onSave: (data: Partial<ProjectDetails>) => void; 
    isLoading: boolean;
}> = ({ isOpen, onClose, project, onSave, isLoading }) => {
    
    // State to hold the form data
    const [formData, setFormData] = useState<Partial<ProjectDetails>>({
        title: project.title,
        description: project.description,
        irr: project.irr,
        npv: project.npv,
        riskScore: project.riskScore,
        projectRanking: project.projectRanking,
        progress: project.progress,
    });
    
    // Sync state when project prop changes (e.g., after successful save/refresh)
    useEffect(() => {
        setFormData({
            title: project.title,
            description: project.description,
            irr: project.irr,
            npv: project.npv,
            riskScore: project.riskScore,
            projectRanking: project.projectRanking,
            progress: project.progress,
        });
    }, [project]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            // Convert numeric inputs
            [name]: type === 'number' ? parseFloat(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    /**
     * Handles closing the modal only if the click occurs on the backdrop (outside the content).
     * This fixes the "cannot be closed" issue.
     */
    const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    
    // Available progress stages (customize as needed)
    const progressOptions: BusinessProjectModel['progress'][] = ['PROPOSAL', 'DEVELOPMENT', 'REVIEW', 'IMPLEMENTATION', 'COMPLETED'];

    return (
        // Reverting back to h-full and py-10, and removing items-center 
        // ensures the modal is scrollable and starts visible from the top on mobile.
        <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center py-10"
            onClick={handleOutsideClick} // Allows clicking the backdrop to close
        >
            {/* The inner div uses max-w-3xl for responsiveness */}
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-y-auto">
                {/* Added break-words to ensure the title wraps gracefully on small screens */}
                <h3 className="text-2xl font-bold mb-4 border-b pb-2 text-indigo-700 break-words">
                    Edit Project: {project.title}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input 
                            type="text" 
                            name="title" 
                            value={formData.title || ''} 
                            onChange={handleChange} 
                            className="mt-1 w-full border border-gray-300 p-2 rounded-md" 
                            required
                        />
                    </div>
                    
                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea 
                            name="description" 
                            value={formData.description || ''} 
                            onChange={handleChange} 
                            rows={6}
                            className="mt-1 w-full border border-gray-300 p-2 rounded-md resize-none" 
                            required
                        />
                    </div>
                    
                    {/* Progress Status (Crucial for Section 4: Implementation) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Progress Status</label>
                        <select
                            name="progress"
                            value={formData.progress}
                            onChange={handleChange}
                            className="mt-1 w-full border border-gray-300 p-2 rounded-md"
                        >
                            {progressOptions.map(stage => (
                                <option key={stage} value={stage}>{stage.charAt(0).toUpperCase() + stage.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    <h4 className="text-lg font-semibold mt-6 text-gray-800">Financial Metrics (For Evaluation Criteria)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {/* IRR */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">IRR (e.g., 0.15 for 15%)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                name="irr" 
                                value={formData.irr || ''} 
                                onChange={handleChange} 
                                className="mt-1 w-full border border-gray-300 p-2 rounded-md"
                            />
                        </div>
                        {/* NPV */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">NPV ($)</label>
                            <input 
                                type="number" 
                                step="1000"
                                name="npv" 
                                value={formData.npv || ''} 
                                onChange={handleChange} 
                                className="mt-1 w-full border border-gray-300 p-2 rounded-md"
                            />
                        </div>
                        {/* Risk Score */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Risk Score (1-5)</label>
                            <input 
                                type="number" 
                                step="0.1"
                                min="1"
                                max="5"
                                name="riskScore" 
                                value={formData.riskScore || ''} 
                                onChange={handleChange} 
                                className="mt-1 w-full border border-gray-300 p-2 rounded-md"
                            />
                        </div>
                        {/* Project Ranking */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Project Ranking (#)</label>
                            <input 
                                type="number" 
                                step="1"
                                name="projectRanking" 
                                value={formData.projectRanking || ''} 
                                onChange={handleChange} 
                                className="mt-1 w-full border border-gray-300 p-2 rounded-md"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
// 'use client'

// import { BusinessProjectModel } from '@prisma/client';
// import React, { useState, useEffect } from 'react';

// interface ProjectCommentDisplay {
//     id: string;
//     content: string;
//     userId: string;
//     timestamp: string;
//     user: { id: string; email: string };
// }

// // Simplified Rating structure
// interface ProjectRatingDisplay {
//     id: string;
//     projectId: string;
//     userId: string;
//     rate: number;
//     createdAt: string;
//     updatedAt: string;
// }


// interface ProjectDetails extends BusinessProjectModel {
//     comments: ProjectCommentDisplay[];
//     projectToUserRatings: ProjectRatingDisplay[];
//     rating: number | null;
//     //irr?: number | null;
//     //npv?: number | null;
//     //riskScore?: number | null;
//     //projectRanking?: number | null;
// }
// // New Utility Component: Project Edit Modal
// export const ProjectEditModal: React.FC<{ 
//     isOpen: boolean; 
//     onClose: () => void; 
//     project: ProjectDetails; 
//     onSave: (data: Partial<ProjectDetails>) => void; 
//     isLoading: boolean;
// }> = ({ isOpen, onClose, project, onSave, isLoading }) => {
    
//     // State to hold the form data
//     const [formData, setFormData] = useState<Partial<ProjectDetails>>({
//         title: project.title,
//         description: project.description,
//         irr: project.irr,
//         npv: project.npv,
//         riskScore: project.riskScore,
//         projectRanking: project.projectRanking,
//         progress: project.progress,
//     });
    
//     // Sync state when project prop changes (e.g., after successful save/refresh)
//     useEffect(() => {
//         setFormData({
//             title: project.title,
//             description: project.description,
//             irr: project.irr,
//             npv: project.npv,
//             riskScore: project.riskScore,
//             projectRanking: project.projectRanking,
//             progress: project.progress,
//         });
//     }, [project]);

//     if (!isOpen) return null;

//     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//         const { name, value, type } = e.target;
//         setFormData(prev => ({
//             ...prev,
//             // Convert numeric inputs
//             [name]: type === 'number' ? parseFloat(value) : value,
//         }));
//     };

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         onSave(formData);
//     };
    
//     // Available progress stages (customize as needed)
//     const progressOptions: BusinessProjectModel['progress'][] = ['PROPOSAL', 'DEVELOPMENT', 'REVIEW', 'IMPLEMENTATION', 'COMPLETED'];

//     return (
//         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-90vh w-full z-50 flex justify-center items-center">
//             <div className="bg-white  p-6 rounded-xl shadow-2xl w-full max-w-3xl mx-4">
//                 <h3 className="text-2xl  font-bold mb-4 border-b pb-2 text-indigo-700">Edit Project: {project.title}</h3>
                
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                     {/* Title */}
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700">Title</label>
//                         <input 
//                             type="text" 
//                             name="title" 
//                             value={formData.title || ''} 
//                             onChange={handleChange} 
//                             className="mt-1 w-full border border-gray-300 p-2 rounded-md" 
//                             required
//                         />
//                     </div>
                    
//                     {/* Description */}
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700">Description</label>
//                         <textarea 
//                             name="description" 
//                             value={formData.description || ''} 
//                             onChange={handleChange} 
//                             rows={6}
//                             className="mt-1 w-full border border-gray-300 p-2 rounded-md resize-none" 
//                             required
//                         />
//                     </div>
                    
//                     {/* Progress Status (Crucial for Section 4: Implementation) */}
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700">Progress Status</label>
//                         <select
//                             name="progress"
//                             value={formData.progress}
//                             onChange={handleChange}
//                             className="mt-1 w-full border border-gray-300 p-2 rounded-md"
//                         >
//                             {progressOptions.map(stage => (
//                                 <option key={stage} value={stage}>{stage.charAt(0).toUpperCase() + stage.slice(1)}</option>
//                             ))}
//                         </select>
//                     </div>

//                     <h4 className="text-lg font-semibold mt-6 text-gray-800">Financial Metrics (For Evaluation Criteria)</h4>
//                     <div className="grid grid-cols-2 gap-4">
//                         {/* IRR */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700">IRR <span className='text-xs'>(e.g, 0.15 for 15%)</span></label>
//                             <input 
//                                 type="number" 
//                                 step="0.01"
//                                 name="irr" 
//                                 value={formData.irr || ''} 
//                                 onChange={handleChange} 
//                                 className="mt-1 w-full border border-gray-300 p-2 rounded-md"
//                             />
//                         </div>
//                         {/* NPV */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700">NPV ($)</label>
//                             <input 
//                                 type="number" 
//                                 step="1000"
//                                 name="npv" 
//                                 value={formData.npv || ''} 
//                                 onChange={handleChange} 
//                                 className="mt-1 w-full border border-gray-300 p-2 rounded-md"
//                             />
//                         </div>
//                         {/* Risk Score */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700">Risk Score (1-5)</label>
//                             <input 
//                                 type="number" 
//                                 step="0.1"
//                                 min="1"
//                                 max="5"
//                                 name="riskScore" 
//                                 value={formData.riskScore || ''} 
//                                 onChange={handleChange} 
//                                 className="mt-1 w-full border border-gray-300 p-2 rounded-md"
//                             />
//                         </div>
//                         {/* Project Ranking */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700">Project Ranking (#)</label>
//                             <input 
//                                 type="number" 
//                                 step="1"
//                                 name="projectRanking" 
//                                 value={formData.projectRanking || ''} 
//                                 onChange={handleChange} 
//                                 className="mt-1 w-full border border-gray-300 p-2 rounded-md"
//                             />
//                         </div>
//                     </div>

//                     <div className="flex justify-end space-x-3 pt-4">
//                         <button 
//                             type="button" 
//                             onClick={onClose} 
//                             className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
//                             disabled={isLoading}
//                         >
//                             Cancel
//                         </button>
//                         <button 
//                             type="submit" 
//                             className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
//                             disabled={isLoading}
//                         >
//                             {isLoading ? 'Saving...' : 'Save Changes'}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };