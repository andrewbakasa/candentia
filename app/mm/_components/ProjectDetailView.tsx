'use client';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, ChevronRight, DollarSign, Briefcase, Target, TrendingUp, 
    AlertTriangle, Activity as ActivityIcon, User, Layers, 
    ShoppingCart, Package, X, FileText, Trash2, Edit2, MoreVertical,
    CheckCircle2, Calendar, ChevronUp, ChevronDown,
    Edit3,
    AlertOctagon,
    Clock,
    Search
} from 'lucide-react';
import toast from 'react-hot-toast';

// Component Imports
import MM_TaskForm from './TaskForm';
import MM_MaterialForm from './MM_MaterialForm';
import MM_PurchaseOrderForm from './MM_PurchaseOrder';
import MM_ProcessDelayForm from './MM_DelayForm';
import ConfirmAction from './ConfirmAction';

/** UTILS **/
const formatDate = (dateValue: any) => {
    const date = new Date(dateValue);
    if (!dateValue || isNaN(date.getTime())) {
        return <span className="text-rose-500 italic">Not Scheduled</span>;
    }
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

interface ProjectDetailViewProps {
    project: any;
    onRefresh?: () => void;
    MM_ActivityForm: React.ComponentType<any>;
    allStrategies?: any[]; 
}

/** SUB-COMPONENTS **/
const Badge = ({ icon, text, color }: any) => (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-${color}-100 text-${color}-700 border border-${color}-200`}>
        {icon} {text}
    </span>
);

const StatCard = ({ icon, label, value, color }: any) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className={`p-2 w-fit rounded-lg bg-${color}-50 text-${color}-600 mb-3`}>{icon}</div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
);

export default function ProjectDetailView({ project, onRefresh, MM_ActivityForm, allStrategies = [] }: ProjectDetailViewProps) {
    const router = useRouter();
    
    // UI State
   // const [activeModal, setActiveModal] = useState<'activity' | 'task' | 'po' | 'boq' | null>(null);
    const [activeModal, setActiveModal] = useState<'activity' | 'task' | 'po' | 'boq' | 'delay' | null>(null);
  
    const [procurementTab, setProcurementTab] = useState<'materials' | 'pos'>('materials');
    
    // Data State
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [selectedActivity, setSelectedActivity] = useState<any>(null); 
    const [expandedPOs, setExpandedPOs] = useState<string[]>([]);
    const [expandedActivities, setExpandedActivities] = useState<string[]>([]);
    const [delaySearch, setDelaySearch] = useState("");

    const togglePO = (id: string) => setExpandedPOs(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    const toggleExpand = (id: string) => setExpandedActivities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    
    const closeModal = () => { 
        setActiveModal(null); 
        setEditingRecord(null); 
        setSelectedActivity(null); 
    };

    const handleSaveSuccess = () => {
        closeModal();
        toast.success('Ledger Synchronized');
        router.refresh(); 
        if (onRefresh) onRefresh(); 
    };

    const handleDelete = async (id: string, entity: 'materials' | 'pos') => {
        const endpoint = entity === 'materials' ? `/mm/api/materialrequirements/${id}` : `/mm/api/purchaseorders/${id}`;
        try {
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            toast.success('Registry Entry Removed');
            router.refresh();
            if (onRefresh) onRefresh();
        } catch (error) {
            toast.error('Failed to delete. Entry may be linked to active transactions.');
        }
    };
    const handleDeleteDelay = async (id: string) => {
        if (!window.confirm("Are you sure? This will reverse the financial impact on the Project Ledger.")) return;

        try {
            const res = await fetch(`/mm/api/delays/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success("Ledger updated: Delay reversed");
                // Refresh the page or trigger a data re-fetch
                router.refresh(); 
            } else {
                const error = await res.json();
                throw new Error(error.message || "Deletion failed");
            }
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const financials = useMemo(() => {
        const committed = project.purchaseOrders?.reduce((acc: number, po: any) => acc + (po.totalValue || 0), 0) || 0;
        const boqValue = project.materialRequirements?.reduce((acc: number, mat: any) => 
            acc + (mat.quantityRequired * (mat.estimatedUnitCost || 0)), 0) || 0;
        const remaining = (project.allocatedBudget || 0) - committed;
        const burn = project.allocatedBudget > 0 ? ((committed / project.allocatedBudget) * 100).toFixed(1) : "0";
         // Delay Metrics
        const totalDelayDays = project.processDelays?.reduce((acc: number, d: any) => acc + (d.durationDays || 0), 0) || 0;
        const activeDelays = project.processDelays?.filter((d: any) => d.status === 'ACTIVE').length || 0;

        return { committed, boqValue, remaining, burn, totalDelayDays, activeDelays };
    }, [project]);

    // 1. Filter Logic: Search matches across Type, Activity, and Description
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const filteredDelays = project.allProcessDelays?.filter((delay: any) => {
        const term = delaySearch.toLowerCase();
        return (
            delay.type?.toLowerCase().includes(term) ||
            delay.activityDescription?.toLowerCase().includes(term) ||
            delay.description?.toLowerCase().includes(term)
        );
    }) || [];

    // Calculate aggregate leakage for filtered results
const totalFilteredLeakage = React.useMemo(() => {
    return filteredDelays.reduce((sum: number, delay: any) => sum + (delay.costImpact || 0), 0);
}, [filteredDelays]);
    

    return (
        <div className="flex flex-col gap-4 bg-slate-50/50 p-4 min-h-screen pb-24 lg:pb-8 relative">
            
            {/* 1. STRATEGIC HEADER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="w-full">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block">1. Project Identity</span>
                            <h1 className="text-2xl font-black text-slate-900 leading-tight mb-4">{project.name}</h1>
                            <div className="flex flex-wrap gap-2">
                                <Badge icon={<Briefcase size={12}/>} text={project.responsibleWorkshop?.name || 'Unassigned'} color="slate" />
                                <Badge icon={<User size={12}/>} text={`PM: ${project.projectManager || 'Pending'}`} color="emerald" />
                                <Badge icon={<Layers size={12}/>} text={project.status} color="indigo" />
                            </div>
                        </div>
                        <div className="flex flex-col items-end w-full md:w-auto">
                             <div className="text-4xl font-black text-slate-900 tracking-tighter">{project.progress}%</div>
                             <div className="w-full md:w-32 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${project.progress}%` }} />
                             </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <Target className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 block">Strategic Alignment {project.plan?.year}</span>
                    <div className="space-y-4 relative z-10">
                        <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Plan Ceiling</p>
                            <p className="text-xl font-black">${project.plan?.totalBudget?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                            <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">BoQ Value</p>
                                <p className="text-sm font-bold text-indigo-300">${financials.boqValue.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Commitments</p>
                                <p className="text-sm font-bold text-emerald-400">${financials.committed.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. KPI GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp size={14}/>} label="Procurement Burn" value={`${financials.burn}%`} color="indigo" />
                <StatCard icon={<DollarSign size={14}/>} label="Uncommitted" value={`$${financials.remaining.toLocaleString()}`} color="emerald" />
                <StatCard icon={<ShoppingCart size={14}/>} label="BoQ Items" value={project.materialRequirements?.length || 0} color="slate" />
                <StatCard icon={<AlertTriangle size={14}/>} label="Budget Health" value={`$${(project.allocatedBudget - (project.totalActualCost || 0)).toLocaleString()}`} color="amber" />
            </div>


            <section className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
                {/* Header & Filter Bar */}
                <div className="p-4 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-rose-50 bg-rose-50/30 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500 text-white rounded-xl shadow-sm"><Clock size={18} /></div>
                        <div>
                            <h2 className="text-base md:text-lg font-black text-slate-900 uppercase leading-none">2. Latency Registry</h2>
                            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest mt-1">Operational Risk Audit</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        {/* Real-time Financial Impact Badge */}
                        <div className="flex items-center gap-2 bg-rose-100/50 border border-rose-200 px-4 py-2 rounded-2xl w-full sm:w-auto">
                            <span className="text-[9px] font-black text-rose-400 uppercase leading-none">Filtered Leakage</span>
                            <span className="text-sm font-black text-rose-600">${totalFilteredLeakage.toLocaleString()}</span>
                        </div>

                        {/* Search Input */}
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

                {/* MOBILE VIEW (Cards) */}
                <div className="block md:hidden divide-y divide-slate-100">
                    {filteredDelays.length > 0 ? (
                        filteredDelays.map((delay: any) => (
                            <div key={delay.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded-lg border border-rose-100 uppercase">
                                        {delay.type?.replace('_', ' ')}
                                    </span>
                                    
                                    {/* Grouped Action Capsule */}
                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <button 
                                            onClick={() => { setEditingRecord(delay); setActiveModal('delay'); }} 
                                            className="p-2 text-slate-500 border-r border-slate-200 active:bg-slate-100"
                                        >
                                            <Edit3 size={16}/>
                                        </button>
                                        <ConfirmAction 
                                            onConfirm={handleDeleteDelay} 
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
                                    {delay.activityDescription || delay.activity?.project?.name}
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
                        ))
                    ) : (
                        <div className="p-10 text-center text-xs font-bold text-slate-400 uppercase italic">No records match your search</div>
                    )}
                </div>

                {/* DESKTOP VIEW (Table) */}
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
                                filteredDelays.map((delay: any) => (
                                    <tr key={delay.id} className="group hover:bg-rose-50/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded uppercase">
                                                {delay.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-xs font-bold text-slate-800">
                                                {delay.activityDescription || delay.activity?.project?.name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 italic truncate max-w-xs">{delay.description}</div>
                                        </td>
                                        <td className="px-4 py-4 text-center text-xs font-bold text-slate-900">{delay.impactHours}h</td>
                                        <td className="px-4 py-4 text-xs font-black text-rose-600">${delay.costImpact?.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                                    <button 
                                                        onClick={() => { setEditingRecord(delay); setActiveModal('delay'); }} 
                                                        className="p-2.5 border-r border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                    >
                                                        <Edit3 size={14}/>
                                                    </button>
                                                    <ConfirmAction 
                                                        onConfirm={handleDeleteDelay} 
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
            {/* 3. EXECUTION REGISTRY (RESPONSIVE) */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="p-6 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 text-white rounded-xl"><ActivityIcon size={18} /></div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">3. Execution Registry</h2>
                    </div>
                    <button onClick={() => { setEditingRecord(null); setActiveModal('activity'); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all text-xs font-black uppercase">
                        <Plus size={16} /> <span className="hidden sm:inline">Add Phase</span>
                    </button>
                </div>

                {/* MOBILE VIEW FOR REGISTRY */}
                <div className="lg:hidden divide-y divide-slate-100">
                    {project.activities?.map((act: any) => {
                        const isExpanded = expandedActivities.includes(act.id);
                        return (
                            <div key={act.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div onClick={() => toggleExpand(act.id)} className="cursor-pointer">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                            {isExpanded ? <ChevronUp size={14} className="text-indigo-600"/> : <ChevronDown size={14}/>}
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
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-indigo-500 font-bold uppercase">{act.tasks?.length || 0} Work Packages</span>
                                    <span className="text-sm font-black text-slate-900">${(act.actualCost || 0).toLocaleString()}</span>
                                </div>
                                
                                {isExpanded && (
                                    <div className="mt-4 space-y-2 pl-4 border-l-2 border-indigo-100">
                                        {act.tasks?.map((task: any) => (
                                            <div key={task.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    {task.status === 'COMPLETED' ? <CheckCircle2 size={14} className="text-emerald-500"/> : <div className="w-3 h-3 rounded-full border border-slate-300"/>}
                                                    <span className={`text-[11px] font-bold ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span>
                                                </div>
                                               <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => { 
                                                            setEditingRecord({ activityId: act.id, description: `Latency: ${task.title}` }); 
                                                            setActiveModal('delay'); 
                                                        }}
                                                        className="p-2 bg-rose-50 text-rose-600 rounded-lg"
                                                    ><Clock size={14}/></button>
                                                    <button onClick={() => { setEditingRecord(task); setSelectedActivity(act); setActiveModal('task'); }} className="text-slate-400"><Edit3 size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* DESKTOP VIEW FOR REGISTRY */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-8 py-4 w-10"></th>
                                <th className="px-4 py-4">Execution Phase</th>
                                <th className="px-8 py-4">Timeline</th>
                                <th className="px-8 py-4">Actual Cost</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {project.activities?.map((act: any) => {
                                const isExpanded = expandedActivities.includes(act.id);
                                return (
                                    <React.Fragment key={act.id}>
                                        <tr className={`hover:bg-slate-50/50 transition-colors group ${isExpanded ? 'bg-slate-50/20' : ''}`}>
                                            <td className="px-8 py-5">
                                                <button onClick={() => toggleExpand(act.id)} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm">
                                                    {isExpanded ? <ChevronUp size={16} className="text-indigo-600"/> : <ChevronDown size={16}/>}
                                                </button>
                                            </td>
                                            <td className="px-4 py-5">
                                                <p className="text-sm font-black text-slate-900 tracking-tight">{act.description}</p>
                                                <div className="flex gap-3 mt-1">
                                                    <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">{act.tasks?.length || 0} Work Packages</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    <span>{formatDate(act.scheduledStart)}</span>
                                                    <span className="text-slate-300 mx-1">→</span>
                                                    <span>{formatDate(act.scheduledEnd)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5"><span className="text-sm font-black text-slate-900">${(act.actualCost || 0).toLocaleString()}</span></td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => { setSelectedActivity(act); setEditingRecord(null); setActiveModal('task'); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"><Plus size={14}/></button>
                                                    <button onClick={() => { setEditingRecord(act); setActiveModal('activity'); }} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-colors"><Edit3 size={14}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                          {isExpanded && (
                                            <tr>
                                                <td colSpan={3} className="px-8 pb-6 bg-slate-50/30">
                                                    <div className="ml-4 border-l-2 border-slate-200 pl-6 space-y-3 mt-2">
                                                       <div className="ml-4 border-l-2 border-slate-200 pl-6 space-y-3">
                                                        {act.tasks?.map((task: any) => (
                                                            <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-3 h-3 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                                                    <p className="text-xs font-black text-slate-800 uppercase">{task.title}</p>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {/* PROCESS DELAY TRIGGER - ProjectID removed */}
                                                                    <button 
                                                                        title="Log Task Latency"
                                                                        onClick={() => { 
                                                                            setEditingRecord({ activityId: act.id, description: `Latency on: ${task.title}` }); 
                                                                            setActiveModal('delay'); 
                                                                        }}
                                                                        className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"
                                                                    ><Clock size={14}/></button>
                                                                    <button onClick={() => { setEditingRecord(task); setSelectedActivity(act); setActiveModal('task'); }} className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg"><Edit3 size={14}/></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
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

            {/* 4. PROCUREMENT PORTFOLIO (RESPONSIVE) */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-10">
                <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ShoppingCart size={18} /></div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">4. Procurement Portfolio</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">ERP Transaction Layer</p>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setProcurementTab('materials')}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all ${procurementTab === 'materials' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Material BoQ
                                </button>
                                <button 
                                    onClick={() => setProcurementTab('pos')}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all ${procurementTab === 'pos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    PO Registry
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <button onClick={() => { setEditingRecord({ projectId: project.id }); setActiveModal('boq'); }} className="flex-1 lg:flex-none justify-center p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-50 transition-colors">
                            <Plus size={14} className="text-indigo-600" /> <span className="sm:inline">Add BoQ</span>
                        </button>
                        <button onClick={() => { setEditingRecord({ projectId: project.id }); setActiveModal('po'); }} className="flex-1 lg:flex-none justify-center p-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all">
                            <Package size={14} /> <span className="sm:inline">Issue PO</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {procurementTab === 'materials' ? (
                        <>
                            {/* BOQ MOBILE */}
                            <div className="lg:hidden divide-y divide-slate-100">
                                {project.materialRequirements?.map((mat: any) => (
                                    <div key={mat.id} className="p-4 bg-white space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="max-w-[70%]">
                                                <p className="text-sm font-black text-slate-900 leading-tight">{mat.material?.description}</p>
                                                <p className="text-[10px] font-mono text-indigo-500 mt-1">{mat.material?.itemCode}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => { setEditingRecord(mat); setActiveModal('boq'); }} className="p-2 bg-slate-50 text-slate-400 rounded-lg"><Edit2 size={14}/></button>
                                                <button onClick={() => handleDelete(mat.id, 'materials')} className="p-2 bg-rose-50 text-rose-500 rounded-lg"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl">
                                            <div>
                                                <p className="text-[8px] text-slate-400 font-black uppercase">Qty</p>
                                                <p className="text-xs font-bold text-slate-700">{mat.quantityRequired} {mat.material?.unitOfMeasure}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-slate-400 font-black uppercase">Est. Unit</p>
                                                <p className="text-xs font-bold text-slate-700">${mat.estimatedUnitCost?.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] text-indigo-400 font-black uppercase">Total</p>
                                                <p className="text-xs font-black text-indigo-600">${(mat.quantityRequired * (mat.estimatedUnitCost || 0)).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* BOQ DESKTOP */}
                            <table className="hidden lg:table w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-8 py-4">Item Description</th>
                                        <th className="px-4 py-4">Quantity</th>
                                        <th className="px-4 py-4">Est. Cost</th>
                                        <th className="px-4 py-4">Total</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {project.materialRequirements?.map((mat: any) => (
                                        <tr key={mat.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                                            <td className="px-8 py-4 font-bold text-slate-700">
                                                {mat.material?.description} <span className="text-[10px] font-mono text-slate-400 ml-2">{mat.material?.itemCode}</span>
                                            </td>
                                            <td className="px-4 py-4 text-slate-600 font-medium">{mat.quantityRequired} {mat.material?.unitOfMeasure}</td>
                                            <td className="px-4 py-4 text-slate-600 font-medium">${mat.estimatedUnitCost?.toLocaleString()}</td>
                                            <td className="px-4 py-4 font-black text-indigo-600">${(mat.quantityRequired * (mat.estimatedUnitCost || 0)).toLocaleString()}</td>
                                            <td className="px-8 py-4 text-right space-x-2">
                                                <button onClick={() => { setEditingRecord(mat); setActiveModal('boq'); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={14}/></button>
                                                <button onClick={() => handleDelete(mat.id, 'materials')} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <>
                            {/* PO MOBILE */}
                            <div className="lg:hidden divide-y divide-slate-100">
                                {project.purchaseOrders?.map((po: any) => (
                                    <div key={po.id} className="p-4 bg-white">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-600 uppercase">{po.poNumber}</p>
                                                <h3 className="font-bold text-slate-900">{po.vendorname}</h3>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {po.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-black uppercase">Commitment Value</p>
                                                <p className="text-lg font-black text-emerald-600">${po.totalValue?.toLocaleString()}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => togglePO(po.id)} className="p-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold px-3">
                                                    {expandedPOs.includes(po.id) ? 'Hide Items' : 'Show Items'}
                                                </button>
                                                <button onClick={() => { setEditingRecord(po); setActiveModal('po'); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Edit2 size={14}/></button>
                                            </div>
                                        </div>
                                        {expandedPOs.includes(po.id) && (
                                            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2 duration-200">
                                                {po.lineItems?.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between text-[11px] bg-slate-50 p-2 rounded-lg">
                                                        <span className="text-slate-600">{item.description}</span>
                                                        <span className="font-black text-slate-900">${item.totalPrice?.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* PO DESKTOP */}
                            <table className="hidden lg:table w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-8 py-4">PO Reference</th>
                                        <th className="px-4 py-4">Vendor</th>
                                        <th className="px-4 py-4">Line Items</th>
                                        <th className="px-4 py-4">Commitment Value</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {project.purchaseOrders?.map((po: any) => {
                                        const isExpanded = expandedPOs.includes(po.id);
                                        return (
                                            <React.Fragment key={po.id}>
                                                <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
                                                    <td className="px-8 py-4 font-black text-slate-900">
                                                        <div className="flex items-center gap-3">
                                                            <button onClick={() => togglePO(po.id)} className="p-1 hover:bg-slate-200 rounded-md text-indigo-600 transition-colors">
                                                                <ChevronRight size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                                            </button>
                                                            {po.poNumber}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-600 font-medium">{po.vendorname}</td>
                                                    <td className="px-4 py-4">
                                                        <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                                            {po.lineItems?.length || 0} Items
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 font-black text-emerald-600">${po.totalValue?.toLocaleString()}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {po.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4 text-right space-x-2">
                                                        <button onClick={() => { setEditingRecord(po); setActiveModal('po'); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={14}/></button>
                                                        <button onClick={() => handleDelete(po.id, 'pos')} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/30">
                                                        <td colSpan={6} className="px-12 py-4">
                                                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                                <table className="w-full text-left text-[11px]">
                                                                    <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                                                                        <tr className="uppercase font-bold tracking-widest">
                                                                            <th className="px-4 py-3">Item Code</th>
                                                                            <th className="px-4 py-3">Description</th>
                                                                            <th className="px-4 py-3 text-right">Total Price</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-50">
                                                                        {po.lineItems?.map((item: any) => (
                                                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                                                <td className="px-4 py-2.5 font-mono text-indigo-600">{item.itemCode}</td>
                                                                                <td className="px-4 py-2.5 text-slate-600">{item.description}</td>
                                                                                <td className="px-4 py-2.5 text-right font-black text-slate-900">${item.totalPrice?.toLocaleString()}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </section>

            {/* MODAL SYSTEM - MOBILE DRAWER STYLE */}
            {activeModal && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-6">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
                        onClick={closeModal} 
                    />
                    
                    <div className="relative bg-white w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col animate-in slide-in-from-bottom sm:zoom-in duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                    {editingRecord?.id ? `Modify ${activeModal === 'boq' ? 'BoQ Entry' : activeModal}` : `New ${activeModal === 'boq' ? 'BoQ Entry' : activeModal}`}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Guideline 1 Compliance Mode</p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-rose-500 transition-colors shadow-sm border border-transparent hover:border-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                            {activeModal === 'activity' && (
                                <MM_ActivityForm 
                                    initialData={editingRecord} 
                                    projects={[project]} 
                                    preselectedProject={project} 
                                    onClose={closeModal} 
                                    onSuccess={handleSaveSuccess} 
                                />
                            )}
                            {activeModal === 'task' && (
                                <MM_TaskForm 
                                    initialData={editingRecord} 
                                    activities={project.activities || []}
                                    preselectedActivity={selectedActivity} 
                                    onClose={closeModal}
                                    onSuccess={handleSaveSuccess} 
                                />
                            )}
                            {activeModal === 'boq' && (
                                <MM_MaterialForm 
                                    initialData={editingRecord} 
                                    projects={[project]} 
                                    strategies={allStrategies} 
                                    onClose={closeModal}
                                    onSuccess={handleSaveSuccess} 
                                />
                            )}
                            {activeModal === 'po' && (
                                <MM_PurchaseOrderForm 
                                    initialData={editingRecord} 
                                    projects={[project]} 
                                    strategies={allStrategies} 
                                    onClose={closeModal} 
                                    onSuccess={handleSaveSuccess} 
                                />
                            )}

                            {activeModal === 'delay' && 
                            (
                            // <MM_ProcessDelayForm    onClose={closeModal} onSuccess={handleSaveSuccess} activities={project.activities} materialRequirements={[]} />
                             <MM_ProcessDelayForm 
                                initialData={editingRecord} 
                                onClose={closeModal} 
                                onSuccess={handleSaveSuccess} 
                                activities={project.activities} 
                            />
                            )}
            
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}