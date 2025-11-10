'use client'
import React, { useState, useEffect, useCallback } from 'react';

interface ProjectCommentDisplay {
    id: string;
    content: string;
    userId: string;
    timestamp: string;
    user: { id: string; email: string };
}

// New Utility Component: EditCommentEditor (Used internally by CommentDisplay)
export const EditCommentEditor: React.FC<{ initialContent: string, commentId: string, onSave: (commentId: string, content: string) => Promise<boolean>, onCancel: () => void }> = ({ initialContent, commentId, onSave, onCancel }) => {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim() === initialContent || !content.trim()) {
            onCancel();
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
                className="w-full border border-yellow-400 p-2 rounded-lg resize-none focus:ring-yellow-500 focus:border-yellow-500 bg-yellow-50 text-sm"
            />
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md transition">
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={isSaving}
                    className="text-sm bg-yellow-600 text-white px-3 py-1 rounded-md font-medium hover:bg-yellow-700 transition disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save Edit'}
                </button>
            </div>
        </form>
    );
};

// Simple Comment Editor (Unchanged)
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
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none shadow-sm"
            />
            <button type="submit" className="mt-3 bg-indigo-600 text-white p-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-md">Post Comment</button>
        </form>
    );
};

// --- UTILITY COMPONENTS (Modified and New) ---

// New Utility Component: StatBox
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

export // Comment Display (Modified to handle editing state)
const CommentDisplay: React.FC<{ comment: ProjectCommentDisplay, isEditable: boolean, onEdit: (commentId: string, newContent: string) => Promise<boolean> }> = ({ comment, isEditable, onEdit }) => {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className="border-l-4 border-yellow-500 pl-4 py-3 bg-white rounded-r-xl shadow-md">
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
        <div className="border-l-4 border-indigo-500 pl-4 py-3 bg-white rounded-r-xl shadow-md">
            <p className="text-base text-gray-800 mb-2">{comment.content}</p>
            <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                <span>By <span className="font-bold text-gray-700">{comment.user.email}</span> on {new Date(comment.timestamp).toLocaleString()}</span>
                {isEditable && (
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="text-blue-500 hover:text-blue-700 ml-2 font-semibold transition"
                    >
                        Edit
                    </button>
                )}
            </div>
        </div>
    );
};



