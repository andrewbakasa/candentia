'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, Loader2, Target, Briefcase, ShoppingCart, Box, ArrowUpRight, Receipt, AlertCircle, Layers 
} from 'lucide-react';
import { toast } from 'sonner';

// Components
import { ActivityTableView, ProjectGridView, StrategyListView, WorkshopListView } from './_components/SubComponents';
import MM_StrategicPlanForm from './_components/MM_StrategicPlanForm';
import MM_ProjectForm from './_components/MM_ProjectForm';
import MM_ActivityForm from './_components/ActivityForm';
import MM_WorkshopForm from './_components/MM_WorkshopForm';
import MM_Sidebar from './_components/MM_Sidebar';
import MM_TaskForm from './_components/TaskForm';
import MM_MaterialForm from './_components/MM_MaterialForm';
import MM_PurchaseOrderForm from './_components/MM_PurchaseOrder';
import MM_MasterMaterialForm from './_components/MM_MasterMaterial';
//import MM_MasterMaterialForm from './_components/MM_MasterMaterialForm'; // Added new form

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
              <button 
                onClick={() => { setEditingRecord(null); setIsModalOpen(true); }} 
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl hover:bg-indigo-600 transition-all text-xs uppercase tracking-widest"
              >
                <Plus size={18} strokeWidth={3} /> 
                Create {activeTab === 'mastermaterials' ? 'Catalog Item' : activeTab.slice(0, -1)}
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
            // ) : activeTab === 'materials' ? (
            //   <MM_MaterialForm initialData={editingRecord} projects={data.projects} projectPlan={data.strategies.find(s => s.id === editingRecord?.project?.planId || editingRecord?.projectId)} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
            
           
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
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// Updated Helper Component to handle different Item Structures
function ProcurementListView({ items, activeTab, onEdit }: { items: any[], activeTab: TabType, onEdit: (item: any) => void }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-[2rem] border border-dashed border-slate-200">
        <ShoppingCart size={40} className="text-slate-200" />
        <p className="text-[10px] font-black uppercase text-slate-400">No Records Found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {activeTab === 'mastermaterials' ? 'Part Number / Category' : 'Reference / Item'}
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {activeTab === 'mastermaterials' ? 'UoM' : 'Status'}
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                {activeTab === 'mastermaterials' ? 'Last Known Cost' : 'Commitment'}
            </th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((item: any) => (
            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-5">
                <p className="font-mono text-xs font-bold text-indigo-600">
                  {item.itemCode || item.poNumber || 'PENDING'}
                </p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {/* Accessing nested material data for BoQ entries vs flat data for Master Items */}
                  {item.material?.description || item.description || item.vendorName || 'N/A'}
                </p>
              </td>
              <td className="px-6 py-5">
                <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-md text-slate-500 uppercase">
                  {item.unitOfMeasure || item.status || 'ACTIVE'}
                </span>
              </td>
              <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
                ${(item.lastKnownCost || item.totalValue || (item.quantityRequired * item.estimatedUnitCost) || 0).toLocaleString()}
              </td>
              <td className="px-6 py-5 text-right">
                <button onClick={() => onEdit(item)} className="p-2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white rounded-xl transition-all">
                  <ArrowUpRight size={14}/>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
// 'use client';

// import React, { useState, useEffect, useCallback, Suspense } from 'react';
// import { useSearchParams, useRouter } from 'next/navigation';
// import { 
//   Plus, Loader2, Target, Briefcase, ShoppingCart, Box, ArrowUpRight, Receipt, AlertCircle 
// } from 'lucide-react';
// import { toast } from 'sonner';

// // Components (Assuming these paths are correct for your structure)
// import { ActivityTableView, ProjectGridView, StrategyListView, WorkshopListView } from './_components/SubComponents';
// import MM_StrategicPlanForm from './_components/MM_StrategicPlanForm';
// import MM_ProjectForm from './_components/MM_ProjectForm';
// import MM_ActivityForm from './_components/ActivityForm';
// import MM_WorkshopForm from './_components/MM_WorkshopForm';
// import MM_Sidebar from './_components/MM_Sidebar';
// import MM_TaskForm from './_components/TaskForm';
// import MM_MaterialForm from './_components/MM_MaterialForm';
// import MM_PurchaseOrderForm from './_components/MM_PurchaseOrder';

// export type TabType = 'strategies' | 'projects' | 'activities' | 'workshops' | 'purchaseorders' | 'materials';

// function DashboardContent({ currentUser }: { currentUser: any }) {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const activeTab = (searchParams?.get('tab') as TabType) || 'strategies';
  
//   // 1. Initial State Guard: Every key is explicitly an empty array
//   const [data, setData] = useState<Record<TabType, any[]>>({ 
//     strategies: [], 
//     projects: [], 
//     activities: [], 
//     workshops: [], 
//     purchaseorders: [], 
//     materials: [] 
//   });
  
//   const [loading, setLoading] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingRecord, setEditingRecord] = useState<any>(null);

//   const handleTabChange = (tab: TabType) => router.push(`/mm/?tab=${tab}`, { scroll: false });

//   // 2. Data Sync Engine (Guideline 1 Compliance)
  
// const fetchData = useCallback(async () => {
//   setLoading(true);
//   try {
//     const dependencyMap: Record<TabType, string[]> = {
//       strategies: [],
//       workshops: [],
//       projects: ['strategies'],
//       activities: ['projects'],
//       purchaseorders: ['strategies', 'projects'], // POs need these for the form
//       materials: ['strategies', 'projects']
//     };

//     const deps = dependencyMap[activeTab] || [];
//     const endpoints = Array.from(new Set([activeTab, ...deps]));
    
//     // Fetch all required data for this tab
//     const results = await Promise.all(
//       endpoints.map(async (slug) => {
//         console.log('endpoint..........',`/mm/api/${slug}`)
//         const res = await fetch(`/mm/api/${slug}`);
//         const json = await res.json();
//         return { slug, data: Array.isArray(json) ? json : [] };
//       })
//     );

//     // Update state using a mapped object to ensure keys match slugs exactly
//     setData((prev) => {
//       const newData = { ...prev };
//       results.forEach(({ slug, data }) => {
//         newData[slug as TabType] = data;
//       });
//       return newData;
//     });

//   } catch (err: any) {
//     console.error("Fetch Error:", err);
//     toast.error("Ledger Sync Failure: " + err.message);
//   } finally {
//     setLoading(false);
//   }
// }, [activeTab]);
//   useEffect(() => { fetchData(); }, [fetchData]);

//   const handleSaveSuccess = () => {
//     setIsModalOpen(false);
//     setEditingRecord(null);
//     fetchData(); 
//   };

//   const isAllowed = (currentUser?.isAdmin) || currentUser?.roles?.some((r: string) => ['admin', 'executive'].includes(r.toLowerCase()));

//   return (
//     <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
//       <MM_Sidebar activeTab={activeTab} />
      
//       <main className="flex-1 overflow-y-auto relative pb-24 lg:pb-0">
//         <div className="max-w-7xl mx-auto p-4 md:p-8">
          
//           <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-6">
//             <div>
//               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">NRZ ERP Gateway</p>
//               <h1 className="text-4xl font-black text-slate-900 capitalize tracking-tight">
//                 {activeTab.replace('purchaseorders', 'Procurement').replace('materials', 'BoQ')} <span className="text-slate-400">Hub</span>
//               </h1>
//             </div>

//             {isAllowed && (
//               <button 
//                 onClick={() => { setEditingRecord(null); setIsModalOpen(true); }} 
//                 className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl hover:bg-indigo-600 transition-all text-xs uppercase tracking-widest"
//               >
//                 <Plus size={18} strokeWidth={3} /> 
//                 Create {activeTab.slice(0, -1)}
//               </button>
//             )}
//           </header>

//           {loading && data[activeTab]?.length === 0 ? (
//             <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
//               <Loader2 className="animate-spin text-blue-600" size={40} />
//               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Ledger...</p>
//             </div>
//           ) : (
//             <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
//               {activeTab === 'strategies' && <StrategyListView strategies={data.strategies} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowed}}/>}
//               {activeTab === 'workshops' && <WorkshopListView workshops={data.workshops} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowed}}/>}
//               {activeTab === 'projects' && <ProjectGridView projects={data.projects} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowed}}/>}
//               {activeTab === 'activities' && <ActivityTableView activities={data.activities} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} permissions={{canEdit:isAllowed}}/>}
              
//               {(activeTab === 'purchaseorders' || activeTab === 'materials') && (
//                 <ProcurementListView 
//                   items={data[activeTab]} 
//                   onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} 
//                 />
//               )}
//             </div>
//           )}
//         </div>
//       </main>

//       {/* Modal Engine */}
//       {isModalOpen && (
//         <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
//           <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh]">
//             {activeTab === 'purchaseorders' ? (
//               <MM_PurchaseOrderForm 
//                 initialData={editingRecord} 
//                 strategies={data.strategies} 
//                 projects={data.projects} 
//                 onClose={() => setIsModalOpen(false)} 
//                 onSuccess={handleSaveSuccess} 
//               />
//             ) : activeTab === 'materials' ? (
//               <MM_MaterialForm 
//                 initialData={editingRecord} 
//                 projects={data.projects} 
//                 // Find the plan linked to the project we are editing
//                 projectPlan={data.strategies.find(s => s.id === editingRecord?.project?.planId || editingRecord?.projectId)}
//                 onClose={() => setIsModalOpen(false)} 
//                 onSuccess={handleSaveSuccess} 
//               />
//             ) : activeTab === 'projects' ? (
//                <MM_ProjectForm 
//                 initialData={editingRecord} 
//                 workshops={data.workshops} 
//                 strategies={data.strategies} 
//                 onClose={() => setIsModalOpen(false)} 
//                 onSuccess={handleSaveSuccess} 
//               />
//             ) : null}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // --- Internal Helper: Fixed items.map crash ---
// function ProcurementListView({ items, onEdit }: { items: any[], onEdit: (item: any) => void }) {
//   //console.log("Current Tab Items:", items); // Check your browser console!
//   // Guard 1: Not an array
//   if (!Array.isArray(items)) {
//     return (
//       <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-[2rem] border border-dashed">
//         <Loader2 className="animate-spin text-blue-600" />
//         <p className="text-[10px] font-black uppercase text-slate-400">Reconciling Data...</p>
//       </div>
//     );
//   }

//   // Guard 2: Empty array
//   if (items.length === 0) {
//     return (
//       <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-[2rem] border border-dashed border-slate-200">
//         <ShoppingCart size={40} className="text-slate-200" />
//         <p className="text-[10px] font-black uppercase text-slate-400">No Registry Records Found</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
//       <table className="w-full text-left">
//         <thead className="bg-slate-50/50 border-b border-slate-100">
//           <tr>
//             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference / Item</th>
//             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
//             <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Commitment</th>
//             <th className="px-6 py-4"></th>
//           </tr>
//         </thead>
//         <tbody className="divide-y divide-slate-50">
//           {items.map((item: any) => (
//             <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
//               <td className="px-6 py-5">
//                 <p className="font-mono text-xs font-bold text-indigo-600">
//                   {item.poNumber || item.itemCode || 'PENDING'}
//                 </p>
//                 <p className="text-xs font-bold text-slate-900 mt-0.5">
//                   {item.vendorname || item.description || 'N/A'}
//                 </p>
//               </td>
//               <td className="px-6 py-5">
//                 <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-md text-slate-500 uppercase">
//                   {item.status || 'ACTIVE'}
//                 </span>
//               </td>
//               <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
//                 ${(item.totalValue || (item.quantityRequired * item.estimatedUnitCost) || 0).toLocaleString()}
//               </td>
//               <td className="px-6 py-5 text-right">
//                 <button onClick={() => onEdit(item)} className="p-2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white rounded-xl transition-all">
//                   <ArrowUpRight size={14}/>
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default function MM_CommandDashboard({ currentUser }: { currentUser: any }) {
//   return (
//     <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}>
//       <DashboardContent currentUser={currentUser} />
//     </Suspense>
//   );
// }