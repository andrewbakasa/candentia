'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, Edit3, ChevronDown, ChevronUp, 
    DollarSign, Briefcase, Target, TrendingUp, AlertTriangle, 
    Activity as ActivityIcon, User, Layers, 
    ShoppingCart, Package, Calendar, X, FileText,
    CheckCircle2, Trash2, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

// Component Imports
import MM_TaskForm from './TaskForm';
import MM_MaterialForm from './MM_MaterialForm';
import MM_PurchaseOrderForm from './MM_PurchaseOrder';
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

export default function ProjectDetailView({ project, onRefresh, MM_ActivityForm, allStrategies = [] }: ProjectDetailViewProps) {
    const router = useRouter();
    
    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isPOModalOpen, setIsPOModalOpen] = useState(false);
    const [isBoQModalOpen, setIsBoQModalOpen] = useState(false);

    // Data States
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [selectedActivity, setSelectedActivity] = useState<any>(null); 
    const [expandedActivities, setExpandedActivities] = useState<string[]>([]);
    const [procurementTab, setProcurementTab] = useState<'materials' | 'pos'>('materials');

    const toggleExpand = (id: string) => {
        setExpandedActivities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    };

    const handleSaveSuccess = () => {
        setIsTaskModalOpen(false);
        setIsModalOpen(false);
        setIsPOModalOpen(false);
        setIsBoQModalOpen(false);
        setEditingRecord(null);
        setSelectedActivity(null);
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

    // Financial calculations
    const totalCommitted = project.purchaseOrders?.reduce((acc: number, po: any) => acc + (po.totalValue || 0), 0) || 0;
    const totalBoQValue = project.materialRequirements?.reduce((acc: number, mat: any) => acc + (mat.quantityRequired * mat.estimatedUnitCost || 0), 0) || 0;
    const remainingBudget = (project.allocatedBudget || 0) - totalCommitted;
    const burnRate = project.allocatedBudget > 0 ? ((totalCommitted / project.allocatedBudget) * 100).toFixed(1) : "0";

    return (
        <div className="flex flex-col gap-4 md:gap-6 bg-slate-50/50 p-3 md:p-8 min-h-screen pb-24 lg:pb-8">
            
            {/* 1. STRATEGIC HEADER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 bg-white rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="w-full">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block italic">Project Identity</span>
                            <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-4">{project.name}</h1>
                            <div className="flex flex-wrap gap-2">
                                <Badge icon={<Briefcase size={12}/>} text={project.responsibleWorkshop?.name || 'Unassigned'} color="slate" />
                                <Badge icon={<User size={12}/>} text={`PM: ${project.projectManager || 'Pending'}`} color="emerald" />
                                <Badge icon={<Layers size={12}/>} text={project.status} color="indigo" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 md:block text-right w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                             <div className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">{project.progress}%</div>
                             <div className="flex-1 md:w-28 h-2 bg-slate-100 rounded-full md:mt-2 overflow-hidden">
                                <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${project.progress}%` }} />
                             </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                    <Target className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 md:w-32 md:h-32" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 block">Strategic Alignment {project.plan?.year}</span>
                    <div className="space-y-4 relative z-10">
                        <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Plan Ceiling (Ref: Guideline 1)</p>
                            <p className="text-xl font-black">${project.plan?.totalBudget?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                            <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">BoQ Value</p>
                                <p className="text-sm font-bold text-indigo-300">${totalBoQValue.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Commitments</p>
                                <p className="text-sm font-bold text-emerald-400">${totalCommitted.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. KPI GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <StatCard icon={<TrendingUp size={14}/>} label="Procurement Burn" value={`${burnRate}%`} color="indigo" />
                <StatCard icon={<DollarSign size={14}/>} label="Uncommitted" value={`$${remainingBudget.toLocaleString()}`} color="emerald" />
                <StatCard icon={<ShoppingCart size={14}/>} label="BoQ Items" value={project.materialRequirements?.length || 0} color="slate" />
                <StatCard icon={<AlertTriangle size={14}/>} label="Budget Health" value={`$${(project.allocatedBudget - (project.totalActualCost || 0)).toLocaleString()}`} color="amber" />
            </div>

            {/* 3. EXECUTION REGISTRY */}
            <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 md:p-8 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 text-white rounded-xl">
                            <ActivityIcon size={18} />
                        </div>
                        <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight">Execution Registry</h2>
                    </div>
                    <button 
                        onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all text-[10px] md:text-xs font-black uppercase"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Add Phase</span>
                    </button>
                </div>

                {/* Mobile Execution View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {project.activities?.map((act: any) => (
                        <MobileActivityCard 
                            key={act.id}
                            act={act}
                            isExpanded={expandedActivities.includes(act.id)}
                            onToggle={() => toggleExpand(act.id)}
                            onAddTask={() => { setSelectedActivity(act); setEditingRecord(null); setIsTaskModalOpen(true); }}
                            onEdit={() => { setEditingRecord(act); setIsModalOpen(true); }}
                            onEditTask={(task: any) => { setEditingRecord(task); setSelectedActivity(act); setIsTaskModalOpen(true); }}
                        />
                    ))}
                </div>

                {/* Desktop Execution View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
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
            </section>

            {/* 4. PROCUREMENT PORTFOLIO */}
            <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-10">
                <div className="p-5 md:p-8 border-b border-slate-100">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <ShoppingCart size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight">Procurement Portfolio</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">ERP Transaction Layer</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
                                <button onClick={() => setProcurementTab('materials')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${procurementTab === 'materials' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                                    BoQ Registry ({project.materialRequirements?.length || 0})
                                </button>
                                <button onClick={() => setProcurementTab('pos')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${procurementTab === 'pos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                                    Purchase Orders ({project.purchaseOrders?.length || 0})
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={() => { setEditingRecord({ projectId: project.id }); setIsBoQModalOpen(true); }} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-[10px] font-black uppercase">
                                    <Plus size={14} className="text-indigo-600" /> Add BoQ
                                </button>
                                <button onClick={() => { setEditingRecord({ projectId: project.id }); setIsPOModalOpen(true); }} className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase">
                                    <Package size={14} /> Issue PO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 md:p-8 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {procurementTab === 'materials' ? (
                            project.materialRequirements?.length > 0 ? project.materialRequirements.map((mat: any) => (
                                <MaterialCard key={mat.id} mat={mat} onEdit={() => { setEditingRecord(mat); setIsBoQModalOpen(true); }} onDelete={() => handleDelete(mat.id, 'materials')} />
                            )) : <EmptyState icon={<FileText size={40} />} message="No BoQ entries registered" />
                        ) : (
                            project.purchaseOrders?.length > 0 ? project.purchaseOrders.map((po: any) => (
                                <POCard key={po.id} po={po} onEdit={() => { setEditingRecord(po); setIsPOModalOpen(true); }} onDelete={() => handleDelete(po.id, 'pos')} />
                            )) : <EmptyState icon={<Package size={40} />} message="No active purchase orders" />
                        )}
                    </div>
                </div>
            </section>

            {/* 5. MODAL LAYER */}
            {(isTaskModalOpen || isModalOpen || isPOModalOpen || isBoQModalOpen) && (
                <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Form Entry</h3>
                            <button onClick={handleSaveSuccess} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2">
                           {isBoQModalOpen && <MM_MaterialForm initialData={editingRecord} projects={[project]} strategies={allStrategies} onClose={() => setIsBoQModalOpen(false)} onSuccess={handleSaveSuccess} />}
                           {isPOModalOpen && <MM_PurchaseOrderForm initialData={editingRecord} projects={[project]} strategies={allStrategies} onClose={() => setIsPOModalOpen(false)} onSuccess={handleSaveSuccess} />}
                           {isTaskModalOpen && <MM_TaskForm initialData={editingRecord} activities={project.activities || []} preselectedActivity={selectedActivity} onClose={() => setIsTaskModalOpen(false)} onSuccess={handleSaveSuccess} />}
                           {isModalOpen && <MM_ActivityForm initialData={editingRecord} projects={[project]} preselectedProject={project} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/** HELPER COMPONENTS **/

function Badge({ icon, text, color }: { icon: any, text: string, color: 'indigo' | 'emerald' | 'slate' }) {
    const styles = {
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        slate: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${styles[color]}`}>
            {icon} {text}
        </div>
    );
}

function StatCard({ icon, label, value, color }: any) {
    const colors: any = {
        indigo: 'text-indigo-600 bg-indigo-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        slate: 'text-slate-600 bg-slate-50',
        amber: 'text-amber-600 bg-amber-50'
    };
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-2 rounded-xl ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-sm font-black text-slate-900">{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    return <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 tracking-tighter border border-slate-200">{status}</span>;
}

function EmptyState({ icon, message }: any) {
    return (
        <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-300">
            {icon}
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest">{message}</p>
        </div>
    );
}

function MaterialCard({ mat, onEdit, onDelete }: any) {
    return (
        <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-sm group relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{mat.material.itemCode || 'BOQ-ITEM'}</span>
                <StatusBadge status={mat.status} />
            </div>
            <h4 className="text-sm font-black text-slate-800 mb-1">{mat.material.description}</h4>
            <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-4">
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Qty</p><p className="text-xs font-black text-slate-900">{mat.quantityRequired} {mat.material.unitOfMeasure}</p></div>
                <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Est. Value</p><p className="text-sm font-black text-slate-900">${(mat.quantityRequired * (mat.estimatedUnitCost || 0)).toLocaleString()}</p></div>
            </div>
            <div className="absolute inset-0 bg-indigo-600/90 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-3 bg-white text-indigo-600 rounded-xl hover:scale-110 transition-transform"><Edit3 size={20} /></button>
                 <ConfirmAction 
                    onConfirm={onDelete} 
                    itemId={mat.id}
                    action="Delete" 
                    heading="Delete Material"
                    description="Are you sure? This entry will be removed."
                    showHint={false} 
                    triggerButton={<button className="p-3 bg-white text-rose-600 rounded-xl hover:scale-110 transition-transform"><Trash2 size={20} /></button>}
                />
            </div>
        </div>
    );
}

function POCard({ po, onEdit, onDelete }: any) {
    return (
        <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm hover:border-emerald-300 transition-all group relative overflow-hidden flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Package size={20} /></div>
                <StatusBadge status={po.status} />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{po.poNumber}</p>
                <h4 className="font-black text-slate-900 text-base mb-3 italic">{po.vendorname || "Unknown Vendor"}</h4>
                <div className="space-y-2 mb-6">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter border-b border-slate-50 pb-1">Materials Registry</p>
                    {po.lineItems && po.lineItems.length > 0 ? (
                        <div className="max-h-32 overflow-y-auto pr-1">
                            {po.lineItems.map((item: any, idx: number) => (
                                <div key={item.id || idx} className="flex justify-between items-start py-1.5 border-b border-slate-50 last:border-0">
                                    <div className="pr-2">
                                        <p className="text-[11px] font-bold text-slate-700 leading-tight">{item.description}</p>
                                        <p className="text-[9px] font-mono text-slate-400">{item.itemCode} • Qty: {item.quantityOrdered}</p>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-900">${item.totalPrice?.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-[10px] text-slate-400 italic">No items listed</p>}
                </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commitment</span>
                <span className="text-base font-black text-indigo-600">${po.totalValue?.toLocaleString()}</span>
            </div>
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Manage Procurement</p>
                <div className="flex gap-3">
                    <button onClick={onEdit} className="p-3 bg-white text-slate-900 rounded-xl hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-110"><Edit3 size={20} /></button>
                    <button onClick={onDelete} className="p-3 bg-white text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all transform hover:scale-110"><Trash2 size={20} /></button>
                </div>
            </div>
        </div>
    );
}

/** EXECUTION REGISTRY VIEWS **/

function MobileActivityCard({ act, isExpanded, onToggle, onAddTask, onEdit, onEditTask }: any) {
    return (
        <div className="p-4 bg-white border-b border-slate-50">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1" onClick={onToggle}>
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter mb-1">Project Phase</p>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">{act.description}</h4>
                </div>
                <div className="flex gap-1.5">
                    <button onClick={onAddTask} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg active:scale-95 transition-transform"><Plus size={14}/></button>
                    <button onClick={onEdit} className="p-2 bg-slate-900 text-white rounded-lg active:scale-95 transition-transform"><Edit3 size={14}/></button>
                </div>
            </div>
            <div className="grid grid-cols-2 mt-4 pt-4 border-t border-slate-50">
                <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Timeline</p>
                    <p className="text-[10px] font-bold text-slate-600">{formatDate(act.scheduledStart)} - {formatDate(act.scheduledEnd)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Phase Cost</p>
                    <p className="text-xs font-black text-slate-900">${(act.actualCost || 0).toLocaleString()}</p>
                </div>
            </div>
            <button onClick={onToggle} className="w-full mt-3 py-2 bg-slate-50 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-400">
                {act.tasks?.length || 0} Work Packages {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>
            {isExpanded && (
                <div className="mt-4 space-y-3 bg-slate-50/50 p-3 rounded-xl">
                    {act.tasks?.map((t: any) => (
                        <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                                {t.status === 'COMPLETED' ? <CheckCircle2 size={14} className="text-emerald-500"/> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"/>}
                                <span className={`text-[11px] font-bold ${t.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.title}</span>
                            </div>
                            <button onClick={() => onEditTask(t)} className="p-1.5 hover:bg-slate-100 rounded-md"><Edit3 size={12} className="text-slate-400"/></button>
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
            <tr className={`hover:bg-slate-50/50 transition-colors group ${isExpanded ? 'bg-slate-50/20' : ''}`}>
                <td className="px-8 py-5">
                    <button onClick={onToggle} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm">
                        {isExpanded ? <ChevronUp size={16} className="text-indigo-600"/> : <ChevronDown size={16}/>}
                    </button>
                </td>
                <td className="px-4 py-5">
                    <p className="text-sm font-black text-slate-900 tracking-tight">{act.description}</p>
                    <div className="flex gap-3 mt-1">
                        <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">{act.tasks?.length || 0} Work Packages</span>
                        {act.actualCost > 0 && <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">• Funded</span>}
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
                        <button onClick={onAddTask} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white"><Plus size={14}/></button>
                        <button onClick={onEdit} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-black"><Edit3 size={14}/></button>
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={5} className="px-8 pb-6 bg-slate-50/30">
                        <div className="ml-4 border-l-2 border-slate-200 pl-6 space-y-3 mt-2">
                            {act.tasks?.map((task: any) => (
                                <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        {task.status === 'COMPLETED' ? <CheckCircle2 size={16} className="text-emerald-500"/> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"/>}
                                        <div>
                                            <p className={`text-xs font-black ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{task.assignedTo || 'Unassigned'} • Due: {formatDate(task.dueDate)}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => onEditTask(task)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600"><Edit3 size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
// 'use client';

// import React, { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//     Plus, Edit3, ChevronDown, ChevronUp, 
//     DollarSign, Briefcase, Target, TrendingUp, AlertTriangle, 
//     Activity as ActivityIcon, User, Layers, 
//     ShoppingCart, Package, Calendar, X, FileText,
//     CheckCircle2, Trash2, Search
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// // Component Imports
// import MM_TaskForm from './TaskForm';
// import MM_MaterialForm from './MM_MaterialForm';
// import MM_PurchaseOrderForm from './MM_PurchaseOrder';
// import ConfirmAction from './ConfirmAction';

// interface ProjectDetailViewProps {
//     project: any;
//     onRefresh?: () => void;
//     MM_ActivityForm: React.ComponentType<any>;
//     allStrategies?: any[]; 
// }

// export default function ProjectDetailView({ project, onRefresh, MM_ActivityForm, allStrategies = [] }: ProjectDetailViewProps) {
//     const router = useRouter();
    
//     // Modal States
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
//     const [isPOModalOpen, setIsPOModalOpen] = useState(false);
//     const [isBoQModalOpen, setIsBoQModalOpen] = useState(false);

//     // Data States
//     const [editingRecord, setEditingRecord] = useState<any>(null);
//     const [selectedActivity, setSelectedActivity] = useState<any>(null); 
//     const [expandedActivities, setExpandedActivities] = useState<string[]>([]);
//     const [procurementTab, setProcurementTab] = useState<'materials' | 'pos'>('materials');

//     const toggleExpand = (id: string) => {
//         setExpandedActivities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
//     };

//     const handleSaveSuccess = () => {
//         setIsTaskModalOpen(false);
//         setIsModalOpen(false);
//         setIsPOModalOpen(false);
//         setIsBoQModalOpen(false);
//         setEditingRecord(null);
//         setSelectedActivity(null);
//         toast.success('Ledger Synchronized');
//         router.refresh(); 
//         if (onRefresh) onRefresh(); 
//     };

//     const handleDelete = async (id: string, entity: 'materials' | 'pos') => {
     
//         const endpoint = entity === 'materials' ? `/mm/api/materialrequirements/${id}` : `/mm/api/purchaseorders/${id}`;
//         //console.log('endpoint----->', endpoint)
//         try {
//             const res = await fetch(endpoint, { method: 'DELETE' });
//             if (!res.ok) throw new Error('Delete failed');
            
//             toast.success('Registry Entry Removed');
//             router.refresh();
//             if (onRefresh) onRefresh();
//         } catch (error) {
//             toast.error('Failed to delete. Entry may be linked to active transactions.');
//         }
//     };

//     // Financial calculations for Guideline 1 Monitoring
//     const totalCommitted = project.purchaseOrders?.reduce((acc: number, po: any) => acc + (po.totalValue || 0), 0) || 0;
//     const totalBoQValue = project.materialRequirements?.reduce((acc: number, mat: any) => acc + (mat.quantityRequired * mat.estimatedUnitCost || 0), 0) || 0;
//     const remainingBudget = (project.allocatedBudget || 0) - totalCommitted;
//     const burnRate = project.allocatedBudget > 0 ? ((totalCommitted / project.allocatedBudget) * 100).toFixed(1) : "0";

//     return (
//         <div className="flex flex-col gap-4 md:gap-6 bg-slate-50/50 p-3 md:p-8 min-h-screen pb-24 lg:pb-8">
            
//             {/* 1. STRATEGIC HEADER */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
//                 <div className="lg:col-span-2 bg-white rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border border-slate-200 shadow-sm">
//                     <div className="flex flex-col md:flex-row justify-between items-start gap-4">
//                         <div className="w-full">
//                             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block italic">Project Identity</span>
//                             <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-4">{project.name}</h1>
//                             <div className="flex flex-wrap gap-2">
//                                 <Badge icon={<Briefcase size={12}/>} text={project.responsibleWorkshop?.name || 'Unassigned'} color="slate" />
//                                 <Badge icon={<User size={12}/>} text={`PM: ${project.projectManager || 'Pending'}`} color="emerald" />
//                                 <Badge icon={<Layers size={12}/>} text={project.status} color="indigo" />
//                             </div>
//                         </div>
//                         <div className="flex items-center gap-4 md:block text-right w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
//                              <div className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">{project.progress}%</div>
//                              <div className="flex-1 md:w-28 h-2 bg-slate-100 rounded-full md:mt-2 overflow-hidden">
//                                 <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${project.progress}%` }} />
//                              </div>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
//                     <Target className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 md:w-32 md:h-32" />
//                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 block">Strategic Alignment {project.plan?.year}</span>
//                     <div className="space-y-4 relative z-10">
//                         <div>
//                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Plan Ceiling (Ref: Guideline 1)</p>
//                             <p className="text-xl font-black">${project.plan?.totalBudget?.toLocaleString() || '0'}</p>
//                         </div>
//                         <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
//                             <div>
//                                 <p className="text-[9px] text-slate-400 font-bold uppercase">BoQ Value</p>
//                                 <p className="text-sm font-bold text-indigo-300">${totalBoQValue.toLocaleString()}</p>
//                             </div>
//                             <div>
//                                 <p className="text-[9px] text-slate-400 font-bold uppercase">Commitments</p>
//                                 <p className="text-sm font-bold text-emerald-400">${totalCommitted.toLocaleString()}</p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* 2. KPI GRID */}
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
//                 <StatCard icon={<TrendingUp size={14}/>} label="Procurement Burn" value={`${burnRate}%`} color="indigo" />
//                 <StatCard icon={<DollarSign size={14}/>} label="Uncommitted" value={`$${remainingBudget.toLocaleString()}`} color="emerald" />
//                 <StatCard icon={<ShoppingCart size={14}/>} label="BoQ Items" value={project.materialRequirements?.length || 0} color="slate" />
//                 <StatCard icon={<AlertTriangle size={14}/>} label="Budget Health" value={`$${(project.allocatedBudget - (project.totalActualCost || 0)).toLocaleString()}`} color="amber" />
//             </div>

//             {/* 3. EXECUTION REGISTRY */}
//             <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
//                 <div className="p-5 md:p-8 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
//                     <div className="flex items-center gap-3">
//                         <div className="p-2 bg-slate-900 text-white rounded-xl">
//                             <ActivityIcon size={18} />
//                         </div>
//                         <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight">Execution Registry</h2>
//                     </div>
//                     <button 
//                         onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
//                         className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all text-[10px] md:text-xs font-black uppercase"
//                     >
//                         <Plus size={16} />
//                         <span className="hidden sm:inline">Add Phase</span>
//                     </button>
//                 </div>

//                 <div className="overflow-x-auto">
//                     <table className="w-full text-left min-w-[600px]">
//                         <thead className="bg-slate-50 border-b border-slate-100">
//                             <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                                 <th className="px-8 py-4 w-10"></th>
//                                 <th className="px-4 py-4">Execution Phase</th>
//                                 <th className="px-8 py-4">Timeline</th>
//                                 <th className="px-8 py-4">Actual Cost</th>
//                                 <th className="px-8 py-4 text-right">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-50">
//                             {project.activities?.map((act: any) => (
//                                 <ActivityRow 
//                                     key={act.id} 
//                                     act={act} 
//                                     isExpanded={expandedActivities.includes(act.id)}
//                                     onToggle={() => toggleExpand(act.id)}
//                                     onAddTask={() => { setSelectedActivity(act); setEditingRecord(null); setIsTaskModalOpen(true); }}
//                                     onEdit={() => { setEditingRecord(act); setIsModalOpen(true); }}
//                                     onEditTask={(task: any) => { setEditingRecord(task); setSelectedActivity(act); setIsTaskModalOpen(true); }}
//                                 />
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </section>

//             {/* 4. PROCUREMENT PORTFOLIO */}
//             <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-10">
//                 <div className="p-5 md:p-8 border-b border-slate-100">
//                     <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
//                         <div className="flex items-center gap-3">
//                             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
//                                 <ShoppingCart size={18} />
//                             </div>
//                             <div>
//                                 <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight">Procurement Portfolio</h2>
//                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">ERP Transaction Layer</p>
//                             </div>
//                         </div>

//                         <div className="flex flex-wrap items-center gap-3">
//                             <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
//                                 <button onClick={() => setProcurementTab('materials')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${procurementTab === 'materials' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
//                                     BoQ Registry ({project.materialRequirements?.length || 0})
//                                 </button>
//                                 <button onClick={() => setProcurementTab('pos')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${procurementTab === 'pos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
//                                     Purchase Orders ({project.purchaseOrders?.length || 0})
//                                 </button>
//                             </div>

//                             <div className="flex items-center gap-2">
//                                 <button onClick={() => { setEditingRecord({ projectId: project.id }); setIsBoQModalOpen(true); }} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-[10px] font-black uppercase">
//                                     <Plus size={14} className="text-indigo-600" /> Add BoQ
//                                 </button>
//                                 <button onClick={() => { setEditingRecord({ projectId: project.id }); setIsPOModalOpen(true); }} className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase">
//                                     <Package size={14} /> Issue PO
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="p-5 md:p-8 bg-slate-50/30">
//                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
//                         {procurementTab === 'materials' ? (
//                             project.materialRequirements?.length > 0 ? project.materialRequirements.map((mat: any) => (
//                                 <MaterialCard key={mat.id} mat={mat} onEdit={() => { setEditingRecord(mat); setIsBoQModalOpen(true); }} onDelete={() => handleDelete(mat.id, 'materials')} />
//                             )) : <EmptyState icon={<FileText size={40} />} message="No BoQ entries registered" />
//                         ) : (
//                             project.purchaseOrders?.length > 0 ? project.purchaseOrders.map((po: any) => (
//                                 <POCard key={po.id} po={po} onEdit={() => { setEditingRecord(po); setIsPOModalOpen(true); }} onDelete={() => handleDelete(po.id, 'pos')} />
//                             )) : <EmptyState icon={<Package size={40} />} message="No active purchase orders" />
//                         )}
//                     </div>
//                 </div>
//             </section>

//             {/* 5. MODAL LAYER */}
//             {(isTaskModalOpen || isModalOpen || isPOModalOpen || isBoQModalOpen) && (
//                 <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
//                     <div className="w-full max-w-2xl bg-white rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300">
//                         {isBoQModalOpen && <MM_MaterialForm initialData={editingRecord} projects={[project]} strategies={allStrategies} onClose={() => setIsBoQModalOpen(false)} onSuccess={handleSaveSuccess} />}
//                         {isPOModalOpen && <MM_PurchaseOrderForm initialData={editingRecord} projects={[project]} strategies={allStrategies} onClose={() => setIsPOModalOpen(false)} onSuccess={handleSaveSuccess} />}
//                         {isTaskModalOpen && <MM_TaskForm initialData={editingRecord} activities={project.activities || []} preselectedActivity={selectedActivity} onClose={() => setIsTaskModalOpen(false)} onSuccess={handleSaveSuccess} />}
//                         {isModalOpen && <MM_ActivityForm initialData={editingRecord} projects={[project]} preselectedProject={project} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />}
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// /** HELPER COMPONENTS **/

// function MaterialCard({ mat, onEdit, onDelete }: any) {
//     //{console.log('mat.............',mat)}
//     return (
//         <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-sm group relative overflow-hidden">
//             <div className="flex justify-between items-start mb-3">
//                 <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{mat.material.itemCode || 'BOQ-ITEM'}</span>
//                 <StatusBadge status={mat.status} />
//             </div>
//             <h4 className="text-sm font-black text-slate-800 mb-1">{mat.material.description}</h4>
//             <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-4">
//                 <div><p className="text-[9px] font-black text-slate-400 uppercase">Qty</p><p className="text-xs font-black text-slate-900">{mat.quantityRequired} {mat.material.unitOfMeasure}</p></div>
//                 <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Est. Value</p><p className="text-sm font-black text-slate-900">${(mat.quantityRequired * (mat.estimatedUnitCost || 0)).toLocaleString()}</p></div>
//             </div>
//             {/* Action Overlay */}
//             <div className="absolute inset-0 bg-indigo-600/90 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
//                 <button onClick={onEdit} className="p-3 bg-white text-indigo-600 rounded-xl hover:scale-110 transition-transform"><Edit3 size={20} /></button>
//                  <ConfirmAction 
//                     onConfirm={onDelete} 
//                     itemId={mat.id}
//                     action="Delete" 
//                     heading="Delete Material"
//                     description="Are you sure? This work order will be permanently removed from the activity logs."
//                     showHint={false} 
//                     triggerButton={
//                     <button className="p-3 bg-white text-rose-600 rounded-xl hover:scale-110 transition-transform">
//                         <Trash2 size={20} />
//                     </button>
//                     }
//                 />
                
//             </div>
//         </div>
//     );
// }

// function POCard0({ po, onEdit, onDelete }: any) {
//     return (
//         <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm hover:border-emerald-300 transition-all group relative overflow-hidden">
//             <div className="flex justify-between items-start mb-4">
//                 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Package size={20} /></div>
//                 <StatusBadge status={po.status} />
//             </div>
//             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{po.poNumber}</p>
//             <h4 className="font-black text-slate-900 text-base mb-4">{po.vendorname}</h4>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commitment</span>
//                 <span className="text-base font-black text-indigo-600">${po.totalValue?.toLocaleString()}</span>
//             </div>
//             {/* Action Overlay */}
//             <div className="absolute inset-0 bg-emerald-600/90 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
//                 <button onClick={onEdit} className="p-3 bg-white text-emerald-600 rounded-xl hover:scale-110 transition-transform"><Edit3 size={20} /></button>
//                 <button onClick={onDelete} className="p-3 bg-white text-rose-600 rounded-xl hover:scale-110 transition-transform"><Trash2 size={20} /></button>
//             </div>
//         </div>
//     );
// }
// function POCard({ po, onEdit, onDelete }: any) {
//     return (
//         <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm hover:border-emerald-300 transition-all group relative overflow-hidden flex flex-col h-full">
//             <div className="flex justify-between items-start mb-4">
//                 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
//                     <Package size={20} />
//                 </div>
//                 <StatusBadge status={po.status} />
//             </div>

//             <div className="flex-1">
//                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
//                     {po.poNumber}
//                 </p>
//                 <h4 className="font-black text-slate-900 text-base mb-3 italic">
//                     {po.vendorname || "Unknown Vendor"}
//                 </h4>

//                 {/* LINE ITEMS LISTING */}
//                 <div className="space-y-2 mb-6">
//                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter border-b border-slate-50 pb-1">
//                         Materials Registry
//                     </p>
//                     {po.lineItems && po.lineItems.length > 0 ? (
//                         <div className="max-h-32 overflow-y-auto pr-1 custom-scrollbar">
//                             {po.lineItems.map((item: any, idx: number) => (
//                                 <div key={item.id || idx} className="flex justify-between items-start py-1.5 border-b border-slate-50 last:border-0">
//                                     <div className="pr-2">
//                                         <p className="text-[11px] font-bold text-slate-700 leading-tight">
//                                             {item.description}
//                                         </p>
//                                         <p className="text-[9px] font-mono text-slate-400">
//                                             {item.itemCode} • Qty: {item.quantityOrdered}
//                                         </p>
//                                     </div>
//                                     <p className="text-[10px] font-black text-slate-900 whitespace-nowrap">
//                                         ${item.totalPrice?.toLocaleString()}
//                                     </p>
//                                 </div>
//                             ))}
//                         </div>
//                     ) : (
//                         <p className="text-[10px] text-slate-400 italic">No items listed</p>
//                     )}
//                 </div>
//             </div>

//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                     Commitment
//                 </span>
//                 <span className="text-base font-black text-indigo-600">
//                     ${po.totalValue?.toLocaleString()}
//                 </span>
//             </div>

//             {/* Action Overlay */}
//             <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
//                 <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Manage Procurement</p>
//                 <div className="flex gap-3">
//                     <button 
//                         onClick={onEdit} 
//                         className="p-3 bg-white text-slate-900 rounded-xl hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-110 active:scale-95 shadow-xl"
//                     >
//                         <Edit3 size={20} />
//                     </button>
//                     <button 
//                         onClick={onDelete} 
//                         className="p-3 bg-white text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all transform hover:scale-110 active:scale-95 shadow-xl"
//                     >
//                         <Trash2 size={20} />
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }
// const formatDate = (dateValue: any) => {
//     const date = new Date(dateValue);
//     if (!dateValue || isNaN(date.getTime())) {
//         return <span className="text-rose-500 italic">Not Scheduled</span>;
//     }
//     return date.toLocaleDateString('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//     });
// };

// function ActivityRow({ act, isExpanded, onToggle, onAddTask, onEdit, onEditTask }: any) {
//     return (
//         <>
//             <tr className={`hover:bg-slate-50/50 transition-colors group ${isExpanded ? 'bg-slate-50/20' : ''}`}>
//                 <td className="px-8 py-5">
//                     <button onClick={onToggle} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm">
//                         {isExpanded ? <ChevronUp size={16} className="text-indigo-600"/> : <ChevronDown size={16}/>}
//                     </button>
//                 </td>
//                 <td className="px-4 py-5">
//                     <p className="text-sm font-black text-slate-900 tracking-tight">{act.description}</p>
//                     <div className="flex gap-3 mt-1">
//                         <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">{act.tasks?.length || 0} Work Packages</span>
//                         {act.actualCost > 0 && <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">• Funded</span>}
//                     </div>
//                 </td>
//                 <td className="px-8 py-5">
//                     <div className="flex flex-col">
//                         {/* <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
//                             <Calendar size={12} className="text-slate-400"/> 
//                            {act.scheduledStart && !isNaN(new Date(act.scheduledStart).getTime()) 
//                                 ? new Date(act.scheduledStart).toLocaleDateString('en-GB', { 
//                                     day: '2-digit', 
//                                     month: 'short',
//                                     year: 'numeric' // Added year for clarity since it's late 2025
//                                 }) 
//                                 : <span className="text-rose-500 italic">Not Scheduled</span>
//                             }
//                             {"-->"}
//                             {act.scheduledEnd && !isNaN(new Date(act.scheduledEnd).getTime()) 
//                                 ? new Date(act.scheduledEnd).toLocaleDateString('en-GB', { 
//                                     day: '2-digit', 
//                                     month: 'short',
//                                     year: 'numeric' // Added year for clarity since it's late 2025
//                                 }) 
//                                 : <span className="text-rose-500 italic">Not Scheduled</span>
//                             }
//                         </div> */}
//                         <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
//                             <Calendar size={12} className="text-slate-400" />
//                             <span>{formatDate(act.scheduledStart)}</span>
//                             <span className="text-slate-300 mx-1">→</span>
//                             <span>{formatDate(act.scheduledEnd)}</span>
//                         </div>
//                     </div>
//                 </td>
//                 <td className="px-8 py-5">
//                     <span className="text-sm font-black text-slate-900">${(act.actualCost || 0).toLocaleString()}</span>
//                 </td>
//                 <td className="px-8 py-5 text-right">
//                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
//                         <button onClick={onAddTask} title="Add Task" className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"><Plus size={14}/></button>
//                         <button onClick={onEdit} title="Edit Phase" className="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-colors"><Edit3 size={14}/></button>
//                     </div>
//                 </td>
//             </tr>

//             {/* EXPANDED TASK DETAILS */}
//             {isExpanded && (
//                 <tr>
//                     <td colSpan={5} className="px-8 pb-6 bg-slate-50/30">
//                         <div className="ml-4 border-l-2 border-slate-200 pl-6 space-y-3 mt-2">
//                             {act.tasks && act.tasks.length > 0 ? act.tasks.map((task: any) => (
//                                 <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group/task hover:border-indigo-200 transition-all">
//                                     <div className="flex items-start gap-3">
//                                         <div className="mt-1">
//                                             {task.status === 'COMPLETED' ? 
//                                                 <div className="bg-emerald-100 p-1 rounded-full"><CheckCircle2 size={14} className="text-emerald-600" /></div> : 
//                                                 <div className="w-5 h-5 rounded-full border-2 border-slate-200 mt-0.5 flex items-center justify-center group-hover/task:border-indigo-400 transition-colors">
//                                                     <div className="w-2 h-2 rounded-full bg-transparent group-hover/task:bg-indigo-400" />
//                                                 </div>
//                                             }
//                                         </div>
//                                         <div>
//                                             <p className={`text-xs font-black tracking-tight ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
//                                                 {task.title}
//                                             </p>
//                                             <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
//                                                 <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
//                                                     <User size={10} /> {task.assignedTo || 'Unassigned'}
//                                                 </div>
                                               
//                                                 <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
//                                                     <Calendar size={10} /> 
//                                                     Due: {task.dueDate && !isNaN(new Date(task.dueDate).getTime()) 
//                                                         ? new Date(task.dueDate).toLocaleDateString() 
//                                                         : 'Pending'}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     <div className="flex items-center gap-6">
//                                         {/* Task Progress Internal Component */}
//                                         <div className="hidden sm:block w-24">
//                                             <div className="flex justify-between mb-1">
//                                                 <span className="text-[8px] font-black text-slate-400 uppercase">Progress</span>
//                                                 <span className="text-[8px] font-black text-slate-600">{task.progress || 0}%</span>
//                                             </div>
//                                             <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
//                                                 <div 
//                                                     className={`h-full transition-all duration-500 ${task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
//                                                     style={{ width: `${task.progress || 0}%` }} 
//                                                 />
//                                             </div>
//                                         </div>

//                                         <button 
//                                             onClick={() => onEditTask(task)} 
//                                             className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all opacity-0 group-hover/task:opacity-100"
//                                         >
//                                             Modify
//                                         </button>
//                                     </div>
//                                 </div>
//                             )) : (
//                                 <div className="py-4 text-center border border-dashed border-slate-200 rounded-2xl bg-white/50">
//                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active tasks in this phase</p>
//                                 </div>
//                             )}
//                         </div>
//                     </td>
//                 </tr>
//             )}
//         </>
//     );
// }

// function StatCard({ icon, label, value, color }: any) {
//     const colors: any = {
//         indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
//         emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
//         slate: "bg-slate-50 text-slate-600 border-slate-100",
//         amber: "bg-amber-50 text-amber-600 border-amber-100"
//     };
//     return (
//         <div className={`p-4 md:p-6 rounded-[1.5rem] border ${colors[color]} bg-white shadow-sm`}>
//             <div className="flex items-center gap-2 mb-2">{icon}<span className="text-[10px] font-black uppercase tracking-tight opacity-70">{label}</span></div>
//             <div className="text-lg md:text-xl font-black">{value}</div>
//         </div>
//     );
// }

// function Badge({ icon, text, color }: any) {
//     const colors: any = { indigo: "bg-indigo-50 text-indigo-700", emerald: "bg-emerald-50 text-emerald-700", slate: "bg-slate-100 text-slate-700" };
//     return <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${colors[color]}`}>{icon} {text}</div>;
// }

// function StatusBadge({ status }: { status: string }) {
//     return <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{status || 'Draft'}</span>;
// }

// function EmptyState({ icon, message }: any) {
//     return <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2rem]">{icon}<p className="mt-4 text-[10px] font-black uppercase tracking-widest">{message}</p></div>;
// }
