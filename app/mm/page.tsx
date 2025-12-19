'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Target, Briefcase, Activity, Plus, 
  Loader2, ChevronRight, X, AlertCircle, 
  Database, RefreshCcw, Settings
} from 'lucide-react';

// Subcomponents & Types
import { 
  ActivityTableView, 
  ProjectGridView, 
  StrategyListView, 
  WorkshopListView 
} from './_components/SubComponents';

import { MM_Activity, MM_Project, MM_StrategicPlan } from './types/strategies';
import MM_StrategicPlanForm from './_components/MM_StrategicPlanForm';
import MM_ProjectForm from './_components/MM_ProjectForm';
import MM_ActivityForm from './_components/ActivityForm';
import MM_WorkshopForm from './_components/MM_WorkshopForm';

type TabType = 'strategies' | 'projects' | 'activities' | 'workshops';

export default function MM_CommandDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('strategies');
  const [data, setData] = useState<{
    strategies: MM_StrategicPlan[];
    projects: MM_Project[];
    activities: MM_Activity[];
    workshops: any[];
  }>({ strategies: [], projects: [], activities: [], workshops: [] });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal & Editing States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `/mm/api/${activeTab}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Failed to fetch ${activeTab} records`);
      const result = await res.json();
      setData(prev => ({ ...prev, [activeTab]: result }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleCreateNew = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
   // if (!confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}? This action is permanent.`)) return;
    
    try {
      const res = await fetch(`/mm/api/${activeTab}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete operation failed');
      fetchData(); // Refresh list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    fetchData(); 
  };

  const hasData = data[activeTab] && data[activeTab].length > 0;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="hidden lg:flex w-72 bg-slate-900 text-white p-6 flex-col border-r border-slate-800">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg">
            <Target size={22} className="text-white" />
          </div>
          <div className="leading-none">
            <span className="font-black text-xl tracking-tight block text-white">NRZ MM</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise ERP</span>
          </div>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavButton active={activeTab === 'strategies'} onClick={() => setActiveTab('strategies')} icon={<Target size={20}/>} label="Strategic Plans" />
          <NavButton active={activeTab === 'workshops'} onClick={() => setActiveTab('workshops')} icon={<Settings size={20}/>} label="Workshops" />
          <NavButton active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<Briefcase size={20}/>} label="Workshop Projects" />
          <NavButton active={activeTab === 'activities'} onClick={() => setActiveTab('activities')} icon={<Activity size={20}/>} label="Operational Activities" />
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0 relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          
          <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 md:mb-10 gap-4">
            <div>
              <nav className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                <span>Maintenance</span>
                <ChevronRight size={12} />
                <span className="text-blue-600">{activeTab}</span>
              </nav>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 capitalize tracking-tight">
                {activeTab === 'strategies' ? 'Strategic' : activeTab} <span className="text-blue-600">Hub</span>
              </h1>
            </div>
            
            <button 
              onClick={handleCreateNew}
              className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-6 py-4 md:py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95"
            >
              <Plus size={20} /> <span className="md:inline text-white">Create {activeTab.slice(0,-1)}</span>
            </button>
          </header>

          {loading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="font-bold text-xs uppercase tracking-widest">Syncing Records...</p>
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchData} />
          ) : !hasData ? (
            <EmptyState activeTab={activeTab} onAdd={handleCreateNew} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'strategies' && <StrategyListView strategies={data.strategies} onEdit={handleEdit} onDelete={handleDelete} />}
              {activeTab === 'workshops' && <WorkshopListView workshops={data.workshops} onEdit={handleEdit} onDelete={handleDelete} />}
              {activeTab === 'projects' && <ProjectGridView projects={data.projects} onEdit={handleEdit} onDelete={handleDelete} />}
              {activeTab === 'activities' && <ActivityTableView activities={data.activities} onEdit={handleEdit} onDelete={handleDelete} />}
            </div>
          )}
        </div>
      </main>

      {/* --- MOBILE NAV --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-3 flex justify-between z-40 pb-safe shadow-lg">
        <MobileNavIcon active={activeTab === 'strategies'} onClick={() => setActiveTab('strategies')} icon={<Target size={24}/>} label="Strategy" />
        <MobileNavIcon active={activeTab === 'workshops'} onClick={() => setActiveTab('workshops')} icon={<Settings size={24}/>} label="Workshops" />
        <MobileNavIcon active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<Briefcase size={24}/>} label="Projects" />
        <MobileNavIcon active={activeTab === 'activities'} onClick={() => setActiveTab('activities')} icon={<Activity size={24}/>} label="Activities" />
      </div>

      {/* --- FORMS MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 flex items-end md:items-center justify-center">
          <div className="w-full h-[90vh] md:h-auto md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden relative">
            <div className="flex justify-between items-center p-4 border-b md:hidden">
              <span className="font-bold text-slate-800">{editingRecord ? 'Edit' : 'Create'} {activeTab.slice(0,-1)}</span>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto max-h-[85vh] md:max-h-[90vh]">
              {activeTab === 'strategies' && (
                <MM_StrategicPlanForm 
                  initialData={editingRecord} 
                  onClose={() => setIsModalOpen(false)} 
                  onSuccess={handleSaveSuccess} 
                />
              )}
              
              {activeTab === 'workshops' && (
                <MM_WorkshopForm 
                  initialData={editingRecord} 
                  onClose={() => setIsModalOpen(false)} 
                  onSuccess={handleSaveSuccess} 
                />
              )}
              
              {activeTab === 'projects' && (
                <MM_ProjectForm 
                  initialData={editingRecord}
                  workshops={data.workshops} 
                  strategies={data.strategies} 
                  onClose={() => setIsModalOpen(false)}
                  onSuccess={handleSaveSuccess} 
                />
              )}
              
              {activeTab === 'activities' && (
                <MM_ActivityForm 
                  initialData={editingRecord}
                  projects={data.projects} 
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

// Helper UI Components
function ErrorState({ message, onRetry }: { message: string, onRetry: () => void }) {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center">
      <AlertCircle size={40} className="text-red-500 mb-4" />
      <h3 className="text-lg font-bold mb-2">Connection Error</h3>
      <p className="text-slate-500 text-sm mb-6">{message}</p>
      <button onClick={onRetry} className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-2 rounded-xl font-bold shadow-sm"><RefreshCcw size={16} /> Retry</button>
    </div>
  );
}

function EmptyState({ activeTab, onAdd }: { activeTab: string, onAdd: () => void }) {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in">
      <div className="bg-white p-8 rounded-3xl shadow-xl border mb-6"><Database size={48} className="text-blue-600" /></div>
      <h3 className="text-xl font-black mb-2 uppercase tracking-tight">No {activeTab} Registered</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-8">Start by adding a {activeTab.slice(0, -1)} to populate the enterprise maintenance hub.</p>
      <button onClick={onAdd} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
        <Plus size={20} /> Add {activeTab.slice(0, -1)}
      </button>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}>
      <div className="flex items-center gap-3">
        <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>{icon}</span>
        <span className="font-bold text-sm tracking-tight">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
    </button>
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
// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import { 
//   Target, Briefcase, Activity, Plus, 
//   Loader2, ChevronRight, X, AlertCircle, 
//   Database, RefreshCcw, Settings, Wrench
// } from 'lucide-react';

// // Subcomponents & Types
// import { ActivityTableView, ProjectGridView, StrategyListView, WorkshopListView } from './_components/SubComponents';
// import { MM_Activity, MM_Project, MM_StrategicPlan } from './types/strategies';
// import MM_StrategicPlanForm from './_components/MM_StrategicPlanForm';
// import MM_ProjectForm from './_components/MM_ProjectForm';
// import MM_ActivityForm from './_components/ActivityForm';
// import MM_WorkshopForm from './_components/MM_WorkshopForm';

// // Added 'workshops' to the TabType
// type TabType = 'strategies' | 'projects' | 'activities' | 'workshops';

// export default function MM_CommandDashboard() {
//   const [activeTab, setActiveTab] = useState<TabType>('strategies');
//   const [data, setData] = useState<{
//     strategies: MM_StrategicPlan[];
//     projects: MM_Project[];
//     activities: MM_Activity[];
//     workshops: any[]; // New state for workshops
//   }>({ strategies: [], projects: [], activities: [], workshops: [] });
  
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const endpoint = `/mm/api/${activeTab}`;
//       const res = await fetch(endpoint);
//       if (!res.ok) throw new Error(`Failed to fetch ${activeTab} records`);
//       const result = await res.json();
//       setData(prev => ({ ...prev, [activeTab]: result }));
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'An unknown error occurred');
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

//   const hasData = data[activeTab] && data[activeTab].length > 0;

//   return (
//     <div className="flex flex-col lg:flex-row h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
//       {/* --- SIDEBAR --- */}
//       <aside className="hidden lg:flex w-72 bg-slate-900 text-white p-6 flex-col border-r border-slate-800">
//         <div className="flex items-center gap-3 px-2 mb-10">
//           <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg">
//             <Target size={22} className="text-white" />
//           </div>
//           <div className="leading-none">
//             <span className="font-black text-xl tracking-tight block text-white">NRZ MM</span>
//             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise ERP</span>
//           </div>
//         </div>
        
//         <nav className="space-y-2 flex-1">
//           <NavButton active={activeTab === 'strategies'} onClick={() => setActiveTab('strategies')} icon={<Target size={20}/>} label="Strategic Plans" />
//           <NavButton active={activeTab === 'workshops'} onClick={() => setActiveTab('workshops')} icon={<Settings size={20}/>} label="Workshops" />
//           <NavButton active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<Briefcase size={20}/>} label="Workshop Projects" />
//           <NavButton active={activeTab === 'activities'} onClick={() => setActiveTab('activities')} icon={<Activity size={20}/>} label="Operational Activities" />
//         </nav>
//       </aside>

//       {/* --- MAIN CONTENT --- */}
//       <main className="flex-1 overflow-y-auto pb-24 lg:pb-0 relative">
//         <div className="max-w-7xl mx-auto p-4 md:p-8">
          
//           <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 md:mb-10 gap-4">
//             <div>
//               <nav className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
//                 <span>Maintenance</span>
//                 <ChevronRight size={12} />
//                 <span className="text-blue-600">{activeTab}</span>
//               </nav>
//               <h1 className="text-2xl md:text-3xl font-black text-slate-900 capitalize tracking-tight">
//                 {activeTab === 'strategies' ? 'Strategic' : activeTab} <span className="text-blue-600">Hub</span>
//               </h1>
//             </div>
            
//             <button 
//               onClick={() => setIsModalOpen(true)}
//               className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-6 py-4 md:py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95"
//             >
//               <Plus size={20} /> <span className="md:inline text-white">Create {activeTab.slice(0,-1)}</span>
//             </button>
//           </header>

//           {loading ? (
//             <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
//               <Loader2 className="animate-spin text-blue-600" size={48} />
//               <p className="font-bold text-xs uppercase tracking-widest">Syncing Records...</p>
//             </div>
//           ) : error ? (
//             <ErrorState message={error} onRetry={fetchData} />
//           ) : !hasData ? (
//             <EmptyState activeTab={activeTab} onAdd={() => setIsModalOpen(true)} />
//           ) : (
//             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//               {activeTab === 'strategies' && <StrategyListView strategies={data.strategies} />}
//               {activeTab === 'workshops' && <WorkshopListView workshops={data.workshops} />}
//               {activeTab === 'projects' && <ProjectGridView projects={data.projects} />}
//               {activeTab === 'activities' && <ActivityTableView activities={data.activities} />}
//             </div>
//           )}
//         </div>
//       </main>

//       {/* --- MOBILE NAV --- */}
//       <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-3 flex justify-between z-40 pb-safe shadow-lg">
//         <MobileNavIcon active={activeTab === 'strategies'} onClick={() => setActiveTab('strategies')} icon={<Target size={24}/>} label="Strategy" />
//         <MobileNavIcon active={activeTab === 'workshops'} onClick={() => setActiveTab('workshops')} icon={<Settings size={24}/>} label="Workshops" />
//         <MobileNavIcon active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<Briefcase size={24}/>} label="Projects" />
//         <MobileNavIcon active={activeTab === 'activities'} onClick={() => setActiveTab('activities')} icon={<Activity size={24}/>} label="Activities" />
//       </div>

//       {/* --- FORMS MODAL --- */}
//       {isModalOpen && (
//         <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 flex items-end md:items-center justify-center">
//           <div className="w-full h-[90vh] md:h-auto md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden relative">
//             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 md:hidden z-10"><X size={20}/></button>
            
//             {activeTab === 'strategies' && <MM_StrategicPlanForm onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />}
            
//             {activeTab === 'workshops' && <MM_WorkshopForm onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />}
            
//             {activeTab === 'projects' && (
//               <MM_ProjectForm                 
//                 workshops={data.workshops} // Pass actual workshops here
//                 onClose={() => setIsModalOpen(false)}
//                 onSuccess={handleSaveSuccess} 
//                 strategies={data.strategies}              
//               />
//             )}
            
//             {activeTab === 'activities' && (
//               <MM_ActivityForm 
//                 onClose={() => setIsModalOpen(false)}
//                 onSuccess={handleSaveSuccess} 
//                 projects={data.projects}              
//                 />
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Helper UI Components
// function ErrorState({ message, onRetry }: { message: string, onRetry: () => void }) {
//   return (
//     <div className="h-[60vh] flex flex-col items-center justify-center text-center">
//       <AlertCircle size={40} className="text-red-500 mb-4" />
//       <h3 className="text-lg font-bold mb-2">Connection Error</h3>
//       <p className="text-slate-500 text-sm mb-6">{message}</p>
//       <button onClick={onRetry} className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-2 rounded-xl font-bold shadow-sm"><RefreshCcw size={16} /> Retry</button>
//     </div>
//   );
// }

// function EmptyState({ activeTab, onAdd }: { activeTab: string, onAdd: () => void }) {
//   return (
//     <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in">
//       <div className="bg-white p-8 rounded-3xl shadow-xl border mb-6"><Database size={48} className="text-blue-600" /></div>
//       <h3 className="text-xl font-black mb-2 uppercase tracking-tight">No {activeTab} Registered</h3>
//       <p className="text-slate-500 text-sm max-w-sm mb-8">Start by adding a {activeTab.slice(0, -1)} to populate the enterprise maintenance hub.</p>
//       <button onClick={onAdd} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
//         <Plus size={20} /> Add {activeTab.slice(0, -1)}
//       </button>
//     </div>
//   );
// }

// function NavButton({ active, icon, label, onClick }: any) {
//   return (
//     <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}>
//       <div className="flex items-center gap-3">
//         <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>{icon}</span>
//         <span className="font-bold text-sm tracking-tight">{label}</span>
//       </div>
//       {active && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
//     </button>
//   );
// }

// function MobileNavIcon({ active, icon, label, onClick }: any) {
//   return (
//     <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-1 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
//       <div className={`p-1.5 rounded-xl ${active ? 'bg-blue-50' : ''}`}>{icon}</div>
//       <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
//     </button>
//   );
// }