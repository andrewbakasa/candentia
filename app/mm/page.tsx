'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Target, Briefcase, Activity, Plus, 
  Loader2, ChevronRight, X, AlertCircle, Menu
} from 'lucide-react';

// Subcomponents & Types
import { ActivityTableView, ProjectGridView, StrategyListView } from './_components/SubComponents';
import { MM_Activity, MM_Project, MM_StrategicPlan } from './types/strategies';
import MM_StrategicPlanForm from './_components/MM_StrategicPlanForm';
import MM_ProjectForm from './_components/MM_ProjectForm';
import MM_ActivityForm from './_components/ActivityForm';

type TabType = 'strategies' | 'projects' | 'activities';

export default function MM_CommandDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('strategies');
  const [data, setData] = useState<{
    strategies: MM_StrategicPlan[];
    projects: MM_Project[];
    activities: MM_Activity[];
  }>({ strategies: [], projects: [], activities: [] });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    fetchData(); 
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex w-72 bg-slate-900 text-white p-6 flex-col border-r border-slate-800">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
            <Target size={22} className="text-white" />
          </div>
          <div className="leading-none">
            <span className="font-black text-xl tracking-tight block">NRZ MM</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise ERP</span>
          </div>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavButton active={activeTab === 'strategies'} onClick={() => setActiveTab('strategies')} icon={<Target size={20}/>} label="Strategic Plans" />
          <NavButton active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<Briefcase size={20}/>} label="Workshop Projects" />
          <NavButton active={activeTab === 'activities'} onClick={() => setActiveTab('activities')} icon={<Activity size={20}/>} label="Operational Activities" />
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          
          {/* Header Section */}
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
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-6 py-4 md:py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95"
            >
              <Plus size={20} /> <span className="md:inline">Create {activeTab === 'strategies' ? 'Plan' : activeTab.slice(0,-1)}</span>
            </button>
          </header>

          {/* Dynamic Content */}
          {loading ? (
            <div className="h-64 lg:h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="font-bold text-xs uppercase tracking-widest">Loading Records...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'strategies' && <StrategyListView strategies={data.strategies} />}
              {activeTab === 'projects' && <ProjectGridView projects={data.projects} />}
              {activeTab === 'activities' && <ActivityTableView activities={data.activities} />}
            </div>
          )}
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40 pb-safe">
        <MobileNavIcon active={activeTab === 'strategies'} onClick={() => setActiveTab('strategies')} icon={<Target size={24}/>} label="Strategy" />
        <MobileNavIcon active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<Briefcase size={24}/>} label="Projects" />
        <MobileNavIcon active={activeTab === 'activities'} onClick={() => setActiveTab('activities')} icon={<Activity size={24}/>} label="Activities" />
      </div>

      {/* Unified Form Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 flex items-end md:items-center justify-center">
          <div className="w-full h-[90vh] md:h-auto md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 md:hidden z-10"><X size={20}/></button>
            
            {activeTab === 'strategies' && <MM_StrategicPlanForm onClose={() => setIsModalOpen(false)} onSuccess={handleSaveSuccess} />}
            {activeTab === 'projects' && (
              <MM_ProjectForm 
                planId={data.strategies[0]?.id} 
                strategicBudget={data.strategies[0]?.totalBudget || 0}
                workshops={[]} 
                managers={[]} 
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSaveSuccess}
              />
            )}
            {activeTab === 'activities' && (
              <MM_ActivityForm 
                projectId={data.projects[0]?.id} 
                projectBudget={data.projects[0]?.allocatedBudget || 0}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSaveSuccess}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavButton({ active, icon, label, onClick }: NavButtonProps) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}>
      <div className="flex items-center gap-3">
        <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>{icon}</span>
        <span className="font-bold text-sm tracking-tight">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
    </button>
  );
}

function MobileNavIcon({ active, icon, label, onClick }: NavButtonProps) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      <div className={`p-1 rounded-lg ${active ? 'bg-blue-50' : ''}`}>{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

interface NavButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}
// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import { 
//   Target, Briefcase, Activity, Plus, 
//   Loader2, ChevronRight, X, AlertCircle 
// } from 'lucide-react';

// // Subcomponents & Types
// import { ActivityTableView, ProjectGridView, StrategyListView } from './_components/SubComponents';
// import { MM_Activity, MM_Project, MM_StrategicPlan } from './types/strategies';
// import MM_StrategicPlanForm from './_components/MM_StrategicPlanForm';
// import MM_ProjectForm from './_components/MM_ProjectForm';
// import MM_ActivityForm from './_components/ActivityForm';

// // Updated TabType: changed 'strategy' to 'strategies'
// type TabType = 'strategies' | 'projects' | 'activities';

// export default function MM_CommandDashboard() {
//   const [activeTab, setActiveTab] = useState<TabType>('strategies');
//   const [data, setData] = useState<{
//     strategies: MM_StrategicPlan[]; // Key updated to match endpoint naming
//     projects: MM_Project[];
//     activities: MM_Activity[];
//   }>({ strategies: [], projects: [], activities: [] });
  
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       // Endpoint is now naturally /mm/api/strategies, /mm/api/projects, etc.
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

//   return (
//     <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="w-72 bg-slate-900 text-white p-6 flex flex-col border-r border-slate-800">
//         <div className="flex items-center gap-3 px-2 mb-10">
//           <div className="bg-blue-600 p-2.5 rounded-xl">
//             <Target size={22} className="text-white" />
//           </div>
//           <div className="leading-none">
//             <span className="font-black text-xl tracking-tight block">NRZ MM</span>
//             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise ERP</span>
//           </div>
//         </div>
        
//         <nav className="space-y-2 flex-1">
//           <NavButton 
//             active={activeTab === 'strategies'} 
//             onClick={() => setActiveTab('strategies')} 
//             icon={<Target size={20}/>} 
//             label="Strategic Plans" 
//           />
//           <NavButton 
//             active={activeTab === 'projects'} 
//             onClick={() => setActiveTab('projects')} 
//             icon={<Briefcase size={20}/>} 
//             label="Workshop Projects" 
//           />
//           <NavButton 
//             active={activeTab === 'activities'} 
//             onClick={() => setActiveTab('activities')} 
//             icon={<Activity size={20}/>} 
//             label="Operational Activities" 
//           />
//         </nav>
//       </aside>

//       <main className="flex-1 overflow-y-auto">
//         <div className="max-w-7xl mx-auto p-8">
//           <header className="flex justify-between items-end mb-10">
//             <div>
//               <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
//                 <span>Maintenance</span>
//                 <ChevronRight size={12} />
//                 <span className="text-blue-600">{activeTab}</span>
//               </nav>
//               <h1 className="text-3xl font-black text-slate-900 capitalize tracking-tight">
//                 {activeTab === 'strategies' ? 'Strategic' : activeTab} <span className="text-blue-600">Hub</span>
//               </h1>
//             </div>
            
//             <button 
//               onClick={() => setIsModalOpen(true)}
//               className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl active:scale-95"
//             >
//               <Plus size={20} /> Create {activeTab === 'strategies' ? 'Plan' : activeTab === 'projects' ? 'Project' : 'Activity'}
//             </button>
//           </header>

//           {loading ? (
//             <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
//               <Loader2 className="animate-spin text-blue-600" size={40} />
//               <p className="font-bold text-sm uppercase tracking-widest">Accessing MM Records...</p>
//             </div>
//           ) : (
//             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//               {activeTab === 'strategies' && <StrategyListView strategies={data.strategies} />}
//               {activeTab === 'projects' && <ProjectGridView projects={data.projects} />}
//               {activeTab === 'activities' && <ActivityTableView activities={data.activities} />}
//             </div>
//           )}
//         </div>
//       </main>

//       {isModalOpen && (
//         <div className="fixed inset-0 z-50 overflow-hidden">
//           {activeTab === 'strategies' && (
//             <MM_StrategicPlanForm 
//               onClose={() => setIsModalOpen(false)}
//               onSuccess={handleSaveSuccess}
//             />
//           )}
          
//           {activeTab === 'projects' && (
//             <MM_ProjectForm 
//               planId={data.strategies[0]?.id} 
//               strategicBudget={data.strategies[0]?.totalBudget || 0}
//               workshops={[]} 
//               managers={[]} 
//               onClose={() => setIsModalOpen(false)}
//               onSuccess={handleSaveSuccess}
//             />
//           )}

//           {activeTab === 'activities' && (
//             <MM_ActivityForm 
//               projectId={data.projects[0]?.id} 
//               projectBudget={data.projects[0]?.allocatedBudget || 0}
//               onClose={() => setIsModalOpen(false)}
//               onSuccess={handleSaveSuccess}
//             />
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// // NavButton remains Exported for use
// interface NavButtonProps {
//   active: boolean;
//   icon: React.ReactNode;
//   label: string;
//   onClick: () => void;
// }

// export function NavButton({ active, icon, label, onClick }: NavButtonProps) {
//   return (
//     <button 
//       onClick={onClick}
//       className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${
//         active 
//           ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
//           : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
//       }`}
//     >
//       <div className="flex items-center gap-3">
//         <span className={`transition-colors duration-200 ${
//           active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'
//         }`}>
//           {icon}
//         </span>
//         <span className="font-bold text-sm tracking-tight">{label}</span>
//       </div>
//       {active ? (
//         <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white] animate-pulse" />
//       ) : (
//         <div className="w-1.5 h-1.5 bg-transparent rounded-full group-hover:bg-slate-700 transition-colors" />
//       )}
//       {active && (
//         <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-300 rounded-r-full" />
//       )}
//     </button>
//   );
// }