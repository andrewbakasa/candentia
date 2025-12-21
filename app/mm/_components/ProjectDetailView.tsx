'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, Edit3, Clock, ChevronDown, ChevronUp, 
    ListChecks, ClipboardList, DollarSign, Briefcase,
    Target, TrendingUp, AlertTriangle, ShieldCheck, 
    Activity as ActivityIcon, User, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import MM_TaskForm from './TaskForm';

export default function ProjectDetailView({ project, onRefresh, MM_ActivityForm }: { 
    project: any, 
    onRefresh?: () => void,
    MM_ActivityForm: React.ComponentType<any>
}) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [selectedActivity, setSelectedActivity] = useState<any>(null); 
    const [expandedActivities, setExpandedActivities] = useState<string[]>([]);

    const toggleExpand = (id: string) => {
        setExpandedActivities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    };

    const handleSaveSuccess = () => {
        setIsTaskModalOpen(false);
        setIsModalOpen(false);
        setEditingRecord(null);
        setSelectedActivity(null);
        toast.success('System Synchronized');
        router.refresh(); 
        if (onRefresh) onRefresh(); 
    };

    // Calculate Variance based on Strategic Plan vs Project Allocation
    const budgetVariance = (project.plan?.totalBudget || 0) - (project.allocatedBudget || 0);
    const costEfficiency = project.allocatedBudget > 0 
        ? ((project.totalActualCost / project.allocatedBudget) * 100).toFixed(1) 
        : 0;

    return (
        <div className="flex flex-col gap-6 bg-slate-50/50 p-3 md:p-8">
            
            {/* STRATEGIC & PROJECT OVERVIEW SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Identity Card */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block">Project Identity</span>
                            <h1 className="text-2xl font-black text-slate-900 leading-tight mb-2">{project.name}</h1>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-[11px] font-bold text-slate-600">
                                    <Briefcase size={14}/> {project.responsibleWorkshop?.name || 'Unassigned Workshop'}
                                </div>
                                <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-700">
                                    <User size={14}/> PM: {project.projectManager || 'Pending'}
                                </div>
                                <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full text-[11px] font-bold text-indigo-700">
                                    <Layers size={14}/> {project.status}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-3xl font-black text-slate-900">{project.progress}%</div>
                             <div className="w-24 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-indigo-600" style={{ width: `${project.progress}%` }} />
                             </div>
                        </div>
                    </div>
                </div>

                {/* Strategic Alignment Card */}
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                    <Target className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 block">Strategic Alignment {project.plan?.year}</span>
                    <div className="space-y-4 relative z-10">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">HQ Strategic Ceiling</p>
                            <p className="text-xl font-black">${project.plan?.totalBudget?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                            <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Project Allocation</p>
                                <p className="text-sm font-bold text-indigo-300">${project.allocatedBudget?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Actual Burn</p>
                                <p className="text-sm font-bold text-emerald-400">${project.totalActualCost?.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FINANCIAL VIABILITY & RISK (KPI Bar) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp size={16}/>} label="Efficiency" value={`${costEfficiency}%`} color="indigo" />
                <StatCard icon={<DollarSign size={16}/>} label="Remaining" value={`$${(project.allocatedBudget - project.totalActualCost).toLocaleString()}`} color="emerald" />
                <StatCard icon={<ShieldCheck size={16}/>} label="Activities" value={project.activities?.length || 0} color="slate" />
                <StatCard icon={<AlertTriangle size={16}/>} label="Strategic Gap" value={`$${budgetVariance.toLocaleString()}`} color="amber" />
            </div>

            {/* ACTIVITY REGISTRY SECTION */}
            <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                            <ActivityIcon size={20} />
                        </div>
                        <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight">Execution Registry</h2>
                    </div>
                    <button 
                        onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg transition-all text-xs font-black uppercase"
                    >
                        <Plus size={18} />
                        <span className="hidden md:inline">Initialize Activity</span>
                    </button>
                </div>

                {/* DESKTOP TABLE VIEW */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-8 py-4 w-10"></th>
                                <th className="px-4 py-4">Execution Phase</th>
                                <th className="px-8 py-4">Timeline</th>
                                <th className="px-8 py-4">Resources (L+M)</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {project.activities?.map((act: any) => (
                                <ActivityRow 
                                    key={act.id} 
                                    act={act} 
                                    isExpanded={expandedActivities.includes(act.id)}
                                    onToggle={() => toggleExpand(act.id)}
                                    onAddTask={() => { setSelectedActivity(act); setEditingRecord(null); setIsTaskModalOpen(true); }}
                                    onEdit={() => { setEditingRecord(act); setIsModalOpen(true); }}
                                    onEditTask={(task: any) => { setEditingRecord(task); setSelectedActivity(act); setIsTaskModalOpen(true); }}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE CARD VIEW */}
                <div className="md:hidden divide-y divide-slate-100">
                    {project.activities?.map((act: any) => (
                        <MobileActivityCard 
                            key={act.id} 
                            act={act} 
                            isExpanded={expandedActivities.includes(act.id)}
                            onToggle={() => toggleExpand(act.id)}
                            onEdit={() => { setEditingRecord(act); setIsModalOpen(true); }}
                            onAddTask={() => { setSelectedActivity(act); setEditingRecord(null); setIsTaskModalOpen(true); }}
                            onEditTask={(task: any) => { setEditingRecord(task); setSelectedActivity(act); setIsTaskModalOpen(true); }}
                        />
                    ))}
                </div>
            </section>

            {/* MODAL SYSTEM */}
            {(isTaskModalOpen || isModalOpen) && (
                <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                        {isTaskModalOpen ? (
                            <MM_TaskForm 
                                initialData={editingRecord}
                                activities={project.activities || []} 
                                preselectedActivity={selectedActivity}
                                onClose={() => { setIsTaskModalOpen(false); setSelectedActivity(null); }}
                                onSuccess={handleSaveSuccess}
                            />
                        ) : (
                            <div className="p-0">
                                <MM_ActivityForm 
                                    initialData={editingRecord} 
                                    projects={[project]} 
                                    preselectedProject={project} 
                                    onClose={() => setIsModalOpen(false)} 
                                    onSuccess={handleSaveSuccess} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper Components
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

function MobileActivityCard({ act, isExpanded, onToggle, onEdit, onAddTask, onEditTask }: any) {
    return (
        <div className="p-4 bg-white">
            <div className="flex justify-between items-start mb-3">
                <div onClick={onToggle} className="flex-1 cursor-pointer">
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase mb-1 inline-block">{act.stage}</span>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{act.description}</h3>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <Clock size={12} /> {act.scheduledStart ? new Date(act.scheduledStart).toLocaleDateString() : 'TBD'}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <DollarSign size={12} /> {((act.actualMaterialCost || 0) + (act.actualLaborCost || 0)).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={onEdit} className="p-2 text-slate-400"><Edit3 size={16}/></button>
                    <button onClick={onToggle} className="p-2 text-slate-400">
                        {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-4 pl-4 border-l-2 border-indigo-100 space-y-3">
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <ListChecks size={12}/> Tasks ({act.tasks?.length || 0})
                        </p>
                        <button onClick={onAddTask} className="text-[10px] font-black text-indigo-600 uppercase">+ New Task</button>
                    </div>
                    {act.tasks?.map((task: any) => (
                        <div key={task.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100">
                            <div>
                                <p className="text-xs font-bold text-slate-700">{task.title}</p>
                                <p className="text-[9px] text-slate-400 font-medium">{task.assignedTo}</p>
                            </div>
                            <button onClick={() => onEditTask(task)} className="text-slate-400"><Edit3 size={14}/></button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ActivityRow({ act, isExpanded, onToggle, onAddTask, onEdit, onEditTask }: any) {
    return (
        <>
            <tr className={`hover:bg-slate-50 transition-colors group font-medium ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                <td className="pl-8">
                    <button onClick={onToggle} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                        {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                </td>
                <td className="px-4 py-5">
                    <p className="font-bold text-slate-800 text-sm">{act.description}</p>
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter mt-1 inline-block">
                        {act.stage}
                    </span>
                </td>
                <td className="px-8 py-5">
                    <div className="text-[11px] font-bold text-slate-600 space-y-1">
                        <div className="flex items-center gap-2"><Clock size={12} className="text-indigo-400" /> Start: {act.scheduledStart ? new Date(act.scheduledStart).toLocaleDateString() : 'TBD'}</div>
                        <div className="flex items-center gap-2 text-slate-400"><Clock size={12} /> Est. End: {act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : 'TBD'}</div>
                    </div>
                </td>
                <td className="px-8 py-5">
                    <div className="space-y-1">
                        <p className="text-xs font-black text-slate-700">${((act.actualMaterialCost || 0) + (act.actualLaborCost || 0)).toLocaleString()}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Budget: ${act.allocatedBudget?.toLocaleString()}</p>
                    </div>
                </td>
                <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onAddTask} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors">
                            <Plus size={14}/> Task
                        </button>
                        <button onClick={onEdit} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit3 size={16}/></button>
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={5} className="bg-slate-50/80 px-12 py-6 border-b border-slate-200">
                        <div className="border-l-4 border-indigo-500 pl-8">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <ListChecks size={14} className="text-indigo-600"/> Assigned Work Orders
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {act.tasks?.length > 0 ? act.tasks.map((task: any) => (
                                    <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-start shadow-sm hover:shadow-md transition-shadow">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-800">{task.title}</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {task.status}
                                                </span>
                                                <p className="text-[10px] text-slate-500 font-bold italic flex items-center gap-1">
                                                    <User size={10}/> {task.assignedTo}
                                                </p>
                                            </div>
                                            {task.description && <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">{task.description}</p>}
                                        </div>
                                        <button onClick={() => onEditTask(task)} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 transition-colors">
                                            <Edit3 size={14}/>
                                        </button>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-8 text-center bg-white/50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Zero tasks dispatched for this activity</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}