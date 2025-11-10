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
    // Note state is no longer needed for initial load, only the raw content for storage
    const [rawContentState, setRawContentState] = useState<string>(project.description || '');

    // Refactored logic to initialize/sync editor state
    const initializeEditorState = useCallback((description: string | null) => {
        //let contentState: ContentState;
        //const descriptionString = description || '';

        // 1. Initialize contentState to a safe default (empty)
        // We can't use ContentState.createEmpty() (as discussed previously, it doesn't exist)
        // but ContentState.createFromText('') is a reliable way to get an empty ContentState object.
        let contentState: ContentState = ContentState.createFromText('');
        
        const descriptionString = description || '';

        try {
            // 1. Try to parse as Draft.js raw content JSON
            if (isJsonStringEditorCompatible(descriptionString)) {
                const rawContent = JSON.parse(descriptionString);
                contentState = convertFromRaw(rawContent);
            } else if (descriptionString) {
                // 2. Fallback: Treat as plain text and convert to ContentState
                // Note: Using convertFromHTML for initial plain text might be safer 
                // than createFromText if you want block structure, but createFromText 
                // is sufficient for simple strings. Let's use createFromText for simplicity 
                // unless it is confirmed to be HTML. If you expect HTML, use convertFromHTML.
                
                // Assuming convertFromHTML is preferred for converting non-JSON string/HTML to blocks
                const blocksFromHTML = convertFromHTML(descriptionString);
                contentState = ContentState.createFromBlockArray(
                    blocksFromHTML.contentBlocks, 
                    blocksFromHTML.entityMap
                );

            } else {
                // 3. Handle null/empty string
                //contentState = ContentState.createEmpty();
             //   EditorState.createEmpty()
             //   ContentState.createFromText('');
            }
        } catch (e) {
            console.error("Error initializing editor state from description:", e);
            // 4. Handle conversion errors (e.g., corrupt JSON or invalid HTML)
            //contentState = ContentState.createEmpty();
            //EditorState.createEmpty()
            //    ContentState.createFromText('');
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
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center py-10"
            onClick={handleOutsideClick}
        >
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-y-auto">
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
                    
                    {/* Description - Draft.js Editor */}
                    <div className='relative'>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <Editor
                            editorStyle={{ 
                                minHeight: '40vh', 
                                maxWidth:"90vw", 
                                border: "1px solid #ccc",  
                                borderRadius: '7px',
                                padding:'11px',
                                }}
                            editorState={editorState}
                            onEditorStateChange={onEditorStateChange}
                            wrapperClassName="wrapper-class"
                            editorClassName="editor-class"
                            toolbarClassName="toolbar-class"
                            toolbarStyle={{border: '1px solid #ccc', borderRadius: '7px'}}
                            wrapperStyle={{ padding: '.2rem', border: '1px solid #ccc',  borderRadius: '7px' } }
                            customStyleMap={styleMap}
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
                                value={formData.irr ?? ''} 
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
                                value={formData.npv ?? ''} 
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
                                value={formData.riskScore ?? ''} 
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
                                value={formData.projectRanking ?? ''} 
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
// 'use client'

// import { SafeUser } from '@/app/types';
// import { BusinessProjectModel } from '@prisma/client';
// import React, { useState, useEffect, useCallback } from 'react';
// import { CompositeDecorator, 
//     //Editor as Editor2, EditorState,
//      DraftDecorator,
//      // ContentState, convertFromRaw 
    
//     } from "draft-js";
// import dynamic from 'next/dynamic';
// const Editor = dynamic(() => import('react-draft-wysiwyg').then(mod => mod.Editor), { ssr: false });

// import { Editor as Editor2, EditorState, convertToRaw,
//   convertFromRaw ,
//   ContentState,
//   convertFromHTML,
//   // BlockMap,
//   ContentBlock,
//   BlockMapBuilder,
//   Modifier,
//   SelectionState,
//   DraftInlineStyle,
//   DefaultDraftInlineStyle,
//   RichUtils,
//   BlockMap,
//   CharacterMetadata
// } from 'draft-js';

// import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
// import { isJsonStringEditorCompatible } from '@/lib/utils';

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
//     const [compositeDecorator,setCompositeDecorator] = useState(new CompositeDecorator([]))
//    let [note, setNote] = useState("")
//   const [editorState, setEditorState] = useState<EditorState>(EditorState.createEmpty());
//     //useEventListener("keydown", onKeyDown);

// // Import Draft.js components
// //import { svg } from 'leaflet';

// // Helper function to get ContentState from item.description
// // This function needs to be robust enough to handle both plain strings and Draft.js raw JSON strings.
// // For the purpose of this component, we'll assume item.description is either a plain string
// // or a JSON string representing Draft.js raw content.
// const getTextFromEditor = (item: any): ContentState => {
//   if (item ) {
//     try {
//       // Attempt to parse as Draft.js raw content
//       const rawContent = JSON.parse(item);
//       // Check if it looks like Draft.js raw content (has blocks and entityMap)
//       if (rawContent.blocks && Array.isArray(rawContent.blocks)) {
//         return convertFromRaw(rawContent);
//       }
//     } catch (e) {
//       // If parsing fails or it's not raw content, treat as plain text
//       // console.warn("Description is not valid Draft.js raw content, treating as plain text:", e);
//     }
//     // Fallback: treat as plain text
//     return ContentState.createFromText(item);
//   }
//   return ContentState.createFromText(''); // Return empty content if no description
// };
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

//       let getNote = () => {
//     if (formData?.description !==undefined && formData?.description !==null) {
//         if (isJsonStringEditorCompatible(formData?.description||"")){
//             try {
//                 const DBEditorState = convertFromRaw(JSON.parse(formData?.description||""));  
//                 setEditorState(EditorState.createWithContent(DBEditorState)); 
//                 setNote(JSON.stringify(DBEditorState))
//             } catch {


//                 const placeholder= ''
//                 //toast.error("Your data has corrupt format. Please rewrite")
//                 // console.log('Data with errors:', data?.description)
//                 const { contentBlocks, entityMap } = convertFromHTML(placeholder);
//                 const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
//                 setEditorState(EditorState.createWithContent(contentState)); 
//                 setNote(JSON.stringify(contentState)) 
          
//             }
           
//         }else{
//             //const processedHTML = DraftPasteProcessor.processHTML(data.description);
//             const { contentBlocks, entityMap } = convertFromHTML(formData.description);
//             const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);    
//             setEditorState(EditorState.createWithContent(contentState)); 
//             setNote(JSON.stringify(contentState)) 
//         }

//     }else {
//         const placeholder= ''
       
     
//         const { contentBlocks, entityMap } = convertFromHTML(placeholder);
//         const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
//         setEditorState(EditorState.createWithContent(contentState)); 
//         setNote(JSON.stringify(contentState)) 
        
//     }

//   }
//   useEffect(()=>{
//     getNote()
//   },[])
    
//     const onEditorStateChange = (editorState: EditorState): void => {
//     setEditorState(editorState);
//     const content = JSON.stringify(convertToRaw(editorState.getCurrentContent()));
//     setNote(content)
//   };

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

//     /**
//      * Handles closing the modal only if the click occurs on the backdrop (outside the content).
//      * This fixes the "cannot be closed" issue.
//      */
//     const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
//         if (e.target === e.currentTarget) {
//             onClose();
//         }
//     };
    
//     // Available progress stages (customize as needed)
//     const progressOptions: BusinessProjectModel['progress'][] = ['PROPOSAL', 'DEVELOPMENT', 'REVIEW', 'IMPLEMENTATION', 'COMPLETED'];
//     const styleMap = {
//         SMALL_YELLOW: {
//         fontSize: '10px',
//         color: 'red',
//         verticalAlign: 'super', 
//         },
//     };
//     return (
//         // Reverting back to h-full and py-10, and removing items-center 
//         // ensures the modal is scrollable and starts visible from the top on mobile.
//         <div 
//             className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center py-10"
//             onClick={handleOutsideClick} // Allows clicking the backdrop to close
//         >
//             {/* The inner div uses max-w-3xl for responsiveness */}
//             <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-y-auto">
//                 {/* Added break-words to ensure the title wraps gracefully on small screens */}
//                 <h3 className="text-2xl font-bold mb-4 border-b pb-2 text-indigo-700 break-words">
//                     Edit Project: {project.title}
//                 </h3>
                
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
//                     {/* <div>
//                         <label className="block text-sm font-medium text-gray-700">Description</label>
//                         <textarea 
//                             name="description" 
//                             value={formData.description || ''} 
//                             onChange={handleChange} 
//                             rows={6}
//                             className="mt-1 w-full border border-gray-300 p-2 rounded-md resize-none" 
//                             required
//                         />
//                     </div> */}

//                      {/* <Editor 
//                         editorState={EditorState.createWithContent(getTextFromEditor(formData.description || ''),    compositeDecorator)} 
//                         readOnly 
//                         onChange={() => {}} // Empty dummy function
//                     /> */}

//                     <Editor
//                         editorStyle={{ minHeight: '40vh', 
//                                         maxWidth:"90vw", 
//                                         //maxHeight: '50vh', 
//                                         border: "1px solid #ccc",  
//                                         borderRadius: '7px',
//                                         padding:'11px',
//                                         }}
//                         editorState={editorState}
//                         onEditorStateChange={onEditorStateChange}
//                         wrapperClassName="wrapper-class"
//                         editorClassName="editor-class"
//                         toolbarClassName="toolbar-class"
//                         toolbarStyle={{border: '1px solid #ccc', borderRadius: '7px'}}
//                         wrapperStyle={{ padding: '.2rem', border: '1px solid #ccc',  borderRadius: '7px' } }
//                         customStyleMap={styleMap} // Add customStyleMap prop here
//                         />
                    
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
//                             <label className="block text-sm font-medium text-gray-700">IRR (e.g., 0.15 for 15%)</label>
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