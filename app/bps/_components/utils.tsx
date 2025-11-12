'use client'
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Commenter, ProjectListItem } from '../BusinessProjectClient';
import { MessageSquare } from 'lucide-react';
// Import the Image component from Next.js for optimized image handling
import Image from 'next/image';


export const NewProjectTemplate: React.FC<{ onSubmit: (data: { title: string, description: string }) => void }> = ({ onSubmit }) => {
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

// --- NEW COMPONENT: CommentersModal ---
interface CommentersModalProps {
    project: ProjectListItem;
    onClose: () => void;
}

export const CommentersModal: React.FC<CommentersModalProps> = ({ project, onClose }) => {
    
    const commenterList: Commenter[] = project.commenters 

    if (project.commentCount === 0) return null;

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={onClose} // Close when clicking outside
        >
            <div 
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Commentators ({project.commentCount})
                </h3>
                
                {/* Visual representation of the list of unique users */}
                <div className="mb-4">
                    
                </div>
                
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {commenterList.map((user) => (
                        <li key={user.id} className="flex items-center text-gray-800 border-b pb-2 last:border-b-0">
                            {user.image ? (
                                // Use Image component if user.image exists
                                <div className="w-8 h-8 rounded-full overflow-hidden mr-3 relative">
                                    <Image 
                                        src={user.image}
                                        alt={user.name || 'User Avatar'}
                                        fill // Fills the parent div
                                        sizes="32px"
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                // Fallback: Initial letter placeholder
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold mr-3 text-gray-600">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                            )}
                            <span className="font-medium">{user.name || 'Anonymous User'}</span>
                            {/* Optional: Show email/ID as a hint */}
                            {user.email && <span className="ml-2 text-xs text-gray-400">({user.email})</span>}
                        </li>
                    ))}
                </ul>
                
                <button 
                    onClick={onClose}
                    className="mt-6 w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition"
                >
                    Close
                </button>
            </div>
        </div>
    );
};
// 'use client'
// import React, { useState, useCallback, useEffect, useMemo } from 'react';
// import { Commenter, ProjectListItem } from '../BusinessProjectClient';
// import { MessageSquare } from 'lucide-react';


// export const NewProjectTemplate: React.FC<{ onSubmit: (data: { title: string, description: string }) => void }> = ({ onSubmit }) => {
//     // ... (NewProjectTemplate implementation is unchanged) ...
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

// // --- NEW COMPONENT: CommentersModal (Placeholder) ---
// interface CommentersModalProps {
//     project: ProjectListItem;
//     onClose: () => void;
// }

// export const CommentersModal: React.FC<CommentersModalProps> = ({ project, onClose }) => {
//     // Placeholder data (replace this with actual project.commenters data)
//     const commenterList: Commenter[] = project.commenters 
    
//     // Simulate fetching the commenters if they weren't fully loaded
//     // For this example, we'll use the placeholder or the (newly added) project.commenters

//     if (project.commentCount === 0) return null;

//     return (
//         // Simple modal overlay for demonstration
//         <div 
//             className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
//             onClick={onClose} // Close when clicking outside
//         >
//             <div 
//                 className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm"
//                 onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
//             >
//                 <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
//                     <MessageSquare className="w-5 h-5 mr-2" />
//                     Commentators ({project.commentCount})
//                 </h3>
                
//                 <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
//                     {commenterList.map((user) => (
//                         <li key={user.id} className="flex items-center text-gray-800 border-b pb-2 last:border-b-0">
//                             {/* Placeholder for Avatar */}
//                             <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold mr-3">
//                                 {user.name ? user.name.charAt(0) : 'U'}
//                             </div>
//                             <span className="font-medium">{user.name || 'Anonymous User'}</span>
//                         </li>
//                     ))}
//                 </ul>
                
//                 <button 
//                     onClick={onClose}
//                     className="mt-6 w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition"
//                 >
//                     Close
//                 </button>
//             </div>
//         </div>
//     );
// };