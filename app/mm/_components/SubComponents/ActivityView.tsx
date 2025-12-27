'use client'
import { 
  AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Construction, 
  ListChecks, Search, User, FileSpreadsheet, X, Clock, LayoutGrid, Target, 
  Trash2, Edit3, ExternalLink, Save, CheckCircle, Filter 
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
  
  // Default search scopes
  const [activeSearchFields, setActiveSearchFields] = useState<ActivitySearchKey[]>(
    ['activityDesc', 'taskTitle']
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

  // --- REFACTORED FILTER LOGIC ---
  const filteredActivities = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return activities || [];

    return activities?.filter((act: any) => {
      // Check Activity Level Scopes
      const matchesActivity = (
        (activeSearchFields.includes('activityDesc') && act.description?.toLowerCase().includes(term)) ||
        (activeSearchFields.includes('supervisor') && act.supervisor?.toLowerCase().includes(term))
      );

      // Check Task Level Scopes
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
          { header: 'Type', key: 'type', width: 12 },
          { header: 'Description', key: 'title', width: 40 },
          { header: 'Owner', key: 'owner', width: 25 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Deadline', key: 'date', width: 15 },
        ];

        filteredActivities.forEach((act: any) => {
          worksheet.addRow({
            type: 'ACTIVITY',
            title: act.description,
            owner: act.supervisor,
            status: act.stage,
            date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : '',
          }).font = { bold: true };

          act.tasks?.forEach((t: any) => {
            worksheet.addRow({
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
      
      {/* 🎉 TOAST FEEDBACK */}
      {showSuccessToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-[2rem] shadow-2xl animate-in slide-in-from-top-full duration-500">
          <CheckCircle size={20} className="text-white" />
          <span className="text-sm font-bold uppercase tracking-widest">Update Applied Locally</span>
        </div>
      )}

      {/* 🛠️ TASK FORM MODAL */}
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

      {/* 🔍 SEARCH & FIELD SELECTOR BAR */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search across ${activeSearchFields.length} active scopes...`}
              className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={handleExport}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
          >
            <FileSpreadsheet size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Export Activity Report</span>
          </button>
        </div>

        {/* DYNAMIC SCOPE SELECTOR */}
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
                                ? 'bg-yellow-400 border-indigo-600 text-white shadow-md' 
                                : 'bg-white border-slate-200 text-slate-400 hover:border-yellow-300'
                            }`}
                        >
                            {searchableActivityFields[key].label}
                        </button>
                    );
                })}
            </div>
        </div>
      </div>

      {/* --- LIST CONTAINER --- */}
      <div className="space-y-4">
        {filteredActivities.length > 0 ? filteredActivities.map((act: any) => {
          const totalCost = (act.actualLaborCost || 0) + (act.actualMaterialCost || 0);
          const taskCount = act.tasks?.length || 0;
          const isExpanded = expandedId === act.id;
          const progress = taskCount 
            ? Math.round((act.tasks.filter((t: any) => t.status === 'COMPLETED').length / taskCount) * 100) 
            : 0;

          return (
            <div key={act.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50">
              {/* Activity Header Row */}
              <div 
                className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                onClick={() => taskCount > 0 && setExpandedId(isExpanded ? null : act.id)}
              >
                {/* ... Header contents (Icon, Description, Progress, Actions) ... */}
                <div className="flex items-center justify-between md:justify-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                    <LayoutGrid size={24} />
                  </div>
                  <div className="md:hidden">
                    <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">Activity</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{taskCount} Tasks</span>
                    <h3 className="text-base font-bold text-slate-900 truncate">{act.description}</h3>
                  </div>
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

              {/* Tasks Expanded Section */}
              {isExpanded && (
                <div className="bg-slate-50/50 p-5 md:p-8 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {act.tasks.map((task: any) => (
                      <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-4 group relative hover:border-indigo-300 transition-all animate-in fade-in slide-in-from-bottom-2">
                        {/* Task Edit Button */}
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
                        {/* Task Meta */}
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                          {task.status}
                        </span>
                        <p className="text-sm font-bold text-slate-800 leading-snug">{task.title}</p>
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
// 'use client'
// import { AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Construction, ListChecks, Search, User, FileSpreadsheet, X, Clock, LayoutGrid, Target, Trash2, Edit3, ExternalLink, Save, CheckCircle } from "lucide-react";
// import React, { useState, useMemo, useEffect } from "react";
// import { ItemActions } from "../SubComponents";
// import Link from "next/link";
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import MM_TaskForm from "../TaskForm";

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
  
//   // --- STATE FOR MODAL & FEEDBACK ---
//   const [editingTask, setEditingTask] = useState<any | null>(null);
//   const [activeActivity, setActiveActivity] = useState<any | null>(null);
//   const [showSuccessToast, setShowSuccessToast] = useState(false);

//   // --- AUTO-HIDE SUCCESS TOAST ---
//   useEffect(() => {
//     if (showSuccessToast) {
//       const timer = setTimeout(() => setShowSuccessToast(false), 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [showSuccessToast]);

//   // --- FILTER LOGIC ---
//   const filteredActivities = useMemo(() => {
//     return activities?.filter((act: any) => {
//       const searchLower = searchTerm.toLowerCase();
//       const matchesActivity = 
//         act.description?.toLowerCase().includes(searchLower) ||
//         act.supervisor?.toLowerCase().includes(searchLower);

//       const matchesTasks = act.tasks?.some((task: any) => 
//         task.title?.toLowerCase().includes(searchLower) ||
//         task.assignedTo?.toLowerCase().includes(searchLower)
//       );

//       return matchesActivity || matchesTasks;
//     }) || [];
//   }, [activities, searchTerm]);

//   // --- EXCELJS EXPORT ---
//   const handleExport = async () => {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Operational Report');
//     worksheet.columns = [
//       { header: 'Type', key: 'type', width: 12 },
//       { header: 'Description', key: 'title', width: 40 },
//       { header: 'Owner', key: 'owner', width: 25 },
//       { header: 'Status', key: 'status', width: 15 },
//       { header: 'Deadline', key: 'date', width: 15 },
//     ];

//     filteredActivities.forEach((act: any) => {
//       worksheet.addRow({
//         type: 'ACTIVITY',
//         title: act.description,
//         owner: act.supervisor,
//         status: act.stage,
//         date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : '',
//       }).font = { bold: true };

//       act.tasks?.forEach((t: any) => {
//         worksheet.addRow({
//           type: '  ↳ TASK',
//           title: t.title,
//           owner: t.assignedTo,
//           status: t.status,
//           date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
//         });
//       });
//     });

//     const buffer = await workbook.xlsx.writeBuffer();
//     saveAs(new Blob([buffer]), `Activity_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//   };

//   return (
//     <div className="w-full space-y-6 relative">
      
//       {/* 🎉 SUCCESS TOAST FEEDBACK */}
//       {showSuccessToast && (
//         <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-[2rem] shadow-2xl shadow-emerald-200/50 animate-in slide-in-from-top-full duration-500">
//           <CheckCircle size={20} className="text-white" />
//           <span className="text-sm font-bold uppercase tracking-widest">Update Applied Locally</span>
//         </div>
//       )}

//       {/* 🛠️ TASK FORM MODAL */}
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
//                     /** * LOCALLY IDENTIFYING THE UPDATE:
//                      * Since the form doesn't return data, we use the IDs we already have
//                      * in state (activeActivity.id and editingTask.id).
//                      **/
//                     if(onEditTask && activeActivity) {
//                         onEditTask(activeActivity.id, editingTask.id);
//                     }

//                     // Trigger UI Updates
//                     setShowSuccessToast(true);
//                     setEditingTask(null);
//                     setActiveActivity(null);
                    
//                     // Refresh data from server to maintain financial accuracy
//                     if(refreshData) refreshData();
//                   }} 
//                 />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* 🔍 SEARCH & EXPORT BAR */}
//       <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-3xl border border-slate-200">
//         <div className="relative w-full max-w-md">
//           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
//           <input
//             type="text"
//             placeholder="Search activities or tasks..."
//             className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         <button 
//           onClick={handleExport}
//           className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
//         >
//           <FileSpreadsheet size={18} />
//           <span className="text-xs font-bold uppercase tracking-widest">Export Activity Report</span>
//         </button>
//       </div>

//       {/* --- LIST CONTAINER --- */}
//       <div className="space-y-4">
//         {filteredActivities.map((act: any) => {
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
//                   <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
//                     <LayoutGrid size={24} />
//                   </div>
//                   <div className="md:hidden">
//                     <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                   </div>
//                 </div>

//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1">
//                     <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">Activity</span>
//                     <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{taskCount} Tasks</span>
//                     <h3 className="text-base font-bold text-slate-900 truncate">{act.description}</h3>
//                   </div>
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
//                 <div className="bg-slate-50/50 p-5 md:p-8 border-t border-slate-100">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {act.tasks.map((task: any) => (
//                       <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-4 group relative hover:border-indigo-300 transition-all">
//                         <div className="absolute top-4 right-4 flex gap-1">
//                           {permissions?.canEdit && (
//                             <button 
//                               onClick={(e) => { 
//                                 e.stopPropagation(); 
//                                 setActiveActivity(act); // IDENTIFY PARENT
//                                 setEditingTask(task);   // IDENTIFY TASK
//                               }}
//                               className="p-1.5 bg-slate-50 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-all"
//                             >
//                               <Edit3 size={14} />
//                             </button>
//                           )}
//                         </div>
//                         <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
//                           {task.status}
//                         </span>
//                         <p className="text-sm font-bold text-slate-800 leading-snug">{task.title}</p>
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
//         })}
//       </div>
//     </div>
//   );
// };