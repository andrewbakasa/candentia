'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, Loader2, Target, Briefcase, ShoppingCart, Box, ArrowUpRight, Receipt, AlertCircle, Layers,  Search, Calendar, DollarSign, Clock
} from 'lucide-react';
import { toast } from 'sonner';
// Components
import { ActivityTableView, ProjectGridView, StrategyListView, WorkshopListView } from './_components/SubComponents';
import MM_ProjectForm from './_components/MM_ProjectForm';
import MM_Sidebar from './_components/MM_Sidebar';
import MM_MaterialForm from './_components/MM_MaterialForm';
import MM_PurchaseOrderForm from './_components/MM_PurchaseOrder';
import MM_MasterMaterialForm from './_components/MM_MasterMaterial';
import ProcurementListView from './_components/ProcurementListView';
import MM_WorkshopForm from './_components/MM_WorkshopForm';

// 1. Updated TabType to include mastermaterials
export type TabType = 'strategies' | 'projects' | 'activities' | 'workshops' | 'purchaseorders' | 'materials' | 'mastermaterials';

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
    mastermaterials: [] // Initialized
  });
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const handleTabChange = (tab: TabType) => router.push(`/mm/?tab=${tab}`, { scroll: false });

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
        projects: ['strategies'],
        activities: ['projects'],
        purchaseorders: ['strategies', 'projects'],
        materials: ['strategies', 'projects']
      };

      const deps = dependencyMap[activeTab] || [];
      const endpoints = Array.from(new Set([activeTab, ...deps]));
      
      const results = await Promise.all(
        endpoints.map(async (slug) => {
          // Use override if exists, otherwise use slug
          const apiPath = endpointOverride[slug as TabType] || slug;
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    fetchData(); 
  };

const isAllowed = (currentUser?.isAdmin) || currentUser?.roles?.some((r: string) => ['admin', 'executive'].includes(r.toLowerCase()));
const tabLabels = {
  mastermaterials: 'Catalog Item',
  strategies: 'Strategy',
  activities: 'Activity',
  projects:'Project',
  workshops:'Workshop',
  purchaseorders:'Purchase Order',
  materials:'Material',
};
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
      <MM_Sidebar activeTab={activeTab} />
      
      <main className="flex-1 overflow-y-auto relative pb-24 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          
          <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-6">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">NRZ ERP Gateway</p>
              <h1 className="text-4xl font-black text-slate-900 capitalize tracking-tight">
                {activeTab === 'purchaseorders' ? 'Procurement' : 
                 activeTab === 'materials' ? 'Project BoQ' : 
                 activeTab === 'mastermaterials' ? 'Master Catalog' : activeTab} 
                <span className="text-slate-400"> Hub</span>
              </h1>
            </div>

            {isAllowed && (
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
              {activeTab === 'strategies' && <StrategyListView strategies={data.strategies} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowed}}/>}
              {activeTab === 'workshops' && <WorkshopListView workshops={data.workshops} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowed}}/>}
              {activeTab === 'projects' && <ProjectGridView projects={data.projects} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowed}}/>}
              {activeTab === 'activities' && <ActivityTableView activities={data.activities} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowed}}/>}
              
              {(activeTab === 'purchaseorders' || activeTab === 'materials' || activeTab === 'mastermaterials') && (
                <ProcurementListView 
                  activeTab={activeTab}
                  items={data[activeTab]} 
                  onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} 
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Engine */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh]">
            {activeTab === 'purchaseorders' ? (
              <MM_PurchaseOrderForm initialData={editingRecord} strategies={data.strategies} projects={data.projects} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
             
           
            ):activeTab === 'materials' ? (
            <MM_MaterialForm 
              initialData={editingRecord} 
              projects={data.projects} 
              strategies={data.strategies} // Pass the full list so the form can look it up
              onClose={() => setIsModalOpen(false)} 
              onSuccess={handleSaveSuccess} 
            />
         

            ) : activeTab === 'mastermaterials' ? (
              <MM_MasterMaterialForm initialData={editingRecord} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
            ) : activeTab === 'projects' ? (
               <MM_ProjectForm initialData={editingRecord} workshops={data.workshops} strategies={data.strategies} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
            ) : activeTab === 'workshops' ? (
            /* ADD THIS SECTION BELOW */
            <MM_WorkshopForm 
              initialData={editingRecord} 
              onClose={() => setIsModalOpen(false)} 
              onSuccess={handleSaveSuccess} 
            />
          ) : null}
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
