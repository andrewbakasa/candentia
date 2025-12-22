'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, Edit3, Clock, ChevronDown, ChevronUp, 
    DollarSign, Briefcase, Target, TrendingUp, AlertTriangle, 
    ShieldCheck, Activity as ActivityIcon, User, Layers, 
    ShoppingCart, Package, Calendar, MoreVertical, ExternalLink,
    CheckCircle2, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import MM_TaskForm from './TaskForm';

interface ProjectDetailViewProps {
    project: any;
    onRefresh?: () => void;
    MM_ActivityForm: React.ComponentType<any>;
}

export default function ProjectDetailView({ project, onRefresh, MM_ActivityForm }: ProjectDetailViewProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
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
        setEditingRecord(null);
        setSelectedActivity(null);
        toast.success('Ledger Synchronized');
        router.refresh(); 
        if (onRefresh) onRefresh(); 
    };

    // Guideline 1: Financial Performance Metrics
    const totalCommitted = project.purchaseOrders?.reduce((acc: number, po: any) => acc + (po.totalValue || 0), 0) || 0;
    const totalBoQValue = project.materialRequirements?.reduce((acc: number, mat: any) => acc + (mat.quantityRequired * mat.estimatedUnitCost || 0), 0) || 0;
    const budgetVariance = (project.plan?.totalBudget || 0) - (project.allocatedBudget || 0);

    return (
        <div className="flex flex-col gap-4 md:gap-6 bg-slate-50/50 p-3 md:p-8 min-h-screen">
            
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
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Plan Ceiling (Reference 2025-01)</p>
                            <p className="text-xl font-black">${project.plan?.totalBudget?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                            <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">BoQ Total</p>
                                <p className="text-sm font-bold text-indigo-300">${totalBoQValue.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">PO Commitments</p>
                                <p className="text-sm font-bold text-emerald-400">${totalCommitted.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. KPI GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <StatCard icon={<TrendingUp size={14}/>} label="Procurement Burn" value={`${((totalCommitted / project.allocatedBudget) * 100).toFixed(1)}%`} color="indigo" />
                <StatCard icon={<DollarSign size={14}/>} label="Uncommitted" value={`$${(project.allocatedBudget - totalCommitted).toLocaleString()}`} color="emerald" />
                <StatCard icon={<ShoppingCart size={14}/>} label="BoQ Items" value={project.materialRequirements?.length || 0} color="slate" />
                <StatCard icon={<AlertTriangle size={14}/>} label="Remaining Budget" value={`$${(project.allocatedBudget - project.totalActualCost).toLocaleString()}`} color="amber" />
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
                        <span className="hidden sm:inline">Initialize Phase</span>
                    </button>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-8 py-4 w-10"></th>
                                <th className="px-4 py-4">Execution Phase</th>
                                <th className="px-8 py-4">Timeline</th>
                                <th className="px-8 py-4">Total Actual Cost</th>
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

            {/* 4. NEW: PROCUREMENT PORTFOLIO WITH INTEGRATED BoQ & PO TRACKING */}
            <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-10">
                <div className="p-5 md:p-8 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <ShoppingCart size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight">Procurement Portfolio</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Material & Service Commitment Gateway</p>
                            </div>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setProcurementTab('materials')}
                                className={`px-6 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${procurementTab === 'materials' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                BoQ Registry ({project.materialRequirements?.length || 0})
                            </button>
                            <button 
                                onClick={() => setProcurementTab('pos')}
                                className={`px-6 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${procurementTab === 'pos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Financial Commitments ({project.purchaseOrders?.length || 0})
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-5 md:p-8 bg-slate-50/30">
                    {procurementTab === 'materials' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {project.materialRequirements?.length > 0 ? project.materialRequirements.map((mat: any) => (
                                <MaterialCard key={mat.id} mat={mat} />
                            )) : (
                                <EmptyState icon={<FileText size={40} />} message="No BoQ entries registered" />
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {project.purchaseOrders?.length > 0 ? project.purchaseOrders.map((po: any) => (
                                <POCard key={po.id} po={po} />
                            )) : (
                                <EmptyState icon={<Package size={40} />} message="No active purchase orders" />
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* 5. RESPONSIVE MODAL WRAPPER */}
            {(isTaskModalOpen || isModalOpen) && (
                <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="overflow-y-auto p-2">
                            {isTaskModalOpen ? (
                                <MM_TaskForm 
                                    initialData={editingRecord}
                                    activities={project.activities || []} 
                                    preselectedActivity={selectedActivity}
                                    onClose={() => { setIsTaskModalOpen(false); setSelectedActivity(null); }}
                                    onSuccess={handleSaveSuccess}
                                />
                            ) : (
                                <MM_ActivityForm 
                                    initialData={editingRecord} 
                                    projects={[project]} 
                                    preselectedProject={project} 
                                    onClose={() => setIsModalOpen(false)} 
                                    onSuccess={handleSaveSuccess} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUB-COMPONENTS & HELPERS ---

function MaterialCard({ mat }: { mat: any }) {
    return (
        <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-sm group">
            <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{mat.itemCode}</span>
                <StatusBadge status={mat.status} />
            </div>
            <h4 className="text-sm font-black text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{mat.description}</h4>
            <div className="flex items-center gap-2 mb-4">
                <ActivityIcon size={12} className="text-slate-300" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">{mat.activityLabel || 'General Requirement'}</p>
            </div>
            <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-auto">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Quantity</p>
                    <p className="text-xs font-black text-slate-900">{mat.quantityRequired} <span className="text-[10px] text-slate-400">units</span></p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Est. Value</p>
                    <p className="text-sm font-black text-slate-900">${(mat.quantityRequired * mat.estimatedUnitCost).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}

function POCard({ po }: { po: any }) {
    return (
        <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm hover:border-emerald-300 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Package size={20} />
                </div>
                <StatusBadge status={po.status} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ERP REF: {po.poNumber}</p>
            <h4 className="font-black text-slate-900 text-base mb-4">{po.vendorName || 'General Procurement'}</h4>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase">Financial Impact</span>
                <span className="text-base font-black text-indigo-600">${po.totalValue?.toLocaleString()}</span>
            </div>
        </div>
    );
}

function EmptyState({ icon, message }: { icon: any, message: string }) {
    return (
        <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-300 gap-4">
            {icon}
            <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
        </div>
    );
}

// ... (Previous Badge, StatCard, StatusBadge, MobileActivityCard, and ActivityRow components remain the same or slightly adjusted for design)
function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        DRAFT: "bg-slate-100 text-slate-500",
        PO_ISSUED: "bg-indigo-100 text-indigo-700 border border-indigo-200",
        RECEIVED: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        AWAITING_FUNDING: "bg-amber-100 text-amber-700 border border-amber-200",
        COMPLETED: "bg-slate-900 text-white"
    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${styles[status] || 'bg-slate-100'}`}>
            {status?.replace('_', ' ')}
        </span>
    );
}

function Badge({ icon, text, color }: { icon: any, text: string, color: string }) {
    const themes: any = {
        indigo: "bg-indigo-50 text-indigo-700",
        emerald: "bg-emerald-50 text-emerald-700",
        slate: "bg-slate-100 text-slate-600"
    };
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${themes[color]}`}>
            {icon} {text}
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
    const colors: any = {
        indigo: "bg-white text-indigo-600 border-slate-200",
        emerald: "bg-white text-emerald-600 border-slate-200",
        amber: "bg-white text-amber-600 border-slate-200",
        slate: "bg-white text-slate-900 border-slate-200"
    };
    return (
        <div className={`p-5 rounded-2xl border shadow-sm ${colors[color]} flex flex-col gap-1 transition-transform hover:-translate-y-1`}>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {icon} {label}
            </div>
            <div className="text-xl font-black">{value}</div>
        </div>
    );
}

function ActivityRow({ act, isExpanded, onToggle, onAddTask, onEdit, onEditTask }: any) {
    return (
        <>
            <tr className={`hover:bg-slate-50/80 transition-colors group ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                <td className="pl-8 py-5">
                    <button onClick={onToggle} className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all">
                        {isExpanded ? <ChevronUp size={18} className="text-indigo-600"/> : <ChevronDown size={18} className="text-slate-400"/>}
                    </button>
                </td>
                <td className="px-4 py-5">
                    <p className="font-black text-slate-800 text-sm">{act.description}</p>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{act.stage}</span>
                </td>
                <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                        <Calendar size={14} className="text-slate-300" />
                        {act.scheduledStart ? new Date(act.scheduledStart).toLocaleDateString() : 'Unscheduled'}
                    </div>
                </td>
                <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-900">${((act.actualMaterialCost || 0) + (act.actualLaborCost || 0)).toLocaleString()}</p>
                </td>
                <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button onClick={onAddTask} className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                            Add Task
                        </button>
                        <button onClick={onEdit} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit3 size={18}/></button>
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={5} className="bg-slate-50/50 px-12 py-8 border-b border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {act.tasks?.map((task: any) => (
                                <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 flex justify-between items-start shadow-sm hover:shadow-md transition-shadow">
                                    <div className="space-y-3">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{task.title}</p>
                                        <div className="flex items-center gap-3">
                                            <StatusBadge status={task.status} />
                                            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase"><User size={12}/> {task.assignedTo}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => onEditTask(task)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><Edit3 size={14}/></button>
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
//     Plus, Edit3, Clock, ChevronDown, ChevronUp, 
//     DollarSign, Briefcase, Target, TrendingUp, AlertTriangle, 
//     ShieldCheck, Activity as ActivityIcon, User, Layers, 
//     ShoppingCart, Package, Calendar, MoreVertical
// } from 'lucide-react';
// import toast from 'react-hot-toast';
// import MM_TaskForm from './TaskForm';

// interface ProjectDetailViewProps {
//     project: any;
//     onRefresh?: () => void;
//     MM_ActivityForm: React.ComponentType<any>;
// }

// export default function ProjectDetailView({ project, onRefresh, MM_ActivityForm }: ProjectDetailViewProps) {
//     const router = useRouter();
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
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
//         setEditingRecord(null);
//         setSelectedActivity(null);
//         toast.success('System Synchronized');
//         router.refresh(); 
//         if (onRefresh) onRefresh(); 
//     };

//     const budgetVariance = (project.plan?.totalBudget || 0) - (project.allocatedBudget || 0);
//     const costEfficiency = project.allocatedBudget > 0 
//         ? ((project.totalActualCost / project.allocatedBudget) * 100).toFixed(1) 
//         : 0;

//     return (
//         <div className="flex flex-col gap-4 md:gap-6 bg-slate-50/50 p-3 md:p-8 min-h-screen">
            
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
//                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Plan Cap</p>
//                             <p className="text-xl font-black">${project.plan?.totalBudget?.toLocaleString() || '0'}</p>
//                         </div>
//                         <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
//                             <div>
//                                 <p className="text-[9px] text-slate-400 font-bold uppercase">Allocated</p>
//                                 <p className="text-sm font-bold text-indigo-300">${project.allocatedBudget?.toLocaleString()}</p>
//                             </div>
//                             <div>
//                                 <p className="text-[9px] text-slate-400 font-bold uppercase">Burn</p>
//                                 <p className="text-sm font-bold text-emerald-400">${project.totalActualCost?.toLocaleString()}</p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* 2. KPI GRID */}
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
//                 <StatCard icon={<TrendingUp size={14}/>} label="Efficiency" value={`${costEfficiency}%`} color="indigo" />
//                 <StatCard icon={<DollarSign size={14}/>} label="Remaining" value={`$${(project.allocatedBudget - project.totalActualCost).toLocaleString()}`} color="emerald" />
//                 <StatCard icon={<ShieldCheck size={14}/>} label="Activities" value={project.activities?.length || 0} color="slate" />
//                 <StatCard icon={<AlertTriangle size={14}/>} label="Budget Gap" value={`$${budgetVariance.toLocaleString()}`} color="amber" />
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
//                         <span className="hidden sm:inline">Initialize</span>
//                     </button>
//                 </div>

//                 {/* MOBILE LIST */}
//                 <div className="md:hidden divide-y divide-slate-100">
//                     {project.activities?.map((act: any) => (
//                         <MobileActivityCard 
//                             key={act.id} 
//                             act={act} 
//                             isExpanded={expandedActivities.includes(act.id)}
//                             onToggle={() => toggleExpand(act.id)}
//                             onAddTask={() => { setSelectedActivity(act); setEditingRecord(null); setIsTaskModalOpen(true); }}
//                             onEdit={() => { setEditingRecord(act); setIsModalOpen(true); }}
//                         />
//                     ))}
//                 </div>

//                 {/* DESKTOP TABLE */}
//                 <div className="hidden md:block overflow-x-auto">
//                     <table className="w-full text-left">
//                         <thead className="bg-slate-50 border-b border-slate-100">
//                             <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                                 <th className="px-8 py-4 w-10"></th>
//                                 <th className="px-4 py-4">Execution Phase</th>
//                                 <th className="px-8 py-4">Timeline</th>
//                                 <th className="px-8 py-4">Total Actual Cost</th>
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
//                     <div className="flex items-center gap-3 mb-6">
//                         <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
//                             <ShoppingCart size={18} />
//                         </div>
//                         <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight">Procurement Portfolio</h2>
//                     </div>
//                     <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-md">
//                         <button 
//                             onClick={() => setProcurementTab('materials')}
//                             className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${procurementTab === 'materials' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
//                         >
//                             BoQ Registry
//                         </button>
//                         <button 
//                             onClick={() => setProcurementTab('pos')}
//                             className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${procurementTab === 'pos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
//                         >
//                             Financial Commitments
//                         </button>
//                     </div>
//                 </div>

//                 <div className="p-5 md:p-8">
//                     {procurementTab === 'materials' ? (
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                             {project.materialRequirements?.map((mat: any) => (
//                                 <div key={mat.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-indigo-200 transition-all">
//                                     <div className="flex justify-between items-start mb-3">
//                                         <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{mat.itemCode}</span>
//                                         <StatusBadge status={mat.status} />
//                                     </div>
//                                     <h4 className="text-sm font-black text-slate-800 mb-1">{mat.description}</h4>
//                                     <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">Stage: {mat.activityLabel || 'General'}</p>
//                                     <div className="flex justify-between items-center border-t border-slate-100 pt-3">
//                                         <div className="text-[10px] font-black text-slate-400 uppercase">Qty: <span className="text-slate-900">{mat.quantityRequired}</span></div>
//                                         <div className="text-sm font-black text-slate-900">${mat.estimatedUnitCost?.toLocaleString()}</div>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     ) : (
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                             {project.purchaseOrders?.map((po: any) => (
//                                 <div key={po.id} className="border-2 border-slate-50 rounded-2xl p-6 bg-white shadow-sm hover:border-indigo-100 transition-all">
//                                     <div className="flex justify-between items-start mb-4">
//                                         <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Package size={20} /></div>
//                                         <StatusBadge status={po.status} />
//                                     </div>
//                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PO REFERENCE</p>
//                                     <h4 className="font-black text-slate-900 text-base mb-4">{po.poNumber}</h4>
//                                     <div className="flex justify-between items-center pt-4 border-t border-slate-50">
//                                         <span className="text-[10px] font-black text-slate-400 uppercase">Total Commitment</span>
//                                         <span className="text-base font-black text-indigo-600">${po.totalValue?.toLocaleString()}</span>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>
//             </section>

//             {/* 5. RESPONSIVE MODAL WRAPPER */}
//             {(isTaskModalOpen || isModalOpen) && (
//                 <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
//                     <div className="w-full max-w-2xl bg-white rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col">
//                         <div className="overflow-y-auto p-2">
//                             {isTaskModalOpen ? (
//                                 <MM_TaskForm 
//                                     initialData={editingRecord}
//                                     activities={project.activities || []} 
//                                     preselectedActivity={selectedActivity}
//                                     onClose={() => { setIsTaskModalOpen(false); setSelectedActivity(null); }}
//                                     onSuccess={handleSaveSuccess}
//                                 />
//                             ) : (
//                                 <MM_ActivityForm 
//                                     initialData={editingRecord} 
//                                     projects={[project]} 
//                                     preselectedProject={project} 
//                                     onClose={() => setIsModalOpen(false)} 
//                                     onSuccess={handleSaveSuccess} 
//                                 />
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// // --- SUB-COMPONENTS & HELPERS ---

// function Badge({ icon, text, color }: { icon: any, text: string, color: string }) {
//     const themes: any = {
//         indigo: "bg-indigo-50 text-indigo-700",
//         emerald: "bg-emerald-50 text-emerald-700",
//         slate: "bg-slate-100 text-slate-600"
//     };
//     return (
//         <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${themes[color]}`}>
//             {icon} {text}
//         </div>
//     );
// }

// function StatCard({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
//     const colors: any = {
//         indigo: "bg-white text-indigo-600 border-slate-200",
//         emerald: "bg-white text-emerald-600 border-slate-200",
//         amber: "bg-white text-amber-600 border-slate-200",
//         slate: "bg-white text-slate-900 border-slate-200"
//     };
//     return (
//         <div className={`p-5 rounded-2xl border shadow-sm ${colors[color]} flex flex-col gap-1 transition-transform hover:-translate-y-1`}>
//             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
//                 {icon} {label}
//             </div>
//             <div className="text-xl font-black">{value}</div>
//         </div>
//     );
// }

// function StatusBadge({ status }: { status: string }) {
//     const styles: any = {
//         DRAFT: "bg-slate-100 text-slate-500",
//         PO_ISSUED: "bg-indigo-100 text-indigo-700",
//         RECEIVED: "bg-emerald-100 text-emerald-700",
//         AWAITING_FUNDING: "bg-amber-100 text-amber-700",
//         FUNDED: "bg-purple-100 text-purple-700",
//         COMPLETED: "bg-blue-600 text-white"
//     };
//     return (
//         <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${styles[status] || 'bg-slate-100'}`}>
//             {status?.replace('_', ' ')}
//         </span>
//     );
// }

// function MobileActivityCard({ act, isExpanded, onToggle, onAddTask, onEdit }: any) {
//     return (
//         <div className="p-5 flex flex-col gap-4">
//             <div className="flex justify-between items-start">
//                 <div>
//                     <h4 className="font-black text-slate-900 text-sm leading-tight">{act.description}</h4>
//                     <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{act.stage}</span>
//                 </div>
//                 <button onClick={onToggle} className="p-2 bg-slate-50 rounded-xl">
//                     {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
//                 </button>
//             </div>
//             <div className="flex justify-between items-end bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
//                 <div className="space-y-1">
//                     <p className="text-[10px] font-bold text-slate-400 uppercase">Actual Spend</p>
//                     <p className="text-sm font-black text-slate-900">${((act.actualMaterialCost || 0) + (act.actualLaborCost || 0)).toLocaleString()}</p>
//                 </div>
//                 <div className="flex gap-2">
//                     <button onClick={onAddTask} className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md"><Plus size={16}/></button>
//                     <button onClick={onEdit} className="p-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl shadow-sm"><Edit3 size={16}/></button>
//                 </div>
//             </div>
//             {isExpanded && act.tasks?.length > 0 && (
//                 <div className="space-y-2 mt-2 pl-4 border-l-2 border-indigo-500">
//                     {act.tasks.map((t: any) => (
//                         <div key={t.id} className="bg-white border border-slate-100 p-3 rounded-xl flex justify-between items-center shadow-sm">
//                             <span className="text-xs font-bold text-slate-700">{t.title}</span>
//                             <StatusBadge status={t.status} />
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// }

// function ActivityRow({ act, isExpanded, onToggle, onAddTask, onEdit, onEditTask }: any) {
//     return (
//         <>
//             <tr className={`hover:bg-slate-50/80 transition-colors group ${isExpanded ? 'bg-slate-50/50' : ''}`}>
//                 <td className="pl-8 py-5">
//                     <button onClick={onToggle} className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all">
//                         {isExpanded ? <ChevronUp size={18} className="text-indigo-600"/> : <ChevronDown size={18} className="text-slate-400"/>}
//                     </button>
//                 </td>
//                 <td className="px-4 py-5">
//                     <p className="font-black text-slate-800 text-sm">{act.description}</p>
//                     <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{act.stage}</span>
//                 </td>
//                 <td className="px-8 py-5">
//                     <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
//                         <Calendar size={14} className="text-slate-300" />
//                         {act.scheduledStart ? new Date(act.scheduledStart).toLocaleDateString() : 'Unscheduled'}
//                     </div>
//                 </td>
//                 <td className="px-8 py-5">
//                     <p className="text-sm font-black text-slate-900">${((act.actualMaterialCost || 0) + (act.actualLaborCost || 0)).toLocaleString()}</p>
//                 </td>
//                 <td className="px-8 py-5 text-right">
//                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
//                         <button onClick={onAddTask} className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
//                             Add Task
//                         </button>
//                         <button onClick={onEdit} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit3 size={18}/></button>
//                     </div>
//                 </td>
//             </tr>
//             {isExpanded && (
//                 <tr>
//                     <td colSpan={5} className="bg-slate-50/50 px-12 py-8 border-b border-slate-200">
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                             {act.tasks?.map((task: any) => (
//                                 <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 flex justify-between items-start shadow-sm hover:shadow-md transition-shadow">
//                                     <div className="space-y-3">
//                                         <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{task.title}</p>
//                                         <div className="flex items-center gap-3">
//                                             <StatusBadge status={task.status} />
//                                             <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase"><User size={12}/> {task.assignedTo}</p>
//                                         </div>
//                                     </div>
//                                     <button onClick={() => onEditTask(task)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><Edit3 size={14}/></button>
//                                 </div>
//                             ))}
//                         </div>
//                     </td>
//                 </tr>
//             )}
//         </>
//     );
// }