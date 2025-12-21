'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, Loader2, X, Target, Settings, Briefcase, Activity 
} from 'lucide-react';

import { ActivityTableView, ProjectGridView, StrategyListView, WorkshopListView } from './_components/SubComponents';
import MM_StrategicPlanForm from './_components/MM_StrategicPlanForm';
import MM_ProjectForm from './_components/MM_ProjectForm';
import MM_ActivityForm from './_components/ActivityForm';
import MM_WorkshopForm from './_components/MM_WorkshopForm';
import MM_Sidebar from './_components/MM_Sidebar';
import MM_TaskForm from './_components/TaskForm';
//import MM_TaskForm from './_components/MM_TaskForm'; // Assuming this exists or will be created

type TabType = 'strategies' | 'projects' | 'activities' | 'workshops';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const activeTab = (searchParams?.get('tab') as TabType) || 'strategies';
  
  const [data, setData] = useState<any>({ strategies: [], projects: [], activities: [], workshops: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  
  // NEW: State to track if we are specifically adding a task to an activity
  const [taskParentActivity, setTaskParentActivity] = useState<any>(null);

  const handleTabChange = (tab: TabType) => {
    router.push(`/mm/?tab=${tab}`, { scroll: false });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/mm/api/${activeTab}`);
      if (!res.ok) throw new Error(`Failed to fetch ${activeTab}`);
      const result = await res.json();
      setData((prev: any) => ({ ...prev, [activeTab]: result }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setTaskParentActivity(null); // Reset task context
    fetchData(); 
  };

  // Handler for adding a task from the Activity Table
  const handleAddTask = (activity: any) => {
    setEditingRecord(null);
    setTaskParentActivity(activity); // Pass the activity context to the form
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
      <MM_Sidebar activeTab={activeTab} />

      <main className="flex-1 overflow-y-auto relative pb-24 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 capitalize tracking-tight">
                {activeTab} <span className="text-blue-600">Hub</span>
              </h1>
            </div>
            <button 
              onClick={() => {
                setEditingRecord(null); 
                setTaskParentActivity(null); 
                setIsModalOpen(true);
              }} 
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-black transition-all active:scale-95"
            >
              <Plus size={20} /> Create {activeTab.slice(0,-1)}
            </button>
          </header>

          {loading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Syncing Records...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'strategies' && <StrategyListView strategies={data.strategies} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} />}
              {activeTab === 'workshops' && <WorkshopListView workshops={data.workshops} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} />}
              {activeTab === 'projects' && <ProjectGridView projects={data.projects} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} />}
              
              {/* UPDATED: Added onAddTask prop */}
              {activeTab === 'activities' && (
                <ActivityTableView 
                  activities={data.activities||[]} 
                  onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} 
                  onAddTask={handleAddTask}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* --- MOBILE NAV --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-3 flex justify-between z-40 pb-safe shadow-lg">
        <MobileNavIcon active={activeTab === 'strategies'} onClick={() => handleTabChange('strategies')} icon={<Target size={24}/>} label="Strategy" />
        <MobileNavIcon active={activeTab === 'workshops'} onClick={() => handleTabChange('workshops')} icon={<Settings size={24}/>} label="Workshops" />
        <MobileNavIcon active={activeTab === 'projects'} onClick={() => handleTabChange('projects')} icon={<Briefcase size={24}/>} label="Projects" />
        <MobileNavIcon active={activeTab === 'activities'} onClick={() => handleTabChange('activities')} icon={<Activity size={24}/>} label="Activities" />
      </div>

      {/* --- FORMS MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 flex items-end md:items-center justify-center">
          <div className="w-full h-[90vh] md:h-auto md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden relative">
            <div className="flex justify-between items-center p-4 border-b md:hidden">
              <span className="font-bold text-slate-800">
                {taskParentActivity ? 'Add Task' : editingRecord ? 'Edit' : 'Create'} {activeTab.slice(0,-1)}
              </span>
              <button onClick={() => {setIsModalOpen(false); setTaskParentActivity(null);}} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto max-h-[85vh] md:max-h-[90vh]">
              {/* NEW: Handle Task Form specifically if taskParentActivity is set */}
              {taskParentActivity ? (
                <MM_TaskForm                  
                  activities={data.activities || []} 
                  preselectedActivity={taskParentActivity}
                  onClose={() => {setIsModalOpen(false); setTaskParentActivity(null);}} 
                  onSuccess={handleSaveSuccess} 
                />
              ) : (
                <>
                  {activeTab === 'strategies' && (
                    <MM_StrategicPlanForm initialData={editingRecord} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
                  )}
                  {activeTab === 'workshops' && (
                    <MM_WorkshopForm initialData={editingRecord} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
                  )}
                  {activeTab === 'projects' && (
                    <MM_ProjectForm initialData={editingRecord} workshops={data.workshops} strategies={data.strategies} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
                  )}
                  {activeTab === 'activities' && (
                    <MM_ActivityForm initialData={editingRecord}  projects={data.projects} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileNavIcon({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-1 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      <div className={`p-1.5 rounded-xl ${active ? 'bg-blue-50' : ''}`}>{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

export default function MM_CommandDashboard() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
// 'use client';

// import React, { useState, useEffect, useCallback, Suspense } from 'react';
// import { useSearchParams, useRouter } from 'next/navigation'; // Added useRouter
// import { 
//   Plus, Loader2, X, Target, Settings, Briefcase, Activity 
// } from 'lucide-react';

// import { ActivityTableView, ProjectGridView, StrategyListView, WorkshopListView } from './_components/SubComponents';
// import MM_StrategicPlanForm from './_components/MM_StrategicPlanForm';
// import MM_ProjectForm from './_components/MM_ProjectForm';
// import MM_ActivityForm from './_components/ActivityForm';
// import MM_WorkshopForm from './_components/MM_WorkshopForm';
// import MM_Sidebar from './_components/MM_Sidebar';

// type TabType = 'strategies' | 'projects' | 'activities' | 'workshops';

// function DashboardContent() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
  
//   // 1. Get the current tab from the URL, defaulting to 'strategies'
//   const activeTab = (searchParams?.get('tab') as TabType) || 'strategies';
  
//   const [data, setData] = useState<any>({ strategies: [], projects: [], activities: [], workshops: [] });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingRecord, setEditingRecord] = useState<any>(null);

//   // 2. Updated Tab Switcher: Push to URL instead of just local state
//   const handleTabChange = (tab: TabType) => {
//     router.push(`/mm/?tab=${tab}`, { scroll: false });
//   };

//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await fetch(`/mm/api/${activeTab}`);
//       if (!res.ok) throw new Error(`Failed to fetch ${activeTab}`);
//       const result = await res.json();
//       setData((prev: any) => ({ ...prev, [activeTab]: result }));
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [activeTab]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const handleSaveSuccess = () => {
//     setIsModalOpen(false);
//     fetchData(); 
//   };

//   return (
//     <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
      
//       {/* SIDEBAR: Pass activeTab (the sidebar links should point to ?tab=...) */}
//       <MM_Sidebar activeTab={activeTab} />

//       <main className="flex-1 overflow-y-auto relative pb-24 lg:pb-0">
//         <div className="max-w-7xl mx-auto p-4 md:p-8">
//           <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-4">
//             <div>
//               <h1 className="text-3xl font-black text-slate-900 capitalize tracking-tight">
//                 {activeTab} <span className="text-blue-600">Hub</span>
//               </h1>
//             </div>
//             <button 
//               onClick={() => {setEditingRecord(null); setIsModalOpen(true);}} 
//               className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-black transition-all active:scale-95"
//             >
//               <Plus size={20} /> Create {activeTab.slice(0,-1)}
//             </button>
//           </header>

//           {loading ? (
//             <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
//               <Loader2 className="animate-spin text-blue-600" size={40} />
//               <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Syncing Records...</p>
//             </div>
//           ) : (
//             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//               {activeTab === 'strategies' && <StrategyListView strategies={data.strategies} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} />}
//               {activeTab === 'workshops' && <WorkshopListView workshops={data.workshops} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} />}
//               {activeTab === 'projects' && <ProjectGridView projects={data.projects} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} />}
//               {activeTab === 'activities' && <ActivityTableView activities={data.activities} onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} />}
//             </div>
//           )}
//         </div>
//       </main>

//       {/* --- MOBILE NAV (Now updates URL) --- */}
//       <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-3 flex justify-between z-40 pb-safe shadow-lg">
//         <MobileNavIcon active={activeTab === 'strategies'} onClick={() => handleTabChange('strategies')} icon={<Target size={24}/>} label="Strategy" />
//         <MobileNavIcon active={activeTab === 'workshops'} onClick={() => handleTabChange('workshops')} icon={<Settings size={24}/>} label="Workshops" />
//         <MobileNavIcon active={activeTab === 'projects'} onClick={() => handleTabChange('projects')} icon={<Briefcase size={24}/>} label="Projects" />
//         <MobileNavIcon active={activeTab === 'activities'} onClick={() => handleTabChange('activities')} icon={<Activity size={24}/>} label="Activities" />
//       </div>

//       {/* --- FORMS MODAL --- */}
//       {isModalOpen && (
//         <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 flex items-end md:items-center justify-center">
//           <div className="w-full h-[90vh] md:h-auto md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden relative">
//             <div className="flex justify-between items-center p-4 border-b md:hidden">
//               <span className="font-bold text-slate-800">{editingRecord ? 'Edit' : 'Create'} {activeTab.slice(0,-1)}</span>
//               <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
//             </div>
            
//             <div className="overflow-y-auto max-h-[85vh] md:max-h-[90vh]">
//               {activeTab === 'strategies' && (
//                 <MM_StrategicPlanForm initialData={editingRecord} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
//               )}
//               {activeTab === 'workshops' && (
//                 <MM_WorkshopForm initialData={editingRecord} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
//               )}
//               {activeTab === 'projects' && (
//                 <MM_ProjectForm initialData={editingRecord} workshops={data.workshops} strategies={data.strategies} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
//               )}
//               {activeTab === 'activities' && (
//                 <MM_ActivityForm initialData={editingRecord} projects={data.projects} onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Mobile Icon Helper
// function MobileNavIcon({ active, icon, label, onClick }: any) {
//   return (
//     <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-1 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
//       <div className={`p-1.5 rounded-xl ${active ? 'bg-blue-50' : ''}`}>{icon}</div>
//       <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
//     </button>
//   );
// }

// export default function MM_CommandDashboard() {
//   return (
//     <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}>
//       <DashboardContent />
//     </Suspense>
//   );
// }