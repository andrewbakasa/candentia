'use client';
import React from 'react';
import { X } from 'lucide-react';

// Form Imports
import MM_TaskForm from '../TaskForm';
import MM_MaterialForm from '../MM_MaterialForm';
import MM_PurchaseOrderForm from '../MM_PurchaseOrder';
import MM_ProcessDelayForm from '../MM_DelayForm';

interface ProjectModalPortalProps {
    isOpen: boolean;
    type: 'activity' | 'task' | 'po' | 'boq' | 'delay' | 'other'| null;
    editingRecord: any;
    project: any;
    allStrategies: any[];
    selectedActivity?: any;
    onClose: () => void;
    onSuccess: () => void;
    forms: {
        MM_ActivityForm: React.ComponentType<any>;
    };
}

const ProjectModalPortal = ({
    isOpen,
    type,
    editingRecord,
    project,
    allStrategies,
    selectedActivity,
    onClose,
    onSuccess,
    forms: { MM_ActivityForm }
}: ProjectModalPortalProps) => {
    if (!isOpen || !type) return null;

    // Standardized Header Titles based on Team Guidelines
    const getModalTitle = () => {
        const prefix = editingRecord?.id ? 'Modify' : 'New';
        const entity = type === 'boq' ? 'Bill of Quantities' : 
                       type === 'po' ? 'Purchase Order' : 
                       type.charAt(0).toUpperCase() + type.slice(1);
        return `${prefix} ${entity} Entry`;
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-6">
            {/* Backdrop with Blur for Executive Focus */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
                onClick={onClose} 
            />
            
            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col animate-in slide-in-from-bottom sm:zoom-in duration-300">
                
                {/* Header: Identity & Compliance Reference */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                            {getModalTitle()}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Guideline 1 Compliance Mode • Ledger v2025
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-rose-500 transition-colors shadow-sm border border-transparent hover:border-slate-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Dynamic Form Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                    {type === 'activity' && (
                        <MM_ActivityForm 
                            initialData={editingRecord} 
                            projects={[project]} 
                            preselectedProject={project} 
                            onClose={onClose} 
                            onSuccess={onSuccess} 
                        />
                    )}

                    {type === 'task' && (
                        <MM_TaskForm 
                            initialData={editingRecord} 
                            activities={project.activities || []}
                            preselectedActivity={selectedActivity} 
                            onClose={onClose}
                            onSuccess={onSuccess} 
                        />
                    )}

                    {type === 'boq' && (
                        <MM_MaterialForm 
                            initialData={editingRecord} 
                            projects={[project]} 
                            strategies={allStrategies} 
                            onClose={onClose}
                            onSuccess={onSuccess} 
                        />
                    )}

                    {type === 'po' && (
                        <MM_PurchaseOrderForm 
                            initialData={editingRecord} 
                            projects={[project]} 
                            strategies={allStrategies} 
                            onClose={onClose} 
                            onSuccess={onSuccess} 
                        />
                    )}

                    {type === 'delay' && (
                        <MM_ProcessDelayForm 
                            initialData={editingRecord} 
                            onClose={onClose} 
                            onSuccess={onSuccess} 
                            activities={project.activities} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectModalPortal;