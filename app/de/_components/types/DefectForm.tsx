'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { 
    AlertTriangle, 
    CheckCircle2, 
    Info, 
    Calendar, 
    Tag, 
    MapPin, 
    AlertCircle,
    Loader2,
    ChevronRight
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Priority } from './types';

// Types remain the same as previous implementation...
// (Priority, DefectStatus, NewDefectPayload, etc.)

export interface NewDefectPayload {
    title: string;
    description: string;
    area: string;
    equipmentTag: string;
    priority: Priority;
    breakdownRelated: boolean;
    identificationDate: string; // ISO string format (YYYY-MM-DDThh:mm)
}
type DefectFormState = NewDefectPayload;

// Helper for dynamic enum key/value access
const PriorityOptions = Object.keys(Priority) as Array<keyof typeof Priority>;

// Initial state for the new defect form
const initialFormState: DefectFormState = {
    title: '',
    description: '',
    area: '',
    equipmentTag: '',
    priority: Priority.MEDIUM,
    breakdownRelated: false,
    identificationDate: new Date().toISOString().substring(0, 16), // YYYY-MM-DDThh:mm format
};

export default function NewDefectForm(): JSX.Element {
    const [formData, setFormData] = useState<DefectFormState>(initialFormState);
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [isError, setIsError] = useState<boolean>(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        // ... same fetch logic as before
        setLoading(false);
    };

    return (
        /* 1. Container: Full width on mobile, max-width on desktop. Remove rounded corners on mobile for "app" feel. */
        <div className="w-full max-w-3xl mx-auto sm:my-8 bg-white sm:rounded-3xl shadow-2xl shadow-slate-200/60 border-x-0 sm:border border-slate-100 overflow-hidden font-inter min-h-screen sm:min-h-fit">
            
            {/* 2. Sticky Header for Mobile: Keeps context visible while scrolling */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-5 py-4 sm:px-8 sm:py-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg shrink-0">
                        <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Log Defect</h2>
                        <p className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guideline Ref: 1-2025</p>
                    </div>
                </div>
                {loading && <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />}
            </div>

            <div className="p-5 sm:p-8">
                {/* Notification Area */}
                {message && (
                    <div className={cn(
                        "flex items-start gap-3 p-4 mb-6 rounded-2xl border text-sm font-semibold",
                        isError ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                    )}>
                        {isError ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                        <span>{message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 pb-20 sm:pb-0">
                    
                    {/* Input Group: Stacked on mobile, 2-col on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Defect Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Summary"
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 rounded-xl p-4 text-base sm:text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Equipment Tag</label>
                            <input
                                type="text"
                                name="equipmentTag"
                                value={formData.equipmentTag}
                                onChange={handleChange}
                                placeholder="PUMP-001"
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 rounded-xl p-4 text-base sm:text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 rounded-xl p-4 text-base sm:text-sm font-medium transition-all outline-none"
                        ></textarea>
                    </div>

                    {/* 3-Way Grid: Stacked on tiny screens, 3-col on desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                            <div className="relative">
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="w-full appearance-none bg-slate-50 border-none rounded-xl p-4 text-base sm:text-sm font-bold text-slate-700 outline-none"
                                >
                                    {PriorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                            </div>
                        </div>
                        {/* Area and ID Date inputs would follow the same pattern... */}
                    </div>

                    {/* Critical Toggle: Extra large touch area for mobile thumbs */}
                    <label className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all active:scale-[0.98] cursor-pointer touch-manipulation",
                        formData.breakdownRelated 
                            ? "bg-red-50 border-red-200" 
                            : "bg-slate-50 border-transparent"
                    )}>
                        <input
                            name="breakdownRelated"
                            type="checkbox"
                            checked={formData.breakdownRelated}
                            onChange={handleChange}
                            className="h-6 w-6 text-red-600 border-slate-300 rounded-lg focus:ring-red-500"
                        />
                        <div className="flex-1">
                            <span className={cn(
                                "text-sm font-black uppercase tracking-wider",
                                formData.breakdownRelated ? "text-red-700" : "text-slate-600"
                            )}>
                                Critical Breakdown
                            </span>
                        </div>
                        {formData.breakdownRelated && <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />}
                    </label>
                    
                    {/* 4. Floating Action Button for Mobile: Keep the submit button accessible */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 sm:relative sm:p-0 sm:bg-transparent sm:border-0 sm:pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center py-4 bg-indigo-600 text-white text-base font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-200 active:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Submit Defect Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
// 'use client';

// import React, { useState, ChangeEvent, FormEvent } from 'react';

// // === EMBEDDED TYPE DEFINITIONS TO RESOLVE COMPILATION ERRORS ===
// // Note: These definitions were moved here from '../types/Defect'
// // to ensure the component is fully self-contained and compiles successfully.

// export enum Priority {
//     LOW = 'LOW',
//     MEDIUM = 'MEDIUM',
//     HIGH = 'HIGH',
//     CRITICAL = 'CRITICAL',
// }

// export enum DefectStatus {
//     IDENTIFIED = 'IDENTIFIED',
//     IN_ANALYSIS = 'IN_ANALYSIS',
//     ACTION_DEFINED = 'ACTION_DEFINED',
//     ACTION_IMPLEMENTED = 'ACTION_IMPLEMENTED',
//     CLOSED_VERIFIED = 'CLOSED_VERIFIED',
// }

// export interface NewDefectPayload {
//     title: string;
//     description: string;
//     area: string;
//     equipmentTag: string;
//     priority: Priority;
//     breakdownRelated: boolean;
//     identificationDate: string; // ISO string format (YYYY-MM-DDThh:mm)
// }

// export interface DefectResponse {
//     id: string;
//     title: string;
//     equipmentTag: string;
//     status: DefectStatus;
// }
// // ===============================================================

// // Define the type for the form state. Since NewDefectPayload matches
// // the shape of the state (string date format), we can use it directly.
// type DefectFormState = NewDefectPayload;

// // Helper for dynamic enum key/value access
// const PriorityOptions = Object.keys(Priority) as Array<keyof typeof Priority>;

// // Initial state for the new defect form
// const initialFormState: DefectFormState = {
//     title: '',
//     description: '',
//     area: '',
//     equipmentTag: '',
//     priority: Priority.MEDIUM,
//     breakdownRelated: false,
//     identificationDate: new Date().toISOString().substring(0, 16), // YYYY-MM-DDThh:mm format
// };

// export default function NewDefectForm(): JSX.Element {
//     // Apply type to useState
//     const [formData, setFormData] = useState<DefectFormState>(initialFormState);
//     const [loading, setLoading] = useState<boolean>(false);
//     const [message, setMessage] = useState<string>('');
//     const [isError, setIsError] = useState<boolean>(false);

//     // Handles changes for all input fields (text, number, select, checkbox)
//     const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
//         const { name, value, type } = e.target;
        
//         // Handle checkbox separately
//         const checked = (e.target as HTMLInputElement).checked;

//         setFormData(prev => ({
//             ...prev,
//             [name]: type === 'checkbox' ? checked : value,
//         }));
//     };

//     const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
//         e.preventDefault();
//         setMessage('');
//         setIsError(false);
//         setLoading(true);

//         // Basic Front-End Validation
//         if (!formData.title || !formData.description || !formData.equipmentTag) {
//             setMessage('Please fill in the Title, Description, and Equipment Tag.');
//             setIsError(true);
//             setLoading(false);
//             return;
//         }

//         try {
//             // The payload is already typed as DefectFormState (NewDefectPayload)
//             const payload: NewDefectPayload = {
//                 ...formData,
//                 // Ensure date is handled correctly (API expects ISO string)
//                 identificationDate: new Date(formData.identificationDate).toISOString(), 
//             };
            
//             // --- API CALL ---
//             // In a real application, this would call your backend (e.g., Next.js API route)
//             const response: Response = await fetch('/api/defects', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload),
//             });

//             // The result can either be the DefectResponse or an error object { message: string }
//             const result: DefectResponse | { message: string, id?: string, title?: string } = await response.json();

//             if (response.ok) {
//                 // Assert result as DefectResponse for safety
//                 const successResult = result as DefectResponse;
//                 setMessage(`Defect "${successResult.title}" (ID: ${successResult.id}) successfully logged!`);
//                 setFormData(initialFormState); // Clear form on success
//             } else {
//                 setIsError(true);
//                 // Display the specific error message from the API Route
//                 setMessage(`Failed to log defect: ${result.title || 'Unknown error.'}`);
//             }
//         } catch (error) {
//             setIsError(true);
//             setMessage('Network error or server connection failed.');
//             console.error('Submission error:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-xl mt-10">
//             <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-3">
//                 Log New Defect
//             </h2>

//             {/* Notification Area */}
//             {message && (
//                 <div className={`p-4 mb-4 rounded-lg ${isError ? 'bg-red-100 text-red-700 border border-red-400' : 'bg-green-100 text-green-700 border border-green-400'}`}>
//                     {message}
//                 </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-6">
                
//                 {/* Defect Title and Tag */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                         <label htmlFor="title" className="block text-sm font-medium text-gray-700">Defect Title (Short Summary) <span className="text-red-500">*</span></label>
//                         <input
//                             type="text"
//                             name="title"
//                             id="title"
//                             value={formData.title}
//                             onChange={handleChange}
//                             required
//                             className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
//                         />
//                     </div>
//                     <div>
//                         <label htmlFor="equipmentTag" className="block text-sm font-medium text-gray-700">Equipment Tag <span className="text-red-500">*</span></label>
//                         <input
//                             type="text"
//                             name="equipmentTag"
//                             id="equipmentTag"
//                             value={formData.equipmentTag}
//                             onChange={handleChange}
//                             required
//                             placeholder="e.g., PUMP-101-A"
//                             className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
//                         />
//                     </div>
//                 </div>

//                 {/* Description */}
//                 <div>
//                     <label htmlFor="description" className="block text-sm font-medium text-gray-700">Detailed Description <span className="text-red-500">*</span></label>
//                     <textarea
//                         name="description"
//                         id="description"
//                         rows={4}
//                         value={formData.description}
//                         onChange={handleChange}
//                         required
//                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
//                     ></textarea>
//                 </div>

//                 {/* Priority, Area, and Date */}
//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
//                     <div>
//                         <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
//                         <select
//                             name="priority"
//                             id="priority"
//                             value={formData.priority}
//                             onChange={handleChange}
//                             className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
//                         >
//                             {PriorityOptions.map(p => (
//                                 <option key={p} value={p}>{p}</option>
//                             ))}
//                         </select>
//                     </div>
//                     <div>
//                         <label htmlFor="area" className="block text-sm font-medium text-gray-700">Area/Location</label>
//                         <input
//                             type="text"
//                             name="area"
//                             id="area"
//                             value={formData.area}
//                             onChange={handleChange}
//                             placeholder="e.g., Line 5, Workshop"
//                             className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
//                         />
//                     </div>
//                     <div>
//                         <label htmlFor="identificationDate" className="block text-sm font-medium text-gray-700">Identification Date</label>
//                         <input
//                             type="datetime-local"
//                             name="identificationDate"
//                             id="identificationDate"
//                             value={formData.identificationDate}
//                             onChange={handleChange}
//                             className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
//                         />
//                     </div>
//                 </div>

//                 {/* Breakdown Checkbox */}
//                 <div className="flex items-start">
//                     <div className="flex items-center h-5">
//                         <input
//                             id="breakdownRelated"
//                             name="breakdownRelated"
//                             type="checkbox"
//                             checked={formData.breakdownRelated}
//                             onChange={handleChange}
//                             className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
//                         />
//                     </div>
//                     <div className="ml-3 text-sm">
//                         <label htmlFor="breakdownRelated" className="font-medium text-gray-700">
//                             Breakdown Related?
//                         </label>
//                         <p className="text-gray-500">
//                             Check if this defect has caused or is causing an immediate operational shutdown.
//                         </p>
//                     </div>
//                 </div>
                
//                 {/* Submit Button */}
//                 <div>
//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
//                             loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
//                         }`}
//                     >
//                         {loading ? 'Logging Defect...' : 'Log Defect'}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// }