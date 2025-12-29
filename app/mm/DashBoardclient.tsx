'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, Loader2, Target, Briefcase, ShoppingCart, Box, ArrowUpRight, Receipt, AlertCircle, Layers,  Search, Calendar, DollarSign, Clock,
  X
} from 'lucide-react';
import { toast } from 'sonner';
// Components
import MM_ProjectForm from './_components/MM_ProjectForm';
import MM_Sidebar from './_components/MM_Sidebar';
import MM_MaterialForm from './_components/MM_MaterialForm';
import MM_PurchaseOrderForm from './_components/MM_PurchaseOrder';
import MM_MasterMaterialForm from './_components/MM_MasterMaterial';
import ProcurementListView from './_components/ProcurementListView';
import MM_WorkshopForm from './_components/MM_WorkshopForm';
import MM_ActivityForm from './_components/ActivityForm';
import MM_DelayForm from './_components/MM_DelayForm';
import { DelayListView } from './_components/SubComponents/DelayListView';
import { ActivityTableView } from './_components/SubComponents/ActivityView';
import { ProjectGridView } from './_components/SubComponents/ProjectListView';
import { WorkshopListView } from './_components/SubComponents/WorkshopListView';
import { StrategyListView } from './_components/SubComponents/StrategicListView';
import MM_StrategicPlanForm from './_components/MM_StrategicPlanForm';
import BaseTaskForm from './_components/BaseTaskForm';
import { BaseTaskGridView } from './_components/SubComponents/BaseTaskListView';
import { TbChevronsDownLeft } from 'react-icons/tb';

// 1. Updated TabType to include mastermaterials
//export type TabType = 'strategies' | 'projects' | 'activities' | 'workshops' | 'purchaseorders' | 'materials' | 'mastermaterials';
export type TabType = 'strategies' | 'projects' | 'activities' | 'workshops' | 'purchaseorders' | 'materials' | 'mastermaterials' | 'delays' |'basetasks';

function DashboardContent({ currentUser }: { currentUser: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams?.get('tab') as TabType) || 'strategies';
  
  const [data, setData] = useState<Record<TabType, any[]>>({ 
    strategies: [], 
    projects: [], 
    activities: [], 
    workshops: [], 
    purchaseorders: [], 
    materials: [],
    mastermaterials: [] ,
    delays: [],
    basetasks: []
  });
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  //const handleTabChange = (tab: TabType) => router.push(`/mm/?tab=${tab}`, { scroll: false });

  // 2. Data Sync Engine
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Logic for endpoint mapping
      const endpointOverride: Partial<Record<TabType, string>> = {
        materials: 'materialrequirements', // Requirement: fetch from requirements endpoint
        mastermaterials: 'mastermaterials' // Requirement: fetch from master catalog
      };

      const dependencyMap: Record<TabType, string[]> = {
        strategies: [],
        workshops: [],
        mastermaterials: [], // Global catalog is independent
        projects: ['strategies','workshops'],
        activities: ['projects','basetasks'],
        purchaseorders: ['strategies', 'projects'],
        materials: ['strategies', 'projects'],
        delays: ['activities', 'projects'],
        basetasks: [],
      };

      const deps = dependencyMap[activeTab] || [];
      const endpoints = Array.from(new Set([activeTab, ...deps]));
      
      const results = await Promise.all(
        endpoints.map(async (slug) => {
          // Use override if exists, otherwise use slug
          const apiPath = endpointOverride[slug as TabType] || slug;
         console.log("apiPath",`/mm/api/${apiPath}`)
          const res = await fetch(`/mm/api/${apiPath}`);
          const json = await res.json();
          return { slug, data: Array.isArray(json) ? json : [] };
        })
      );

      setData((prev) => {
        const newData = { ...prev };
        results.forEach(({ slug, data }) => {
          newData[slug as TabType] = data;
        });
        return newData;
      });

    } catch (err: any) {
      console.error("Fetch Error:", err);
      toast.error("Ledger Sync Failure: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

const handleDelete = async (tab: TabType, id: string) => {
  // Optional: Add a native confirmation or use a custom modal
  //if (!confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;

  try {
    const res = await fetch(`/mm/api/${tab}/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error("Failed to delete record");

    toast.success(`${tabLabels[tab]} removed successfully`);
    fetchData(); // Refresh the ledger
  } catch (err: any) {
    console.error("Delete Error:", err);
    toast.error("Deletion Failed: " + err.message);
  }
};
  // --- Targeted Data Refresh for Activities/Tasks ---
  const handleRefreshData = useCallback(async () => {
    try {
      // Re-fetch activities specifically
      const res = await fetch(`/mm/api/activities`);
      if (!res.ok) throw new Error("Sync failed");
      
      const updatedActivities = await res.json();
      
      // Update only the activities slice of state
      setData((prev) => ({
        ...prev,
        activities: Array.isArray(updatedActivities) ? updatedActivities : []
      }));

      // A subtle toast is better than a hard loading screen for background refreshes
      toast.success("Ledger Synchronized", {
        description: "Activity and Task states have been updated."
      });
    } catch (err: any) {
      console.error("Refresh Error:", err);
      toast.error("Background Sync Failed: " + err.message);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveSuccess = () => {
    toast.success("Update successfull")
    setIsModalOpen(false);
    setEditingRecord(null);
    fetchData(); 
  };

const isAllowedDelete = (currentUser?.isAdmin)// || currentUser?.roles?.some((r: string) => ['admin', 'executive'].includes(r.toLowerCase()));

const isAllowedEdit = (currentUser?.isAdmin) || currentUser?.roles?.some((r: string) => ['admin', 'engineer'].includes(r.toLowerCase()));

const tabLabels = {
  mastermaterials: 'Catalog Item',
  strategies: 'Strategy',
  activities: 'Activity',
  projects:'Project',
  workshops:'Workshop',
  purchaseorders:'Purchase Order',
  materials:'Material',
  delays:'Process Delay',
  basetasks:'Base Tasks',
};
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
      <MM_Sidebar activeTab={activeTab} />
      
      <main className="flex-1 overflow-y-auto relative pb-24 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          
          <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">NRZ ERP Gateway</p>
              <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tight">
                {activeTab === 'purchaseorders' ? 'Procurement' : 
                 activeTab === 'materials' ? 'Project BoQ' : 
                 activeTab === 'mastermaterials' ? 'Master Catalog' : activeTab} 
                <span className="text-slate-400"> Hub</span>
              </h1>
            </div>

            {isAllowedEdit && (
              //export exceljs of filtered data----> AI should create function thasend excel data  when clicked button// all active purchase orders, or catelog material or boq active
              <button 
                onClick={() => { setEditingRecord(null); setIsModalOpen(true); }} 
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl hover:bg-indigo-600 transition-all text-xs uppercase tracking-widest"
              > 
                <Plus size={18} strokeWidth={3} /> 
                {`Create ${tabLabels[activeTab] || 'Item'}`}
              </button>
            )}
          </header>

          {loading && data[activeTab]?.length === 0 ? (
            <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Ledger...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {activeTab === 'strategies' && <StrategyListView strategies={data.strategies} onEdit={(r: any) => { setEditingRecord(r); setIsModalOpen(true); } }  permissions={{ canEdit: isAllowedEdit , canDelete: isAllowedDelete}} onDelete={(id: string) => handleDelete('strategies', id)}/>}
              {activeTab === 'workshops' && <WorkshopListView workshops={data.workshops} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowedEdit}}/>}
              {activeTab === 'projects' && <ProjectGridView projects={data.projects} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowedEdit}}/>}
              {activeTab === 'activities' && <ActivityTableView baseTasks={data.basetasks} activities={data.activities} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowedEdit}} refreshData={handleRefreshData}/>}
              {activeTab === 'basetasks' && <BaseTaskGridView baseTasks={data.basetasks} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowedEdit}} refreshData={handleRefreshData}/>}
            
              {activeTab === 'delays' && (
                  <DelayListView 
                    delays={data.delays} 
                    onEdit={(r) => { setEditingRecord(r); setIsModalOpen(true); }} permissions={{canEdit:isAllowedEdit}}
                  />
                )}
              {(activeTab === 'purchaseorders' || activeTab === 'materials' || activeTab === 'mastermaterials') && (
                <ProcurementListView 
                  activeTab={activeTab}
                  items={data[activeTab]} 
                  onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowedEdit}}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="w-full max-w-4xl bg-white rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            
            {/* Scrollable Form Container with Bottom Safe-Area */}
            <div className="overflow-y-auto pb-28 md:pb-8"> 
              {/* Header (Optional: keeps close button visible) */}
              <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 flex justify-between items-center z-10 border-b border-slate-50">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {editingRecord ? 'Update Entry' : 'New Registry'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {/* Form Selection Logic */}
              <div className="p-2 md:p-6">
                {activeTab === 'strategies' ? (
                <MM_StrategicPlanForm 
                  initialData={editingRecord} 
                  onClose={() => setIsModalOpen(false)} 
                  onSuccess={handleSaveSuccess} 
                />
               ) :activeTab === 'purchaseorders' ? (
                  <MM_PurchaseOrderForm initialData={editingRecord} strategies={data.strategies} projects={data.projects} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
                ) : activeTab === 'materials' ? (
                  <MM_MaterialForm initialData={editingRecord} projects={data.projects} strategies={data.strategies} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
                ) : activeTab === 'activities' ? (
                  <MM_ActivityForm initialData={editingRecord} projects={data.projects} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
                  ) : activeTab === 'basetasks' ? (
                  <BaseTaskForm initialData={editingRecord}  onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />            
                
                ) : activeTab === 'mastermaterials' ? (
                  <MM_MasterMaterialForm initialData={editingRecord} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
                ) : activeTab === 'projects' ? (
                  <MM_ProjectForm initialData={editingRecord} workshops={data.workshops} strategies={data.strategies} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
                ) : activeTab === 'workshops' ? (
                  <MM_WorkshopForm initialData={editingRecord} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
                ): activeTab === 'delays' ? (
                <MM_DelayForm 
                                initialData={editingRecord}
                                activities={data.activities}
                                onClose={() => setIsModalOpen(false)}
                                onSuccess={handleSaveSuccess} 
                                materialRequirements={[]}               
                 /> 
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MM_CommandDashboard({ currentUser }: { currentUser: any }) {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}>
      <DashboardContent currentUser={currentUser} />
    </Suspense>
  );
}
