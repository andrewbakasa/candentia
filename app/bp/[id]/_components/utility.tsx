'use client'
import React, { useState, useEffect, useCallback } from 'react';

// --- INTERFACES ---

interface ProjectCommentDisplay {
    id: string;
    content: string;
    userId: string;
    timestamp: string; // ISO string expected
    user: { id: string; email: string; name?: string; image?: string }; // Added optional name and image
}

// --- UTILITIES ---

/**
 * Calculates the time elapsed between a given timestamp and the current time 
 * and returns it in a human-readable, relative format (e.g., "5 hours ago").
 * @param timestamp - The ISO 8601 timestamp string.
 * @returns The relative time string.
 */
export const timeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    // Time constants in seconds
    const MINUTE = 60;
    const HOUR = 3600;
    const DAY = 86400;
    const WEEK = 604800;
    const MONTH = 2592000; // 30 days
    const YEAR = 31536000; // 365 days

    if (seconds < MINUTE) {
        return seconds <= 5 ? "just now" : `${seconds} seconds ago`;
    } else if (seconds < HOUR) {
        const minutes = Math.floor(seconds / MINUTE);
        return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    } else if (seconds < DAY) {
        const hours = Math.floor(seconds / HOUR);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (seconds < WEEK) {
        const days = Math.floor(seconds / DAY);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (seconds < MONTH) {
        const weeks = Math.floor(seconds / WEEK);
        return `${weeks} wk${weeks > 1 ? 's' : ''} ago`;
    } else if (seconds < YEAR) {
        const months = Math.floor(seconds / MONTH);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        const years = Math.floor(seconds / YEAR);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }
};

// --- CORE COMPONENTS ---

// New Utility Component: EditCommentEditor (Used internally by CommentDisplay)
export const EditCommentEditor: React.FC<{ initialContent: string, commentId: string, onSave: (commentId: string, content: string) => Promise<boolean>, onCancel: () => void }> = ({ initialContent, commentId, onSave, onCancel }) => {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        // Allow saving if content is only whitespace different, but not empty
        if (!content.trim()) {
            onCancel(); // Treat empty content as cancel
            return;
        }

        if (content.trim() === initialContent.trim()) {
             onCancel(); // No change
             return;
        }

        setIsSaving(true);
        const success = await onSave(commentId, content.trim());
        setIsSaving(false);

        if (success) {
            onCancel();
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-2">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="w-full border border-yellow-400 p-3 rounded-lg resize-none focus:ring-yellow-500 focus:border-yellow-500 bg-yellow-50 text-base"
                placeholder="Edit your comment..."
            />
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md transition">
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={isSaving || content.trim() === initialContent.trim()}
                    className="text-sm bg-yellow-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'Saving...' : 'Save Edit'}
                </button>
            </div>
        </form>
    );
};

// Simple Comment Editor (Unchanged for this request)
export const CommentEditor: React.FC<{ onSubmit: (content: string) => void }> = ({ onSubmit }) => {
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
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none shadow-sm text-base"
            />
            <button type="submit" className="mt-3 bg-indigo-600 text-white p-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-md">Post Comment</button>
        </form>
    );
};

// --- UTILITY COMPONENTS (Unchanged for this request) ---

// StatBox (Unchanged)
export const StatBox: React.FC<{ title: string, value: string, color: 'green' | 'indigo' | 'red' | 'blue' }> = ({ title, value, color }) => {
    let baseColor = '';
    let bgColor = '';
    
    switch (color) {
        case 'green':
            baseColor = 'text-green-600';
            bgColor = 'bg-green-50 border-green-200';
            break;
        case 'indigo':
            baseColor = 'text-indigo-600';
            bgColor = 'bg-indigo-50 border-indigo-200';
            break;
        case 'red':
            baseColor = 'text-red-600';
            bgColor = 'bg-red-50 border-red-200';
            break;
        case 'blue':
        default:
            baseColor = 'text-blue-600';
            bgColor = 'bg-blue-50 border-blue-200';
            break;
    }
    
    return (
        <div className={`p-4 rounded-xl border shadow-sm ${bgColor}`}>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${baseColor}`}>{value}</p>
        </div>
    );
};

// Simple Star Rating Component (Unchanged)
export const UserRatingComponent: React.FC<{ myRating: number | null, onRate: (rate: number) => void }> = ({ myRating, onRate }) => (
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


// --- IMPROVED COMMENT DISPLAY ---

export // Comment Display (Modified for better UI, full data, and relative time)
const CommentDisplay: React.FC<{ comment: ProjectCommentDisplay, isEditable: boolean, onEdit: (commentId: string, newContent: string) => Promise<boolean> }> = ({ comment, isEditable, onEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    
    // Use an effect to update the relative time (optional, for real-time updates)
    // For simplicity, we'll calculate it on render, but a timer could be added here
    const relativeTime = timeAgo(comment.timestamp);
    const fullDate = new Date(comment.timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
    
    // Fallback/Display Name
    const userName = comment.user.name || comment.user.email.split('@')[0];
    const userInitial = userName.charAt(0).toUpperCase();

    if (isEditing) {
        return (
            <div className="border-l-4 border-yellow-500 pl-4 py-3 bg-white rounded-r-xl shadow-md transition duration-200 ease-in-out">
                <EditCommentEditor 
                    initialContent={comment.content}
                    commentId={comment.id}
                    onSave={onEdit}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className="flex space-x-4 p-4 border border-gray-100 bg-white rounded-xl shadow-sm hover:shadow-lg transition duration-200 ease-in-out">
            
            {/* User Avatar/Initial */}
            <div className="flex-shrink-0">
                {comment.user.image ? (
                    // Replace with an actual Image component or appropriate tag
                    <img 
                        src={comment.user.image} 
                        alt={userName} 
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-200"
                    />
                ) : (
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-500 text-white font-semibold text-lg ring-2 ring-indigo-200">
                        {userInitial}
                    </div>
                )}
            </div>

            {/* Content and Metadata */}
            <div className="flex-1 min-w-0">
                {/* Header: User Info & Time */}
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <span className="font-bold text-indigo-700 text-base leading-snug">{userName}</span>
                        <span className="text-xs text-gray-500 ml-2" title={comment.user.email}>({comment.user.email})</span>
                    </div>
                    <div className="flex space-x-2 items-center text-xs text-gray-500">
                        {/* Relative Time Display */}
                        <span className="text-sm font-medium text-gray-600" title={fullDate}>
                            {relativeTime}
                        </span>
                        
                        {/* Edit Button */}
                        {isEditable && (
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="text-indigo-500 hover:text-indigo-700 font-semibold transition text-sm"
                                title="Edit this comment"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* Comment Content */}
                <p className="text-gray-800 text-base whitespace-pre-wrap break-words">{comment.content}</p>
            </div>
        </div>
    );
};
// 'use client'
// import React, { useState, useEffect, useCallback } from 'react';

// interface ProjectCommentDisplay {
//     id: string;
//     content: string;
//     userId: string;
//     timestamp: string;
//     user: { id: string; email: string };
// }

// // New Utility Component: EditCommentEditor (Used internally by CommentDisplay)
// export const EditCommentEditor: React.FC<{ initialContent: string, commentId: string, onSave: (commentId: string, content: string) => Promise<boolean>, onCancel: () => void }> = ({ initialContent, commentId, onSave, onCancel }) => {
//     const [content, setContent] = useState(initialContent);
//     const [isSaving, setIsSaving] = useState(false);

//     const handleSave = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (content.trim() === initialContent || !content.trim()) {
//             onCancel();
//             return;
//         }

//         setIsSaving(true);
//         const success = await onSave(commentId, content.trim());
//         setIsSaving(false);

//         if (success) {
//             onCancel();
//         }
//     };

//     return (
//         <form onSubmit={handleSave} className="space-y-2">
//             <textarea
//                 value={content}
//                 onChange={(e) => setContent(e.target.value)}
//                 rows={3}
//                 className="w-full border border-yellow-400 p-2 rounded-lg resize-none focus:ring-yellow-500 focus:border-yellow-500 bg-yellow-50 text-sm"
//             />
//             <div className="flex justify-end space-x-2">
//                 <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md transition">
//                     Cancel
//                 </button>
//                 <button 
//                     type="submit" 
//                     disabled={isSaving}
//                     className="text-sm bg-yellow-600 text-white px-3 py-1 rounded-md font-medium hover:bg-yellow-700 transition disabled:opacity-50"
//                 >
//                     {isSaving ? 'Saving...' : 'Save Edit'}
//                 </button>
//             </div>
//         </form>
//     );
// };

// // Simple Comment Editor (Unchanged)
// export const CommentEditor: React.FC<{ onSubmit: (content: string) => void }> = ({ onSubmit }) => {
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

// // --- UTILITY COMPONENTS (Modified and New) ---

// // New Utility Component: StatBox
// export const StatBox: React.FC<{ title: string, value: string, color: 'green' | 'indigo' | 'red' | 'blue' }> = ({ title, value, color }) => {
//     let baseColor = '';
//     let bgColor = '';
    
//     switch (color) {
//         case 'green':
//             baseColor = 'text-green-600';
//             bgColor = 'bg-green-50 border-green-200';
//             break;
//         case 'indigo':
//             baseColor = 'text-indigo-600';
//             bgColor = 'bg-indigo-50 border-indigo-200';
//             break;
//         case 'red':
//             baseColor = 'text-red-600';
//             bgColor = 'bg-red-50 border-red-200';
//             break;
//         case 'blue':
//         default:
//             baseColor = 'text-blue-600';
//             bgColor = 'bg-blue-50 border-blue-200';
//             break;
//     }
    
//     return (
//         <div className={`p-4 rounded-xl border shadow-sm ${bgColor}`}>
//             <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
//             <p className={`text-2xl font-bold ${baseColor}`}>{value}</p>
//         </div>
//     );
// };

// // Simple Star Rating Component (Unchanged)
// export const UserRatingComponent: React.FC<{ myRating: number | null, onRate: (rate: number) => void }> = ({ myRating, onRate }) => (
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

// export // Comment Display (Modified to handle editing state)
// const CommentDisplay: React.FC<{ comment: ProjectCommentDisplay, isEditable: boolean, onEdit: (commentId: string, newContent: string) => Promise<boolean> }> = ({ comment, isEditable, onEdit }) => {
//     const [isEditing, setIsEditing] = useState(false);

//     if (isEditing) {
//         return (
//             <div className="border-l-4 border-yellow-500 pl-4 py-3 bg-white rounded-r-xl shadow-md">
//                 <EditCommentEditor 
//                     initialContent={comment.content}
//                     commentId={comment.id}
//                     onSave={onEdit}
//                     onCancel={() => setIsEditing(false)}
//                 />
//             </div>
//         );
//     }

//     return (
//         <div className="border-l-4 border-indigo-500 pl-4 py-3 bg-white rounded-r-xl shadow-md">
//             <p className="text-base text-gray-800 mb-2">{comment.content}</p>
//             <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
//                 <span>By <span className="font-bold text-gray-700">{comment.user.email}</span> on {new Date(comment.timestamp).toLocaleString()}</span>
//                 {isEditable && (
//                     <button 
//                         onClick={() => setIsEditing(true)} 
//                         className="text-blue-500 hover:text-blue-700 ml-2 font-semibold transition"
//                     >
//                         Edit
//                     </button>
//                 )}
//             </div>
//         </div>
//     );
// };



