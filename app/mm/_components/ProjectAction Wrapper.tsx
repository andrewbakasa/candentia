'use client';

import React from 'react';
import { ArrowLeft, Edit3, Share2, Printer, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProjectActionsWrapperProps {
    project: any;
}

export default function ProjectActionsWrapper({ project }: ProjectActionsWrapperProps) {
    const router = useRouter();

    const handlePrint = () => window.print();

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 print:hidden">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm group"
            >
                <div className="p-2 bg-white rounded-full border border-slate-200 group-hover:border-slate-400 transition-all">
                    <ArrowLeft size={16} />
                </div>
                Back to Inventory
            </button>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                >
                    <Printer size={14} /> Export PDF
                </button>
                
                <button 
                    onClick={() => router.push(`/mm/projects/edit/${project.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                >
                    <Edit3 size={14} /> Edit Project
                </button>

                <button 
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                >
                    <Share2 size={14} /> Share Brief
                </button>
            </div>
        </div>
    );
}