'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Calendar, User, Wrench, Activity, AlertCircle, CheckCircle2, 
    DollarSign, TrendingUp, Briefcase, Package, ClipboardList, 
    Plus, X, Trash2, Edit3, Target, ShieldAlert, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmAction from './ConfirmAction';

export default function ProjectDetailView({ project, onRefresh, MM_ActivityForm }: { 
    project: any, 
    onRefresh?: () => void,
    MM_ActivityForm: React.ComponentType<any>
}) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const budgetUsed = project.totalActualCost || 0;
    const budgetTotal = project.allocatedBudget || 1;
    const utilizationPercentage = (budgetUsed / budgetTotal) * 100;

    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        setEditingRecord(null);
        toast.success('System Synchronized');
        router.refresh(); 
        if (onRefresh) onRefresh(); 
    };

    const handleDelete = async (activityId: string) => {
        setIsDeleting(activityId);
        try {
            const response = await fetch(`/mm/api/activities/${activityId}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Activity Purged');
                router.refresh();
            }
        } catch (error) {
            toast.error('Network Error');
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="flex flex-col gap-6 bg-slate-50/50 p-4 md:p-8">
            
            {/* 1. STRATEGIC OVERVIEW (DESKTOP & MOBILE) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                            <Target size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Mission</p>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900">{project.name}</h1>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Workshop</p>
                            <p className="text-sm font-black text-slate-700 truncate">{project.responsibleWorkshop?.name || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Strategic Year</p>
                            <p className="text-sm font-black text-slate-700">{project.plan?.year || '2025'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Manager</p>
                            <p className="text-sm font-black text-slate-700 truncate">{project.projectManager || 'Pending'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Status</p>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                                {project.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* STRATEGY STATS CARD */}
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Financial Ceiling (Guideline 2.1)</p>
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <p className="text-3xl font-black">${project.allocatedBudget?.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Strategic Budget</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-xl font-black ${utilizationPercentage > 90 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {utilizationPercentage.toFixed(1)}%
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Utilized</p>
                        </div>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-700 ${utilizationPercentage > 100 ? 'bg-red-500' : 'bg-indigo-400'}`} 
                            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                        />
                    </div>
                </div>
            </section>

            {/* 2. ACTIVITY REGISTRY (MOBILE & DESKTOP VARIANTS) */}
            <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                            <ClipboardList size={20} />
                        </div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Activity Registry</h2>
                    </div>
                    <button 
                        onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
                        className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg transition-all"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-8 py-4">Task Details</th>
                                <th className="px-8 py-4">Timeline</th>
                                <th className="px-8 py-4">Cost Breakdown</th>
                                <th className="px-8 py-4 text-right">Admin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {project.activities?.map((act: any) => (
                                <tr key={act.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <p className="font-bold text-slate-800 text-sm">{act.description}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Supervisor: {act.supervisor}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                            <Clock size={12} className="text-indigo-400" />
                                            {act.scheduledStart ? new Date(act.scheduledStart).toLocaleDateString() : 'Unscheduled'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex gap-4">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase">Material</p>
                                                <p className="text-xs font-bold">${act.actualMaterialCost?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase">Labor</p>
                                                <p className="text-xs font-bold">${act.actualLaborCost?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingRecord(act); setIsModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit3 size={16}/></button>
                                            {/* <ConfirmAction onConfirm={() => handleDelete(act.id)} itemId={act.id} triggerButton={<button className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>} action={'Read'}/> */}
                                             <ConfirmAction 
                                                     onConfirm={() => handleDelete(act.id)} 
                                                     itemId={act.id}
                                                     action="Delete" 
                                                     heading="Confirm Deletion"
                                                     description="This action will permanently remove this item from the NRZ system. This cannot be undone."
                                                     showHint={false} 
                                                     // We pass a custom trigger to match the Edit button's style perfectly
                                                     triggerButton={
                                                     <button className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors disabled:opacity-50">
                                                          {isDeleting === act.id ? <Activity size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                     </button>
                                                     }
                                                 />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE LIST (Audit Card View) */}
                <div className="md:hidden divide-y divide-slate-100">
                    {project.activities?.map((act: any) => (
                        <div key={act.id} className="p-6 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="max-w-[70%]">
                                    <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase mb-1 inline-block">
                                        REF: {act.id.slice(-5)}
                                    </span>
                                    <p className="font-black text-slate-900 leading-tight">{act.description}</p>
                                    <p className="text-[10px] font-bold text-indigo-500 mt-1 uppercase">{act.stage}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingRecord(act); setIsModalOpen(true); }} className="p-2 bg-slate-50 rounded-lg"><Edit3 size={14}/></button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Cost</p>
                                    <p className="text-sm font-black text-slate-900">${((act.actualMaterialCost || 0) + (act.actualLaborCost || 0)).toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Progress</p>
                                    <p className="text-sm font-black text-slate-900">{act.progress || 0}%</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* MODAL SYSTEM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="flex items-center justify-between p-8 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase">Registry Update</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{project.name}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                        </div>
                        {/* <div className="p-8 max-h-[70vh] overflow-y-auto">
                            <MM_ActivityForm initialData={editingRecord} projects={[project]} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
                        </div> */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto">
                        <MM_ActivityForm 
                            initialData={editingRecord} 
                            projects={[project]} 
                            // Add the line below to lock the form to this specific project context
                            preselectedProject={project} 
                            onClose={() => setIsModalOpen(false)} 
                            onSuccess={handleSaveSuccess} 
                        />
                    </div>
                    </div>
                </div>
            )}
        </div>
    );
}