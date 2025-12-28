'use client'

import { 
  Search, User, FileSpreadsheet, X, Clock, LayoutGrid, Target, 
  Edit3, CheckCircle, Filter, Briefcase, Warehouse, ChevronDown, ChevronUp, 
  Construction, ExternalLink, AlertTriangle, ListChecks, CheckCircle2
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { ItemActions } from "../SubComponents";
import Link from "next/link";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import MM_TaskForm from "../TaskForm";
import { toast } from "sonner";

export const searchableActivityFields = {
    projectName: { label: 'Project', type: 'string' },
    activityDesc: { label: 'Activity', type: 'string' },
    supervisor: { label: 'Supervisor', type: 'string' },
    workshop: { label: 'Workshop', type: 'string' },
    taskTitle: { label: 'Task Title', type: 'string' },
};

export type ActivitySearchKey = keyof typeof searchableActivityFields;

export const ActivityTableView = ({ 
  activities = [], 
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
  const [showUnfulfilledOnly, setShowUnfulfilledOnly] = useState(false);
  const [activeSearchFields, setActiveSearchFields] = useState<ActivitySearchKey[]>(
    ['projectName', 'activityDesc', 'workshop']
  );

  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [activeActivity, setActiveActivity] = useState<any | null>(null);

  // --- DATABASE-LEVEL FILTER ENGINE ---
  const filteredActivities = useMemo(() => {
    let result = activities;

    // 1. Filter Activity Rows (Global "Pending" status)
    if (showUnfulfilledOnly) {
      result = result.filter((act: any) => {
        const total = act.tasks?.length || 0;
        const completed = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
        // If an activity has no tasks, we treat it as unfulfilled/pending initialization
        return total === 0 || completed < total; 
      });
    }

    // 2. Multi-Field Search Logic based on ActiveSearchFields
    const term = searchTerm.toLowerCase().trim();
    if (!term) return result;

    return result.filter((act: any) => {
      const workshop = act.project?.responsibleWorkshop;

      // Check each active scope
      const matchProject = activeSearchFields.includes('projectName') && 
        act.project?.name?.toLowerCase().includes(term);

      const matchActivity = activeSearchFields.includes('activityDesc') && 
        act.description?.toLowerCase().includes(term);

      const matchSupervisor = activeSearchFields.includes('supervisor') && 
        act.supervisor?.toLowerCase().includes(term);

      const matchWorkshop = activeSearchFields.includes('workshop') && (
        workshop?.name?.toLowerCase().includes(term) || 
        workshop?.location?.toLowerCase().includes(term)
      );

      const matchTasks = activeSearchFields.includes('taskTitle') && 
        act.tasks?.some((task: any) => task.title?.toLowerCase().includes(term));

      return matchProject || matchActivity || matchSupervisor || matchWorkshop || matchTasks;
    });
  }, [activities, searchTerm, activeSearchFields, showUnfulfilledOnly]);

  const handleExport = async () => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Operational Report');
        
        // Define Columns
        worksheet.columns = [
          { header: 'Project', key: 'project', width: 25 },
          { header: 'Workshop', key: 'workshop', width: 20 },
          { header: 'Activity/Task', key: 'title', width: 40 },
          { header: 'Supervisor/Assignee', key: 'owner', width: 25 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Deadline', key: 'date', width: 15 },
        ];

        // Style Header Row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };

        // Process current filtered results
        filteredActivities.forEach((act: any) => {
          // Add Activity Row
          const actRow = worksheet.addRow({
            project: act.project?.name || 'GLOBAL',
            workshop: act.project?.responsibleWorkshop?.name || 'N/A',
            title: act.description.toUpperCase(),
            owner: act.supervisor || 'Unassigned',
            status: act.stage || 'ACTIVE',
            date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : 'N/A',
          });

          // Style Activity Row (Highlight as a Group Header)
          actRow.font = { bold: true };
          actRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };

          // Filter tasks based on current UI state (Pending vs All)
          const tasksToExport = showUnfulfilledOnly 
            ? act.tasks?.filter((t: any) => t.status !== 'COMPLETED') 
            : act.tasks;

          tasksToExport?.forEach((t: any) => {
            const taskRow = worksheet.addRow({
              project: '', 
              workshop: '', 
              title: `   ↳ ${t.title}`, // Indent for hierarchy
              owner: t.assignedTo || 'Unassigned', 
              status: t.status,
              date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A',
            });

            // If task is completed, make it look "de-emphasized" in Excel
            if (t.status === 'COMPLETED') {
              taskRow.font = { italic: true, color: { argb: '94A3B8' } };
            }
          });

          // Add a spacer row for readability
          worksheet.addRow({});
        });

        // Generate and Save File
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = showUnfulfilledOnly 
            ? `Pending_Operational_Report_${new Date().toISOString().split('T')[0]}.xlsx`
            : `Full_Operational_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            
        saveAs(new Blob([buffer]), fileName);
        toast.success("Scoped report exported successfully");
    } catch (e) { 
        console.error(e);
        toast.error("Export failed: Check console for details"); 
    }
  };

  return (
    <div className="w-full space-y-6 relative pb-10">
      {/* TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
             <MM_TaskForm 
                initialData={editingTask} activities={activities}
                preselectedActivity={activeActivity} 
                onClose={() => { setEditingTask(null); setActiveActivity(null); }}
                onSuccess={() => { toast.success("Records Updated"); setEditingTask(null); if(refreshData) refreshData(); }} 
              />
          </div>
        </div>
      )}

      {/* 🔍 SEARCH & SCOPE CONTROLS */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text" placeholder={`Search across ${activeSearchFields.length} fields...`}
              className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400"><X size={16} /></button>}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
                onClick={() => setShowUnfulfilledOnly(!showUnfulfilledOnly)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl transition-all shadow-sm border font-black uppercase text-[10px] tracking-widest ${
                    showUnfulfilledOnly ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
                }`}
            >
                {showUnfulfilledOnly ? <ListChecks size={18}/> : <Construction size={18} />}
                {showUnfulfilledOnly ? "Pending Items" : "All Work"}
            </button>
            <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg">
                <FileSpreadsheet size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Excel</span>
            </button>
          </div>
        </div>

        {/* DYNAMIC FIELD SELECTOR */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Filter size={14} /> Active Scopes:</span>
            {Object.entries(searchableActivityFields).map(([key, config]) => {
                const isActive = activeSearchFields.includes(key as ActivitySearchKey);
                return (
                    <button
                        key={key}
                        onClick={() => {
                            const k = key as ActivitySearchKey;
                            setActiveSearchFields(prev => isActive ? prev.filter(f => f !== k) : [...prev, k]);
                        }}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
                            isActive ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
                        }`}
                    >
                        {config.label}
                    </button>
                );
            })}
        </div>
      </div>

      {/* 🏗️ FEED */}
      <div className="grid grid-cols-1 gap-4">
        {filteredActivities.map((act: any) => {
          const workshop = act.project?.responsibleWorkshop;
          const isExpanded = expandedId === act.id;
          
          // Internal Task Filtering logic
          const tasksToDisplay = showUnfulfilledOnly 
            ? act.tasks?.filter((t: any) => t.status !== 'COMPLETED') 
            : act.tasks;

          const totalTasks = act.tasks?.length || 0;
          const completedCount = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
          const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
          const isOverdue = act.scheduledEnd && new Date(act.scheduledEnd) < new Date() && progress < 100;

          return (
            <div key={act.id} className={`bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 ${isOverdue ? 'border-red-200' : 'border-slate-200 hover:shadow-xl'}`}>
              <div className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`} onClick={() => setExpandedId(isExpanded ? null : act.id)}>
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

                {/* Progress Indicators */}
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

              {/* GRID OF TASKS */}
              {isExpanded && (
                <div className="bg-slate-50/50 p-6 md:p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasksToDisplay?.length > 0 ? tasksToDisplay.map((task: any, tIdx: number) => (
                      <div key={task.id} className={`bg-white p-5 rounded-[1.5rem] border transition-all group relative ${task.status === 'COMPLETED' ? 'bg-emerald-50/30 border-emerald-100 opacity-80' : 'border-slate-200 hover:border-indigo-300 shadow-sm'}`}>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          {permissions?.canEdit && <button onClick={(e) => { e.stopPropagation(); setActiveActivity(act); setEditingTask(task); }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Edit3 size={14} /></button>}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 text-white rounded">TASK {tIdx + 1}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded ${task.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>{task.status}</span>
                        </div>
                        <p className={`text-sm font-bold text-slate-800 mb-4 line-clamp-2 ${task.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>{task.title}</p>
                        <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Assignee</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600"><User size={12} className="text-indigo-400"/> {task.assignedTo || 'Unassigned'}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Deadline</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 justify-end"><Clock size={12} className="text-amber-400"/> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</div>
                          </div>
                        </div>
                      </div>
                    )) : (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <CheckCircle2 size={32} className="text-emerald-500 mb-2 opacity-30" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section Complete</p>
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
//   // Set to false by default so everything is shown initially
//   const [showUnfulfilledOnly, setShowUnfulfilledOnly] = useState(false);
//   const [activeSearchFields, setActiveSearchFields] = useState<ActivitySearchKey[]>(
//     ['projectName', 'activityDesc', 'workshop']
//   );

//   const [editingTask, setEditingTask] = useState<any | null>(null);
//   const [activeActivity, setActiveActivity] = useState<any | null>(null);

//   // --- FILTER ENGINE ---
//   const filteredActivities = useMemo(() => {
//     let result = activities;

//     // 1. Activity-Level Filter (Hides 100% complete activities if toggled)
//     if (showUnfulfilledOnly) {
//       result = result.filter((act: any) => {
//         const total = act.tasks?.length || 0;
//         const completed = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//         return total === 0 || completed < total; 
//       });
//     }

//     // 2. Search Logic
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return result;

//     return result.filter((act: any) => {
//       const workshop = act.project?.responsibleWorkshop;
//       const matchesActivity = (
//         (activeSearchFields.includes('projectName') && act.project?.name?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('activityDesc') && act.description?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('supervisor') && act.supervisor?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('workshop') && (
//             workshop?.name?.toLowerCase().includes(term) || 
//             workshop?.location?.toLowerCase().includes(term)
//         ))
//       );
//       const matchesTasks = act.tasks?.some((task: any) => 
//         (activeSearchFields.includes('taskTitle') && task.title?.toLowerCase().includes(term))
//       );
//       return matchesActivity || matchesTasks;
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
//         filteredActivities.forEach((act: any) => {
//           const row = worksheet.addRow({
//             project: act.project?.name || 'N/A',
//             workshop: act.project?.responsibleWorkshop?.name || 'N/A',
//             title: act.description,
//             owner: act.supervisor,
//             status: act.stage,
//             date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : '',
//           });
//           row.font = { bold: true };
//           row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
//           act.tasks?.forEach((t: any) => {
//             worksheet.addRow({
//               project: '', workshop: '', title: `  ↳ ${t.title}`,
//               owner: t.assignedTo, status: t.status,
//               date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
//             });
//           });
//         });
//         const buffer = await workbook.xlsx.writeBuffer();
//         saveAs(new Blob([buffer]), `Operational_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//         toast.success("Excel report exported successfully");
//     } catch (e) { toast.error("Export failed"); }
//   };

//   return (
//     <div className="w-full space-y-6 relative pb-10">
//       {/* TASK EDIT MODAL */}
//       {editingTask && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
//              <MM_TaskForm 
//                 initialData={editingTask} activities={activities}
//                 preselectedActivity={activeActivity} 
//                 onClose={() => { setEditingTask(null); setActiveActivity(null); }}
//                 onSuccess={() => {
//                   toast.success("Database Synchronized");
//                   setEditingTask(null);
//                   if(refreshData) refreshData();
//                 }} 
//               />
//           </div>
//         </div>
//       )}

//       {/* 🔍 TOP CONTROLS */}
//       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
//           <div className="relative w-full max-w-md group">
//             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
//             <input
//               type="text" placeholder="Search activities and tasks..."
//               className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
//               value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>

//           <div className="flex items-center gap-2 w-full md:w-auto">
//             {/* TOGGLE FOR PENDING ONLY */}
//             <button 
//                 onClick={() => setShowUnfulfilledOnly(!showUnfulfilledOnly)}
//                 className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl transition-all shadow-sm border font-black uppercase text-[10px] tracking-widest ${
//                     showUnfulfilledOnly ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
//                 }`}
//             >
//                 {showUnfulfilledOnly ? <ListChecks size={18}/> : <Construction size={18} />}
//                 {showUnfulfilledOnly ? "Pending Items" : "Show All Work"}
//             </button>
//             <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg">
//                 <FileSpreadsheet size={18} />
//                 <span className="text-[10px] font-black uppercase tracking-widest">Excel</span>
//             </button>
//           </div>
//         </div>

//         {/* ... Filter Scopes ... */}
//       </div>

//       {/* 🏗️ MAIN FEED */}
//       <div className="grid grid-cols-1 gap-4">
//         {filteredActivities.map((act: any) => {
//           const workshop = act.project?.responsibleWorkshop;
//           const isExpanded = expandedId === act.id;
          
//           // Logic for Task visibility within the activity
//           const displayTasks = showUnfulfilledOnly 
//             ? act.tasks?.filter((t: any) => t.status !== 'COMPLETED') 
//             : act.tasks;

//           const totalTasks = act.tasks?.length || 0;
//           const completedCount = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//           const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
//           const isOverdue = act.scheduledEnd && new Date(act.scheduledEnd) < new Date() && progress < 100;

//           return (
//             <div key={act.id} className={`bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 ${isOverdue ? 'border-red-200 shadow-red-50' : 'border-slate-200 hover:shadow-xl'}`}>
//               <div className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`} onClick={() => setExpandedId(isExpanded ? null : act.id)}>
//                 <div className="flex items-center gap-4">
//                     <div className={`w-14 h-14 rounded-[1.25rem] flex flex-col items-center justify-center ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
//                         <LayoutGrid size={20} />
//                     </div>
//                 </div>

//                 <div className="flex-1 min-w-0 space-y-3">
//                   <div className="flex flex-wrap items-center gap-2">
//                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase">
//                         <Briefcase size={12} className="text-indigo-400" />{act.project?.name || 'GLOBAL'}
//                     </div>
//                     {workshop && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg font-black text-[10px] uppercase"><Warehouse size={12}/>{workshop.name}</div>}
//                     {isOverdue && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white rounded-lg font-black text-[10px] uppercase animate-pulse">Overdue</div>}
//                   </div>
//                   <h3 className="text-lg font-bold text-slate-900 leading-tight">{act.description}</h3>
//                   <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500 font-bold">
//                     <div className="flex items-center gap-2 text-slate-700"><User size={12}/>{act.supervisor || 'Unassigned'}</div>
//                     <div className="flex items-center gap-2 text-indigo-600"><CheckCircle2 size={12}/>{completedCount} / {totalTasks} Tasks</div>
//                   </div>
//                 </div>

//                 <div className="flex md:flex-col items-center md:items-end justify-between gap-4 md:w-40">
//                     <div className="flex flex-col md:items-end gap-1 flex-1 md:flex-none">
//                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{progress}% Fulfilled</span>
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

//               {/* EXPANDED TASK GRID */}
//               {isExpanded && (
//                 <div className="bg-slate-50/50 p-6 md:p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {displayTasks?.length > 0 ? displayTasks.map((task: any, tIdx: number) => (
//                       <div key={task.id} className={`bg-white p-5 rounded-[1.5rem] border transition-all group relative ${task.status === 'COMPLETED' ? 'border-emerald-100 bg-emerald-50/20 opacity-75' : 'border-slate-200 hover:border-indigo-300 shadow-sm'}`}>
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
//                         <div className="col-span-full py-10 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
//                             <CheckCircle2 size={32} className="text-emerald-500 mb-2 opacity-50" />
//                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">All tasks in this activity are complete.</p>
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

// // --- SEARCH CONFIGURATION ---
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

//   // --- FILTER & LOGIC ENGINE ---
//   const filteredActivities = useMemo(() => {
//     let result = activities;

//     // 1. Filter Activity Rows (Progress < 100%)
//     if (showUnfulfilledOnly) {
//       result = result.filter((act: any) => {
//         const totalTasks = act.tasks?.length || 0;
//         const completedTasks = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//         const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
//         return progress < 100;
//       });
//     }

//     // 2. Search Logic
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return result;

//     return result.filter((act: any) => {
//       const workshop = act.project?.responsibleWorkshop;
//       const matchesActivity = (
//         (activeSearchFields.includes('projectName') && act.project?.name?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('activityDesc') && act.description?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('supervisor') && act.supervisor?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('workshop') && (
//             workshop?.name?.toLowerCase().includes(term) || 
//             workshop?.location?.toLowerCase().includes(term)
//         ))
//       );
//       const matchesTasks = act.tasks?.some((task: any) => 
//         (activeSearchFields.includes('taskTitle') && task.title?.toLowerCase().includes(term))
//       );
//       return matchesActivity || matchesTasks;
//     });
//   }, [activities, searchTerm, activeSearchFields, showUnfulfilledOnly]);

//   // --- EXPORT LOGIC ---
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
//         filteredActivities.forEach((act: any) => {
//           const row = worksheet.addRow({
//             project: act.project?.name || 'N/A',
//             workshop: act.project?.responsibleWorkshop?.name || 'N/A',
//             title: act.description,
//             owner: act.supervisor,
//             status: act.stage,
//             date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : '',
//           });
//           row.font = { bold: true };
//           row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
//           act.tasks?.forEach((t: any) => {
//             worksheet.addRow({
//               project: '', workshop: '', title: `  ↳ ${t.title}`,
//               owner: t.assignedTo, status: t.status,
//               date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
//             });
//           });
//         });
//         const buffer = await workbook.xlsx.writeBuffer();
//         saveAs(new Blob([buffer]), `Operational_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//         toast.success("Excel report exported successfully");
//     } catch (e) { toast.error("Export failed"); }
//   };

//   return (
//     <div className="w-full space-y-6 relative pb-10">
//       {/* TASK EDIT MODAL */}
//       {editingTask && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
//              <MM_TaskForm 
//                 initialData={editingTask} activities={activities}
//                 preselectedActivity={activeActivity} 
//                 onClose={() => { setEditingTask(null); setActiveActivity(null); }}
//                 onSuccess={() => {
//                   toast.success("Sync Complete");
//                   setEditingTask(null);
//                   if(refreshData) refreshData();
//                 }} 
//               />
//           </div>
//         </div>
//       )}

//       {/* 🔍 CONTROLS */}
//       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
//           <div className="relative w-full max-w-md group">
//             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//             <input
//               type="text" placeholder="Search operational data..."
//               className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
//               value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400"><X size={16} /></button>}
//           </div>

//           <div className="flex items-center gap-2 w-full md:w-auto">
//             <button 
//                 onClick={() => setShowUnfulfilledOnly(!showUnfulfilledOnly)}
//                 className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl transition-all shadow-sm border font-black uppercase text-[10px] tracking-widest ${
//                     showUnfulfilledOnly ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-slate-200 text-slate-400'
//                 }`}
//             >
//                 {showUnfulfilledOnly ? <ListChecks size={18}/> : <Construction size={18} />}
//                 {showUnfulfilledOnly ? "Pending Work" : "All Work"}
//             </button>
//             <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg">
//                 <FileSpreadsheet size={18} />
//                 <span className="text-[10px] font-black uppercase tracking-widest">Excel</span>
//             </button>
//           </div>
//         </div>

//         <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-50">
//             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Filter size={14} /> Scopes:</span>
//             {Object.entries(searchableActivityFields).map(([key, config]) => (
//                 <button
//                     key={key}
//                     onClick={() => {
//                         const k = key as ActivitySearchKey;
//                         setActiveSearchFields(prev => prev.includes(k) ? prev.filter(f => f !== k) : [...prev, k]);
//                     }}
//                     className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
//                         activeSearchFields.includes(key as ActivitySearchKey) 
//                         ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' 
//                         : 'bg-white border-slate-200 text-slate-400'
//                     }`}
//                 >
//                     {config.label}
//                 </button>
//             ))}
//         </div>
//       </div>

//       {/* 🏗️ MAIN FEED */}
//       <div className="grid grid-cols-1 gap-4">
//         {filteredActivities.length > 0 ? filteredActivities.map((act: any) => {
//           const workshop = act.project?.responsibleWorkshop;
//           const isExpanded = expandedId === act.id;
//           const totalTasks = act.tasks?.length || 0;
//           const pendingTasks = act.tasks?.filter((t: any) => t.status !== 'COMPLETED') || [];
//           const progress = totalTasks > 0 ? Math.round(((totalTasks - pendingTasks.length) / totalTasks) * 100) : 0;
//           const isOverdue = act.scheduledEnd && new Date(act.scheduledEnd) < new Date() && progress < 100;

//           return (
//             <div key={act.id} className={`bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 ${isOverdue ? 'border-red-200 shadow-lg shadow-red-50' : 'border-slate-200 hover:shadow-xl'}`}>
//               <div className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`} onClick={() => setExpandedId(isExpanded ? null : act.id)}>
//                 <div className="flex items-center gap-4">
//                     <div className={`w-14 h-14 rounded-[1.25rem] flex flex-col items-center justify-center ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
//                         <span className="text-[10px] font-black leading-none mb-1 opacity-50">ACT</span>
//                         <LayoutGrid size={20} />
//                     </div>
//                 </div>

//                 <div className="flex-1 min-w-0 space-y-3">
//                   <div className="flex flex-wrap items-center gap-2">
//                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg"><Briefcase size={12} className="text-indigo-400" /><span className="text-[10px] font-black uppercase">{act.project?.name || 'GLOBAL'}</span></div>
//                     {workshop && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg"><Warehouse size={12}/><span className="text-[10px] font-black uppercase">{workshop.name}</span></div>}
//                     {isOverdue && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white rounded-lg animate-pulse"><AlertTriangle size={12} /><span className="text-[10px] font-black uppercase">Overdue</span></div>}
//                   </div>
//                   <h3 className="text-lg font-bold text-slate-900 leading-tight">{act.description}</h3>
//                   <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500 font-bold">
//                     <div className="flex items-center gap-2 text-slate-700"><User size={12}/>{act.supervisor || 'Unassigned'}</div>
//                     <div className="flex items-center gap-2 text-slate-900"><Target size={14} className="text-emerald-500" />${((act.actualLaborCost || 0) + (act.actualMaterialCost || 0)).toLocaleString()}</div>
//                     <div className="flex items-center gap-2 text-indigo-600"><CheckCircle2 size={12}/>{totalTasks - pendingTasks.length} / {totalTasks} Tasks</div>
//                   </div>
//                 </div>

//                 <div className="flex md:flex-col items-center md:items-end justify-between gap-4 md:w-40 border-t md:border-t-0 pt-4 md:pt-0">
//                     <div className="flex flex-col md:items-end gap-1 flex-1 md:flex-none">
//                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{progress}% Fulfilled</span>
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

//               {/* EXPANDED SECTION - ACTIVE TASKS ONLY */}
//               {isExpanded && (
//                 <div className="bg-slate-50/50 p-6 md:p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {pendingTasks.length > 0 ? pendingTasks.map((task: any, tIdx: number) => (
//                       <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group relative">
//                         <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
//                           {permissions?.canEdit && <button onClick={(e) => { e.stopPropagation(); setActiveActivity(act); setEditingTask(task); }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Edit3 size={14} /></button>}
//                         </div>
//                         <div className="flex items-center gap-2 mb-3">
//                             <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 text-white rounded">TASK {tIdx + 1}</span>
//                             <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-700">{task.status}</span>
//                         </div>
//                         <p className="text-sm font-bold text-slate-800 mb-4 line-clamp-2">{task.title}</p>
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
//                         <div className="col-span-full py-6 flex flex-col items-center justify-center opacity-50">
//                             <CheckCircle size={32} className="text-emerald-500 mb-2" />
//                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Activity Fully Operational - No Outstanding Tasks</p>
//                         </div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         }) : (
//           <div className="py-20 flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
//             <Search size={32} className="text-slate-200 mb-4" />
//             <p className="text-xs font-black uppercase tracking-widest text-slate-400">No Operational Records Match Filters</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
// 'use client'

// import { 
//   Search, User, FileSpreadsheet, X, Clock, LayoutGrid, Target, 
//   Edit3, CheckCircle, Filter, Briefcase, Warehouse, ChevronDown, ChevronUp, 
//   Construction, ExternalLink, AlertTriangle, ListChecks
// } from "lucide-react";
// import React, { useState, useMemo } from "react";
// import { ItemActions } from "../SubComponents";
// import Link from "next/link";
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import MM_TaskForm from "../TaskForm";
// import { toast } from "sonner";

// // --- SEARCH CONFIGURATION ---
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

//   // --- FILTER & LOGIC ENGINE ---
//   const filteredActivities = useMemo(() => {
//     let result = activities;

//     // 1. Filter for Unfulfilled (Progress < 100%)
//     if (showUnfulfilledOnly) {
//       result = result.filter((act: any) => {
//         const totalTasks = act.tasks?.length || 0;
//         const completedTasks = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//         const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
//         return progress < 100;
//       });
//     }

//     // 2. Search Logic
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return result;

//     return result.filter((act: any) => {
//       const workshop = act.project?.responsibleWorkshop;
      
//       const matchesActivity = (
//         (activeSearchFields.includes('projectName') && act.project?.name?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('activityDesc') && act.description?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('supervisor') && act.supervisor?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('workshop') && (
//             workshop?.name?.toLowerCase().includes(term) || 
//             workshop?.location?.toLowerCase().includes(term)
//         ))
//       );

//       const matchesTasks = act.tasks?.some((task: any) => 
//         (activeSearchFields.includes('taskTitle') && task.title?.toLowerCase().includes(term))
//       );

//       return matchesActivity || matchesTasks;
//     });
//   }, [activities, searchTerm, activeSearchFields, showUnfulfilledOnly]);

//   // --- EXPORT LOGIC ---
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

//         filteredActivities.forEach((act: any) => {
//           const row = worksheet.addRow({
//             project: act.project?.name || 'N/A',
//             workshop: act.project?.responsibleWorkshop?.name || 'N/A',
//             title: act.description,
//             owner: act.supervisor,
//             status: act.stage,
//             date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : '',
//           });
//           row.font = { bold: true };
//           row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };

//           act.tasks?.forEach((t: any) => {
//             worksheet.addRow({
//               project: '',
//               workshop: '',
//               title: `  ↳ ${t.title}`,
//               owner: t.assignedTo,
//               status: t.status,
//               date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
//             });
//           });
//         });

//         const buffer = await workbook.xlsx.writeBuffer();
//         saveAs(new Blob([buffer]), `NRZ_Operational_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//         toast.success("Excel report exported successfully");
//     } catch (e) {
//         toast.error("Export failed");
//     }
//   };

//   return (
//     <div className="w-full space-y-6 relative pb-10">
      
//       {/* TASK EDIT MODAL */}
//       {editingTask && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
//              <MM_TaskForm 
//                 initialData={editingTask} 
//                 activities={activities}
//                 preselectedActivity={activeActivity} 
//                 onClose={() => { setEditingTask(null); setActiveActivity(null); }}
//                 onSuccess={() => {
//                   toast.success("Database Synchronized Successfully");
//                   setEditingTask(null);
//                   if(refreshData) refreshData();
//                 }} 
//               />
//           </div>
//         </div>
//       )}

//       {/* 🔍 SEARCH & FILTER SECTION */}
//       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
//           <div className="relative w-full max-w-md group">
//             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//             <input
//               type="text"
//               placeholder="Search project, workshop, or supervisor..."
//               className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             {searchTerm && (
//               <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400">
//                 <X size={16} />
//               </button>
//             )}
//           </div>

//           <div className="flex items-center gap-2 w-full md:w-auto">
//             <button 
//                 onClick={() => setShowUnfulfilledOnly(!showUnfulfilledOnly)}
//                 className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl transition-all shadow-sm border font-black uppercase text-[10px] tracking-widest ${
//                     showUnfulfilledOnly 
//                     ? 'bg-amber-500 border-amber-600 text-white' 
//                     : 'bg-white border-slate-200 text-slate-400 hover:border-amber-200'
//                 }`}
//             >
//                 {showUnfulfilledOnly ? <ListChecks size={18}/> : <Construction size={18} />}
//                 {showUnfulfilledOnly ? "Pending Work" : "All Activities"}
//             </button>

//             <button 
//                 onClick={handleExport}
//                 className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg"
//             >
//                 <FileSpreadsheet size={18} />
//                 <span className="text-[10px] font-black uppercase tracking-widest">Report</span>
//             </button>
//           </div>
//         </div>

//         <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-50">
//             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
//                 <Filter size={14} /> Scopes:
//             </span>
//             {Object.entries(searchableActivityFields).map(([key, config]) => (
//                 <button
//                     key={key}
//                     onClick={() => {
//                         const k = key as ActivitySearchKey;
//                         setActiveSearchFields(prev => prev.includes(k) ? prev.filter(f => f !== k) : [...prev, k]);
//                     }}
//                     className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
//                         activeSearchFields.includes(key as ActivitySearchKey) 
//                         ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' 
//                         : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
//                     }`}
//                 >
//                     {config.label}
//                 </button>
//             ))}
//         </div>
//       </div>

//       {/* 🏗️ MAIN ACTIVITIES FEED */}
//       <div className="grid grid-cols-1 gap-4">
//         {filteredActivities.length > 0 ? filteredActivities.map((act: any) => {
//           const workshop = act.project?.responsibleWorkshop;
//           const isExpanded = expandedId === act.id;
          
//           const totalTasks = act.tasks?.length || 0;
//           const completedTasks = act.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
//           const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
//           // Determine if activity is overdue (Operational Guideline Sec 5.2)
//           const isOverdue = act.scheduledEnd && new Date(act.scheduledEnd) < new Date() && progress < 100;

//           return (
//             <div key={act.id} className={`bg-white border rounded-[2rem] overflow-hidden hover:shadow-xl transition-all duration-300 ${isOverdue ? 'border-red-200' : 'border-slate-200'}`}>
//               <div 
//                 className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
//                 onClick={() => act.tasks?.length > 0 && setExpandedId(isExpanded ? null : act.id)}
//               >
//                 {/* Visual Identity */}
//                 <div className="flex items-center gap-4">
//                     <div className={`w-14 h-14 rounded-[1.25rem] flex flex-col items-center justify-center transition-colors ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
//                         <span className="text-[10px] font-black leading-none mb-1 opacity-50">ACT</span>
//                         <LayoutGrid size={20} />
//                     </div>
//                 </div>

//                 <div className="flex-1 min-w-0 space-y-3">
//                   <div className="flex flex-wrap items-center gap-2">
//                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg">
//                         <Briefcase size={12} className="text-indigo-400" />
//                         <span className="text-[10px] font-black uppercase">{act.project?.name || 'GLOBAL'}</span>
//                     </div>

//                     {workshop && (
//                       <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">
//                           <Warehouse size={12} className="text-amber-500" />
//                           <span className="text-[10px] font-black uppercase">{workshop.name}</span>
//                       </div>
//                     )}

//                     {isOverdue && (
//                       <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white rounded-lg animate-pulse">
//                           <AlertTriangle size={12} />
//                           <span className="text-[10px] font-black uppercase">Overdue</span>
//                       </div>
//                     )}
//                   </div>
                  
//                   <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">{act.description}</h3>
                  
//                   <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500">
//                     <div className="flex items-center gap-2 font-bold text-slate-700">
//                         <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center"><User size={10}/></div>
//                         {act.supervisor || 'No Supervisor'}
//                     </div>
//                     <div className="flex items-center gap-2 font-bold text-slate-900">
//                         <Target size={14} className="text-emerald-500" />
//                         ${((act.actualLaborCost || 0) + (act.actualMaterialCost || 0)).toLocaleString()}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Status & Progress */}
//                 <div className="flex md:flex-col items-center md:items-end justify-between gap-4 md:w-40 border-t md:border-t-0 pt-4 md:pt-0">
//                     <div className="flex flex-col md:items-end gap-1 flex-1 md:flex-none">
//                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{progress}% Fulfilled</span>
//                         <div className="w-full md:w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
//                             <div className={`h-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }} />
//                         </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <Link href={`/mm/activities/${act.id}`} onClick={(e) => e.stopPropagation()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600">
//                             <ExternalLink size={18} />
//                         </Link>
//                         <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                         {act.tasks?.length > 0 && (isExpanded ? <ChevronUp size={20} className="text-indigo-500" /> : <ChevronDown size={20} className="text-slate-300" />)}
//                     </div>
//                 </div>
//               </div>

//               {/* EXPANDED TASKS SECTION */}
//               {isExpanded && (
//                 <div className="bg-slate-50/50 p-6 md:p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {act.tasks.map((task: any, tIdx: number) => (
//                       <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group relative">
//                         <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
//                           {permissions?.canEdit && (
//                             <button 
//                               onClick={(e) => { e.stopPropagation(); setActiveActivity(act); setEditingTask(task); }}
//                               className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
//                             >
//                               <Edit3 size={14} />
//                             </button>
//                           )}
//                         </div>
//                         <div className="flex items-center gap-2 mb-3">
//                             <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 text-white rounded">TASK {tIdx + 1}</span>
//                             <span className={`text-[9px] font-black px-2 py-0.5 rounded ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
//                               {task.status}
//                             </span>
//                         </div>
//                         <p className="text-sm font-bold text-slate-800 mb-4 line-clamp-2">{task.title}</p>
//                         <div className="flex justify-between items-end border-t border-slate-50 pt-3">
//                           <div className="space-y-1">
//                             <span className="text-[8px] font-black text-slate-400 uppercase">Assigned To</span>
//                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600"><User size={12} className="text-indigo-400"/> {task.assignedTo || 'Unassigned'}</div>
//                           </div>
//                           <div className="text-right space-y-1">
//                             <span className="text-[8px] font-black text-slate-400 uppercase">Deadline</span>
//                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 justify-end"><Clock size={12} className="text-amber-400"/> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</div>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         }) : (
//           <div className="py-20 flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
//             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Search size={32} className="text-slate-200" /></div>
//             <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">No Records Match Current Filters</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
// 'use client'
// import { 
//   Search, User, FileSpreadsheet, X, Clock, LayoutGrid, Target, 
//   Edit3, CheckCircle, Filter, Briefcase, Warehouse, ChevronDown, ChevronUp, Construction,
//   ExternalLink
// } from "lucide-react";
// import React, { useState, useMemo, useEffect } from "react";
// import { ItemActions } from "../SubComponents";
// import Link from "next/link";
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import MM_TaskForm from "../TaskForm";
// import { toast } from "sonner";

// // --- SEARCH CONFIGURATION ---
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
//   const [activeSearchFields, setActiveSearchFields] = useState<ActivitySearchKey[]>(
//     ['projectName', 'activityDesc', 'workshop']
//   );

//   const [editingTask, setEditingTask] = useState<any | null>(null);
//   const [activeActivity, setActiveActivity] = useState<any | null>(null);
//   const [showSuccessToast, setShowSuccessToast] = useState(false);

//   // --- FILTER LOGIC ---
//   const filteredActivities = useMemo(() => {
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return activities;

//     return activities.filter((act: any) => {
//       const workshop = act.project?.responsibleWorkshop;
      
//       const matchesActivity = (
//         (activeSearchFields.includes('projectName') && act.project?.name?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('activityDesc') && act.description?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('supervisor') && act.supervisor?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('workshop') && (
//             workshop?.name?.toLowerCase().includes(term) || 
//             workshop?.location?.toLowerCase().includes(term)
//         ))
//       );

//       const matchesTasks = act.tasks?.some((task: any) => 
//         (activeSearchFields.includes('taskTitle') && task.title?.toLowerCase().includes(term))
//       );

//       return matchesActivity || matchesTasks;
//     });
//   }, [activities, searchTerm, activeSearchFields]);

//   // --- EXPORT LOGIC ---
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

//         filteredActivities.forEach((act: any) => {
//           const row = worksheet.addRow({
//             project: act.project?.name || 'N/A',
//             workshop: act.project?.responsibleWorkshop?.name || 'N/A',
//             title: act.description,
//             owner: act.supervisor,
//             status: act.stage,
//             date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : '',
//           });
//           row.font = { bold: true };
//           row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };

//           act.tasks?.forEach((t: any) => {
//             worksheet.addRow({
//               project: '',
//               workshop: '',
//               title: `  ↳ ${t.title}`,
//               owner: t.assignedTo,
//               status: t.status,
//               date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
//             });
//           });
//         });

//         const buffer = await workbook.xlsx.writeBuffer();
//         saveAs(new Blob([buffer]), `Workshop_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//         toast.success("Excel report exported successfully");
//     } catch (e) {
//         toast.error("Export failed");
//     }
//   };

//   return (
//     <div className="w-full space-y-6 relative pb-10">
      
//       {/* SUCCESS NOTIFICATION */}
//       {/* {showSuccessToast && (
//         <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-full shadow-2xl animate-in slide-in-from-top-full">
//           <CheckCircle size={20} />
//           <span className="text-sm font-bold uppercase tracking-widest">Database Synchronized</span>
//         </div>
//       )} */}

//       {/* TASK EDIT MODAL */}
//       {editingTask && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
//              <MM_TaskForm 
//                 initialData={editingTask} 
//                 activities={activities}
//                 preselectedActivity={activeActivity} 
//                 onClose={() => { setEditingTask(null); setActiveActivity(null); }}
//                 onSuccess={() => {
//                   setShowSuccessToast(true);
//                   setEditingTask(null);
//                   if(refreshData) refreshData();
//                 }} 
//               />
//           </div>
//         </div>
//       )}

//       {/* 🔍 SEARCH & FILTER SECTION */}
//       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
//           <div className="relative w-full max-w-md group">
//             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//             <input
//               type="text"
//               placeholder="Search by project, workshop, or supervisor..."
//               className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             {searchTerm && (
//               <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400">
//                 <X size={16} />
//               </button>
//             )}
//           </div>

//           <button 
//             onClick={handleExport}
//             className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg"
//           >
//             <FileSpreadsheet size={18} />
//             <span className="text-xs font-black uppercase tracking-widest">Download Report</span>
//           </button>
//         </div>

//         <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-50">
//             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
//                 <Filter size={14} /> Filter Scopes:
//             </span>
//             {Object.entries(searchableActivityFields).map(([key, config]) => (
//                 <button
//                     key={key}
//                     onClick={() => {
//                         const k = key as ActivitySearchKey;
//                         setActiveSearchFields(prev => prev.includes(k) ? prev.filter(f => f !== k) : [...prev, k]);
//                     }}
//                     className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
//                         activeSearchFields.includes(key as ActivitySearchKey) 
//                         ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' 
//                         : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
//                     }`}
//                 >
//                     {config.label}
//                 </button>
//             ))}
//         </div>
//       </div>

//       {/* 🏗️ MAIN ACTIVITIES FEED */}
//       <div className="grid grid-cols-1 gap-4">
//         {filteredActivities.length > 0 ? filteredActivities.map((act: any, idx: number) => {
//           const workshop = act.project?.responsibleWorkshop;
//           const isExpanded = expandedId === act.id;
//           const progress = act.tasks?.length 
//             ? Math.round((act.tasks.filter((t: any) => t.status === 'COMPLETED').length / act.tasks.length) * 100) 
//             : 0;

//           return (
//             <div key={act.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
//               <div 
//                 className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
//                 onClick={() => act.tasks?.length > 0 && setExpandedId(isExpanded ? null : act.id)}
//               >
//                 {/* Visual Identity */}
//                 <div className="flex items-center gap-4">
//                     <div className="w-14 h-14 bg-slate-100 rounded-[1.25rem] flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
//                         <span className="text-[10px] font-black leading-none mb-1 text-slate-300">ACT</span>
//                         <LayoutGrid size={20} />
//                     </div>
//                 </div>

//                 <div className="flex-1 min-w-0 space-y-3">
//                   <div className="flex flex-wrap items-center gap-2">
//                     {/* Project Label */}
//                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg">
//                         <Briefcase size={12} className="text-indigo-400" />
//                         <span className="text-[10px] font-black uppercase">{act.project?.name || 'GLOBAL'}</span>
//                     </div>

//                     {/* Workshop Label - PRODUCTION UI */}
//                     {workshop && (
//                       <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">
//                           <Warehouse size={12} className="text-amber-500" />
//                           <span className="text-[10px] font-black uppercase">{workshop.name}</span>
//                           {workshop.location && (
//                               <span className="hidden sm:inline-block text-[8px] opacity-60 ml-1 pl-1.5 border-l border-amber-200">
//                                 {workshop.location}
//                               </span>
//                           )}
//                       </div>
//                     )}
//                   </div>
                  
//                   <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">{act.description}</h3>
                  
//                   <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500">
//                     <div className="flex items-center gap-2 font-bold text-slate-700">
//                         <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center"><User size={10}/></div>
//                         {act.supervisor || 'No Supervisor'}
//                     </div>
//                     <div className="flex items-center gap-2 font-bold text-slate-900">
//                         <Target size={14} className="text-emerald-500" />
//                         ${((act.actualLaborCost || 0) + (act.actualMaterialCost || 0)).toLocaleString()}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Status & Progress */}
//                 <div className="flex md:flex-col items-center md:items-end justify-between gap-4 md:w-40 border-t md:border-t-0 pt-4 md:pt-0">
//                     <div className="flex flex-col md:items-end gap-1 flex-1 md:flex-none">
//                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{progress}% Complete</span>
//                         <div className="w-full md:w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
//                             <div className={`h-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }} />
//                         </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <Link href={`/mm/activities/${act.id}`} onClick={(e) => e.stopPropagation()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600">
//                             <ExternalLink size={18} />
//                         </Link>
//                         <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                         {act.tasks?.length > 0 && (isExpanded ? <ChevronUp size={20} className="text-indigo-500" /> : <ChevronDown size={20} className="text-slate-300" />)}
//                     </div>
//                 </div>
//               </div>

//               {/* EXPANDED TASKS SECTION */}
//               {isExpanded && (
//                 <div className="bg-slate-50/50 p-6 md:p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {act.tasks.map((task: any, tIdx: number) => (
//                       <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group relative">
//                         <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
//                           {permissions?.canEdit && (
//                             <button 
//                               onClick={(e) => { e.stopPropagation(); setActiveActivity(act); setEditingTask(task); }}
//                               className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
//                             >
//                               <Edit3 size={14} />
//                             </button>
//                           )}
//                         </div>
//                         <div className="flex items-center gap-2 mb-3">
//                            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 text-white rounded">TASK {tIdx + 1}</span>
//                            <span className={`text-[9px] font-black px-2 py-0.5 rounded ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
//                              {task.status}
//                            </span>
//                         </div>
//                         <p className="text-sm font-bold text-slate-800 mb-4 line-clamp-2">{task.title}</p>
//                         <div className="flex justify-between items-end border-t border-slate-50 pt-3">
//                           <div className="space-y-1">
//                             <span className="text-[8px] font-black text-slate-400 uppercase">Assigned To</span>
//                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600"><User size={12} className="text-indigo-400"/> {task.assignedTo || 'Unassigned'}</div>
//                           </div>
//                           <div className="text-right space-y-1">
//                             <span className="text-[8px] font-black text-slate-400 uppercase">Deadline</span>
//                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 justify-end"><Clock size={12} className="text-amber-400"/> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</div>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         }) : (
//           <div className="py-20 flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
//             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Search size={32} className="text-slate-200" /></div>
//             <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">No Operational Records Match Search</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
// 'use client'
// import { 
//   AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Construction, 
//   ListChecks, Search, User, FileSpreadsheet, X, Clock, LayoutGrid, Target, 
//   Trash2, Edit3, ExternalLink, Save, CheckCircle, Filter, Briefcase 
// } from "lucide-react";
// import React, { useState, useMemo, useEffect } from "react";
// import { ItemActions } from "../SubComponents";
// import Link from "next/link";
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import MM_TaskForm from "../TaskForm";
// import { toast } from "sonner";

// // --- SEARCH CONFIGURATION ---
// export const searchableActivityFields = {
//     projectName: { label: 'Project Name', type: 'string' },
//     activityDesc: { label: 'Activity Description', type: 'string' },
//     supervisor: { label: 'Supervisor', type: 'string' },
//     taskTitle: { label: 'Task Title', type: 'string' },
//     taskAssignee: { label: 'Task Assigned To', type: 'string' },
//     workshop: { label: 'Workshop', type: 'string' },
// };

// export type ActivitySearchKey = keyof typeof searchableActivityFields;

// export const ActivityTableView = ({ 
//   activities, 
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

//   console.log("activities",activities)
  
//   const [activeSearchFields, setActiveSearchFields] = useState<ActivitySearchKey[]>(
//     ['projectName', 'activityDesc', 'taskTitle']
//   );

//   const [editingTask, setEditingTask] = useState<any | null>(null);
//   const [activeActivity, setActiveActivity] = useState<any | null>(null);
//   const [showSuccessToast, setShowSuccessToast] = useState(false);

//   useEffect(() => {
//     if (showSuccessToast) {
//       const timer = setTimeout(() => setShowSuccessToast(false), 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [showSuccessToast]);

//   const filteredActivities = useMemo(() => {
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return activities || [];

//     return activities?.filter((act: any) => {
//       const matchesActivity = (
//         (activeSearchFields.includes('projectName') && act.project?.name?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('activityDesc') && act.description?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('supervisor') && act.supervisor?.toLowerCase().includes(term))    ||
//         (activeSearchFields.includes('workshop') && act.project?.responsibleWorkshop?.name.toLowerCase().includes(term))||
//         (activeSearchFields.includes('workshop') && act.project?.responsibleWorkshop?.location.toLowerCase().includes(term))
//       );

//       const matchesTasks = act.tasks?.some((task: any) => 
//         (activeSearchFields.includes('taskTitle') && task.title?.toLowerCase().includes(term)) ||
//         (activeSearchFields.includes('taskAssignee') && task.assignedTo?.toLowerCase().includes(term))
//       );

//       return matchesActivity || matchesTasks;
//     }) || [];
//   }, [activities, searchTerm, activeSearchFields]);

//   const handleExport = async () => {
//     try {
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Operational Report');
//         worksheet.columns = [
//           { header: 'Project', key: 'project', width: 25 },
//           { header: 'Type', key: 'type', width: 12 },
//           { header: 'Description', key: 'title', width: 40 },
//           { header: 'Owner', key: 'owner', width: 25 },
//           { header: 'Status', key: 'status', width: 15 },
//           { header: 'Deadline', key: 'date', width: 15 },
//         ];

//         filteredActivities.forEach((act: any) => {
//           worksheet.addRow({
//             project: act.project?.name || 'Unassigned',
//             type: 'ACTIVITY',
//             title: act.description,
//             owner: act.supervisor,
//             status: act.stage,
//             date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : '',
//           }).font = { bold: true };

//           act.tasks?.forEach((t: any) => {
//             worksheet.addRow({
//               project: '',
//               type: '  ↳ TASK',
//               title: t.title,
//               owner: t.assignedTo,
//               status: t.status,
//               date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
//             });
//           });
//         });

//         const buffer = await workbook.xlsx.writeBuffer();
//         saveAs(new Blob([buffer]), `Activity_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//         toast.success("Excel report exported successfully");
//     } catch (e) {
//         toast.error("Export failed");
//     }
//   };

//   return (
//     <div className="w-full space-y-6 relative">
      
//       {showSuccessToast && (
//         <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-[2rem] shadow-2xl animate-in slide-in-from-top-full duration-500">
//           <CheckCircle size={20} className="text-white" />
//           <span className="text-sm font-bold uppercase tracking-widest">Update Applied Locally</span>
//         </div>
//       )}

//       {editingTask && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
//             <div className="p-2 overflow-y-auto max-h-[90vh]">
//                <MM_TaskForm 
//                   initialData={editingTask} 
//                   activities={activities || []}
//                   preselectedActivity={activeActivity} 
//                   onClose={() => {
//                     setEditingTask(null);
//                     setActiveActivity(null);
//                   }}
//                   onSuccess={() => {
//                     if(onEditTask && activeActivity) onEditTask(activeActivity.id, editingTask.id);
//                     setShowSuccessToast(true);
//                     setEditingTask(null);
//                     setActiveActivity(null);
//                     if(refreshData) refreshData();
//                   }} 
//                 />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* 🔍 SEARCH BAR WITH CLEAR ACTION */}
//       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
//           <div className="relative w-full max-w-md group">
//             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//             <input
//               type="text"
//               placeholder={`Search across ${activeSearchFields.length} active scopes...`}
//               className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             {/* UX: Clear Search Button */}
//             {searchTerm && (
//               <button 
//                 onClick={() => setSearchTerm('')}
//                 className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-all"
//               >
//                 <X size={16} />
//               </button>
//             )}
//           </div>

//           <button 
//             onClick={handleExport}
//             className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
//           >
//             <FileSpreadsheet size={18} />
//             <span className="text-xs font-black uppercase tracking-widest">Export Activity Report ({filteredActivities.length})</span>
//           </button>
//         </div>

//         <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2 border-t border-slate-50">
//             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
//                 <Filter size={14} className="text-indigo-500" />
//                 Search Scope:
//             </div>
//             <div className="flex flex-wrap gap-2">
//                 {(Object.keys(searchableActivityFields) as ActivitySearchKey[]).map((key) => {
//                     const isActive = activeSearchFields.includes(key);
//                     return (
//                         <button
//                             key={key}
//                             onClick={() => {
//                                 const next = isActive 
//                                     ? activeSearchFields.filter(f => f !== key) 
//                                     : [...activeSearchFields, key];
//                                 setActiveSearchFields(next);
//                             }}
//                             className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
//                                 isActive 
//                                 ? 'bg-amber-400 border-amber-500 text-white shadow-md' 
//                                 : 'bg-white border-slate-200 text-slate-400 hover:border-amber-300'
//                             }`}
//                         >
//                             {searchableActivityFields[key].label}
//                         </button>
//                     );
//                 })}
//             </div>
//         </div>
//       </div>

//       <div className="space-y-4">
//         {filteredActivities.length > 0 ? filteredActivities.map((act: any, idx: number) => {
//           const totalCost = (act.actualLaborCost || 0) + (act.actualMaterialCost || 0);
//           const taskCount = act.tasks?.length || 0;
//           const isExpanded = expandedId === act.id;
//           const progress = taskCount 
//             ? Math.round((act.tasks.filter((t: any) => t.status === 'COMPLETED').length / taskCount) * 100) 
//             : 0;

//           return (
//             <div key={act.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50">
//               <div 
//                 className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
//                 onClick={() => taskCount > 0 && setExpandedId(isExpanded ? null : act.id)}
//               >
//                 <div className="flex items-center justify-between md:justify-start gap-4">
//                   {/* UX: Activity Numbering */}
//                   <div className="relative group">
//                     <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-105">
//                       <LayoutGrid size={24} />
//                     </div>
//                     <div className="absolute -top-2 -left-2 w-6 h-6 bg-slate-900 text-white text-[10px] font-black flex items-center justify-center rounded-lg border-2 border-white shadow-sm">
//                         #{idx + 1}
//                     </div>
//                   </div>
//                   <div className="md:hidden">
//                     <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                   </div>
//                 </div>

//                 <div className="flex-1 min-w-0">
//                   <div className="flex flex-wrap items-center gap-2 mb-2">
//                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg shadow-sm">
//                         <Briefcase size={12} className="text-indigo-400" />
//                         <span className="text-[10px] font-black uppercase tracking-tighter">
//                             {act.project?.name || 'Global Registry'}
//                         </span>
//                     </div>
//                     <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded-lg">Activity</span>
//                     <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{taskCount} Tasks</span>
//                   </div>
                  
//                   <h3 className="text-base font-bold text-slate-900 truncate mb-1">{act.description}</h3>
                  
//                   <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500 font-medium">
//                     <div className="flex items-center gap-1.5"><Construction size={14} className="text-slate-400" /> {act.supervisor}</div>
//                     <div className="flex items-center gap-1.5 font-bold text-slate-900"><Target size={14} className="text-emerald-500" /> ${totalCost.toLocaleString()}</div>
//                   </div>
//                 </div>

//                 <div className="hidden md:flex flex-col items-end gap-1 w-32">
//                    <span className="text-[10px] font-black text-slate-400 uppercase">{progress}% Done</span>
//                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
//                       <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
//                    </div>
//                 </div>

//                 <div className="hidden md:flex items-center gap-3">
//                    <Link href={`/mm/activities/${act.id}`} onClick={(e) => e.stopPropagation()} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-lg text-[9px] font-black uppercase transition-all">
//                     Full Report
//                   </Link>
//                   <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                 </div>

//                 <div className="flex items-center justify-center text-slate-400">
//                    {taskCount > 0 && (isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
//                 </div>
//               </div>

//               {isExpanded && (
//                 <div className="bg-slate-50/50 p-5 md:p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {act.tasks.map((task: any, tIdx: number) => (
//                       <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-4 group relative hover:border-indigo-300 transition-all">
//                         <div className="absolute top-4 right-4 flex gap-1">
//                           {permissions?.canEdit && (
//                             <button 
//                               onClick={(e) => { 
//                                 e.stopPropagation(); 
//                                 setActiveActivity(act);
//                                 setEditingTask(task);
//                               }}
//                               className="p-1.5 bg-slate-50 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-all"
//                             >
//                               <Edit3 size={14} />
//                             </button>
//                           )}
//                         </div>

//                         {/* UX: Task Status and Numbering Row */}
//                         <div className="flex items-center gap-2">
//                            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 text-white rounded-md">
//                              Task {String(tIdx + 1).padStart(2, '0')}
//                            </span>
//                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${task.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
//                              {task.status}
//                            </span>
//                         </div>

//                         <p className="text-sm font-bold text-slate-800 leading-snug min-h-[2.5rem]">{task.title}</p>
                        
//                         <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
//                           <div className="flex flex-col gap-0.5 text-[10px] font-bold text-slate-700 truncate">
//                              <span className="text-[8px] font-black text-slate-400 uppercase">Assigned</span>
//                              <div className="flex items-center gap-1.5"><User size={12} className="text-indigo-500" /> {task.assignedTo || 'TBD'}</div>
//                           </div>
//                           <div className="flex flex-col gap-0.5 text-[10px] font-bold text-slate-700">
//                              <span className="text-[8px] font-black text-slate-400 uppercase">Due Date</span>
//                              <div className="flex items-center gap-1.5"><Clock size={12} className="text-amber-500" /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</div>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         }) : (
//           <div className="h-40 flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
//             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No activities found matching active filters</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };