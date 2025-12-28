'use client'

import React, { useState, useMemo } from "react";
import { 
  User, FileSpreadsheet, Clock, LayoutGrid, Briefcase, 
  Warehouse, ChevronDown, ChevronUp, Construction, 
  ExternalLink, ListChecks, CheckCircle2, Edit3 
} from "lucide-react";
import Link from "next/link";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from "sonner";
import { ItemActions } from "../SubComponents";
import MM_TaskForm from "../TaskForm";
import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

const ACTIVITY_SEARCH_SCOPES: SearchScope[] = [
  { key: 'projectName', label: 'Project' },
  { key: 'activityDesc', label: 'Activity' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'workshop', label: 'Workshop' },
  { key: 'taskTitle', label: 'Task Title' },
];

export const ActivityTableView = ({ 
  activities = [], onEdit, onDelete, onAddTask, refreshData, permissions, baseTasks, 
}: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFields, setActiveFields] = useState<string[]>(['projectName', 'activityDesc', 'workshop']);
  const [showUnfulfilledOnly, setShowUnfulfilledOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [activeActivity, setActiveActivity] = useState<any | null>(null);

  const filteredActivities = useMemo(() => {
    let result = activities;
    
    // Activity-level filtering: Only show activities that have pending tasks
    if (showUnfulfilledOnly) {
      result = result.filter((act: any) => {
        const total = act.tasks?.length || 0;
        const completed = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
        return total === 0 || completed < total;
      });
    }

    const term = searchTerm.toLowerCase().trim();
    if (!term) return result;

    return result.filter((act: any) => {
      const workshop = act.project?.responsibleWorkshop;
      const matchProject = activeFields.includes('projectName') && act.project?.name?.toLowerCase().includes(term);
      const matchActivity = activeFields.includes('activityDesc') && act.description?.toLowerCase().includes(term);
      const matchSupervisor = activeFields.includes('supervisor') && act.supervisor?.toLowerCase().includes(term);
      const matchWorkshop = activeFields.includes('workshop') && (
        workshop?.name?.toLowerCase().includes(term) || workshop?.location?.toLowerCase().includes(term)
      );
      const matchTasks = activeFields.includes('taskTitle') && 
        act.tasks?.some((task: any) => task.title?.toLowerCase().includes(term));

      return matchProject || matchActivity || matchSupervisor || matchWorkshop || matchTasks;
    });
  }, [activities, searchTerm, activeFields, showUnfulfilledOnly]);

   const handleExport = async () => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Operational Report');
        worksheet.columns = [
          { header: 'Project', key: 'project', width: 25 },
          { header: 'Workshop', key: 'workshop', width: 20 },
          { header: 'Activity/Task', key: 'title', width: 40 },
          { header: 'Supervisor/Assignee', key: 'owner', width: 25 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Deadline', key: 'date', width: 15 },
        ];
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };

        filteredActivities.forEach((act: any) => {
          const actRow = worksheet.addRow({
            project: act.project?.name || 'GLOBAL',
            workshop: act.project?.responsibleWorkshop?.name || 'N/A',
            title: act.description.toUpperCase(),
            owner: act.supervisor || 'Unassigned',
            status: act.stage || 'ACTIVE',
            date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : 'N/A',
          });
          actRow.font = { bold: true };
          actRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };

          const tasksToExport = showUnfulfilledOnly ? act.tasks?.filter((t: any) => t.status !== 'COMPLETED') : act.tasks;
          tasksToExport?.forEach((t: any) => {
            const taskRow = worksheet.addRow({
              title: `   ↳ ${t.title}`, 
              owner: t.assignedTo || 'Unassigned', 
              status: t.status,
              date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A',
            });
            if (t.status === 'COMPLETED') taskRow.font = { italic: true, color: { argb: '94A3B8' } };
          });
          worksheet.addRow({});
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Operational_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Report exported successfully");
    } catch (e) { 
        toast.error("Export failed"); 
    }
  };

  return (
    <div className="w-full space-y-6 pb-10">
      {editingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
             <MM_TaskForm 
              initialData={editingTask} activities={activities}
              preselectedActivity={activeActivity}
              onClose={() => { setEditingTask(null); setActiveActivity(null); } }
              onSuccess={() => { toast.success("Records Updated"); setEditingTask(null); if (refreshData) refreshData(); } } 
              baseTasks={baseTasks}              />
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS */}
     
     {/* 🔍 REFACTORED SEARCH & FILTERS BAR */}
<div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm">
  <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
    
    {/* Left: Search Engine */}
    <div className="w-full lg:flex-1">
      <SearchFilterEngine 
        scopes={ACTIVITY_SEARCH_SCOPES}
        initialActiveScopes={activeFields}
        onSearchChange={setSearchTerm}
        onScopesChange={setActiveFields}
        placeholder="Search across all operational scopes..."
      />
    </div>

    {/* Right: Actions Container - Slimmer Buttons */}
      <div className="flex items-center gap-2 w-full lg:w-auto lg:pt-0.5"> 
        <button 
          onClick={() => setShowUnfulfilledOnly(!showUnfulfilledOnly)}
          className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 h-12 rounded-xl transition-all border font-black uppercase text-[10px] tracking-widest ${
            showUnfulfilledOnly 
              ? 'bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-100' 
              : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-indigo-300'
          }`}
        >
          {showUnfulfilledOnly ? <ListChecks size={16}/> : <Construction size={16} />}
          <span>{showUnfulfilledOnly ? "Pending" : "All Work"}</span>
        </button>

        <button 
          onClick={handleExport} 
          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 h-12 bg-green-700 text-white rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-slate-200"
        >
          <FileSpreadsheet size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Excel</span>
        </button>
          </div>
        </div>
      </div>

      {/* ACTIVITY FEED */}
      <div className="grid grid-cols-1 gap-4">
        {filteredActivities.map((act: any) => {
          const isExpanded = expandedId === act.id;
          const workshop = act.project?.responsibleWorkshop;
          const totalTasks = act.tasks?.length || 0;
          const completedCount = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
          const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
          const isOverdue = act.scheduledEnd && new Date(act.scheduledEnd) < new Date() && progress < 100;

          // LOGIC: Filter tasks for the UI based on the toggle button
          const displayTasks = showUnfulfilledOnly 
            ? act.tasks?.filter((t: any) => t.status !== 'COMPLETED')
            : act.tasks;

          return (
            <div key={act.id} className={`bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 ${isOverdue ? 'border-red-200' : 'border-slate-200 hover:shadow-xl'}`}>
              <div 
                className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                onClick={() => setExpandedId(isExpanded ? null : act.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-[1.25rem] flex flex-col items-center justify-center ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
                    <LayoutGrid size={20} />
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase">
                      <Briefcase size={12} className="text-indigo-400" /> {act.project?.name || 'GLOBAL'}
                    </div>
                    {workshop && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg font-black text-[10px] uppercase"><Warehouse size={12}/> {workshop.name}</div>}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{act.description}</h3>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500 font-bold">
                    <div className="flex items-center gap-2 text-slate-700"><User size={12}/>{act.supervisor || 'Unassigned'}</div>
                    <div className="flex items-center gap-2 text-indigo-600"><CheckCircle2 size={12}/>{completedCount} / {totalTasks} Tasks</div>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-4 md:w-40 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="flex flex-col md:items-end gap-1 flex-1 md:flex-none">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{progress}% Done</span>
                    <div className="w-full md:w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/mm/activities/${act.id}`} onClick={(e) => e.stopPropagation()} className="p-2 text-slate-400 hover:text-indigo-600"><ExternalLink size={18} /></Link>
                    <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
                    {isExpanded ? <ChevronUp size={20} className="text-indigo-500" /> : <ChevronDown size={20} className="text-slate-300" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-slate-50/50 p-6 md:p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayTasks?.length > 0 ? displayTasks.map((task: any, tIdx: number) => (
                      <div key={task.id} className={`bg-white p-5 rounded-[1.5rem] border transition-all group relative ${task.status === 'COMPLETED' ? 'bg-emerald-50/30 border-emerald-100 opacity-80' : 'border-slate-200 hover:border-indigo-300 shadow-sm'}`}>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          {permissions?.canEdit && (
                            <button onClick={(e) => { e.stopPropagation(); setActiveActivity(act); setEditingTask(task); }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                              <Edit3 size={14} />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 text-white rounded">TASK {tIdx + 1}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded ${task.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>{task.status}</span>
                        </div>
                        <p className={`text-sm font-bold text-slate-800 mb-4 line-clamp-2 ${task.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>{task.title}</p>
                        <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Assignee</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600"><User size={12} className="text-indigo-400"/> {task.assignedTo || 'Unassigned'}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Deadline</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 justify-end"><Clock size={12} className="text-amber-400"/> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <CheckCircle2 size={32} className="text-emerald-500 mb-2 opacity-30" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {showUnfulfilledOnly ? "All Tasks Fulfilled" : "No Tasks Found"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
// 'use client'

// import React, { useState, useMemo } from "react";
// import { 
//   User, FileSpreadsheet, Clock, LayoutGrid, Briefcase, 
//   Warehouse, ChevronDown, ChevronUp, Construction, 
//   ExternalLink, ListChecks, CheckCircle2, Edit3 
// } from "lucide-react";
// import Link from "next/link";
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { toast } from "sonner";
// import { ItemActions } from "../SubComponents";
// import MM_TaskForm from "../TaskForm";
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// const ACTIVITY_SEARCH_SCOPES: SearchScope[] = [
//   { key: 'projectName', label: 'Project' },
//   { key: 'activityDesc', label: 'Activity' },
//   { key: 'supervisor', label: 'Supervisor' },
//   { key: 'workshop', label: 'Workshop' },
//   { key: 'taskTitle', label: 'Task Title' },
// ];

// export const ActivityTableView = ({ 
//   activities = [], onEdit, onDelete, onAddTask, refreshData, permissions 
// }: any) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [activeFields, setActiveFields] = useState<string[]>(['projectName', 'activityDesc', 'workshop']);
//   const [showUnfulfilledOnly, setShowUnfulfilledOnly] = useState(false);
//   const [expandedId, setExpandedId] = useState<string | null>(null);
//   const [editingTask, setEditingTask] = useState<any | null>(null);
//   const [activeActivity, setActiveActivity] = useState<any | null>(null);

//   const filteredActivities = useMemo(() => {
//     let result = activities;
//     if (showUnfulfilledOnly) {
//       result = result.filter((act: any) => {
//         const total = act.tasks?.length || 0;
//         const completed = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//         return total === 0 || completed < total;
//       });
//     }

//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return result;

//     return result.filter((act: any) => {
//       const workshop = act.project?.responsibleWorkshop;
//       const matchProject = activeFields.includes('projectName') && act.project?.name?.toLowerCase().includes(term);
//       const matchActivity = activeFields.includes('activityDesc') && act.description?.toLowerCase().includes(term);
//       const matchSupervisor = activeFields.includes('supervisor') && act.supervisor?.toLowerCase().includes(term);
//       const matchWorkshop = activeFields.includes('workshop') && (
//         workshop?.name?.toLowerCase().includes(term) || workshop?.location?.toLowerCase().includes(term)
//       );
//       const matchTasks = activeFields.includes('taskTitle') && 
//         act.tasks?.some((task: any) => task.title?.toLowerCase().includes(term));

//       return matchProject || matchActivity || matchSupervisor || matchWorkshop || matchTasks;
//     });
//   }, [activities, searchTerm, activeFields, showUnfulfilledOnly]);

//   const handleExport = async () => {
//     try {
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet('Operational Report');
//       // ... Excel columns configuration
//       const buffer = await workbook.xlsx.writeBuffer();
//       saveAs(new Blob([buffer]), `Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//       toast.success("Export successful");
//     } catch (e) { toast.error("Export failed"); }
//   };

//   return (
//     <div className="w-full space-y-6 pb-10">
//       {editingTask && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
//              <MM_TaskForm 
//                 initialData={editingTask} activities={activities}
//                 preselectedActivity={activeActivity} 
//                 onClose={() => { setEditingTask(null); setActiveActivity(null); }}
//                 onSuccess={() => { toast.success("Records Updated"); setEditingTask(null); if(refreshData) refreshData(); }} 
//               />
//           </div>
//         </div>
//       )}

//       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
//           <div className="w-full lg:flex-1">
//             <SearchFilterEngine 
//               scopes={ACTIVITY_SEARCH_SCOPES}
//               initialActiveScopes={activeFields}
//               onSearchChange={setSearchTerm}
//               onScopesChange={setActiveFields}
//               placeholder="Search across all operational scopes..."
//             />
//           </div>
//           <div className="flex items-center gap-2 w-full lg:w-auto">
//             <button 
//               onClick={() => setShowUnfulfilledOnly(!showUnfulfilledOnly)}
//               className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl transition-all shadow-sm border font-black uppercase text-[10px] tracking-widest ${
//                 showUnfulfilledOnly ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
//               }`}
//             >
//               {showUnfulfilledOnly ? <ListChecks size={18}/> : <Construction size={18} />}
//               {showUnfulfilledOnly ? "Pending Items" : "All Work"}
//             </button>
//             <button onClick={handleExport} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg">
//               <FileSpreadsheet size={18} />
//               <span className="text-[10px] font-black uppercase tracking-widest">Excel</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 gap-4">
//         {filteredActivities.map((act: any) => {
//           const isExpanded = expandedId === act.id;
//           const workshop = act.project?.responsibleWorkshop;
//           const totalTasks = act.tasks?.length || 0;
//           const completedCount = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//           const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
//           const isOverdue = act.scheduledEnd && new Date(act.scheduledEnd) < new Date() && progress < 100;

//           return (
//             <div key={act.id} className={`bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 ${isOverdue ? 'border-red-200' : 'border-slate-200 hover:shadow-xl'}`}>
//               <div 
//                 className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
//                 onClick={() => setExpandedId(isExpanded ? null : act.id)}
//               >
//                 <div className="flex items-center gap-4">
//                   <div className={`w-14 h-14 rounded-[1.25rem] flex flex-col items-center justify-center ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
//                     <LayoutGrid size={20} />
//                   </div>
//                 </div>

//                 <div className="flex-1 min-w-0 space-y-3">
//                   <div className="flex flex-wrap items-center gap-2">
//                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase">
//                       <Briefcase size={12} className="text-indigo-400" /> {act.project?.name || 'GLOBAL'}
//                     </div>
//                     {workshop && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg font-black text-[10px] uppercase"><Warehouse size={12}/> {workshop.name}</div>}
//                   </div>
//                   <h3 className="text-lg font-bold text-slate-900 leading-tight">{act.description}</h3>
//                   <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500 font-bold">
//                     <div className="flex items-center gap-2 text-slate-700"><User size={12}/>{act.supervisor || 'Unassigned'}</div>
//                     <div className="flex items-center gap-2 text-indigo-600"><CheckCircle2 size={12}/>{completedCount} / {totalTasks} Tasks</div>
//                   </div>
//                 </div>

//                 <div className="flex md:flex-col items-center md:items-end justify-between gap-4 md:w-40 border-t md:border-t-0 pt-4 md:pt-0">
//                   <div className="flex flex-col md:items-end gap-1 flex-1 md:flex-none">
//                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{progress}% Done</span>
//                     <div className="w-full md:w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
//                       <div className={`h-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }} />
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Link href={`/mm/activities/${act.id}`} onClick={(e) => e.stopPropagation()} className="p-2 text-slate-400 hover:text-indigo-600"><ExternalLink size={18} /></Link>
//                     <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                     {isExpanded ? <ChevronUp size={20} className="text-indigo-500" /> : <ChevronDown size={20} className="text-slate-300" />}
//                   </div>
//                 </div>
//               </div>

//               {isExpanded && (
//                 <div className="bg-slate-50/50 p-6 md:p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {act.tasks?.length > 0 ? act.tasks.map((task: any, tIdx: number) => (
//                       <div key={task.id} className={`bg-white p-5 rounded-[1.5rem] border transition-all group relative ${task.status === 'COMPLETED' ? 'bg-emerald-50/30 border-emerald-100 opacity-80' : 'border-slate-200 hover:border-indigo-300 shadow-sm'}`}>
//                         <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
//                           {permissions?.canEdit && (
//                             <button onClick={(e) => { e.stopPropagation(); setActiveActivity(act); setEditingTask(task); }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
//                               <Edit3 size={14} />
//                             </button>
//                           )}
//                         </div>
//                         <div className="flex items-center gap-2 mb-3">
//                           <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 text-white rounded">TASK {tIdx + 1}</span>
//                           <span className={`text-[9px] font-black px-2 py-0.5 rounded ${task.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>{task.status}</span>
//                         </div>
//                         <p className={`text-sm font-bold text-slate-800 mb-4 line-clamp-2 ${task.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>{task.title}</p>
//                         <div className="flex justify-between items-end border-t border-slate-50 pt-3">
//                           <div className="space-y-1">
//                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Assignee</span>
//                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600"><User size={12} className="text-indigo-400"/> {task.assignedTo || 'Unassigned'}</div>
//                           </div>
//                           <div className="text-right space-y-1">
//                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Deadline</span>
//                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 justify-end"><Clock size={12} className="text-amber-400"/> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</div>
//                           </div>
//                         </div>
//                       </div>
//                     )) : (
//                       <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
//                         <CheckCircle2 size={32} className="text-emerald-500 mb-2 opacity-30" />
//                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section Complete</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };
// 'use client'

// import React, { useState, useMemo } from "react";
// import { 
//   User, FileSpreadsheet, Clock, LayoutGrid, Briefcase, 
//   Warehouse, ChevronDown, ChevronUp, Construction, 
//   ExternalLink, ListChecks, CheckCircle2 
// } from "lucide-react";
// import Link from "next/link";
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { toast } from "sonner";
// //import { SearchFilterEngine, SearchScope } from "./SearchFilterEngine";
// import { ItemActions } from "../SubComponents";
// import MM_TaskForm from "../TaskForm";
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// const ACTIVITY_SEARCH_SCOPES: SearchScope[] = [
//   { key: 'projectName', label: 'Project' },
//   { key: 'activityDesc', label: 'Activity' },
//   { key: 'supervisor', label: 'Supervisor' },
//   { key: 'workshop', label: 'Workshop' },
//   { key: 'taskTitle', label: 'Task Title' },
// ];

// export const ActivityTableView = ({ 
//   activities = [], onEdit, onDelete, onAddTask, refreshData, permissions 
// }: any) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [activeFields, setActiveFields] = useState<string[]>(['projectName', 'activityDesc', 'workshop']);
//   const [showUnfulfilledOnly, setShowUnfulfilledOnly] = useState(false);
//   const [expandedId, setExpandedId] = useState<string | null>(null);
//   const [editingTask, setEditingTask] = useState<any | null>(null);
//   //   // UI State
//   const [isScopeOpen, setIsScopeOpen] = useState(false);
//  // const [editingTask, setEditingTask] = useState<any | null>(null);
//   const [activeActivity, setActiveActivity] = useState<any | null>(null);

//   // --- FILTER LOGIC ---
//   const filteredActivities = useMemo(() => {
//     let result = activities;

//     if (showUnfulfilledOnly) {
//       result = result.filter((act: any) => {
//         const total = act.tasks?.length || 0;
//         const completed = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//         return total === 0 || completed < total;
//       });
//     }

//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return result;

//     return result.filter((act: any) => {
//       const workshop = act.project?.responsibleWorkshop;
//       const matchProject = activeFields.includes('projectName') && act.project?.name?.toLowerCase().includes(term);
//       const matchActivity = activeFields.includes('activityDesc') && act.description?.toLowerCase().includes(term);
//       const matchSupervisor = activeFields.includes('supervisor') && act.supervisor?.toLowerCase().includes(term);
//       const matchWorkshop = activeFields.includes('workshop') && (
//         workshop?.name?.toLowerCase().includes(term) || workshop?.location?.toLowerCase().includes(term)
//       );
//       const matchTasks = activeFields.includes('taskTitle') && 
//         act.tasks?.some((task: any) => task.title?.toLowerCase().includes(term));

//       return matchProject || matchActivity || matchSupervisor || matchWorkshop || matchTasks;
//     });
//   }, [activities, searchTerm, activeFields, showUnfulfilledOnly]);

//   const handleExport = async () => {
//     try {
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet('Operational Report');
//       // ... (Rest of your Excel logic remains the same)
//       const buffer = await workbook.xlsx.writeBuffer();
//       saveAs(new Blob([buffer]), `Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//       toast.success("Export successful");
//     } catch (e) { toast.error("Export failed"); }
//   };

//   return (
//     <div className="w-full space-y-6 pb-10">
//       {/* MODAL SYSTEM */}
//       {editingTask && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        
//           <MM_TaskForm 
//                  initialData={editingTask} activities={activities}
//                  preselectedActivity={activeActivity} 
//                  onClose={() => { setEditingTask(null); setActiveActivity(null); }}
//                  onSuccess={() => { toast.success("Records Updated"); setEditingTask(null); if(refreshData) refreshData(); }} 
//                />
//         </div>
//       )}

//       {/* SEARCH BAR SECTION */}
//       <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
//           <div className="w-full lg:flex-1">
//             <SearchFilterEngine 
//               scopes={ACTIVITY_SEARCH_SCOPES}
//               initialActiveScopes={activeFields}
//               onSearchChange={setSearchTerm}
//               onScopesChange={setActiveFields}
//               placeholder="Search across activities..."
//             />
//           </div>
//           <div className="flex items-center gap-2 w-full lg:w-auto">
//             <button 
//               onClick={() => setShowUnfulfilledOnly(!showUnfulfilledOnly)}
//               className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl transition-all border font-black uppercase text-[10px] tracking-widest ${
//                 showUnfulfilledOnly ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-slate-200 text-slate-400'
//               }`}
//             >
//               {showUnfulfilledOnly ? <ListChecks size={16}/> : <Construction size={16} />}
//               {showUnfulfilledOnly ? "Pending" : "All Work"}
//             </button>
//             <button onClick={handleExport} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all">
//               <FileSpreadsheet size={16} />
//               <span className="text-[10px] font-black uppercase tracking-widest">Excel</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* FEED GRID */}
//       <div className="grid grid-cols-1 gap-4">
//         {filteredActivities.map((act: any) => {
//           const isExpanded = expandedId === act.id;
//           const totalTasks = act.tasks?.length || 0;
//           const completedCount = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//           const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

//           return (
//             <div key={act.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden hover:shadow-lg transition-all">
//               <div 
//                 className={`p-5 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
//                 onClick={() => setExpandedId(isExpanded ? null : act.id)}
//               >
//                 <div className="flex items-center gap-4 flex-1">
//                   <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
//                     <LayoutGrid size={20} />
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2 mb-1">
//                       <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded uppercase">
//                         {act.project?.name || 'GLOBAL'}
//                       </span>
//                     </div>
//                     <h3 className="text-sm font-bold text-slate-900">{act.description}</h3>
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-between md:w-48 border-t md:border-t-0 pt-3 md:pt-0">
//                   <div className="flex-1 mr-4">
//                     <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-1">
//                       <span>Progress</span>
//                       <span>{progress}%</span>
//                     </div>
//                     <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
//                       <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                     {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
//                   </div>
//                 </div>
//               </div>

//               {isExpanded && (
//                 <div className="bg-slate-50 p-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {act.tasks?.map((task: any) => (
//                     <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-200">
//                       <p className="text-xs font-bold text-slate-800 mb-2">{task.title}</p>
//                       <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
//                         <span className="flex items-center gap-1"><User size={12}/> {task.assignedTo || 'Open'}</span>
//                         <span className="flex items-center gap-1"><Clock size={12}/> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };
// 'use client'

// import { 
//   Search, User, FileSpreadsheet, X, Clock, LayoutGrid, Filter, 
//   Briefcase, Warehouse, ChevronDown, ChevronUp, Construction, 
//   ExternalLink, ListChecks, CheckCircle2, Settings2, Check
// } from "lucide-react";
// import React, { useState, useMemo, useRef, useEffect } from "react";
// import { ItemActions } from "../SubComponents";
// import Link from "next/link";
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import MM_TaskForm from "../TaskForm";
// import { toast } from "sonner";

// export const searchableActivityFields = {
//     projectName: { label: 'Project', type: 'string' },
//     activityDesc: { label: 'Activity', type: 'string' },
//     supervisor: { label: 'Supervisor', type: 'string' },
//     workshop: { label: 'Workshop', type: 'string' },
//     taskTitle: { label: 'Task Title', type: 'string' },
// };

// export type ActivitySearchKey = keyof typeof searchableActivityFields;

// export const ActivityTableView = ({ 
//   activities = [], 
//   onEdit, 
//   onDelete, 
//   onAddTask, 
//   onEditTask, 
//   onDeleteTask, 
//   permissions,
//   refreshData 
// }: any) => {
//   const [expandedId, setExpandedId] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [showUnfulfilledOnly, setShowUnfulfilledOnly] = useState(false);
//   const [activeSearchFields, setActiveSearchFields] = useState<ActivitySearchKey[]>(
//     ['projectName', 'activityDesc', 'workshop']
//   );

//   // UI State
//   const [isScopeOpen, setIsScopeOpen] = useState(false);
//   const [editingTask, setEditingTask] = useState<any | null>(null);
//   const [activeActivity, setActiveActivity] = useState<any | null>(null);
//   const scopeRef = useRef<HTMLDivElement>(null);

//   // Close dropdown on outside click
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (scopeRef.current && !scopeRef.current.contains(event.target as Node)) {
//         setIsScopeOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // --- FILTER ENGINE ---
//   const filteredActivities = useMemo(() => {
//     let result = activities;

//     if (showUnfulfilledOnly) {
//       result = result.filter((act: any) => {
//         const total = act.tasks?.length || 0;
//         const completed = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//         return total === 0 || completed < total; 
//       });
//     }

//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return result;

//     return result.filter((act: any) => {
//       const workshop = act.project?.responsibleWorkshop;
//       const matchProject = activeSearchFields.includes('projectName') && act.project?.name?.toLowerCase().includes(term);
//       const matchActivity = activeSearchFields.includes('activityDesc') && act.description?.toLowerCase().includes(term);
//       const matchSupervisor = activeSearchFields.includes('supervisor') && act.supervisor?.toLowerCase().includes(term);
//       const matchWorkshop = activeSearchFields.includes('workshop') && (
//         workshop?.name?.toLowerCase().includes(term) || workshop?.location?.toLowerCase().includes(term)
//       );
//       const matchTasks = activeSearchFields.includes('taskTitle') && 
//         act.tasks?.some((task: any) => task.title?.toLowerCase().includes(term));

//       return matchProject || matchActivity || matchSupervisor || matchWorkshop || matchTasks;
//     });
//   }, [activities, searchTerm, activeSearchFields, showUnfulfilledOnly]);

//   const handleExport = async () => {
//     try {
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Operational Report');
//         worksheet.columns = [
//           { header: 'Project', key: 'project', width: 25 },
//           { header: 'Workshop', key: 'workshop', width: 20 },
//           { header: 'Activity/Task', key: 'title', width: 40 },
//           { header: 'Supervisor/Assignee', key: 'owner', width: 25 },
//           { header: 'Status', key: 'status', width: 15 },
//           { header: 'Deadline', key: 'date', width: 15 },
//         ];
//         worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
//         worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };

//         filteredActivities.forEach((act: any) => {
//           const actRow = worksheet.addRow({
//             project: act.project?.name || 'GLOBAL',
//             workshop: act.project?.responsibleWorkshop?.name || 'N/A',
//             title: act.description.toUpperCase(),
//             owner: act.supervisor || 'Unassigned',
//             status: act.stage || 'ACTIVE',
//             date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : 'N/A',
//           });
//           actRow.font = { bold: true };
//           actRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };

//           const tasksToExport = showUnfulfilledOnly ? act.tasks?.filter((t: any) => t.status !== 'COMPLETED') : act.tasks;
//           tasksToExport?.forEach((t: any) => {
//             const taskRow = worksheet.addRow({
//               title: `   ↳ ${t.title}`, 
//               owner: t.assignedTo || 'Unassigned', 
//               status: t.status,
//               date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A',
//             });
//             if (t.status === 'COMPLETED') taskRow.font = { italic: true, color: { argb: '94A3B8' } };
//           });
//           worksheet.addRow({});
//         });

//         const buffer = await workbook.xlsx.writeBuffer();
//         saveAs(new Blob([buffer]), `Operational_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//         toast.success("Report exported successfully");
//     } catch (e) { 
//         toast.error("Export failed"); 
//     }
//   };

//   return (
//     <div className="w-full space-y-4 md:space-y-6 relative pb-10">
//       {/* TASK MODAL */}
//       {editingTask && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
//              <MM_TaskForm 
//                 initialData={editingTask} activities={activities}
//                 preselectedActivity={activeActivity} 
//                 onClose={() => { setEditingTask(null); setActiveActivity(null); }}
//                 onSuccess={() => { toast.success("Records Updated"); setEditingTask(null); if(refreshData) refreshData(); }} 
//               />
//           </div>
//         </div>
//       )}

//       {/* 🔍 COMPACT SEARCH & DROPDOWN ENGINE */}
//       <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col lg:flex-row gap-3 md:gap-4 items-center">
          
//           {/* Main Search Input Group */}
//           <div className="relative w-full flex-1 flex gap-2">
//             <div className="relative flex-1 group">
//                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//                 <input
//                     type="text" 
//                     placeholder={`Search in ${activeSearchFields.length} fields...`}
//                     className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
//                     value={searchTerm} 
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//                 {searchTerm && (
//                     <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400">
//                         <X size={14} />
//                     </button>
//                 )}
//             </div>

//             {/* DROPDOWN SCOPE SELECTOR */}
//             <div className="relative" ref={scopeRef}>
//                 <button 
//                     onClick={() => setIsScopeOpen(!isScopeOpen)}
//                     className={`h-full px-4 rounded-2xl border transition-all flex items-center gap-2 ${
//                         isScopeOpen ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500'
//                     }`}
//                 >
//                     <Settings2 size={18} />
//                     <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Scope</span>
//                 </button>

//                 {isScopeOpen && (
//                     <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
//                         <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">
//                             Include in Search:
//                         </p>
//                         <div className="space-y-1">
//                             {Object.entries(searchableActivityFields).map(([key, config]) => {
//                                 const isActive = activeSearchFields.includes(key as ActivitySearchKey);
//                                 return (
//                                     <button
//                                         key={key}
//                                         onClick={() => {
//                                             const k = key as ActivitySearchKey;
//                                             setActiveSearchFields(prev => isActive ? prev.filter(f => f !== k) : [...prev, k]);
//                                         }}
//                                         className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
//                                             isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-500'
//                                         }`}
//                                     >
//                                         {config.label}
//                                         {isActive && <Check size={14} />}
//                                     </button>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 )}
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex items-center gap-2 w-full lg:w-auto">
//             <button 
//                 onClick={() => setShowUnfulfilledOnly(!showUnfulfilledOnly)}
//                 className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl transition-all border font-black uppercase text-[10px] tracking-widest ${
//                     showUnfulfilledOnly ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-slate-200 text-slate-400'
//                 }`}
//             >
//                 {showUnfulfilledOnly ? <ListChecks size={16}/> : <Construction size={16} />}
//                 {showUnfulfilledOnly ? "Pending" : "All Work"}
//             </button>
//             <button onClick={handleExport} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all">
//                 <FileSpreadsheet size={16} />
//                 <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
//             </button>
//           </div>
//         </div>

//         {/* ACTIVE SCOPE INDICATOR */}
//         <div className="flex flex-wrap gap-1.5 pt-1">
//             {activeSearchFields.map(field => (
//                 <span key={field} className="text-[8px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200 uppercase tracking-tighter">
//                     {searchableActivityFields[field].label}
//                 </span>
//             ))}
//         </div>
//       </div>

//       {/* 🏗️ FEED (Remains logically same, adjusted for mobile spacing) */}
//       <div className="grid grid-cols-1 gap-4">
//         {filteredActivities.map((act: any) => {
//           const isExpanded = expandedId === act.id;
//           const tasksToDisplay = showUnfulfilledOnly ? act.tasks?.filter((t: any) => t.status !== 'COMPLETED') : act.tasks;
//           const totalTasks = act.tasks?.length || 0;
//           const completedCount = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//           const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
//           const isOverdue = act.scheduledEnd && new Date(act.scheduledEnd) < new Date() && progress < 100;

//           return (
//             <div key={act.id} className={`bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 ${isOverdue ? 'border-red-200' : 'border-slate-200 hover:shadow-lg'}`}>
//               <div className={`p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`} onClick={() => setExpandedId(isExpanded ? null : act.id)}>
//                 <div className="flex items-center gap-4">
//                     <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] flex flex-col items-center justify-center shrink-0 ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
//                         <LayoutGrid size={20} />
//                     </div>
//                     <div className="md:hidden flex-1">
//                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-white rounded-md font-black text-[8px] uppercase w-fit mb-1">
//                             <Briefcase size={10} className="text-indigo-400" /> {act.project?.name || 'GLOBAL'}
//                         </div>
//                         <h3 className="text-sm font-bold text-slate-900 leading-tight">{act.description}</h3>
//                     </div>
//                 </div>

//                 <div className="hidden md:block flex-1 min-w-0 space-y-2">
//                   <div className="flex flex-wrap items-center gap-2">
//                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase">
//                         <Briefcase size={12} className="text-indigo-400" /> {act.project?.name || 'GLOBAL'}
//                     </div>
//                     {act.project?.responsibleWorkshop && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg font-black text-[10px] uppercase"><Warehouse size={12}/> {act.project.responsibleWorkshop.name}</div>}
//                   </div>
//                   <h3 className="text-lg font-bold text-slate-900 leading-tight">{act.description}</h3>
//                 </div>

//                 <div className="flex md:flex-col items-center md:items-end justify-between gap-4 md:w-40 border-t md:border-t-0 pt-3 md:pt-0">
//                     <div className="flex flex-col md:items-end gap-1 flex-1">
//                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{progress}%</span>
//                         <div className="w-full md:w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
//                             <div className={`h-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }} />
//                         </div>
//                     </div>
//                     <div className="flex items-center gap-1">
//                         <Link href={`/mm/activities/${act.id}`} onClick={(e) => e.stopPropagation()} className="p-2 text-slate-400 hover:text-indigo-600"><ExternalLink size={16} /></Link>
//                         {isExpanded ? <ChevronUp size={20} className="text-indigo-500" /> : <ChevronDown size={20} className="text-slate-300" />}
//                     </div>
//                 </div>
//               </div>

//               {isExpanded && (
//                 <div className="bg-slate-50/50 p-4 md:p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
//                     {tasksToDisplay?.length > 0 ? tasksToDisplay.map((task: any, tIdx: number) => (
//                       <div key={task.id} className={`bg-white p-4 rounded-[1.5rem] border transition-all group relative ${task.status === 'COMPLETED' ? 'bg-emerald-50/30 border-emerald-100 opacity-80' : 'border-slate-200 shadow-sm'}`}>
//                         <p className={`text-sm font-bold text-slate-800 mb-3 ${task.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>{task.title}</p>
//                         <div className="flex justify-between items-end border-t border-slate-50 pt-3">
//                           <div className="space-y-1">
//                             <span className="text-[8px] font-black text-slate-400 uppercase">Assignee</span>
//                             <div className="text-[10px] font-bold text-slate-600">{task.assignedTo || 'Unassigned'}</div>
//                           </div>
//                           <div className="text-right space-y-1">
//                             <span className="text-[8px] font-black text-slate-400 uppercase">Due</span>
//                             <div className="text-[10px] font-bold text-slate-600">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</div>
//                           </div>
//                         </div>
//                       </div>
//                     )) : (
//                         <div className="col-span-full py-8 text-center text-[10px] font-black uppercase text-slate-400">Section Complete</div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };
// 'use client'

// import { 
//   Search, User, FileSpreadsheet, X, Clock, LayoutGrid, Target, 
//   Edit3, CheckCircle, Filter, Briefcase, Warehouse, ChevronDown, ChevronUp, 
//   Construction, ExternalLink, AlertTriangle, ListChecks, CheckCircle2
// } from "lucide-react";
// import React, { useState, useMemo } from "react";
// import { ItemActions } from "../SubComponents";
// import Link from "next/link";
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import MM_TaskForm from "../TaskForm";
// import { toast } from "sonner";

// export const searchableActivityFields = {
//     projectName: { label: 'Project', type: 'string' },
//     activityDesc: { label: 'Activity', type: 'string' },
//     supervisor: { label: 'Supervisor', type: 'string' },
//     workshop: { label: 'Workshop', type: 'string' },
//     taskTitle: { label: 'Task Title', type: 'string' },
// };

// export type ActivitySearchKey = keyof typeof searchableActivityFields;

// export const ActivityTableView = ({ 
//   activities = [], 
//   onEdit, 
//   onDelete, 
//   onAddTask, 
//   onEditTask, 
//   onDeleteTask, 
//   permissions,
//   refreshData 
// }: any) => {
//   const [expandedId, setExpandedId] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [showUnfulfilledOnly, setShowUnfulfilledOnly] = useState(false);
//   const [activeSearchFields, setActiveSearchFields] = useState<ActivitySearchKey[]>(
//     ['projectName', 'activityDesc', 'workshop']
//   );

//   const [editingTask, setEditingTask] = useState<any | null>(null);
//   const [activeActivity, setActiveActivity] = useState<any | null>(null);

//   // --- DATABASE-LEVEL FILTER ENGINE ---
//   const filteredActivities = useMemo(() => {
//     let result = activities;

//     // 1. Filter Activity Rows (Global "Pending" status)
//     if (showUnfulfilledOnly) {
//       result = result.filter((act: any) => {
//         const total = act.tasks?.length || 0;
//         const completed = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//         // If an activity has no tasks, we treat it as unfulfilled/pending initialization
//         return total === 0 || completed < total; 
//       });
//     }

//     // 2. Multi-Field Search Logic based on ActiveSearchFields
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return result;

//     return result.filter((act: any) => {
//       const workshop = act.project?.responsibleWorkshop;

//       // Check each active scope
//       const matchProject = activeSearchFields.includes('projectName') && 
//         act.project?.name?.toLowerCase().includes(term);

//       const matchActivity = activeSearchFields.includes('activityDesc') && 
//         act.description?.toLowerCase().includes(term);

//       const matchSupervisor = activeSearchFields.includes('supervisor') && 
//         act.supervisor?.toLowerCase().includes(term);

//       const matchWorkshop = activeSearchFields.includes('workshop') && (
//         workshop?.name?.toLowerCase().includes(term) || 
//         workshop?.location?.toLowerCase().includes(term)
//       );

//       const matchTasks = activeSearchFields.includes('taskTitle') && 
//         act.tasks?.some((task: any) => task.title?.toLowerCase().includes(term));

//       return matchProject || matchActivity || matchSupervisor || matchWorkshop || matchTasks;
//     });
//   }, [activities, searchTerm, activeSearchFields, showUnfulfilledOnly]);

//   const handleExport = async () => {
//     try {
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Operational Report');
        
//         // Define Columns
//         worksheet.columns = [
//           { header: 'Project', key: 'project', width: 25 },
//           { header: 'Workshop', key: 'workshop', width: 20 },
//           { header: 'Activity/Task', key: 'title', width: 40 },
//           { header: 'Supervisor/Assignee', key: 'owner', width: 25 },
//           { header: 'Status', key: 'status', width: 15 },
//           { header: 'Deadline', key: 'date', width: 15 },
//         ];

//         // Style Header Row
//         worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
//         worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };

//         // Process current filtered results
//         filteredActivities.forEach((act: any) => {
//           // Add Activity Row
//           const actRow = worksheet.addRow({
//             project: act.project?.name || 'GLOBAL',
//             workshop: act.project?.responsibleWorkshop?.name || 'N/A',
//             title: act.description.toUpperCase(),
//             owner: act.supervisor || 'Unassigned',
//             status: act.stage || 'ACTIVE',
//             date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : 'N/A',
//           });

//           // Style Activity Row (Highlight as a Group Header)
//           actRow.font = { bold: true };
//           actRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };

//           // Filter tasks based on current UI state (Pending vs All)
//           const tasksToExport = showUnfulfilledOnly 
//             ? act.tasks?.filter((t: any) => t.status !== 'COMPLETED') 
//             : act.tasks;

//           tasksToExport?.forEach((t: any) => {
//             const taskRow = worksheet.addRow({
//               project: '', 
//               workshop: '', 
//               title: `   ↳ ${t.title}`, // Indent for hierarchy
//               owner: t.assignedTo || 'Unassigned', 
//               status: t.status,
//               date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A',
//             });

//             // If task is completed, make it look "de-emphasized" in Excel
//             if (t.status === 'COMPLETED') {
//               taskRow.font = { italic: true, color: { argb: '94A3B8' } };
//             }
//           });

//           // Add a spacer row for readability
//           worksheet.addRow({});
//         });

//         // Generate and Save File
//         const buffer = await workbook.xlsx.writeBuffer();
//         const fileName = showUnfulfilledOnly 
//             ? `Pending_Operational_Report_${new Date().toISOString().split('T')[0]}.xlsx`
//             : `Full_Operational_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            
//         saveAs(new Blob([buffer]), fileName);
//         toast.success("Scoped report exported successfully");
//     } catch (e) { 
//         console.error(e);
//         toast.error("Export failed: Check console for details"); 
//     }
//   };

//   return (
//     <div className="w-full space-y-6 relative pb-10">
//       {/* TASK MODAL */}
//       {editingTask && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
//              <MM_TaskForm 
//                 initialData={editingTask} activities={activities}
//                 preselectedActivity={activeActivity} 
//                 onClose={() => { setEditingTask(null); setActiveActivity(null); }}
//                 onSuccess={() => { toast.success("Records Updated"); setEditingTask(null); if(refreshData) refreshData(); }} 
//               />
//           </div>
//         </div>
//       )}

//       {/* 🔍 SEARCH & SCOPE CONTROLS */}
//       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
//           <div className="relative w-full max-w-md group">
//             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//             <input
//               type="text" placeholder={`Search across ${activeSearchFields.length} fields...`}
//               className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
//               value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400"><X size={16} /></button>}
//           </div>

//           <div className="flex items-center gap-2 w-full md:w-auto">
//             <button 
//                 onClick={() => setShowUnfulfilledOnly(!showUnfulfilledOnly)}
//                 className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl transition-all shadow-sm border font-black uppercase text-[10px] tracking-widest ${
//                     showUnfulfilledOnly ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
//                 }`}
//             >
//                 {showUnfulfilledOnly ? <ListChecks size={18}/> : <Construction size={18} />}
//                 {showUnfulfilledOnly ? "Pending Items" : "All Work"}
//             </button>
//             <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg">
//                 <FileSpreadsheet size={18} />
//                 <span className="text-[10px] font-black uppercase tracking-widest">Excel</span>
//             </button>
//           </div>
//         </div>

//         {/* DYNAMIC FIELD SELECTOR */}
//         <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-50">
//             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Filter size={14} /> Active Scopes:</span>
//             {Object.entries(searchableActivityFields).map(([key, config]) => {
//                 const isActive = activeSearchFields.includes(key as ActivitySearchKey);
//                 return (
//                     <button
//                         key={key}
//                         onClick={() => {
//                             const k = key as ActivitySearchKey;
//                             setActiveSearchFields(prev => isActive ? prev.filter(f => f !== k) : [...prev, k]);
//                         }}
//                         className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
//                             isActive ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
//                         }`}
//                     >
//                         {config.label}
//                     </button>
//                 );
//             })}
//         </div>
//       </div>

//       {/* 🏗️ FEED */}
//       <div className="grid grid-cols-1 gap-4">
//         {filteredActivities.map((act: any) => {
//           const workshop = act.project?.responsibleWorkshop;
//           const isExpanded = expandedId === act.id;
          
//           // Internal Task Filtering logic
//           const tasksToDisplay = showUnfulfilledOnly 
//             ? act.tasks?.filter((t: any) => t.status !== 'COMPLETED') 
//             : act.tasks;

//           const totalTasks = act.tasks?.length || 0;
//           const completedCount = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//           const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
//           const isOverdue = act.scheduledEnd && new Date(act.scheduledEnd) < new Date() && progress < 100;

//           return (
//             <div key={act.id} className={`bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 ${isOverdue ? 'border-red-200' : 'border-slate-200 hover:shadow-xl'}`}>
//               <div className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`} onClick={() => setExpandedId(isExpanded ? null : act.id)}>
//                 <div className="flex items-center gap-4">
//                     <div className={`w-14 h-14 rounded-[1.25rem] flex flex-col items-center justify-center ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
//                         <LayoutGrid size={20} />
//                     </div>
//                 </div>

//                 <div className="flex-1 min-w-0 space-y-3">
//                   <div className="flex flex-wrap items-center gap-2">
//                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase">
//                         <Briefcase size={12} className="text-indigo-400" /> {act.project?.name || 'GLOBAL'}
//                     </div>
//                     {workshop && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg font-black text-[10px] uppercase"><Warehouse size={12}/> {workshop.name}</div>}
//                   </div>
//                   <h3 className="text-lg font-bold text-slate-900 leading-tight">{act.description}</h3>
//                   <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500 font-bold">
//                     <div className="flex items-center gap-2 text-slate-700"><User size={12}/>{act.supervisor || 'Unassigned'}</div>
//                     <div className="flex items-center gap-2 text-indigo-600"><CheckCircle2 size={12}/>{completedCount} / {totalTasks} Tasks</div>
//                   </div>
//                 </div>

//                 {/* Progress Indicators */}
//                 <div className="flex md:flex-col items-center md:items-end justify-between gap-4 md:w-40 border-t md:border-t-0 pt-4 md:pt-0">
//                     <div className="flex flex-col md:items-end gap-1 flex-1 md:flex-none">
//                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{progress}% Done</span>
//                         <div className="w-full md:w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
//                             <div className={`h-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }} />
//                         </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <Link href={`/mm/activities/${act.id}`} onClick={(e) => e.stopPropagation()} className="p-2 text-slate-400 hover:text-indigo-600"><ExternalLink size={18} /></Link>
//                         <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                         {isExpanded ? <ChevronUp size={20} className="text-indigo-500" /> : <ChevronDown size={20} className="text-slate-300" />}
//                     </div>
//                 </div>
//               </div>

//               {/* GRID OF TASKS */}
//               {isExpanded && (
//                 <div className="bg-slate-50/50 p-6 md:p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {tasksToDisplay?.length > 0 ? tasksToDisplay.map((task: any, tIdx: number) => (
//                       <div key={task.id} className={`bg-white p-5 rounded-[1.5rem] border transition-all group relative ${task.status === 'COMPLETED' ? 'bg-emerald-50/30 border-emerald-100 opacity-80' : 'border-slate-200 hover:border-indigo-300 shadow-sm'}`}>
//                         <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
//                           {permissions?.canEdit && <button onClick={(e) => { e.stopPropagation(); setActiveActivity(act); setEditingTask(task); }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Edit3 size={14} /></button>}
//                         </div>
//                         <div className="flex items-center gap-2 mb-3">
//                             <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 text-white rounded">TASK {tIdx + 1}</span>
//                             <span className={`text-[9px] font-black px-2 py-0.5 rounded ${task.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>{task.status}</span>
//                         </div>
//                         <p className={`text-sm font-bold text-slate-800 mb-4 line-clamp-2 ${task.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>{task.title}</p>
//                         <div className="flex justify-between items-end border-t border-slate-50 pt-3">
//                           <div className="space-y-1">
//                             <span className="text-[8px] font-black text-slate-400 uppercase">Assignee</span>
//                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600"><User size={12} className="text-indigo-400"/> {task.assignedTo || 'Unassigned'}</div>
//                           </div>
//                           <div className="text-right space-y-1">
//                             <span className="text-[8px] font-black text-slate-400 uppercase">Deadline</span>
//                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 justify-end"><Clock size={12} className="text-amber-400"/> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</div>
//                           </div>
//                         </div>
//                       </div>
//                     )) : (
//                         <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
//                             <CheckCircle2 size={32} className="text-emerald-500 mb-2 opacity-30" />
//                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section Complete</p>
//                         </div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };