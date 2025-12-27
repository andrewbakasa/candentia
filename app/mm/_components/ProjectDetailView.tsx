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
import { SafeUser } from '@/app/types';

interface ProjectDetailViewProps {
    project: any;
     currentUser:SafeUser|null;
    onRefresh?: () => void;
    MM_ActivityForm: React.ComponentType<any>;
    allStrategies?: any[]; 
}


export default function ProjectDetailView({ project, onRefresh, MM_ActivityForm, currentUser, allStrategies = [] }: ProjectDetailViewProps) {
    const router = useRouter();
    const isAllowedDelete = (currentUser?.isAdmin)// || currentUser?.roles?.some((r: string) => ['admin', 'executive'].includes(r.toLowerCase()));

    const isAllowedEdit = (currentUser?.isAdmin) || currentUser?.roles?.some((r: string) => ['admin', 'engineer'].includes(r.toLowerCase()));

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

    // --- NEW: DELETE HANDLERS FOR EXECUTION REGISTRY ---

    /**
     * Delete an Execution Phase (Activity)
     */
    const handleDeleteActivity = async (id: string | number) => {
        try {
            const res = await fetch(`/mm/api/activities/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete phase');
            
            toast.success('Execution Phase Removed');
            handleSync();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete phase. Check for linked tasks.');
        }
    };

    /**
     * Delete a Work Package (Task) within a specific Phase
     */
    const handleDeleteTask = async (activityId: string | number, taskId: string | number) => {
        try {
            const res = await fetch(`/mm/api/tasks/${taskId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete work package');
            
            toast.success('Work Package Removed');
            handleSync();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete task.');
        }
    };

    // --- EXISTING HANDLERS ---

    const handleDelete = async (id: string, entity: 'materials' | 'pos') => {
        const endpoint = entity === 'materials' ? `/mm/api/materialrequirements/${id}` : `/mm/api/purchaseorders/${id}`;
        try {
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            toast.success('Registry Entry Removed');
            handleSync();
        } catch (error) {
            toast.error('Failed to delete. Entry may be linked to active transactions.');
        }
    };

    const handleDeleteDelay = async (id: string|number) => {
        try {
            const res = await fetch(`/mm/api/delays/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Ledger updated: Delay reversed");
                handleSync();
            } else {
                const error = await res.json();
                throw new Error(error.message || "Deletion failed");
            }
        } catch (err: any) {
            toast.error(err.message);
        }
    };

  

    const filteredDelays = project.allProcessDelays?.filter((delay: any) => {
        const term = delaySearch.toLowerCase();
        return (
            delay.type?.toLowerCase().includes(term) ||
            delay.activityDescription?.toLowerCase().includes(term) ||
            delay.description?.toLowerCase().includes(term)
        );
    }) || [];

    const totalFilteredLeakage = useMemo(() => {
        return filteredDelays.reduce((sum: number, delay: any) => sum + (delay.costImpact || 0), 0);
    }, [filteredDelays]);

    const handleAddBoQ = (projectId: string) => {
        setEditingRecord({ projectId });
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
            
            {/* STRATEGIC HEADER & KPI GRID (Omitted for brevity, keep your original) */}

            {/* LATENCY REGISTRY */}
            <LatencyRegistry 
                filteredDelays={filteredDelays}
                totalFilteredLeakage={totalFilteredLeakage}
                delaySearch={delaySearch}
                setDelaySearch={setDelaySearch}
                setEditingRecord={setEditingRecord}
                setActiveModal={setActiveModal}
                handleDeleteDelay={handleDeleteDelay}
                ConfirmAction={ConfirmAction}
                 permissions={{ canEdit: isAllowedEdit , canDelete: isAllowedDelete}}
            />

            {/* EXECUTION REGISTRY - Updated with Delete Handlers */}
            <ExecutionRegistry 
                activities={project.activities}
                setEditingRecord={setEditingRecord}
                setActiveModal={setActiveModal}
                setSelectedActivity={setSelectedActivity}
                formatDate={(date) => new Date(date).toLocaleDateString()}
                onDeleteActivity={handleDeleteActivity}
                onDeleteTask={handleDeleteTask} permissions={{
                    canEdit: isAllowedEdit||false,
                    canDelete: isAllowedDelete||false
                }}               //  permissions={{ canEdit: isAllowedEdit , canDelete: isAllowedDelete}}
            />

            {/* PROCUREMENT PORTFOLIO */}
            <ProcurementPortfolio 
                project={project}
                onAddBoQ={handleAddBoQ}
                onIssuePO={handleIssuePO}
                onEditRecord={handleEdit}
                onDeleteRecord={handleDelete}
                 permissions={{ canEdit: isAllowedEdit , canDelete: isAllowedDelete}}
            />

            {/* MODAL ORCHESTRATOR */}
            <ProjectModalPortal 
                isOpen={!!activeModal}
                type={activeModal}
                editingRecord={editingRecord}
                project={project}
                allStrategies={allStrategies}
                selectedActivity={selectedActivity}
                onClose={closeModal}
                onSuccess={handleSync}
                forms={{ MM_ActivityForm }}
            />
        </div>
    );
}