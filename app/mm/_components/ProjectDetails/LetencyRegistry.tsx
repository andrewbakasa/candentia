'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
    Clock, Edit3, Trash2, AlertCircle, ExternalLink, History, Zap, Eye
} from 'lucide-react';
import Link from 'next/link';
import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

const DELAY_SEARCH_SCOPES: SearchScope[] = [
    { key: 'project', label: 'Project' }, 
    { key: 'type', label: 'Type' }, 
    { key: 'notes', label: 'Notes/Description' }, 
    { key: 'activity', label: 'Activity' }
];

const fuzzyMatch = (term: string, fields: (string | undefined)[]) => {
    const tokens = term.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return true;
    const combinedFields = fields.filter(Boolean).join(' ').toLowerCase();
    return tokens.every(token => combinedFields.includes(token));
};

export function LatencyRegistry({ 
    delays = [], setEditingRecord, setActiveModal, handleDeleteDelay, ConfirmAction, permissions 
}: any) {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [activeScopes, setActiveScopes] = useState<string[]>(['project', 'activity']);
    
    // SINGLE TOGGLE STATE: true = only active, false = show everything
    const [showActiveOnly, setShowActiveOnly] = useState(true);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 150);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const filteredDelays = useMemo(() => {
        const now = new Date();
        
        let results = delays;

        // 1. Status Filtering Logic
        if (showActiveOnly) {
            results = results.filter((d: any) => {
                const act = d.activity;
                if (!act) return true; 
                
                const isCompleted = act.status === 'COMPLETED';
                const isPastEnd = act.scheduledEnd && new Date(act.scheduledEnd) < now;
                return !(isCompleted || isPastEnd);
            });
        }

        // 2. Search Logic
        if (debouncedSearch.trim()) {
            results = results.filter((d: any) => {
                const searchFields: string[] = [];
                if (activeScopes.includes('type')) searchFields.push(d.type || "");
                if (activeScopes.includes('project')) searchFields.push(d.activity?.project?.name || "");
                if (activeScopes.includes('activity')) searchFields.push(d.activity?.description || "");
                if (activeScopes.includes('notes')) searchFields.push(d.description || "");
                return fuzzyMatch(debouncedSearch, searchFields);
            });
        }
        return results;
    }, [delays, debouncedSearch, activeScopes, showActiveOnly]);

    const aggregates = useMemo(() => {
        return filteredDelays.reduce((acc: { cost: number; hours: number; }, curr: { costImpact: any; impactHours: any; }) => ({
            cost: acc.cost + (Number(curr.costImpact) || 0),
            hours: acc.hours + (Number(curr.impactHours) || 0)
        }), { cost: 0, hours: 0 });
    }, [filteredDelays]);

    return (
        <section className="bg-white rounded-[2rem] lg:rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-900/5 overflow-hidden flex flex-col">
            
            {/* AUDIT HEADER */}
            <div className="p-6 lg:p-10 bg-white border-b border-slate-100">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                                <Clock size={18} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
                                    2. Latency Registry
                                </h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
                                    {showActiveOnly ? 'Active Risk Audit' : 'Full Registry Archive'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* SINGLE TOGGLE BUTTON */}
                            <button 
                                onClick={() => setShowActiveOnly(!showActiveOnly)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all border ${
                                    showActiveOnly 
                                    ? 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100' 
                                    : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'
                                }`}
                            >
                                {showActiveOnly ? <Zap size={14} className="fill-current" /> : <Eye size={14} />}
                                {showActiveOnly ? 'Viewing: Active Only' : 'Viewing: All Records'}
                            </button>

                            {/* AGGREGATES */}
                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                <div className="px-5 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Total Latency</span>
                                    <span className="text-base font-black text-slate-900">{aggregates.hours.toLocaleString()}h</span>
                                </div>
                                <div className="px-5 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Leakage Impact</span>
                                    <span className="text-base font-black text-slate-900">${aggregates.cost.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-[560px]">                       
                        <SearchFilterEngine 
                            scopes={DELAY_SEARCH_SCOPES}
                            initialActiveScopes={activeScopes} 
                            onSearchChange={setSearchTerm} 
                            onScopesChange={setActiveScopes} 
                        />
                    </div>
                </div>
            </div>

            {/* REGISTRY CONTENT */}
            <div className="flex-1 bg-slate-50/20">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                <th className="px-10 py-5 border-b border-slate-100">Context & Activity</th>
                                <th className="px-6 py-5 border-b border-slate-100">Incident Type</th>
                                <th className="px-6 py-5 border-b border-slate-100 text-center">Latency</th>
                                <th className="px-10 py-5 border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDelays.map((delay: any) => {
                                // Calculate if this specific row is "History" for styling
                                const isHistory = delay.activity?.status === 'COMPLETED' || 
                                                 (delay.activity?.scheduledEnd && new Date(delay.activity.scheduledEnd) < new Date());

                                return (
                                    <tr key={delay.id} className={`group hover:bg-white transition-all cursor-default ${isHistory ? 'opacity-70 bg-slate-50/30' : ''}`}>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${isHistory ? 'text-slate-500 bg-slate-200' : 'text-indigo-600 bg-indigo-50'}`}>
                                                    {delay.activity?.project?.name || 'Unassigned'}
                                                </span>
                                                {isHistory && <History size={12} className="text-slate-400" />}
                                            </div>
                                            <p className={`text-sm font-bold leading-snug ${isHistory ? 'text-slate-500' : 'text-slate-800'}`}>
                                                {delay.activity?.description}
                                            </p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-[10px] font-black text-rose-600 uppercase mb-1">{delay.type?.replace(/_/g, ' ')}</div>
                                            <p className="text-[11px] text-slate-400 italic line-clamp-1 group-hover:line-clamp-none transition-all max-w-xs">
                                                {delay.description}
                                            </p>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="text-sm font-black text-slate-900">${(Number(delay.costImpact) || 0).toLocaleString()}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(Number(delay.impactHours) || 0)}h Lost</div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                {permissions.canEdit && (
                                                    <button 
                                                        onClick={() => { setEditingRecord(delay); setActiveModal('delay'); }}
                                                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                    >
                                                        <Edit3 size={16}/>
                                                    </button>
                                                )}
                                                {permissions.canDelete && (
                                                    <ConfirmAction 
                                                        onConfirm={() => handleDeleteDelay(delay.id)} 
                                                        itemId={delay.id} 
                                                        action="Delete" 
                                                        triggerButton={
                                                            <button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                                <Trash2 size={16}/>
                                                            </button>
                                                        } 
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredDelays.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                        <AlertCircle size={40} className="text-slate-200 mb-4" />
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                            No records found
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Try toggling to All Records or adjusting search</p>
                    </div>
                )}
            </div>
        </section>
    );
}
// 'use client';

// import React, { useState, useMemo, useEffect } from 'react';
// import { 
//     Clock, Search, X, Edit3, Trash2, Filter, 
//     Check, ChevronDown, AlertCircle, ArrowRight,
//     ExternalLink, Layout, Activity, History, Zap
// } from 'lucide-react';
// import Link from 'next/link';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// const DELAY_SEARCH_SCOPES: SearchScope[] = [
//     { key: 'project', label: 'Project' }, 
//     { key: 'type', label: 'Type' }, 
//     { key: 'notes', label: 'Notes/Description' }, 
//     { key: 'activity', label: 'Activity' }
// ];

// const fuzzyMatch = (term: string, fields: (string | undefined)[]) => {
//     const tokens = term.toLowerCase().split(/\s+/).filter(t => t.length > 0);
//     if (tokens.length === 0) return true;
//     const combinedFields = fields.filter(Boolean).join(' ').toLowerCase();
//     return tokens.every(token => combinedFields.includes(token));
// };

// export function LatencyRegistry({ 
//     delays = [], setEditingRecord, setActiveModal, handleDeleteDelay, ConfirmAction, permissions 
// }: any) {
//     const [searchTerm, setSearchTerm] = useState("");
//     const [debouncedSearch, setDebouncedSearch] = useState("");
//     const [activeScopes, setActiveScopes] = useState<string[]>(['project', 'activity']);
    
//     // NEW: View State (Active vs History)
//     const [viewMode, setViewMode] = useState<'active' | 'history'>('active');

//     useEffect(() => {
//         const handler = setTimeout(() => setDebouncedSearch(searchTerm), 150);
//         return () => clearTimeout(handler);
//     }, [searchTerm]);

//     const filteredDelays = useMemo(() => {
//         const now = new Date();
        
//         // 1. Filter by Status (Active vs History)
//         let results = delays.filter((d: any) => {
//             const act = d.activity;
//             if (!act) return viewMode === 'active'; // Default unassigned to active
            
//             const isCompleted = act.status === 'COMPLETED';
//             const isPastEnd = act.scheduledEnd && new Date(act.scheduledEnd) < now;
//             const isHistory = isCompleted || isPastEnd;

//             return viewMode === 'active' ? !isHistory : isHistory;
//         });

//         // 2. Filter by Search Term
//         if (debouncedSearch.trim()) {
//             results = results.filter((d: any) => {
//                 const searchFields: string[] = [];
//                 if (activeScopes.includes('type')) searchFields.push(d.type || "");
//                 if (activeScopes.includes('project')) searchFields.push(d.activity?.project?.name || "");
//                 if (activeScopes.includes('activity')) searchFields.push(d.activity?.description || "");
//                 if (activeScopes.includes('notes')) searchFields.push(d.description || "");
//                 return fuzzyMatch(debouncedSearch, searchFields);
//             });
//         }
//         return results;
//     }, [delays, debouncedSearch, activeScopes, viewMode]);

//     const aggregates = useMemo(() => {
//         return filteredDelays.reduce((acc: { cost: number; hours: number; }, curr: { costImpact: any; impactHours: any; }) => ({
//             cost: acc.cost + (Number(curr.costImpact) || 0),
//             hours: acc.hours + (Number(curr.impactHours) || 0)
//         }), { cost: 0, hours: 0 });
//     }, [filteredDelays]);

//     return (
//         <section className="bg-white rounded-[2rem] lg:rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-900/5 overflow-hidden flex flex-col">
            
//             {/* AUDIT HEADER */}
//             <div className="p-6 lg:p-10 bg-white border-b border-slate-100">
//                 <div className="flex flex-col gap-8">
//                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                         <div className="flex items-center gap-3">
//                             <div className={`p-2 rounded-xl shadow-lg transition-colors ${viewMode === 'active' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-600 text-white shadow-slate-200'}`}>
//                                 {viewMode === 'active' ? <Clock size={18} /> : <History size={18} />}
//                             </div>
//                             <div>
//                                 <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
//                                     2. Latency Registry
//                                 </h2>
//                                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
//                                     {viewMode === 'active' ? 'Active Risk Audit' : 'Historical Leakage Log'}
//                                 </p>
//                             </div>
//                         </div>

//                         {/* MODE TOGGLE & AGGREGATES */}
//                         <div className="flex flex-wrap items-center gap-4">
//                             {/* View Switcher */}
//                             <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
//                                 <button 
//                                     onClick={() => setViewMode('active')}
//                                     className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
//                                 >
//                                     <Zap size={12} /> Active
//                                 </button>
//                                 <button 
//                                     onClick={() => setViewMode('history')}
//                                     className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
//                                 >
//                                     <History size={12} /> History
//                                 </button>
//                             </div>

//                             <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
//                                 <div className="px-5 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
//                                     <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Total Latency</span>
//                                     <span className="text-base font-black text-slate-900">{aggregates.hours.toLocaleString()}h</span>
//                                 </div>
//                                 <div className="px-5 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
//                                     <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Leakage Impact</span>
//                                     <span className="text-base font-black text-slate-900">${aggregates.cost.toLocaleString()}</span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="w-full lg:w-[560px]">                       
//                         <SearchFilterEngine 
//                             scopes={DELAY_SEARCH_SCOPES}
//                             initialActiveScopes={activeScopes} 
//                             onSearchChange={setSearchTerm} 
//                             onScopesChange={setActiveScopes} 
//                         />
//                     </div>
//                 </div>
//             </div>

//             {/* REGISTRY CONTENT */}
//             <div className="flex-1 bg-slate-50/20">
//                 <div className="hidden lg:block overflow-x-auto">
//                     <table className="w-full text-left border-separate border-spacing-0">
//                         <thead>
//                             <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
//                                 <th className="px-10 py-5 border-b border-slate-100">Context & Activity</th>
//                                 <th className="px-6 py-5 border-b border-slate-100">Incident Type</th>
//                                 <th className="px-6 py-5 border-b border-slate-100 text-center">Latency</th>
//                                 <th className="px-10 py-5 border-b border-slate-100 text-right">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-100">
//                             {filteredDelays.map((delay: any) => (
//                                 <tr key={delay.id} className="group hover:bg-white transition-all cursor-default">
//                                     <td className="px-10 py-6">
//                                         <div className="flex items-center gap-2 mb-1">
//                                             <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${viewMode === 'active' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 bg-slate-100'}`}>
//                                                 {delay.activity?.project?.name || 'Unassigned'}
//                                             </span>
//                                             {delay.activityId && (
//                                                 <Link href={`/mm/activities/${delay.activityId}`} className="text-slate-300 hover:text-indigo-600 transition-colors">
//                                                     <ExternalLink size={14} />
//                                                 </Link>
//                                             )}
//                                         </div>
//                                         <p className="text-sm font-bold text-slate-800 leading-snug">{delay.activity?.description}</p>
//                                     </td>
//                                     <td className="px-6 py-6">
//                                         <div className="text-[10px] font-black text-rose-600 uppercase mb-1">{delay.type?.replace(/_/g, ' ')}</div>
//                                         <p className="text-[11px] text-slate-400 italic line-clamp-1 group-hover:line-clamp-none transition-all max-w-xs">
//                                             {delay.description}
//                                         </p>
//                                     </td>
//                                     <td className="px-6 py-6 text-center">
//                                         <div className="text-sm font-black text-slate-900">${(Number(delay.costImpact) || 0).toLocaleString()}</div>
//                                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(Number(delay.impactHours) || 0)}h Lost</div>
//                                     </td>
//                                     <td className="px-10 py-6 text-right">
//                                         <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
//                                             {permissions.canEdit && (
//                                                 <button 
//                                                     onClick={() => { setEditingRecord(delay); setActiveModal('delay'); }}
//                                                     className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
//                                                 >
//                                                     <Edit3 size={16}/>
//                                                 </button>
//                                             )}
//                                             {permissions.canDelete && (
//                                                 <ConfirmAction 
//                                                     onConfirm={() => handleDeleteDelay(delay.id)} 
//                                                     itemId={delay.id} 
//                                                     action="Delete" 
//                                                     triggerButton={
//                                                         <button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
//                                                             <Trash2 size={16}/>
//                                                         </button>
//                                                     } 
//                                                 />
//                                             )}
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>

//                 {filteredDelays.length === 0 && (
//                     <div className="py-24 flex flex-col items-center justify-center text-center">
//                         <AlertCircle size={40} className="text-slate-200 mb-4" />
//                         <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
//                             {viewMode === 'active' ? 'No active risks found' : 'No historical logs found'}
//                         </h3>
//                         <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Try adjusting your search filters</p>
//                     </div>
//                 )}
//             </div>
//         </section>
//     );
// }