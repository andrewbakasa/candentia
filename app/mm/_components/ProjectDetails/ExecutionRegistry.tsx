'use client';
import React, { useState, useMemo } from 'react';
import { 
    Activity as ActivityIcon, 
    Plus, 
    ChevronUp, 
    ChevronDown, 
    Edit3, 
    Clock, 
    CheckCircle2, 
    Calendar,
    Search,
    Filter,
    ArrowRight
} from 'lucide-react';

/** * DATA INTERFACES
 * Following Guideline 1: Standardized Documentation 
 */
export interface Task {
    id: string | number;
    title: string;
    status: 'COMPLETED' | 'PENDING' | string;
}

export interface Activity {
    id: string | number;
    description: string;
    scheduledStart: string;
    scheduledEnd: string;
    actualCost: number;
    tasks?: Task[];
}

interface ExecutionRegistryProps {
    activities: Activity[];
    setEditingRecord: (record: any) => void;
    setActiveModal: (type: 'activity' | 'task' | 'delay' | null) => void;
    setSelectedActivity: (activity: Activity) => void;
    formatDate: (date: string) => string;
}

const ExecutionRegistry: React.FC<ExecutionRegistryProps> = ({
    activities = [],
    setEditingRecord,
    setActiveModal,
    setSelectedActivity,
    formatDate
}) => {
    // --- STATE MANAGEMENT ---
    const [expandedActivities, setExpandedActivities] = useState<(string | number)[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // --- LOGIC: Top-Down Preservation Filter ---
    const filteredActivities = useMemo(() => {
        const lowerTerm = searchTerm.toLowerCase().trim();
        if (!lowerTerm) return activities;

        return activities.filter(act => {
            const phaseMatches = act.description.toLowerCase().includes(lowerTerm);
            const taskMatches = act.tasks?.some(t => t.title.toLowerCase().includes(lowerTerm));
            return phaseMatches || taskMatches;
        });
    }, [activities, searchTerm]);

    // --- LOGIC: Contextual Auto-Expand ---
    const effectiveExpandedRows = useMemo(() => {
        if (!searchTerm.trim()) return expandedActivities;
        return filteredActivities.map(act => act.id);
    }, [filteredActivities, searchTerm, expandedActivities]);

    const toggleExpand = (id: string | number) => {
        setExpandedActivities(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    return (
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            
            {/* 1. HEADER & SEARCH ORCHESTRATION */}
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 text-white rounded-xl shadow-inner">
                        <ActivityIcon size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">3. Execution Registry</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Registry Phase v2.5</p>
                    </div>
                </div>

                <div className="flex flex-1 max-w-md items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <Search size={16} className="text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Filter by Phase or Work Package..."
                        className="bg-transparent border-none text-xs font-bold w-full focus:outline-none text-slate-700 placeholder:text-slate-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm("")} className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase">Clear</button>
                    )}
                </div>

                <button 
                    onClick={() => { setEditingRecord(null); setActiveModal('activity'); }} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all text-xs font-black uppercase"
                >
                    <Plus size={16} /> <span>Add Phase</span>
                </button>
            </div>

            {/* 2. EMPTY STATE LOGIC */}
            {filteredActivities.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Filter className="text-slate-200" size={32} />
                    </div>
                    <p className="text-sm font-black text-slate-900 uppercase">No Matching Records</p>
                </div>
            )}

            {/* 3. MOBILE ADAPTIVE VIEW */}
            <div className="lg:hidden divide-y divide-slate-100">
                {filteredActivities.map((act) => {
                    const isExpanded = effectiveExpandedRows.includes(act.id);
                    const lowerSearch = searchTerm.toLowerCase();
                    const isParentMatch = searchTerm && act.description.toLowerCase().includes(lowerSearch);
                    
                    // Show all tasks if parent matches, otherwise filter tasks
                    const tasksToDisplay = isParentMatch 
                        ? (act.tasks || []) 
                        : (act.tasks?.filter(t => t.title.toLowerCase().includes(lowerSearch)) || []);

                    return (
                        <div key={act.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div onClick={() => toggleExpand(act.id)} className="cursor-pointer flex-1">
                                    <h3 className={`text-sm font-black uppercase tracking-tight flex items-center gap-2 ${isParentMatch ? 'text-indigo-600' : 'text-slate-900'}`}>
                                        {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                        {act.description}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                                        {formatDate(act.scheduledStart)} — {formatDate(act.scheduledEnd)}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => { setSelectedActivity(act); setEditingRecord(null); setActiveModal('task'); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Plus size={14}/></button>
                                    <button onClick={() => { setEditingRecord(act); setActiveModal('activity'); }} className="p-2 bg-slate-900 text-white rounded-lg"><Edit3 size={14}/></button>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className="mt-4 space-y-2 pl-4 border-l-2 border-indigo-100 animate-in slide-in-from-left duration-200">
                                    {tasksToDisplay.map((task) => (
                                        <div key={task.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                {task.status === 'COMPLETED' ? <CheckCircle2 size={14} className="text-emerald-500"/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"/>}
                                                <span className={`text-[11px] font-bold ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span>
                                            </div>
                                            <button onClick={() => { setEditingRecord(task); setSelectedActivity(act); setActiveModal('task'); }} className="text-slate-400"><Edit3 size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 4. DESKTOP SYSTEMIC VIEW */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-8 py-5 w-10"></th>
                            <th className="px-4 py-5">Execution Phase</th>
                            <th className="px-8 py-5">Timeline</th>
                            <th className="px-8 py-5">Actual Cost</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredActivities.map((act) => {
                            const isExpanded = effectiveExpandedRows.includes(act.id);
                            const lowerSearch = searchTerm.toLowerCase();
                            const isParentMatch = searchTerm && act.description.toLowerCase().includes(lowerSearch);
                            
                            // ADJUSTMENT: If parent matches, show all tasks. Otherwise, show only matches.
                            const tasksToDisplay = isParentMatch 
                                ? (act.tasks || []) 
                                : (act.tasks?.filter(t => t.title.toLowerCase().includes(lowerSearch)) || []);

                            return (
                                <React.Fragment key={act.id}>
                                    <tr className={`hover:bg-slate-50/30 transition-all group ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                                        <td className="px-8 py-5">
                                            <button onClick={() => toggleExpand(act.id)} className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all shadow-sm">
                                                {isExpanded ? <ChevronUp size={16} className="text-indigo-600"/> : <ChevronDown size={16}/>}
                                            </button>
                                        </td>
                                        <td className="px-4 py-5">
                                            <p className={`text-sm font-black tracking-tight ${isParentMatch ? 'text-indigo-600' : 'text-slate-900'}`}>{act.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-black uppercase tracking-widest border border-indigo-100">
                                                    {act.tasks?.length || 0} Packages
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
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button onClick={() => { setSelectedActivity(act); setEditingRecord(null); setActiveModal('task'); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Plus size={14}/></button>
                                                <button onClick={() => { setEditingRecord(act); setActiveModal('activity'); }} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-md"><Edit3 size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {isExpanded && (
                                        <tr className="animate-in fade-in duration-300">
                                            <td colSpan={5} className="px-8 pb-8 bg-slate-50/20">
                                                <div className="ml-4 border-l-2 border-indigo-100 pl-8 space-y-3 mt-4">
                                                    {tasksToDisplay.map((task) => {
                                                        const isTaskMatch = searchTerm && task.title.toLowerCase().includes(lowerSearch);
                                                        return (
                                                            <div key={task.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-colors group/task ${isTaskMatch ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-100 hover:border-indigo-300'}`}>
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-2.5 h-2.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-slate-200'}`} />
                                                                    <div>
                                                                        <p className={`text-xs font-black uppercase tracking-tight ${isTaskMatch ? 'text-indigo-600' : 'text-slate-800'}`}>{task.title}</p>
                                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{task.status}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => { setEditingRecord({ activityId: act.id, description: `Latency: ${task.title}` }); setActiveModal('delay'); }} className="p-2 bg-rose-50 text-rose-600 rounded-xl opacity-0 group-hover/task:opacity-100 transition-all hover:bg-rose-600 hover:text-white"><Clock size={14}/></button>
                                                                    <button onClick={() => { setEditingRecord(task); setSelectedActivity(act); setActiveModal('task'); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={14}/></button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
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
        </section>
    );
};

export default ExecutionRegistry;