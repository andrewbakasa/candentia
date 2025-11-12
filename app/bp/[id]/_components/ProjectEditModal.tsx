'use client'

import { SafeUser } from '@/app/types';
import { BusinessProjectModel } from '@prisma/client';
import React, { useState, useEffect, useCallback } from 'react';
import { CompositeDecorator, DraftDecorator } from "draft-js";
import dynamic from 'next/dynamic';
// Import the Editor from 'react-draft-wysiwyg'
const Editor = dynamic(() => import('react-draft-wysiwyg').then(mod => mod.Editor), { ssr: false });

import { 
    Editor as Editor2, EditorState, convertToRaw,
    convertFromRaw, ContentState, convertFromHTML,
    Modifier, SelectionState, DraftInlineStyle,
    DefaultDraftInlineStyle, RichUtils, BlockMap,
    CharacterMetadata
} from 'draft-js';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
// Assuming isJsonStringEditorCompatible is robustly implemented
import { isJsonStringEditorCompatible } from '@/lib/utils'; 

// --- Interface Definitions (Kept as is) ---
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

interface ProjectDetails extends BusinessProjectModel {
    comments: ProjectCommentDisplay[];
    projectToUserRatings: ProjectRatingDisplay[];
    rating: number | null;
}
// ------------------------------------------

// New Utility Component: Project Edit Modal
export const ProjectEditModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    project: ProjectDetails; 
    onSave: (data: Partial<ProjectDetails>) => void; 
    isLoading: boolean;
}> = ({ isOpen, onClose, project, onSave, isLoading }) => {
    // State for form data
    const [formData, setFormData] = useState<Partial<ProjectDetails>>({
        title: project.title,
        description: project.description,
        irr: project.irr,
        npv: project.npv,
        riskScore: project.riskScore,
        projectRanking: project.projectRanking,
        progress: project.progress,
    });
    
    // Draft.js State
    const [editorState, setEditorState] = useState<EditorState>(EditorState.createEmpty());
    const [rawContentState, setRawContentState] = useState<string>(project.description || '');

    // Refactored logic to initialize/sync editor state
    const initializeEditorState = useCallback((description: string | null) => {
        let contentState: ContentState = ContentState.createFromText('');
        const descriptionString = description || '';

        try {
            // 1. Check if content is valid Draft.js Raw JSON
            if (isJsonStringEditorCompatible(descriptionString)) {
                const rawContent = JSON.parse(descriptionString);
                contentState = convertFromRaw(rawContent);
            } else if (descriptionString) {
                // 2. Fallback: Treat as plain text
                // Using createFromText as a reliable plain text fallback
                contentState = ContentState.createFromText(descriptionString);
            }
            // If description is null/empty, contentState remains ContentState.createFromText('')
        } catch (e) {
            console.error("Error initializing editor state from description:", e);
            // Default to empty state on error
            contentState = ContentState.createFromText(''); 
        }

        setEditorState(EditorState.createWithContent(contentState));
        setRawContentState(JSON.stringify(convertToRaw(contentState)));

    }, []);

    // Effect to initialize/sync state when 'project' prop changes or modal opens
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
        // Important: Initialize the Draft.js editor with the current project description
        initializeEditorState(project.description);
    }, [project, initializeEditorState]); 

    // Draft.js onChange handler
    const onEditorStateChange = (newEditorState: EditorState): void => {
        setEditorState(newEditorState);
        // Convert the current content to raw JSON string for storage
        const content = JSON.stringify(convertToRaw(newEditorState.getCurrentContent()));
        setRawContentState(content);
        // Do NOT update formData here, only update on final submit to prevent unnecessary renders/side-effects.
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // **CRITICAL STEP:** Update the description in formData with the latest raw content before saving.
        const dataToSave = {
            ...formData,
            description: rawContentState, // Use the state updated by onEditorStateChange
        }
        
        onSave(dataToSave);
    };

    const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

 
    
    const progressOptions: BusinessProjectModel['progress'][] = ['PROPOSAL', 'DEVELOPMENT', 'REVIEW', 'IMPLEMENTATION', 'COMPLETED'];
    
    // Custom style map for Draft.js
    const styleMap = {
        SMALL_YELLOW: {
        fontSize: '10px',
        color: 'red',
        verticalAlign: 'super', 
        },
    };
    
    return (
        <div 
            // Enhanced backdrop for better focus
            className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center py-10"
            onClick={handleOutsideClick}
        >
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-5xl mx-4 overflow-y-auto transform transition-all duration-300 scale-95 opacity-0 animate-fade-in">
                
                {/* Header */}
                <h3 className="text-3xl font-extrabold mb-4 border-b-2 pb-3 text-indigo-700 break-words">
                    Edit Project: {project.title}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Basic Info: Title and Progress */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border p-4 rounded-lg bg-gray-50/50">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Project Title</label>
                            <input 
                                type="text" 
                                name="title" 
                                value={formData.title || ''} 
                                onChange={handleChange} 
                                placeholder="E.g., Global Expansion Initiative Q4"
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm" 
                                required
                            />
                        </div>
                        
                        {/* Progress Status (Improved Label) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Implementation Stage</label>
                            <select
                                name="progress"
                                value={formData.progress}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                            >
                                {progressOptions.map(stage => (
                                    <option key={stage} value={stage}>
                                        {/* Capitalize first letter of each word in the stage */}
                                        {stage.replace(/_/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description - Draft.js Editor (Cleaned styles) */}
                    <div className='relative'>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Description / Proposal</label>
                        <div className="border border-gray-300 rounded-lg shadow-inner bg-white">
                            <Editor
                                editorStyle={{ 
                                    minHeight: '300px', 
                                    padding:'15px',
                                    overflowY: 'auto',
                                }}
                                editorState={editorState}
                                onEditorStateChange={onEditorStateChange}
                                // Removed wrapperStyle and toolbarStyle props here, relying on div for border
                                wrapperClassName="wrapper-class"
                                editorClassName="editor-class"
                                toolbarClassName="toolbar-class"
                                toolbarStyle={{ 
                                    borderBottom: '1px solid #ddd', 
                                    borderTop: 'none',
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '7px 7px 0 0',
                                    padding: '8px',
                                    marginBottom: '0', 
                                }}
                                customStyleMap={styleMap}
                            />
                        </div>
                    </div>
                    
                    {/* Financial Metrics Section (New Fieldset) */}
                    <fieldset className="border border-gray-200 p-6 rounded-lg shadow-sm space-y-4">
                        <legend className="text-lg font-extrabold px-2 text-gray-800">Financial and Risk Evaluation Criteria</legend>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            
                            {/* IRR (Improved Label) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Internal Rate of Return (IRR) %</label>
                                <input 
                                    type="number" 
                                    step="0.001"
                                    name="irr" 
                                    value={formData.irr ?? ''} 
                                    onChange={handleChange} 
                                    placeholder="e.g., 0.150 for 15.0%"
                                    className="mt-1 w-full border border-gray-300 p-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                                />
                            </div>
                            
                            {/* NPV (Improved Label) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Net Present Value (NPV) $</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    name="npv" 
                                    value={formData.npv ?? ''} 
                                    onChange={handleChange} 
                                    placeholder="e.g., 1,500,000"
                                    className="mt-1 w-full border border-gray-300 p-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                                />
                            </div>
                            
                            {/* Risk Score (Improved Label) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Risk Score (1=Low, 5=High)</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="1"
                                    max="5"
                                    name="riskScore" 
                                    value={formData.riskScore ?? ''} 
                                    onChange={handleChange} 
                                    placeholder="e.g., 2.5"
                                    className="mt-1 w-full border border-gray-300 p-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                                />
                            </div>
                            
                            {/* Project Ranking (Improved Label) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Priority Ranking (1=Highest)</label>
                                <input 
                                    type="number" 
                                    step="1"
                                    name="projectRanking" 
                                    value={formData.projectRanking ?? ''} 
                                    onChange={handleChange} 
                                    placeholder="e.g., 1"
                                    className="mt-1 w-full border border-gray-300 p-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* Action Buttons (Enhanced Styling and Loading Indicator) */}
                    <div className="flex justify-end space-x-3 pt-4 border-t pt-6">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-6 py-2.5 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition duration-150 shadow-md"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2.5 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition duration-150 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Simple animation keyframes definition for modal entry */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

// This utility function can remain outside the component, potentially in a utils file.
 export const getTextFromEditor = (item: any): ContentState => {
  if (item ) {
    try {
      // Attempt to parse as Draft.js raw content
      const rawContent = JSON.parse(item);
      // Check if it looks like Draft.js raw content (has blocks and entityMap)
      if (rawContent.blocks && Array.isArray(rawContent.blocks)) {
        return convertFromRaw(rawContent);
      }
    } catch (e) {
      // If parsing fails or it's not raw content, treat as plain text
      // console.warn("Description is not valid Draft.js raw content, treating as plain text:", e);
    }
    // Fallback: treat as plain text
    return ContentState.createFromText(item);
  }
  return ContentState.createFromText(''); // Return empty content if no description
};
