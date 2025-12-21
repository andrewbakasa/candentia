'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, Edit3, Clock, ChevronDown, ChevronUp, 
    ListChecks, DollarSign, Briefcase,
    Target, TrendingUp, AlertTriangle, ShieldCheck, 
    Activity as ActivityIcon, User, Layers, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import MM_TaskForm from './TaskForm';

export default function ActivityDetailView({ activity, onRefresh, MM_TaskForm_Component }: { 
    activity: any, 
    onRefresh?: () => void,
    MM_TaskForm_Component?: React.ComponentType<any> 
}) {
    const router = useRouter();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);

    const handleSaveSuccess = () => {
        setIsTaskModalOpen(false);
        setEditingTask(null);
        toast.success('Activity Tasks Synchronized');
        router.refresh(); 
        if (onRefresh) onRefresh(); 
    };

    // Financial calculations for this specific activity
    const totalActualCost = (activity.actualLaborCost || 0) + (activity.actualMaterialCost || 0);
    const budgetVariance = (activity.allocatedBudget || 0) - totalActualCost;
    const activityEfficiency = activity.allocatedBudget > 0 
        ? ((totalActualCost / activity.allocatedBudget) * 100).toFixed(1) 
        : 0;

    return (
        <div className="flex flex-col gap-6 bg-slate-50/50 p-3 md:p-8">
            
            {/* NAVIGATION & BREADCRUMB */}
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-[10px] font-black uppercase tracking-widest"
            >
                <ArrowLeft size={14} /> Back to Project Execution
            </button>

            {/* ACTIVITY & PROJECT CONTEXT SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Identity Card */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block">
                                Activity Phase: {activity.stage || 'General'}
                            </span>
                            <h1 className="text-2xl font-black text-slate-900 leading-tight mb-2">{activity.description}</h1>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-[11px] font-bold text-slate-600">
                                    <Briefcase size={14}/> Project: {activity.project?.name || 'Unlinked'}
                                </div>
                                <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full text-[11px] font-bold text-indigo-700">
                                    <Layers size={14}/> Status: {activity.status || 'Active'}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Timeline</div>
                             <div className="text-xs font-bold text-slate-800">
                                {activity.scheduledStart ? new Date(activity.scheduledStart).toLocaleDateString() : 'Start TBD'}
                             </div>
                             <div className="text-xs font-medium text-slate-400 italic">to</div>
                             <div className="text-xs font-bold text-slate-800">
                                {activity.scheduledEnd ? new Date(activity.scheduledEnd).toLocaleDateString() : 'End TBD'}
                             </div>
                        </div>
                    </div>
                </div>

                {/* Parent Project Strategic context */}
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                    <Target className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 block">Strategic Context</span>
                    <div className="space-y-4 relative z-10">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Activity Budget Allocation</p>
                            <p className="text-xl font-black">${activity.allocatedBudget?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                            <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Material Burn</p>
                                <p className="text-sm font-bold text-indigo-300">${activity.actualMaterialCost?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Labor Burn</p>
                                <p className="text-sm font-bold text-emerald-400">${activity.actualLaborCost?.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI BAR */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp size={16}/>} label="Burn Rate" value={`${activityEfficiency}%`} color="indigo" />
                <StatCard icon={<DollarSign size={16}/>} label="Phase Variance" value={`$${budgetVariance.toLocaleString()}`} color={budgetVariance < 0 ? "amber" : "emerald"} />
                <StatCard icon={<ShieldCheck size={16}/>} label="Work Orders" value={activity.tasks?.length || 0} color="slate" />
                <StatCard icon={<Clock size={16}/>} label="Days Elapsed" value="--" color="slate" />
            </div>

            {/* TASK DISPATCH REGISTRY */}
            <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                            <ListChecks size={20} />
                        </div>
                        <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight">Work Order Registry</h2>
                    </div>
                    <button 
                        onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg transition-all text-xs font-black uppercase"
                    >
                        <Plus size={18} />
                        <span>Dispatch Work Order</span>
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activity.tasks?.length > 0 ? activity.tasks.map((task: any) => (
                            <div key={task.id} className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                        task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        {task.status}
                                    </span>
                                    <button onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                        <Edit3 size={16}/>
                                    </button>
                                </div>
                                
                                <h3 className="text-sm font-black text-slate-800 mb-2">{task.title}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1 italic">{task.description || 'No instructions provided.'}</p>
                                
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                            <User size={12}/>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600">{task.assignedTo || 'Unassigned'}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        ID: #{task.id.slice(-4)}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                <ActivityIcon size={40} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No work orders dispatched for this phase</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* MODAL SYSTEM */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <MM_TaskForm 
                            initialData={editingTask}
                            activities={[activity]} 
                            preselectedActivity={activity}
                            onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
                            onSuccess={handleSaveSuccess}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Re-usable Helper Components
function StatCard({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
    const colors: any = {
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
        slate: "bg-slate-50 text-slate-700 border-slate-100"
    };
    return (
        <div className={`p-4 rounded-2xl border ${colors[color]} flex flex-col gap-1`}>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-70">
                {icon} {label}
            </div>
            <div className="text-lg font-black">{value}</div>
        </div>
    );
}