'use client';

import React, { useState } from 'react';
import { ArrowLeft, Edit3, Link2, Printer, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EntityActionsHeaderProps {
    itemId: string;
    editPath: string; // e.g., `/mm/projects/edit/${id}` or `/mm/activities/edit/${id}`
    entityLabel: string; // e.g., "Project" or "Activity"
    backLabel?: string; // e.g., "Back to Inventory"
}

export default function EntityActionsHeader({ 
    itemId, 
    editPath, 
    entityLabel, 
    backLabel = "Back to List" 
}: EntityActionsHeaderProps) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    const handlePrint = () => window.print();

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link: ', err);
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 print:hidden">
            {/* Navigation Back */}
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm group"
            >
                <div className="p-2 bg-white rounded-full border border-slate-200 group-hover:border-slate-400 transition-all shadow-sm">
                    <ArrowLeft size={16} />
                </div>
                {backLabel}
            </button>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Printer size={14} /> Export PDF
                </button>
                
                {/* <button 
                    onClick={() => router.push(editPath)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Edit3 size={14} /> Edit {entityLabel}
                </button> */}

                <button 
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                        copied 
                        ? 'bg-emerald-500 text-white shadow-emerald-100' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                    }`}
                >
                    {copied ? (
                        <><Check size={14} /> Copied!</>
                    ) : (
                        <><Link2 size={14} /> Copy URL</>
                    )}
                </button>
            </div>
        </div>
    );
}
// 'use client';

// import React, { useState } from 'react';
// import { ArrowLeft, Edit3, Link2, Printer, Check } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// interface ProjectActionsWrapperProps {
//     project: any;
// }

// export default function ProjectActionsWrapper({ project }: ProjectActionsWrapperProps) {
//     const router = useRouter();
//     const [copied, setCopied] = useState(false);

//     const handlePrint = () => window.print();

//     const handleCopyLink = async () => {
//         try {
//             await navigator.clipboard.writeText(window.location.href);
//             setCopied(true);
//             // Reset feedback after 2 seconds
//             setTimeout(() => setCopied(false), 2000);
//         } catch (err) {
//             console.error('Failed to copy link: ', err);
//         }
//     };

//     return (
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 print:hidden">
//             <button 
//                 onClick={() => router.back()}
//                 className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm group"
//             >
//                 <div className="p-2 bg-white rounded-full border border-slate-200 group-hover:border-slate-400 transition-all">
//                     <ArrowLeft size={16} />
//                 </div>
//                 Back to Inventory
//             </button>

//             <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
//                 <button 
//                     onClick={handlePrint}
//                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
//                 >
//                     <Printer size={14} /> Export PDF
//                 </button>
                
//                 <button 
//                     onClick={() => router.push(`/mm/projects/edit/${project.id}`)}
//                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
//                 >
//                     <Edit3 size={14} /> Edit Project
//                 </button>

//                 {/* Updated Copy Link Button */}
//                 <button 
//                     onClick={handleCopyLink}
//                     className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
//                         copied 
//                         ? 'bg-emerald-500 text-white shadow-emerald-100' 
//                         : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
//                     }`}
//                 >
//                     {copied ? (
//                         <>
//                             <Check size={14} /> Link Copied!
//                         </>
//                     ) : (
//                         <>
//                             <Link2 size={14} /> Copy Current URL
//                         </>
//                     )}
//                 </button>
//             </div>
//         </div>
//     );
// }
// 'use client';

// import React from 'react';
// import { ArrowLeft, Edit3, Share2, Printer, Trash2 } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// interface ProjectActionsWrapperProps {
//     project: any;
// }

// export default function ProjectActionsWrapper({ project }: ProjectActionsWrapperProps) {
//     const router = useRouter();

//     const handlePrint = () => window.print();

//     return (
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 print:hidden">
//             <button 
//                 onClick={() => router.back()}
//                 className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm group"
//             >
//                 <div className="p-2 bg-white rounded-full border border-slate-200 group-hover:border-slate-400 transition-all">
//                     <ArrowLeft size={16} />
//                 </div>
//                 Back to Inventory
//             </button>

//             <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
//                 <button 
//                     onClick={handlePrint}
//                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
//                 >
//                     <Printer size={14} /> Export PDF
//                 </button>
                
//                 <button 
//                     onClick={() => router.push(`/mm/projects/edit/${project.id}`)}
//                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
//                 >
//                     <Edit3 size={14} /> Edit Project
//                 </button>

//                 <button 
//                     className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
//                 >
//                     <Share2 size={14} /> Share Brief
//                 </button>
//             </div>
//         </div>
//     );
// }