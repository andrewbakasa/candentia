import React from 'react';
import { Clock, Search, X, Edit3, Trash2 } from 'lucide-react';

/** * DATA INTERFACES
 * Following Guideline 1 of 2025: Standardized Documentation
 */
export interface LatencyRecord {
    id: string | number;
    type: string;
    description: string;
    impactHours: number;
    costImpact: number;
    activityDescription?: string;
    activity?: {
        description:string,
        project?: {
            name: string;
        };
    };
}

export type ModalType = 'delay' | 'other' | null;

interface LatencyRegistryProps {
    filteredDelays: LatencyRecord[];
    totalFilteredLeakage: number;
    delaySearch: string;
    setDelaySearch: (val: string) => void;
    setEditingRecord: (record: LatencyRecord) => void;
    setActiveModal: (type: ModalType) => void;
    handleDeleteDelay: (id: string | number) => void;
    ConfirmAction: React.ComponentType<any>; // Prop injected for the confirm button logic
}

/** * SUB-COMPONENT: LATENCY HEADER
 * Visualizes "Financial Performance" and "Market Viability" filters
 */
const LatencyHeader: React.FC<Pick<LatencyRegistryProps, 'totalFilteredLeakage' | 'delaySearch' | 'setDelaySearch'>> = ({ 
    totalFilteredLeakage, 
    delaySearch, 
    setDelaySearch 
}) => (
    <div className="p-4 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-rose-50 bg-rose-50/30 gap-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500 text-white rounded-xl shadow-sm"><Clock size={18} /></div>
            <div>
                <h2 className="text-base md:text-lg font-black text-slate-900 uppercase leading-none">2. Latency Registry</h2>
                <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest mt-1">Operational Risk Audit</p>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-rose-100/50 border border-rose-200 px-4 py-2 rounded-2xl w-full sm:w-auto">
                <span className="text-[9px] font-black text-rose-400 uppercase leading-none">Filtered Leakage</span>
                <span className="text-sm font-black text-rose-600">${totalFilteredLeakage.toLocaleString()}</span>
            </div>

            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                    type="text"
                    placeholder="Filter type, activity, or reason..."
                    className="w-full text-xs bg-white border border-rose-100 rounded-2xl pl-9 pr-8 py-2.5 outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-sm"
                    value={delaySearch}
                    onChange={(e) => setDelaySearch(e.target.value)}
                />
                {delaySearch && (
                    <button onClick={() => setDelaySearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500">
                        <X size={14}/>
                    </button>
                )}
            </div>
        </div>
    </div>
);

/** * SUB-COMPONENT: MOBILE CARD
 */
const LatencyMobileCard: React.FC<{
    delay: LatencyRecord;
    onEdit: () => void;
    onDelete: (id: string | number) => void;
    ConfirmAction: React.ComponentType<any>;
}> = ({ delay, onEdit, onDelete, ConfirmAction }) => (
    <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded-lg border border-rose-100 uppercase">
                {delay.type?.replace('_', ' ')}
            </span>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button onClick={onEdit} className="p-2 text-slate-500 border-r border-slate-200 active:bg-slate-100">
                    <Edit3 size={16}/>
                </button>
                <ConfirmAction 
                    onConfirm={onDelete} 
                    itemId={delay.id}
                    action="Delete" 
                    triggerButton={
                        <button className="p-2 text-slate-400 hover:text-rose-600 active:bg-rose-50">
                            <Trash2 size={16}/>
                        </button>
                    }
                />
            </div>
        </div>
        <h3 className="text-sm font-bold text-slate-800 leading-tight">
            {delay.activity?.description || delay.activity?.project?.name}
        </h3>
        <p className="text-xs text-slate-500 italic line-clamp-2">{delay.description}</p>
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div>
                <p className="text-[8px] font-black text-slate-400 uppercase">Impact Time</p>
                <p className="text-sm font-black text-slate-900">{delay.impactHours}h</p>
            </div>
            <div className="text-right">
                <p className="text-[8px] font-black text-rose-400 uppercase">Financial Leakage</p>
                <p className="text-sm font-black text-rose-600">${delay.costImpact?.toLocaleString()}</p>
            </div>
        </div>
    </div>
);

/** * SUB-COMPONENT: DESKTOP ROW
 */
const LatencyDesktopRow: React.FC<{
    delay: LatencyRecord;
    onEdit: () => void;
    onDelete: (id: string | number) => void;
    ConfirmAction: React.ComponentType<any>;
}> = ({ delay, onEdit, onDelete, ConfirmAction }) => (
    <tr className="group hover:bg-rose-50/10 transition-colors">
        <td className="px-6 py-4">
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded uppercase">
                {delay.type}
            </span>
        </td>
        <td className="px-4 py-4">
            <div className="text-xs font-bold text-slate-800">
                {delay.activity?.description || delay.activity?.project?.name}
            </div>
            <div className="text-[10px] text-slate-400 italic truncate max-w-xs">{delay.description}</div>
        </td>
        <td className="px-4 py-4 text-center text-xs font-bold text-slate-900">{delay.impactHours}h</td>
        <td className="px-4 py-4 text-xs font-black text-rose-600">${delay.costImpact?.toLocaleString()}</td>
        <td className="px-6 py-4">
            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <button 
                        onClick={onEdit} 
                        className="p-2.5 border-r border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                        <Edit3 size={14}/>
                    </button>
                    <ConfirmAction 
                        onConfirm={onDelete} 
                        itemId={delay.id}
                        action="Delete" 
                        triggerButton={
                            <button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                                <Trash2 size={14}/>
                            </button>
                        }
                    />
                </div>
            </div>
        </td>
    </tr>
);

/** * MAIN COMPONENT: LATENCY REGISTRY
 */
const LatencyRegistry: React.FC<LatencyRegistryProps> = ({ 
    filteredDelays, 
    totalFilteredLeakage, 
    delaySearch, 
    setDelaySearch,
    setEditingRecord,
    setActiveModal,
    handleDeleteDelay,
    ConfirmAction
}) => {
    return (
        <section className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
            <LatencyHeader 
                totalFilteredLeakage={totalFilteredLeakage}
                delaySearch={delaySearch}
                setDelaySearch={setDelaySearch}
            />

            {/* MOBILE VIEW */}
            <div className="block md:hidden divide-y divide-slate-100">
                {filteredDelays.length > 0 ? (
                    filteredDelays.map((delay) => (
                        <LatencyMobileCard 
                            key={delay.id} 
                            delay={delay} 
                            ConfirmAction={ConfirmAction}
                            onEdit={() => { setEditingRecord(delay); setActiveModal('delay'); }}
                            onDelete={handleDeleteDelay}
                        />
                    ))
                ) : (
                    <div className="p-10 text-center text-xs font-bold text-slate-400 uppercase italic">
                        No records match your search
                    </div>
                )}
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-6 py-4">Type</th>
                            <th className="px-4 py-4">Context</th>
                            <th className="px-4 py-4 text-center">Hours</th>
                            <th className="px-4 py-4">Cost Impact</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredDelays.length > 0 ? (
                            filteredDelays.map((delay) => (
                                <LatencyDesktopRow 
                                    key={delay.id} 
                                    delay={delay}
                                    ConfirmAction={ConfirmAction}
                                    onEdit={() => { setEditingRecord(delay); setActiveModal('delay'); }}
                                    onDelete={handleDeleteDelay}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-20 text-center">
                                    <p className="text-xs font-black text-slate-400 uppercase italic">No matching records found</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default LatencyRegistry;