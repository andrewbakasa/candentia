'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Clock, Search, X, Edit3, Trash2, Filter, 
    Check, ChevronDown, AlertCircle, ArrowRight,
    LayoutGrid, List, Timer
} from 'lucide-react';

/** * DATA INTERFACES 
 * Aligned with Guideline 1: Cost & Infrastructure Standards
 */
export interface LatencyRecord {
    id: string | number;
    type: string;
    description: string;
    impactHours: number;
    costImpact: number;
    activity?: {
        description: string;
        project?: {
            name: string;
        };
    };
}

export type SearchScope = 'type' | 'project' | 'activity' | 'notes';
export type ModalType = 'delay' | 'other' | null;

interface LatencyRegistryProps {
    delays: LatencyRecord[];
    setEditingRecord: (record: LatencyRecord) => void;
    setActiveModal: (type: ModalType) => void;
    handleDeleteDelay: (id: string | number) => void;
    ConfirmAction: React.ComponentType<any>;
    permissions: { canEdit: boolean; canDelete: boolean; };
}

/** * SUB-COMPONENT: ENTITY SEARCH FIELD */
const ActiveSearchField: React.FC<{
    value: string;
    onChange: (val: string) => void;
    activeScopes: SearchScope[];
    toggleScope: (scope: SearchScope) => void;
}> = ({ value, onChange, activeScopes, toggleScope }) => {
    const [showMenu, setShowMenu] = useState(false);
    const scopeLabels: Record<SearchScope, string> = {
        type: 'Risk Type',
        project: 'Project Name',
        activity: 'Activity/Task',
        notes: 'Audit Notes'
    };

    return (
        <div className="flex items-center w-full lg:w-[480px] relative z-[100]">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text"
                    placeholder={`Search ${activeScopes.length} entities...`}
                    className="w-full text-sm bg-white border border-rose-100 rounded-l-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-medium"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>

            <div className="relative">
                <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className={`flex items-center gap-2 px-5 py-3.5 border-y border-r rounded-r-2xl transition-all text-[11px] font-black uppercase tracking-widest
                        ${showMenu ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-50 border-rose-100 text-slate-600 hover:bg-rose-50'}`}
                >
                    <Filter size={14} />
                    <span className="hidden sm:inline">Scopes</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
                </button>

                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                        <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-2 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Toggle Audit Targets</div>
                            {(Object.keys(scopeLabels) as SearchScope[]).map((scope) => (
                                <button
                                    key={scope}
                                    onClick={() => toggleScope(scope)}
                                    className="w-full flex items-center justify-between px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-rose-50 transition-colors"
                                >
                                    {scopeLabels[scope]}
                                    {activeScopes.includes(scope) ? (
                                        <div className="bg-rose-500 p-0.5 rounded-md text-white"><Check size={12} strokeWidth={4} /></div>
                                    ) : (
                                        <div className="w-4 h-4 rounded-md border border-slate-200" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

/** * MAIN COMPONENT: LATENCY REGISTRY */
const LatencyRegistry: React.FC<LatencyRegistryProps> = ({ 
    delays, setEditingRecord, setActiveModal, handleDeleteDelay, ConfirmAction, permissions 
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeScopes, setActiveScopes] = useState<SearchScope[]>(['project', 'activity']);

    const toggleScope = (scope: SearchScope) => {
        setActiveScopes(prev => 
            prev.includes(scope) 
                ? (prev.length > 1 ? prev.filter(s => s !== scope) : prev) 
                : [...prev, scope]
        );
    };

    const filteredDelays = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return delays;
        return delays.filter(delay => {
            const matchesType = activeScopes.includes('type') && delay.type?.toLowerCase().includes(term);
            const matchesProject = activeScopes.includes('project') && delay.activity?.project?.name?.toLowerCase().includes(term);
            const matchesActivity = activeScopes.includes('activity') && delay.activity?.description?.toLowerCase().includes(term);
            const matchesNotes = activeScopes.includes('notes') && delay.description?.toLowerCase().includes(term);
            return matchesType || matchesProject || matchesActivity || matchesNotes;
        });
    }, [delays, searchTerm, activeScopes]);

    // CALCULATED TOTALS
    const totalLeakage = useMemo(() => 
        filteredDelays.reduce((acc, curr) => acc + (curr.costImpact || 0), 0)
    , [filteredDelays]);

    const totalHours = useMemo(() => 
        filteredDelays.reduce((acc, curr) => acc + (curr.impactHours || 0), 0)
    , [filteredDelays]);

    return (
        <section className="bg-white rounded-[2rem] lg:rounded-[3rem] border border-rose-100 shadow-2xl shadow-rose-900/10 overflow-hidden flex flex-col">
            
            {/* AUDIT HEADER & SEARCHBAR */}
            <div className="relative z-[50] p-6 lg:p-10 bg-white border-b border-rose-50">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-rose-600 text-white rounded-3xl shadow-xl shadow-rose-200 flex items-center justify-center">
                                <Clock size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Latency Registry</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Active Audit Context: 2025-Q3</p>
                                </div>
                            </div>
                        </div>

                        {/* TOTALS DISPLAY SECTION */}
                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
                            {/* Financial Total */}
                            <div className="px-5 py-2 bg-white rounded-[1.5rem] shadow-sm border border-rose-50 flex flex-col min-w-[120px]">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Total Leakage</span>
                                <span className="text-xl font-black text-rose-600 leading-tight">${totalLeakage.toLocaleString()}</span>
                            </div>
                            {/* Hours Total */}
                            <div className="px-5 py-2 bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col min-w-[100px]">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Total Hours</span>
                                <span className="text-xl font-black text-slate-800 leading-tight">{totalHours.toLocaleString()}h</span>
                            </div>
                        </div>
                    </div>

                    <ActiveSearchField 
                        value={searchTerm} 
                        onChange={setSearchTerm} 
                        activeScopes={activeScopes} 
                        toggleScope={toggleScope} 
                    />
                </div>
            </div>

            {/* CONTENT AREA: RESPONSIVE DISPLAY */}
            <div className="flex-1 bg-slate-50/30">
                
                {/* DESKTOP TABLE VIEW (Visible on lg+) */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur-md">
                            <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-10 py-6 border-b border-slate-100">Risk Type</th>
                                <th className="px-6 py-6 border-b border-slate-100">Project / Activity Context</th>
                                <th className="px-6 py-6 border-b border-slate-100 text-center">Latency</th>
                                <th className="px-6 py-6 border-b border-slate-100">Leakage</th>
                                <th className="px-10 py-6 border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDelays.map((delay) => (
                                <tr key={delay.id} className="group hover:bg-white transition-all">
                                    <td className="px-10 py-6">
                                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl uppercase">
                                            {delay.type?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1">{delay.activity?.project?.name || 'Global'}</div>
                                        <div className="text-sm font-bold text-slate-800 leading-tight">{delay.activity?.description}</div>
                                        <div className="text-xs text-slate-500 italic mt-2 line-clamp-1 group-hover:line-clamp-none transition-all duration-300">"{delay.description}"</div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-600 border border-slate-200">{delay.impactHours}h</span>
                                    </td>
                                    <td className="px-6 py-6 font-black text-sm text-rose-600 tracking-tight">${delay.costImpact?.toLocaleString()}</td>
                                    <td className="px-10 py-6">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                            {permissions.canEdit && (
                                                <button onClick={() => { setEditingRecord(delay); setActiveModal('delay'); }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"><Edit3 size={16}/></button>
                                            )}
                                            {permissions.canDelete && (
                                                <ConfirmAction onConfirm={() => handleDeleteDelay(delay.id)} itemId={delay.id} action="Delete" triggerButton={<button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm"><Trash2 size={16}/></button>} />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE CARD VIEW (Visible below lg) */}
                <div className="lg:hidden p-5 flex flex-col gap-5">
                    {filteredDelays.map((delay) => (
                        <div key={delay.id} className="bg-white rounded-[2rem] p-6 border border-rose-100 shadow-sm relative active:scale-[0.98] transition-transform">
                            <div className="flex justify-between items-start mb-5">
                                <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl uppercase">
                                    {delay.type?.replace('_', ' ')}
                                </span>
                                <div className="flex items-center gap-1">
                                    {permissions.canEdit && <button onClick={() => { setEditingRecord(delay); setActiveModal('delay'); }} className="p-3 text-slate-400 active:text-indigo-600"><Edit3 size={18}/></button>}
                                    {permissions.canDelete && <ConfirmAction onConfirm={() => handleDeleteDelay(delay.id)} itemId={delay.id} action="Delete" triggerButton={<button className="p-3 text-slate-400 active:text-rose-600"><Trash2 size={18}/></button>} />}
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{delay.activity?.project?.name}</span>
                                <h3 className="text-base font-bold text-slate-900 leading-snug mt-1">{delay.activity?.description}</h3>
                                <p className="text-xs text-slate-500 italic mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">{delay.description}</p>
                            </div>

                            <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Latency</p>
                                        <p className="text-sm font-black text-slate-700">{delay.impactHours}h</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Leakage</p>
                                        <p className="text-sm font-black text-rose-600">${delay.costImpact?.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                                    <ArrowRight size={18} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* EMPTY STATE */}
                {filteredDelays.length === 0 && (
                    <div className="py-32 flex flex-col items-center justify-center text-center px-10">
                        <div className="p-6 bg-white rounded-full border border-slate-100 shadow-sm mb-6">
                            <AlertCircle size={48} className="text-slate-200" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">No matching risk records</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase mt-2">Try adjusting your entity scopes or search filters</p>
                    </div>
                )}
            </div>

            {/* STICKY FOOTER SUMMARY */}
            <div className="p-6 lg:px-10 lg:py-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Hit Count: {filteredDelays.length}</p>
                    <div className="hidden sm:block h-4 w-px bg-slate-200" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Total Impact: {totalHours.toLocaleString()} Hours</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full border border-rose-100">
                    <Check size={12} strokeWidth={4} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Verified Shareholder Standard</span>
                </div>
            </div>
        </section>
    );
};

export default LatencyRegistry;
// 'use client';

// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import { 
//     Clock, Search, X, Edit3, Trash2, Filter, 
//     Check, ChevronDown, AlertCircle, ArrowRight,
//     LayoutGrid, List
// } from 'lucide-react';

// /** * DATA INTERFACES 
//  * Aligned with Guideline 1: Cost & Infrastructure Standards
//  */
// export interface LatencyRecord {
//     id: string | number;
//     type: string;
//     description: string;
//     impactHours: number;
//     costImpact: number;
//     activity?: {
//         description: string;
//         project?: {
//             name: string;
//         };
//     };
// }

// export type SearchScope = 'type' | 'project' | 'activity' | 'notes';
// export type ModalType = 'delay' | 'other' | null;

// interface LatencyRegistryProps {
//     delays: LatencyRecord[];
//     setEditingRecord: (record: LatencyRecord) => void;
//     setActiveModal: (type: ModalType) => void;
//     handleDeleteDelay: (id: string | number) => void;
//     ConfirmAction: React.ComponentType<any>;
//     permissions: { canEdit: boolean; canDelete: boolean; };
// }

// /** * SUB-COMPONENT: ENTITY SEARCH FIELD
//  * FIXED: High z-index (z-50) and overflow-visible container.
//  */
// const ActiveSearchField: React.FC<{
//     value: string;
//     onChange: (val: string) => void;
//     activeScopes: SearchScope[];
//     toggleScope: (scope: SearchScope) => void;
// }> = ({ value, onChange, activeScopes, toggleScope }) => {
//     const [showMenu, setShowMenu] = useState(false);
//     const scopeLabels: Record<SearchScope, string> = {
//         type: 'Risk Type',
//         project: 'Project Name',
//         activity: 'Activity/Task',
//         notes: 'Audit Notes'
//     };

//     return (
//         <div className="flex items-center w-full lg:w-[480px] relative z-[100]">
//             <div className="relative flex-1">
//                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
//                 <input 
//                     type="text"
//                     placeholder={`Search ${activeScopes.length} entities (CMD+K)...`}
//                     className="w-full text-sm bg-white border border-rose-100 rounded-l-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-medium"
//                     value={value}
//                     onChange={(e) => onChange(e.target.value)}
//                 />
//             </div>

//             <div className="relative">
//                 <button 
//                     onClick={() => setShowMenu(!showMenu)}
//                     className={`flex items-center gap-2 px-5 py-3.5 border-y border-r rounded-r-2xl transition-all text-[11px] font-black uppercase tracking-widest
//                         ${showMenu ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-50 border-rose-100 text-slate-600 hover:bg-rose-50'}`}
//                 >
//                     <Filter size={14} />
//                     <span className="hidden sm:inline">Scopes</span>
//                     <ChevronDown size={14} className={`transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
//                 </button>

//                 {showMenu && (
//                     <>
//                         <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
//                         <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
//                             <div className="px-4 py-2 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Toggle Audit Targets</div>
//                             {(Object.keys(scopeLabels) as SearchScope[]).map((scope) => (
//                                 <button
//                                     key={scope}
//                                     onClick={() => toggleScope(scope)}
//                                     className="w-full flex items-center justify-between px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-rose-50 transition-colors"
//                                 >
//                                     {scopeLabels[scope]}
//                                     {activeScopes.includes(scope) ? (
//                                         <div className="bg-rose-500 p-0.5 rounded-md text-white"><Check size={12} strokeWidth={4} /></div>
//                                     ) : (
//                                         <div className="w-4 h-4 rounded-md border border-slate-200" />
//                                     )}
//                                 </button>
//                             ))}
//                         </div>
//                     </>
//                 )}
//             </div>
//         </div>
//     );
// };

// /** * MAIN COMPONENT: LATENCY REGISTRY
//  */
// const LatencyRegistry: React.FC<LatencyRegistryProps> = ({ 
//     delays, setEditingRecord, setActiveModal, handleDeleteDelay, ConfirmAction, permissions 
// }) => {
//     const [searchTerm, setSearchTerm] = useState("");
//     const [activeScopes, setActiveScopes] = useState<SearchScope[]>(['project', 'activity']);

//     const toggleScope = (scope: SearchScope) => {
//         setActiveScopes(prev => 
//             prev.includes(scope) 
//                 ? (prev.length > 1 ? prev.filter(s => s !== scope) : prev) 
//                 : [...prev, scope]
//         );
//     };

//     const filteredDelays = useMemo(() => {
//         const term = searchTerm.toLowerCase().trim();
//         if (!term) return delays;
//         return delays.filter(delay => {
//             const matchesType = activeScopes.includes('type') && delay.type?.toLowerCase().includes(term);
//             const matchesProject = activeScopes.includes('project') && delay.activity?.project?.name?.toLowerCase().includes(term);
//             const matchesActivity = activeScopes.includes('activity') && delay.activity?.description?.toLowerCase().includes(term);
//             const matchesNotes = activeScopes.includes('notes') && delay.description?.toLowerCase().includes(term);
//             return matchesType || matchesProject || matchesActivity || matchesNotes;
//         });
//     }, [delays, searchTerm, activeScopes]);

//     const totalLeakage = useMemo(() => 
//         filteredDelays.reduce((acc, curr) => acc + (curr.costImpact || 0), 0)
//     , [filteredDelays]);

//     return (
//         <section className="bg-white rounded-[2rem] lg:rounded-[3rem] border border-rose-100 shadow-2xl shadow-rose-900/10 overflow-hidden flex flex-col">
            
//             {/* AUDIT HEADER & SEARCHBAR */}
//             <div className="relative z-[50] p-6 lg:p-10 bg-white border-b border-rose-50">
//                 <div className="flex flex-col gap-8">
//                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
//                         <div className="flex items-center gap-5">
//                             <div className="p-4 bg-rose-600 text-white rounded-3xl shadow-xl shadow-rose-200 flex items-center justify-center">
//                                 <Clock size={28} />
//                             </div>
//                             <div>
//                                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Latency Registry</h2>
//                                 <div className="flex items-center gap-2 mt-2">
//                                     <span className="w-2 h-2 rounded-full bg-emerald-500" />
//                                     <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Active Audit Context: 2025-Q3</p>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
//                             <div className="px-6 py-2 bg-white rounded-[1.5rem] shadow-sm border border-rose-50">
//                                 <span className="block text-[9px] font-black text-slate-400 uppercase tracking-tight">Filtered Leakage</span>
//                                 <span className="text-xl font-black text-rose-600">${totalLeakage.toLocaleString()}</span>
//                             </div>
//                         </div>
//                     </div>

//                     <ActiveSearchField 
//                         value={searchTerm} 
//                         onChange={setSearchTerm} 
//                         activeScopes={activeScopes} 
//                         toggleScope={toggleScope} 
//                     />
//                 </div>
//             </div>

//             {/* CONTENT AREA: RESPONSIVE DISPLAY */}
//             <div className="flex-1 bg-slate-50/30">
                
//                 {/* DESKTOP TABLE VIEW (Visible on lg+) */}
//                 <div className="hidden lg:block overflow-x-auto">
//                     <table className="w-full text-left border-separate border-spacing-0">
//                         <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur-md">
//                             <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
//                                 <th className="px-10 py-6 border-b border-slate-100">Risk Type</th>
//                                 <th className="px-6 py-6 border-b border-slate-100">Project / Activity Context</th>
//                                 <th className="px-6 py-6 border-b border-slate-100 text-center">Latency</th>
//                                 <th className="px-6 py-6 border-b border-slate-100">Leakage</th>
//                                 <th className="px-10 py-6 border-b border-slate-100 text-right">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-100">
//                             {filteredDelays.map((delay) => (
//                                 <tr key={delay.id} className="group hover:bg-white transition-all">
//                                     <td className="px-10 py-6">
//                                         <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl uppercase">
//                                             {delay.type?.replace('_', ' ')}
//                                         </span>
//                                     </td>
//                                     <td className="px-6 py-6">
//                                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1">{delay.activity?.project?.name || 'Global'}</div>
//                                         <div className="text-sm font-bold text-slate-800 leading-tight">{delay.activity?.description}</div>
//                                         <div className="text-xs text-slate-500 italic mt-2 line-clamp-1 group-hover:line-clamp-none transition-all duration-300">{delay.description}</div>
//                                     </td>
//                                     <td className="px-6 py-6 text-center">
//                                         <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-600 border border-slate-200">{delay.impactHours}h</span>
//                                     </td>
//                                     <td className="px-6 py-6 font-black text-sm text-rose-600 tracking-tight">${delay.costImpact?.toLocaleString()}</td>
//                                     <td className="px-10 py-6">
//                                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
//                                             {permissions.canEdit && (
//                                                 <button onClick={() => { setEditingRecord(delay); setActiveModal('delay'); }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"><Edit3 size={16}/></button>
//                                             )}
//                                             {permissions.canDelete && (
//                                                 <ConfirmAction onConfirm={() => handleDeleteDelay(delay.id)} itemId={delay.id} action="Delete" triggerButton={<button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm"><Trash2 size={16}/></button>} />
//                                             )}
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* MOBILE CARD VIEW (Visible below lg) */}
//                 <div className="lg:hidden p-5 flex flex-col gap-5">
//                     {filteredDelays.map((delay) => (
//                         <div key={delay.id} className="bg-white rounded-[2rem] p-6 border border-rose-100 shadow-sm relative active:scale-[0.98] transition-transform">
//                             <div className="flex justify-between items-start mb-5">
//                                 <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl uppercase">
//                                     {delay.type?.replace('_', ' ')}
//                                 </span>
//                                 <div className="flex items-center gap-1">
//                                     {permissions.canEdit && <button onClick={() => { setEditingRecord(delay); setActiveModal('delay'); }} className="p-3 text-slate-400 active:text-indigo-600"><Edit3 size={18}/></button>}
//                                     {permissions.canDelete && <ConfirmAction onConfirm={() => handleDeleteDelay(delay.id)} itemId={delay.id} action="Delete" triggerButton={<button className="p-3 text-slate-400 active:text-rose-600"><Trash2 size={18}/></button>} />}
//                                 </div>
//                             </div>

//                             <div className="mb-6">
//                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{delay.activity?.project?.name}</span>
//                                 <h3 className="text-base font-bold text-slate-900 leading-snug mt-1">{delay.activity?.description}</h3>
//                                 <p className="text-xs text-slate-500 italic mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">{delay.description}</p>
//                             </div>

//                             <div className="flex items-center justify-between pt-5 border-t border-slate-50">
//                                 <div className="flex gap-6">
//                                     <div>
//                                         <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Latency</p>
//                                         <p className="text-sm font-black text-slate-700">{delay.impactHours}h</p>
//                                     </div>
//                                     <div>
//                                         <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Leakage</p>
//                                         <p className="text-sm font-black text-rose-600">${delay.costImpact?.toLocaleString()}</p>
//                                     </div>
//                                 </div>
//                                 <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
//                                     <ArrowRight size={18} />
//                                 </div>
//                             </div>
//                         </div>
//                     ))}
//                 </div>

//                 {/* EMPTY STATE */}
//                 {filteredDelays.length === 0 && (
//                     <div className="py-32 flex flex-col items-center justify-center text-center px-10">
//                         <div className="p-6 bg-white rounded-full border border-slate-100 shadow-sm mb-6">
//                             <AlertCircle size={48} className="text-slate-200" />
//                         </div>
//                         <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">No matching risk records</h3>
//                         <p className="text-[11px] text-slate-400 font-bold uppercase mt-2">Try adjusting your entity scopes or search filters</p>
//                     </div>
//                 )}
//             </div>

//             {/* STICKY FOOTER SUMMARY */}
//             <div className="p-6 lg:px-10 lg:py-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
//                 <div className="flex items-center gap-6">
//                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Hit Count: {filteredDelays.length}</p>
//                     <div className="hidden sm:block h-4 w-px bg-slate-200" />
//                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Standard Ref: G1-2025</p>
//                 </div>
//                 <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full border border-rose-100">
//                     <Check size={12} strokeWidth={4} />
//                     <span className="text-[9px] font-black uppercase tracking-widest">Verified Shareholder Standard</span>
//                 </div>
//             </div>
//         </section>
//     );
// };

// export default LatencyRegistry;