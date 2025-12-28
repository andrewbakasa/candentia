'use client';
import React, { useState, useMemo } from 'react';
import { 
    Activity as ActivityIcon, 
    Plus, 
    ChevronUp, 
    ChevronDown, 
    Edit3, 
    Clock, 
    Calendar,
    Search,
    Filter,
    ArrowRight,
    Trash2,
    X,
    Hash,
    ExternalLink // Added for visual cue
} from 'lucide-react';
import ConfirmAction from '../ConfirmAction';
import Link from 'next/link';

/** * DATA INTERFACES
 * Following Guideline 1: Standardized Documentation 
 * Compliant with 14 September 2025 Ref No: Guideline 1 of 2025
 */
export interface Task {
    id: string | number;
    title: string;
    status: 'COMPLETED' | 'PENDING' | string;
    assignedTo: string;
}

export interface Activity {
    id: string | number;
    description: string;
    scheduledStart: string;
    scheduledEnd: string;
    actualCost: number;
    tasks?: Task[];
}

export type SearchScope = 'phase' | 'task';

interface ExecutionRegistryProps {
    activities: Activity[];
    setEditingRecord: (record: any) => void;
    setActiveModal: (type: 'activity' | 'task' | 'delay' | null) => void;
    setSelectedActivity: (activity: Activity) => void;
    formatDate: (date: string) => string;
    onDeleteActivity?: (id: string | number) => void;
    onDeleteTask?: (activityId: string | number, taskId: string | number) => void;
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
    };
}

const ExecutionRegistry: React.FC<ExecutionRegistryProps> = ({
    activities = [],
    setEditingRecord,
    setActiveModal,
    setSelectedActivity,
    formatDate,
    onDeleteActivity,
    onDeleteTask,
    permissions
}) => {
    // --- STATE MANAGEMENT ---
    const [expandedActivities, setExpandedActivities] = useState<(string | number)[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeSearchFields, setActiveSearchFields] = useState<SearchScope[]>(['phase', 'task']);

    const filteredActivities = useMemo(() => {
        const lowerTerm = searchTerm.toLowerCase().trim();
        
        // If no search term, return original activities
        if (!lowerTerm) return activities;

        return activities
            .map(act => {
                // 1. Check if the Phase (Activity) itself matches
                const phaseMatches = activeSearchFields.includes('phase') && 
                                act.description.toLowerCase().includes(lowerTerm);
                
                // 2. Filter tasks: only keep tasks that match the term if 'task' search is active
                const matchingTasks = (act.tasks || []).filter(t => 
                    t.title.toLowerCase().includes(lowerTerm)
                );

                const hasTaskMatches = activeSearchFields.includes('task') && matchingTasks.length > 0;

                // 3. Logic: If the phase matches, we show the phase. 
                // If the phase doesn't match but its tasks do, we show the phase with ONLY matching tasks.
                if (phaseMatches || hasTaskMatches) {
                    return {
                        ...act,
                        // If we found specific task matches, show only those. 
                        // Otherwise, if the phase matched, show all its tasks.
                        tasks: hasTaskMatches ? matchingTasks : act.tasks
                    };
                }
                
                return null;
            })
            .filter(act => act !== null); // Standard filter without the type predicate
    }, [activities, searchTerm, activeSearchFields]);
        // --- LOGIC: Contextual Auto-Expand ---
    const effectiveExpandedRows = useMemo(() => {
        if (!searchTerm.trim()) return expandedActivities;
        return filteredActivities.map(act => act?.id);
    }, [filteredActivities, searchTerm, expandedActivities]);

    const toggleExpand = (id: string | number) => {
        setExpandedActivities(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSearchField = (field: SearchScope) => {
        setActiveSearchFields(prev => 
            prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
        );
    };

    return (
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            
            {/* 1. HEADER & SEARCH ORCHESTRATION */}
            <div className="p-6 space-y-4 border-b border-slate-100 bg-slate-50/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 text-white rounded-xl shadow-inner">
                            <ActivityIcon size={18} />
                        </div>
                        <div>
                            <Link 
                                href="/mm?tab=activities" 
                                className="group block hover:opacity-80 transition-opacity"
                                >
                                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none group-hover:text-indigo-600">
                                        3. Execution Registry 🔗
                                    </h2>
                            </Link>
                            
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ref: Guideline 1/2025 v2.5</p>
                        </div>
                    </div>

                    <div className="flex flex-1 max-w-md items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <Search size={16} className="text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search phases or tasks..."
                            className="bg-transparent border-none text-xs font-bold w-full focus:outline-none text-slate-700 placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="p-1 hover:bg-slate-100 rounded-md">
                                <X size={14} className="text-slate-400" />
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={() => { setEditingRecord(null); setActiveModal('activity'); }} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all text-xs font-black uppercase"
                    >
                        <Plus size={16} /> <span>New Phase</span>
                    </button>
                </div>

                {/* SEARCH SCOPE TOGGLES */}
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Filter size={10} /> Filter By:
                    </span>
                    {(['phase', 'task'] as SearchScope[]).map(scope => (
                        <button
                            key={scope}
                            onClick={() => toggleSearchField(scope)}
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all border ${
                                activeSearchFields.includes(scope)
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                            }`}
                        >
                            {scope}s
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. EMPTY STATE */}
            {filteredActivities.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Filter className="text-slate-200" size={32} />
                    </div>
                    <p className="text-sm font-black text-slate-900 uppercase">No Matching Records found</p>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold">Adjust your search scope or add a new phase</p>
                </div>
            )}

            {/* 3. DESKTOP VIEW */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-6 py-5 w-12 text-center items-center justify-center flex"><Hash size={12}/></th>
                            <th className="px-4 py-5">Execution Phase</th>
                            <th className="px-8 py-5">Timeline</th>
                            <th className="px-8 py-5">Actual Cost</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredActivities.map((act, index) => {
                            const isExpanded = effectiveExpandedRows.includes(act?.id);
                            const tasksToDisplay = act?.tasks || [];
                            const phaseNumber = index + 1;

                            return (
                                <React.Fragment key={act?.id}>
                                    <tr className={`hover:bg-slate-50/30 transition-all group ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[10px] font-black text-slate-300">{phaseNumber}</span>
                                                <button onClick={() => toggleExpand(act?.id||"")} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm">
                                                    {isExpanded ? <ChevronUp size={14} className="text-indigo-600"/> : <ChevronDown size={14}/>}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5">
                                            {/* --- ADDED ACTIVITY LINK --- */}
                                            <Link href={`/mm/activities/${act?.id}`} className="group/link inline-block">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-slate-900 tracking-tight group-hover/link:text-indigo-600 transition-colors">
                                                        {act?.description}
                                                    </p>
                                                    <ExternalLink size={12} className="text-slate-300 opacity-0 group-hover/link:opacity-100 transition-all" />
                                                </div>
                                            </Link>
                                            <div className="block">
                                                <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-black uppercase mt-1 inline-block">
                                                    {act?.tasks?.length || 0} Work Packages
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
                                                <Calendar size={12} className="text-slate-400" />
                                                <span>{formatDate(act.scheduledStart)}</span>
                                                <ArrowRight size={10} className="text-slate-300" />
                                                <span>{formatDate(act.scheduledEnd)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 font-black text-slate-900 text-sm">
                                            ${(act.actualCost || 0).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button 
                                                    onClick={() => { setSelectedActivity(act); setEditingRecord(null); setActiveModal('task'); }} 
                                                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title="Add Work Package"
                                                >
                                                    <Plus size={14}/>
                                                </button>
                                                {permissions.canEdit && (
                                                    <button 
                                                        onClick={() => { setEditingRecord(act); setActiveModal('activity'); }} 
                                                        className="p-2 bg-slate-900 text-white rounded-xl shadow-md hover:bg-black transition-all"
                                                        title="Edit Phase"
                                                    >
                                                        <Edit3 size={14}/>
                                                    </button>
                                                )}
                                                {permissions.canDelete && onDeleteActivity && (
                                                    <ConfirmAction 
                                                        onConfirm={() => onDeleteActivity(act?.id)} 
                                                        itemId={act?.id?.toString()}
                                                        action="Delete" 
                                                        triggerButton={
                                                            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                                <Trash2 size={14}/>
                                                            </button>
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {isExpanded && (
                                        <tr className="animate-in fade-in slide-in-from-top-1 duration-300">
                                            <td colSpan={5} className="px-8 pb-8 bg-slate-50/20">
                                                <div className="ml-10 border-l-2 border-indigo-100 pl-8 space-y-3 mt-4">
                                                    {tasksToDisplay.length > 0 ? tasksToDisplay.map((task, taskIdx) => (
                                                        <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group/task hover:border-indigo-300 hover:shadow-md transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[9px] font-black text-slate-300 tracking-tighter">
                                                                    {phaseNumber}.{taskIdx + 1}
                                                                </span>
                                                                <div className={`w-2.5 h-2.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-200'}`} />
                                                                <div>
                                                                    <p className="text-xs font-black uppercase text-slate-800">{task.title}</p>
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                                                                        {task.status} <span className="mx-1 text-slate-200">•</span> Resp: {task.assignedTo}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => { setEditingRecord({ activityId: act.id, description: `Latency: ${task.title}` }); setActiveModal('delay'); }} 
                                                                    className="p-2 bg-rose-50 text-rose-600 rounded-xl opacity-0 group-hover/task:opacity-100 transition-all hover:bg-rose-600 hover:text-white"
                                                                    title="Report Delay"
                                                                >
                                                                    <Clock size={14}/>
                                                                </button>
                                                                {permissions.canEdit && (
                                                                    <button onClick={() => { setEditingRecord(task); setSelectedActivity(act); setActiveModal('task'); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={14}/></button>
                                                                )}
                                                                {permissions.canDelete && onDeleteTask && (
                                                                    <ConfirmAction 
                                                                        onConfirm={() => onDeleteTask(act.id, task.id)} 
                                                                        itemId={task.id.toString()}
                                                                        action="Delete" 
                                                                        triggerButton={
                                                                            <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                                                                <Trash2 size={14}/>
                                                                            </button>
                                                                        }
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">No work packages assigned to this phase</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* 4. MOBILE CARD VIEW */}
            <div className="lg:hidden divide-y divide-slate-100">
                {filteredActivities.map((act, index) => {
                    const isExpanded = effectiveExpandedRows.includes(act.id);
                    const tasksToDisplay = act?.tasks || [];
                    const phaseNumber = index + 1;

                    return (
                        <div key={act?.id} className="p-4 space-y-4">
                            <div className={`p-4 rounded-2xl border transition-all ${isExpanded ? 'bg-slate-50 border-indigo-100 shadow-sm' : 'bg-white border-slate-100'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            Phase {phaseNumber}
                                        </p>
                                        {/* --- ADDED ACTIVITY LINK --- */}
                                        <Link href={`/mm/activities/${act.id}`} className="group/link inline-flex items-center gap-2">
                                            <h3 className="text-sm font-black text-slate-900 leading-tight group-hover/link:text-indigo-600 transition-colors">
                                                {act.description}
                                            </h3>
                                            <ExternalLink size={12} className="text-slate-300" />
                                        </Link>
                                    </div>
                                    <div className="flex gap-1">
                                         <button 
                                            onClick={() => { setSelectedActivity(act); setEditingRecord(null); setActiveModal('task'); }}
                                            className="p-2 text-indigo-600 bg-indigo-50 rounded-lg shadow-sm"
                                        >
                                            <Plus size={14} />
                                        </button>
                                        {permissions.canEdit && (
                                            <button 
                                                onClick={() => { setEditingRecord(act); setActiveModal('activity'); }}
                                                className="p-2 text-white bg-slate-900 rounded-lg shadow-sm"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Cost Utilization</p>
                                        <p className="text-xs font-black text-slate-900">${(act.actualCost || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Timeline</p>
                                        <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                            {formatDate(act.scheduledStart)} <ArrowRight size={8} /> {formatDate(act.scheduledEnd)}
                                        </p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => toggleExpand(act?.id||"")}
                                    className={`w-full py-2.5 flex items-center justify-center gap-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        isExpanded ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'
                                    }`}
                                >
                                    {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                    {tasksToDisplay.length} Work Packages
                                </button>
                            </div>

                            {isExpanded && (
                                <div className="pl-4 border-l-2 border-indigo-100 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                    {tasksToDisplay.map((task, taskIdx) => (
                                        <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-black text-slate-300">{phaseNumber}.{taskIdx + 1}</span>
                                                    <div className={`w-2 h-2 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)]' : 'bg-slate-300'}`} />
                                                    <p className="text-xs font-black uppercase text-slate-800">{task.title}</p>
                                                </div>
                                                {permissions.canDelete && (
                                                    <ConfirmAction 
                                                        onConfirm={() => onDeleteTask?.(act.id, task.id)}
                                                        itemId={task.id.toString()}
                                                        action="Delete"
                                                        triggerButton={
                                                            <button className="p-1 text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                                                        }
                                                    />
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Resp: {task.assignedTo}</p>
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => { setEditingRecord({ activityId: act.id, description: `Latency: ${task.title}` }); setActiveModal('delay'); }}
                                                        className="p-2 text-rose-600 bg-rose-50 rounded-lg"
                                                    >
                                                        <Clock size={12}/>
                                                    </button>
                                                    {permissions.canEdit && (
                                                        <button 
                                                            onClick={() => { setEditingRecord(task); setSelectedActivity(act); setActiveModal('task'); }}
                                                            className="p-2 text-indigo-600 bg-indigo-50 rounded-lg"
                                                        >
                                                            <Edit3 size={12}/>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default ExecutionRegistry;