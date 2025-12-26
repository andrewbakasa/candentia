'use client';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    DollarSign, Briefcase, Target, TrendingUp, 
    AlertTriangle, Activity as ActivityIcon, User, Layers, 
    ShoppingCart
   
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmAction from './ConfirmAction';
import LatencyRegistry from './ProjectDetails/LetencyRegistry';
import ExecutionRegistry from './ProjectDetails/ExecutionRegistry';
import ProcurementPortfolio from './ProjectDetails/ProcurementPortifolio';
import ProjectModalPortal from './ProjectDetails/ProjectModalPortal';

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
    
    const [activeModal, setActiveModal] = useState<'activity' | 'task' | 'po' | 'boq' | 'delay' | 'other' | null>(null);  
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [selectedActivity, setSelectedActivity] = useState<any>(null); 
    const [delaySearch, setDelaySearch] = useState("");    
    const closeModal = () => { 
        setActiveModal(null); 
        setEditingRecord(null); 
        setSelectedActivity(null); 
    };
   
    const handleSync = () => {
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
    const handleDeleteDelay = async (id: string|number) => {
       // if (!window.confirm("Are you sure? This will reverse the financial impact on the Project Ledger.")) return;

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


// 2. HANDLER FUNCTIONS
  const handleAddBoQ = (projectId: string) => {
    setEditingRecord({ projectId }); // Set context for the new record
    setActiveModal('boq');
  };

  const handleIssuePO = (projectId: string) => {
    setEditingRecord({ projectId });
    setActiveModal('po');
  };

  const handleEdit = (record: any, type: 'boq' | 'po') => {
    setEditingRecord(record);
    setActiveModal(type);
  };
    

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
            

            {/* Calling the Latency Registry Component */}
                <LatencyRegistry 
                    filteredDelays={filteredDelays}
                    totalFilteredLeakage={totalFilteredLeakage}
                    delaySearch={delaySearch}
                    setDelaySearch={setDelaySearch}
                    setEditingRecord={setEditingRecord}
                    setActiveModal={setActiveModal}
                    handleDeleteDelay={handleDeleteDelay}
                    ConfirmAction={ConfirmAction} // Passing the shared component as a prop
                />

                <ExecutionRegistry 
                    activities={project.activities}
                    setEditingRecord={setEditingRecord}
                    setActiveModal={setActiveModal}
                    setSelectedActivity={setSelectedActivity}
                    formatDate={(date) => new Date(date).toLocaleDateString()}
                />

                {/* 3. COMPONENT CALL */}
                <ProcurementPortfolio 
                    project={project}
                    onAddBoQ={handleAddBoQ}
                    onIssuePO={handleIssuePO}
                    onEditRecord={handleEdit}
                    onDeleteRecord={handleDelete}
                />


                {/* SECTION 4: MODAL ORCHESTRATOR */}
            <ProjectModalPortal 
                isOpen={!!activeModal}
                type={activeModal}
                editingRecord={editingRecord}
                project={project}
                allStrategies={allStrategies}
                selectedActivity={selectedActivity}
                onClose={closeModal}
                onSuccess={handleSync}
                forms={{ MM_ActivityForm }} // Injecting the prop-passed form
            />

           
        </div>
    );
}