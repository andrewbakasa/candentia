'use client'
import { 
  AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Construction, 
  ListChecks, Search, User, FileSpreadsheet, X, Clock, LayoutGrid, Target, 
  Trash2, Edit3, ExternalLink, Save, CheckCircle, Filter, Briefcase 
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { ItemActions } from "../SubComponents";
import Link from "next/link";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import MM_TaskForm from "../TaskForm";
import { toast } from "sonner";

// --- SEARCH CONFIGURATION ---
export const searchableActivityFields = {
    projectName: { label: 'Project Name', type: 'string' },
    activityDesc: { label: 'Activity Description', type: 'string' },
    supervisor: { label: 'Supervisor', type: 'string' },
    taskTitle: { label: 'Task Title', type: 'string' },
    taskAssignee: { label: 'Task Assigned To', type: 'string' },
};

export type ActivitySearchKey = keyof typeof searchableActivityFields;

export const ActivityTableView = ({ 
  activities, 
  onEdit, 
  onDelete, 
  onAddTask, 
  onEditTask, 
  onDeleteTask, 
  permissions,
  refreshData 
}: any) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeSearchFields, setActiveSearchFields] = useState<ActivitySearchKey[]>(
    ['projectName', 'activityDesc', 'taskTitle']
  );

  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [activeActivity, setActiveActivity] = useState<any | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => setShowSuccessToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  const filteredActivities = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return activities || [];

    return activities?.filter((act: any) => {
      const matchesActivity = (
        (activeSearchFields.includes('projectName') && act.project?.name?.toLowerCase().includes(term)) ||
        (activeSearchFields.includes('activityDesc') && act.description?.toLowerCase().includes(term)) ||
        (activeSearchFields.includes('supervisor') && act.supervisor?.toLowerCase().includes(term))
      );

      const matchesTasks = act.tasks?.some((task: any) => 
        (activeSearchFields.includes('taskTitle') && task.title?.toLowerCase().includes(term)) ||
        (activeSearchFields.includes('taskAssignee') && task.assignedTo?.toLowerCase().includes(term))
      );

      return matchesActivity || matchesTasks;
    }) || [];
  }, [activities, searchTerm, activeSearchFields]);

  const handleExport = async () => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Operational Report');
        worksheet.columns = [
          { header: 'Project', key: 'project', width: 25 },
          { header: 'Type', key: 'type', width: 12 },
          { header: 'Description', key: 'title', width: 40 },
          { header: 'Owner', key: 'owner', width: 25 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Deadline', key: 'date', width: 15 },
        ];

        filteredActivities.forEach((act: any) => {
          worksheet.addRow({
            project: act.project?.name || 'Unassigned',
            type: 'ACTIVITY',
            title: act.description,
            owner: act.supervisor,
            status: act.stage,
            date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : '',
          }).font = { bold: true };

          act.tasks?.forEach((t: any) => {
            worksheet.addRow({
              project: '',
              type: '  ↳ TASK',
              title: t.title,
              owner: t.assignedTo,
              status: t.status,
              date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
            });
          });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Activity_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Excel report exported successfully");
    } catch (e) {
        toast.error("Export failed");
    }
  };

  return (
    <div className="w-full space-y-6 relative">
      
      {showSuccessToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-[2rem] shadow-2xl animate-in slide-in-from-top-full duration-500">
          <CheckCircle size={20} className="text-white" />
          <span className="text-sm font-bold uppercase tracking-widest">Update Applied Locally</span>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-2 overflow-y-auto max-h-[90vh]">
               <MM_TaskForm 
                  initialData={editingTask} 
                  activities={activities || []}
                  preselectedActivity={activeActivity} 
                  onClose={() => {
                    setEditingTask(null);
                    setActiveActivity(null);
                  }}
                  onSuccess={() => {
                    if(onEditTask && activeActivity) onEditTask(activeActivity.id, editingTask.id);
                    setShowSuccessToast(true);
                    setEditingTask(null);
                    setActiveActivity(null);
                    if(refreshData) refreshData();
                  }} 
                />
            </div>
          </div>
        </div>
      )}

      {/* 🔍 SEARCH BAR WITH CLEAR ACTION */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder={`Search across ${activeSearchFields.length} active scopes...`}
              className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* UX: Clear Search Button */}
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button 
            onClick={handleExport}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
          >
            <FileSpreadsheet size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Export Activity Report ({filteredActivities.length})</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                <Filter size={14} className="text-indigo-500" />
                Search Scope:
            </div>
            <div className="flex flex-wrap gap-2">
                {(Object.keys(searchableActivityFields) as ActivitySearchKey[]).map((key) => {
                    const isActive = activeSearchFields.includes(key);
                    return (
                        <button
                            key={key}
                            onClick={() => {
                                const next = isActive 
                                    ? activeSearchFields.filter(f => f !== key) 
                                    : [...activeSearchFields, key];
                                setActiveSearchFields(next);
                            }}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
                                isActive 
                                ? 'bg-amber-400 border-amber-500 text-white shadow-md' 
                                : 'bg-white border-slate-200 text-slate-400 hover:border-amber-300'
                            }`}
                        >
                            {searchableActivityFields[key].label}
                        </button>
                    );
                })}
            </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredActivities.length > 0 ? filteredActivities.map((act: any, idx: number) => {
          const totalCost = (act.actualLaborCost || 0) + (act.actualMaterialCost || 0);
          const taskCount = act.tasks?.length || 0;
          const isExpanded = expandedId === act.id;
          const progress = taskCount 
            ? Math.round((act.tasks.filter((t: any) => t.status === 'COMPLETED').length / taskCount) * 100) 
            : 0;

          return (
            <div key={act.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50">
              <div 
                className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                onClick={() => taskCount > 0 && setExpandedId(isExpanded ? null : act.id)}
              >
                <div className="flex items-center justify-between md:justify-start gap-4">
                  {/* UX: Activity Numbering */}
                  <div className="relative group">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-105">
                      <LayoutGrid size={24} />
                    </div>
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-slate-900 text-white text-[10px] font-black flex items-center justify-center rounded-lg border-2 border-white shadow-sm">
                        #{idx + 1}
                    </div>
                  </div>
                  <div className="md:hidden">
                    <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg shadow-sm">
                        <Briefcase size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                            {act.project?.name || 'Global Registry'}
                        </span>
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded-lg">Activity</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{taskCount} Tasks</span>
                  </div>
                  
                  <h3 className="text-base font-bold text-slate-900 truncate mb-1">{act.description}</h3>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5"><Construction size={14} className="text-slate-400" /> {act.supervisor}</div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900"><Target size={14} className="text-emerald-500" /> ${totalCost.toLocaleString()}</div>
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-end gap-1 w-32">
                   <span className="text-[10px] font-black text-slate-400 uppercase">{progress}% Done</span>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                   </div>
                </div>

                <div className="hidden md:flex items-center gap-3">
                   <Link href={`/mm/activities/${act.id}`} onClick={(e) => e.stopPropagation()} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-lg text-[9px] font-black uppercase transition-all">
                    Full Report
                  </Link>
                  <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
                </div>

                <div className="flex items-center justify-center text-slate-400">
                   {taskCount > 0 && (isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
                </div>
              </div>

              {isExpanded && (
                <div className="bg-slate-50/50 p-5 md:p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {act.tasks.map((task: any, tIdx: number) => (
                      <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-4 group relative hover:border-indigo-300 transition-all">
                        <div className="absolute top-4 right-4 flex gap-1">
                          {permissions?.canEdit && (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setActiveActivity(act);
                                setEditingTask(task);
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-all"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                        </div>

                        {/* UX: Task Status and Numbering Row */}
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 text-white rounded-md">
                             Task {String(tIdx + 1).padStart(2, '0')}
                           </span>
                           <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${task.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                             {task.status}
                           </span>
                        </div>

                        <p className="text-sm font-bold text-slate-800 leading-snug min-h-[2.5rem]">{task.title}</p>
                        
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
                          <div className="flex flex-col gap-0.5 text-[10px] font-bold text-slate-700 truncate">
                             <span className="text-[8px] font-black text-slate-400 uppercase">Assigned</span>
                             <div className="flex items-center gap-1.5"><User size={12} className="text-indigo-500" /> {task.assignedTo || 'TBD'}</div>
                          </div>
                          <div className="flex flex-col gap-0.5 text-[10px] font-bold text-slate-700">
                             <span className="text-[8px] font-black text-slate-400 uppercase">Due Date</span>
                             <div className="flex items-center gap-1.5"><Clock size={12} className="text-amber-500" /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="h-40 flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No activities found matching active filters</p>
          </div>
        )}
      </div>
    </div>
  );
};