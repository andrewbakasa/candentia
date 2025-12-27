'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, Edit3, Clock, ListChecks, Briefcase,
    Target, TrendingUp, AlertTriangle, ShieldCheck, 
    Activity as ActivityIcon, User, ArrowLeft, LayoutList,
    Trash2, RefreshCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import MM_TaskForm from './TaskForm';
import ConfirmAction from './ConfirmAction';
import { SafeUser } from '@/app/types';

interface ActivityDetailViewProps {
    activity: any;
    onRefresh?: () => void;
    currentUser:SafeUser|null;
    MM_TaskForm_Component?: React.ComponentType<{
        initialData?: any;
        activities: any[];
        preselectedActivity?: any;
        onClose: () => void;
        onSuccess: () => void;
    }>;
}

export default function ActivityDetailView({ 
    activity, 
    onRefresh, 
    currentUser,
    MM_TaskForm_Component: TaskForm = MM_TaskForm 
}: ActivityDetailViewProps) {
    const router = useRouter();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [isDeletingTaskId, setIsDeletingTaskId] = useState<string | null>(null);
    const isAllowedDelete = (currentUser?.isAdmin)// || currentUser?.roles?.some((r: string) => ['admin', 'executive'].includes(r.toLowerCase()));

    const isAllowedEdit = (currentUser?.isAdmin) || currentUser?.roles?.some((r: string) => ['admin', 'engineer'].includes(r.toLowerCase()));


    // --- BUTTON HANDLERS ---

    // 1. New Order: Complete clean slate
    const handleNewOrder = () => {
        setEditingTask(null);
        setIsTaskModalOpen(true);
    };

    // 2. Dispatch Work Order: Pre-fills data based on parent Activity context
    const handleDispatchOrder = () => {
        setEditingTask({
            title: `WO: ${activity.description}`,
            assignedTo: activity.supervisor || '',
            status: 'OPEN',
            description: `Execution for Activity ID: ${activity.id.slice(-6)}`
        });
        setIsTaskModalOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsTaskModalOpen(false);
        setEditingTask(null);
        toast.success('Work Order Synchronized');
        router.refresh(); 
        if (onRefresh) onRefresh(); 
    };

    const handleDeleteTask = async (taskId: string) => {
        setIsDeletingTaskId(taskId);
        try {
            await axios.delete(`/mm/api/tasks/${taskId}`);
            toast.success('Work Order Successfully Removed');
            router.refresh();
            if (onRefresh) onRefresh();
        } catch (error: any) {
            console.error("Task deletion failed:", error);
            toast.error(error.response?.data?.message || 'Failed to remove Work Order');
        } finally {
            setIsDeletingTaskId(null);
        }
    };

    // Financial calculations per 2025 Guideline methodology
    const totalActualCost = (activity.actualLaborCost || 0) + (activity.actualMaterialCost || 0);
    const budgetVariance = (activity.allocatedBudget || 0) - totalActualCost;
    const activityEfficiency = activity.allocatedBudget > 0 
        ? ((totalActualCost / activity.allocatedBudget) * 100).toFixed(1) 
        : 0;

    return (
        <div className="flex flex-col gap-4 md:gap-8 bg-slate-50/50 p-4 md:p-10 min-h-screen font-sans">
            
            {/* --- TOP NAVIGATION --- */}
            <nav className="flex items-center justify-between">
                <button 
                    onClick={() => {
                        // Check if project ID exists to go to specific project, else fallback
                        if (activity.projectId || activity.project?.id) {
                            router.push(`/mm/projects/${activity.projectId || activity.project.id}`);
                        } else {
                            router.back();
                        }
                    }}
                    className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-indigo-50 transition-colors border border-slate-100">
                        <ArrowLeft size={14} />
                    </div>
                    <span className="hidden md:inline">Return to {activity.project?.name || 'Project'}</span>
                </button>
                
                
            
                <button 
                    onClick={() => router.back()}
                    className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-indigo-50 transition-colors border border-slate-100">
                        <ArrowLeft size={14} />
                    </div>
                    <span className="hidden md:inline">Exit to Project Logs</span>
                </button>

                <div className="flex gap-2">
                    <button 
                        onClick={() => router.refresh()}
                        className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 transition-all"
                    >
                        <RefreshCcw size={14} />
                    </button>
                    {/* BUTTON 1: CLEAN SLATE */}
                    <button 
                        onClick={handleNewOrder}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        <Plus size={14} /> New Order
                    </button>
                </div>
            </nav>

            {/* --- STRATEGIC OVERVIEW GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                    {activity.stage}
                                </span>
                                {activity.isRework && (
                                    <span className="bg-rose-100 text-rose-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                                        <AlertTriangle size={10} /> Rework Metric
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl md:text-4xl font-black text-slate-900 leading-tight">
                                {activity.description}
                            </h1>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600">
                                    <Briefcase size={12} className="text-indigo-500"/> 
                                    {activity.project?.name || 'Standard Protocol'}
                                </div>
                                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600">
                                    <User size={12} className="text-indigo-500"/> 
                                    {activity.supervisor || 'Unassigned'}
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-auto bg-slate-900 text-white p-6 rounded-[2rem] flex flex-row md:flex-col justify-between items-center gap-4">
                             <div className="text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Target Start</p>
                                <p className="text-xs font-bold">{activity.scheduledStart ? new Date(activity.scheduledStart).toLocaleDateString() : 'TBD'}</p>
                             </div>
                             <div className="h-[1px] w-6 md:w-full bg-slate-700"></div>
                             <div className="text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Target End</p>
                                <p className="text-xs font-bold text-indigo-400">{activity.scheduledEnd ? new Date(activity.scheduledEnd).toLocaleDateString() : 'TBD'}</p>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <Target className="absolute -right-6 -bottom-6 text-white/10 w-48 h-48" />
                    <div className="relative z-10">
                        <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Financial Ceiling</span>
                        <p className="text-4xl font-black mt-2">${activity.allocatedBudget?.toLocaleString()}</p>
                    </div>
                    <div className="relative z-10 mt-8 flex justify-between items-end border-t border-white/10 pt-4">
                        <div>
                            <p className="text-[9px] text-indigo-200 font-bold uppercase">Actual Cost</p>
                            <p className="text-md font-black">${totalActualCost.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-indigo-200 font-bold uppercase">Efficiency</p>
                            <p className="text-md font-black">{activityEfficiency}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- STRATEGIC KPI GRID --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp size={16}/>} label="Variance" value={`$${budgetVariance.toLocaleString()}`} color={budgetVariance < 0 ? "amber" : "emerald"} />
                <StatCard icon={<ShieldCheck size={16}/>} label="Work Count" value={activity.tasks?.length || 0} color="indigo" />
                <StatCard icon={<ActivityIcon size={16}/>} label="Progress" value={`${activity.progress || 0}%`} color="slate" />
                <StatCard icon={<Clock size={16}/>} label="Audit Status" value={activity.varianceReason ? "REVIEW" : "CLEAR"} color={activity.varianceReason ? "amber" : "emerald"} />
            </div>

            {/* --- OPERATIONAL SECTION: TASK REGISTRY --- */}
            <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-10">
                <div className="p-6 md:p-10 flex items-center justify-between border-b border-slate-50 bg-slate-50/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl text-slate-600 shadow-sm border border-slate-100">
                            <ListChecks size={24} />
                        </div>
                        <div className="hidden md:block">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Work Order Registry</h2>
                            <p className="text-xs text-slate-400 font-bold tracking-wide">Context-linked task dispatching.</p>
                        </div>
                    </div>
                    {/* BUTTON 2: CONTEXTUAL DISPATCH */}
                    <button 
                        onClick={handleDispatchOrder}
                        className="flex items-center gap-2 px-6 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl shadow-xl transition-all text-xs font-black uppercase tracking-widest"
                    >
                        <Plus size={18} />
                        <span>Dispatch Work Order</span>
                    </button>
                </div>

                <div className="p-6 md:p-10">
                    {activity.tasks?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {activity.tasks?.map((task: any) => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    onEdit={() => { setEditingTask(task); setIsTaskModalOpen(true); }} 
                                    onDelete={() => handleDeleteTask(task.id)}
                                    isDeleting={isDeletingTaskId === task.id}
                                    isAllowedDelete={isAllowedDelete}
                                    isAllowedEdit={isAllowedEdit}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2rem]">
                            <LayoutList size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">No Work Orders Dispatched</p>
                        </div>
                    )}
                </div>
            </section>

            {/* --- TASK MODAL --- */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <TaskForm 
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

// --- SUB-COMPONENTS ---

function TaskCard({ task, onEdit, onDelete, isDeleting, isAllowedDelete,isAllowedEdit }: any) {
    return (
        <div className={`bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-start mb-6">
                <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                    {task.status}
                </span>
                <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAllowedEdit&&<button onClick={onEdit} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Edit3 size={14}/>
                    </button>}
                    {isAllowedDelete && <ConfirmAction 
                        onConfirm={onDelete} 
                        itemId={task.id}
                        action="Delete" 
                        heading="Confirm Deletion"
                        description="This action will permanently remove this item."
                        triggerButton={
                            <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                <Trash2 size={16} />
                            </button>
                        }
                    />}
                </div>
            </div>
            
            <h3 className="text-sm font-black text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors">
                {task.title}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium line-clamp-2 mb-6 italic">
                {task.description || 'Standard maintenance protocol applies.'}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500 shadow-sm text-[8px] font-black uppercase">
                        {task.assignedTo?.substring(0, 2) || 'OP'}
                    </div>
                    <span className="text-[9px] font-black text-slate-600 uppercase">
                        {task.assignedTo || 'Open Pool'}
                    </span>
                </div>
                <span className="text-[9px] font-bold text-slate-300">ID-{task.id.slice(-4)}</span>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: any) {
    const theme: any = {
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
        slate: "bg-slate-100 text-slate-700 border-slate-200"
    };
    return (
        <div className={`p-5 rounded-[2rem] border ${theme[color]} shadow-sm`}>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">
                {icon} {label}
            </div>
            <div className="text-xl font-black tracking-tight">{value}</div>
        </div>
    );
}