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
import axios from 'axios';
import { toast } from 'sonner';
import { SafeUser } from '../types';

type TabType = 'strategies' | 'projects' | 'activities' | 'workshops';

interface DashboardContentProps {
  currentUser: SafeUser | null;
}

function DashboardContent({ currentUser }: DashboardContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const activeTab = (searchParams?.get('tab') as TabType) || 'strategies';
  
  const [data, setData] = useState<any>({ strategies: [], projects: [], activities: [], workshops: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isDeletingActivityId, setIsDeletingActivityId] = useState<string | null>(null);
  const [taskParentActivity, setTaskParentActivity] = useState<any>(null);
  const [parentProjectContext, setParentProjectContext] = useState<any>(null);
  const [isDeletingTaskId, setIsDeletingTaskId] = useState<string | null>(null);
  const [isDeletingProjectId, setIsDeletingProjectId] = useState<string | null>(null);
const [isDeletingWorkshopId, setIsDeletingWorkshopId] = useState<string | null>(null);
const [isDeletingStrategyId, setIsDeletingStrategyId] = useState<string | null>(null);

  const handleTabChange = (tab: TabType) => {
    router.push(`/mm/?tab=${tab}`, { scroll: false });
  };

  // --- Access Control Check ---
  const allowedRoles = ['admin', 'executive'];

  const isAllowedEditAccess = 
    (currentUser?.isAdmin === true) || 
    (currentUser?.roles?.some(role => 
        allowedRoles.some(allowed => allowed.toLowerCase() === role.toLowerCase())
    ) === true);

  const permissions= {
    canAdd: currentUser,
    canEdit: isAllowedEditAccess,
    canDelete: isAllowedEditAccess,
  };  

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const primaryRes = await fetch(`/mm/api/${activeTab}`);
      if (!primaryRes.ok) throw new Error(`Failed to fetch ${activeTab}`);
      const primaryResult = await primaryRes.json();

      if (activeTab === 'projects') {
        const [stratRes, workshopRes] = await Promise.all([
          fetch('/mm/api/strategies'),
          fetch('/mm/api/workshops')
        ]);

        const strategies = stratRes.ok ? await stratRes.json() : [];
        const workshops = workshopRes.ok ? await workshopRes.json() : [];

        setData((prev: any) => ({
          ...prev,
          projects: primaryResult,
          strategies: strategies,
          workshops: workshops
        }));
      } else {
        setData((prev: any) => ({ ...prev, [activeTab]: primaryResult }));
      }
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
    setTaskParentActivity(null);
    setParentProjectContext(null);
    setEditingRecord(null);
    fetchData(); 
  };

  const handleAddTask = (activity: any) => {
    setEditingRecord(null);
    setTaskParentActivity(activity);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: any, activity: any) => {
    setEditingRecord(task); 
    setTaskParentActivity(activity); 
    if (activity?.project) {
      setParentProjectContext(activity.project);
    }
    setIsModalOpen(true);
  };

  const handleDeleteActivity = async (actId: string) => {
    setIsDeletingActivityId(actId);
    try {
      await axios.delete(`/mm/api/activities/${actId}`);
      toast.success('Activity Decommissioned Successfully');
      fetchData(); 
      router.refresh(); 
    } catch (error: any) {
      console.error("Activity deletion failed:", error);
      toast.error(error.response?.data?.message || 'Failed to remove Activity.');
    } finally {
      setIsDeletingActivityId(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setIsDeletingProjectId(projectId);
    try {
      await axios.delete(`/mm/api/projects/${projectId}`);
      toast.success('Project and associated records decommissioned');
      await fetchData(); 
      router.refresh(); 
    } catch (error: any) {
      console.error("Project deletion failed:", error);
      toast.error(error.response?.data?.message || 'Failed to remove Project.');
    } finally {
      setIsDeletingProjectId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setIsDeletingTaskId(taskId);
    try {
      await axios.delete(`/mm/api/tasks/${taskId}`);
      toast.success('Work Order Decommissioned');
      await fetchData(); 
      router.refresh(); 
    } catch (error: any) {
      console.error("Task deletion failed:", error);
      toast.error(error.response?.data?.message || 'Failed to remove Work Order.');
    } finally {
      setIsDeletingTaskId(null);
    }
  };
const handleDeleteWorkshop = async (workshopId: string) => {
    setIsDeletingWorkshopId(workshopId);
    try {
      await axios.delete(`/mm/api/workshops/${workshopId}`);
      toast.success('Workshop Decommissioned Successfully');
      await fetchData(); // Refresh local state
      router.refresh();  // Refresh server components
    } catch (error: any) {
      console.error("Workshop deletion failed:", error);
      toast.error(error.response?.data?.message || 'Failed to remove Workshop. Check if it has active projects.');
    } finally {
      setIsDeletingWorkshopId(null);
    }
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    setIsDeletingStrategyId(strategyId);
    try {
      await axios.delete(`/mm/api/strategies/${strategyId}`);
      toast.success('Strategic Plan Removed');
      await fetchData(); 
      router.refresh(); 
    } catch (error: any) {
      console.error("Strategy deletion failed:", error);
      toast.error(error.response?.data?.message || 'Failed to remove Strategic Plan.');
    } finally {
      setIsDeletingStrategyId(null);
    }
  };
  const handleAddActivityToProject = (project: any) => {
    setEditingRecord(null);
    setParentProjectContext(project);
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
            {isAllowedEditAccess && (
              <button 
                onClick={() => {
                  setEditingRecord(null); 
                  setTaskParentActivity(null); 
                  setParentProjectContext(null);
                  setIsModalOpen(true);
                }} 
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-black transition-all active:scale-95"
              >
                <Plus size={20} /> 
                {/* Create {activeTab.slice(0,-1)} */}
                Create {
                  activeTab === 'strategies' ? 'Strategy' :
                  activeTab === 'activities' ? 'Activity' :
                  activeTab === 'workshops' ? 'Workshop' :
                  activeTab === 'projects' ? 'Project' : 'Record'
                }
              </button>
            )}
          </header>

          {loading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Syncing Records...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'strategies' && 
                <StrategyListView strategies={data.strategies} 
                onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} 
                onDelete={handleDeleteStrategy}
                permissions={permissions}/>
              }
              {activeTab === 'workshops' && 
                <WorkshopListView workshops={data.workshops} 
                onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} 
                onDelete={handleDeleteWorkshop}
                permissions={permissions}/>
              }
              
              {activeTab === 'projects' && (
                <ProjectGridView 
                  projects={data.projects} 
                  onDelete={handleDeleteProject}
                  permissions={permissions}
                  onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} 
                  onAddActivity={handleAddActivityToProject} 
                />
              )}
              
              {activeTab === 'activities' && (
                <ActivityTableView 
                  activities={data.activities||[]} 
                  onEdit={(r:any)=>{setEditingRecord(r); setIsModalOpen(true);}} 
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDelete={handleDeleteActivity}
                  permissions={permissions}
                  onDeleteTask={handleDeleteTask}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-3 flex justify-between z-40 pb-safe shadow-lg">
        <MobileNavIcon active={activeTab === 'strategies'} onClick={() => handleTabChange('strategies')} icon={<Target size={24}/>} label="Strategy" />
        <MobileNavIcon active={activeTab === 'workshops'} onClick={() => handleTabChange('workshops')} icon={<Settings size={24}/>} label="Workshops" />
        <MobileNavIcon active={activeTab === 'projects'} onClick={() => handleTabChange('projects')} icon={<Briefcase size={24}/>} label="Projects" />
        <MobileNavIcon active={activeTab === 'activities'} onClick={() => handleTabChange('activities')} icon={<Activity size={24}/>} label="Activities" />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 flex items-end md:items-center justify-center">
          <div className="w-full h-[90vh] md:h-auto md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden relative">
            <div className="flex justify-between items-center p-4 border-b md:hidden">
              <span className="font-bold text-slate-800">
                {taskParentActivity ? 'Task Manager' : parentProjectContext ? 'Project Activity' : 'Record Manager'}
              </span>
              <button onClick={() => {setIsModalOpen(false); setTaskParentActivity(null); setParentProjectContext(null);}} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto max-h-[85vh] md:max-h-[90vh]">
              {taskParentActivity ? (
                <MM_TaskForm                   
                  activities={data.activities || []} 
                  preselectedActivity={taskParentActivity}
                  initialData={editingRecord}
                  onClose={() => {setIsModalOpen(false); setTaskParentActivity(null); setEditingRecord(null);}} 
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
                    <MM_ActivityForm 
                      initialData={editingRecord} 
                      preselectedProject={editingRecord?.project || parentProjectContext} 
                      projects={data.projects} 
                      onClose={() => {
                        setIsModalOpen(false); 
                        setParentProjectContext(null);
                        setEditingRecord(null);
                      }} 
                      onSuccess={handleSaveSuccess} 
                    />
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

export default function MM_CommandDashboard({ currentUser }: DashboardContentProps) {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}>
      <DashboardContent currentUser={currentUser} />
    </Suspense>
  );
}