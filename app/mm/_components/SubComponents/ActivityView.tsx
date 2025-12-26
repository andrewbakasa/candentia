'use client'
import { AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Construction, ListChecks, Search, User, FileSpreadsheet, X, Clock, LayoutGrid, Target, Trash2, Edit3, ExternalLink, Save, CheckCircle } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { ItemActions } from "../SubComponents";
import Link from "next/link";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import MM_TaskForm from "../TaskForm";

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
  
  // --- STATE FOR MODAL & FEEDBACK ---
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [activeActivity, setActiveActivity] = useState<any | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // --- AUTO-HIDE SUCCESS TOAST ---
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => setShowSuccessToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  // --- FILTER LOGIC ---
  const filteredActivities = useMemo(() => {
    return activities?.filter((act: any) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesActivity = 
        act.description?.toLowerCase().includes(searchLower) ||
        act.supervisor?.toLowerCase().includes(searchLower);

      const matchesTasks = act.tasks?.some((task: any) => 
        task.title?.toLowerCase().includes(searchLower) ||
        task.assignedTo?.toLowerCase().includes(searchLower)
      );

      return matchesActivity || matchesTasks;
    }) || [];
  }, [activities, searchTerm]);

  // --- EXCELJS EXPORT ---
  const handleExport = async () => {
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
  };

  return (
    <div className="w-full space-y-6 relative">
      
      {/* 🎉 SUCCESS TOAST FEEDBACK */}
      {showSuccessToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-[2rem] shadow-2xl shadow-emerald-200/50 animate-in slide-in-from-top-full duration-500">
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
                    /** * LOCALLY IDENTIFYING THE UPDATE:
                     * Since the form doesn't return data, we use the IDs we already have
                     * in state (activeActivity.id and editingTask.id).
                     **/
                    if(onEditTask && activeActivity) {
                        onEditTask(activeActivity.id, editingTask.id);
                    }

                    // Trigger UI Updates
                    setShowSuccessToast(true);
                    setEditingTask(null);
                    setActiveActivity(null);
                    
                    // Refresh data from server to maintain financial accuracy
                    if(refreshData) refreshData();
                  }} 
                />
            </div>
          </div>
        </div>
      )}

      {/* 🔍 SEARCH & EXPORT BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-3xl border border-slate-200">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activities or tasks..."
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          onClick={handleExport}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
        >
          <FileSpreadsheet size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Export Activity Report</span>
        </button>
      </div>

      {/* --- LIST CONTAINER --- */}
      <div className="space-y-4">
        {filteredActivities.map((act: any) => {
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

              {isExpanded && (
                <div className="bg-slate-50/50 p-5 md:p-8 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {act.tasks.map((task: any) => (
                      <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-4 group relative hover:border-indigo-300 transition-all">
                        <div className="absolute top-4 right-4 flex gap-1">
                          {permissions?.canEdit && (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setActiveActivity(act); // IDENTIFY PARENT
                                setEditingTask(task);   // IDENTIFY TASK
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-all"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                        </div>
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
        })}
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
//   onEditTask, // We will call this with the updated task data
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

//   // --- EXCEL EXPORT ---
//   const handleExport = async () => {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Operational Report');
//     worksheet.columns = [
//       { header: 'Type', key: 'type', width: 12 },
//       { header: 'Description', key: 'title', width: 40 },
//       { header: 'Owner', key: 'owner', width: 25 },
//       { header: 'Status', key: 'status', width: 15 },
//       { header: 'Deadline', key: 'date', width: 15 },
//       { header: 'Actual Cost', key: 'cost', width: 15 },
//     ];

//     filteredActivities.forEach((act: any) => {
//       const totalCost = (act.actualLaborCost || 0) + (act.actualMaterialCost || 0);
//       worksheet.addRow({
//         type: 'ACTIVITY',
//         title: act.description,
//         owner: act.supervisor,
//         status: act.stage,
//         date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : '',
//         cost: totalCost
//       }).font = { bold: true };

//       act.tasks?.forEach((t: any) => {
//         worksheet.addRow({
//           type: '  ↳ TASK',
//           title: t.title,
//           owner: t.assignedTo,
//           status: t.status,
//           date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
//           cost: ''
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
//           <span className="text-sm font-bold uppercase tracking-widest">Local Sync Complete</span>
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
//                      * We pass the parent the ID of the activity AND the full updated task object.
//                      * This allows the parent to map through its state and update the specific item.
//                      **/
//                     if(onEditTask) {
//                         onEditTask(activeActivity.id,);
//                     }

//                     // UI Updates
//                     setShowSuccessToast(true);
//                     setEditingTask(null);
//                     setActiveActivity(null);
                    
//                     // Optional: Server re-fetch
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
//           <span className="text-xs font-bold uppercase tracking-widest">Export Data</span>
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
//                                 setActiveActivity(act); // 1. Set the Parent Activity
//                                 setEditingTask(task);   // 2. Set the Target Task
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
//   refreshData // Added a prop to trigger parent data re-fetch if applicable
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

//   // --- EXCELJS EXPORT HANDLER ---
//   const handleExport = async () => {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Operational Report');

//     worksheet.columns = [
//       { header: 'Type', key: 'type', width: 12 },
//       { header: 'Description', key: 'title', width: 40 },
//       { header: 'Owner', key: 'owner', width: 25 },
//       { header: 'Status', key: 'status', width: 15 },
//       { header: 'Deadline', key: 'date', width: 15 },
//       { header: 'Actual Cost', key: 'cost', width: 15 },
//     ];

//     filteredActivities.forEach((act: any) => {
//       const totalCost = (act.actualLaborCost || 0) + (act.actualMaterialCost || 0);
//       worksheet.addRow({
//         type: 'ACTIVITY',
//         title: act.description,
//         owner: act.supervisor,
//         status: act.stage,
//         date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : '',
//         cost: totalCost
//       }).font = { bold: true };

//       act.tasks?.forEach((t: any) => {
//         worksheet.addRow({
//           type: '  ↳ TASK',
//           title: t.title,
//           owner: t.assignedTo,
//           status: t.status,
//           date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
//           cost: ''
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
//           <span className="text-sm font-bold uppercase tracking-widest">Task Updated Successfully!</span>
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
//                     // 1. Close modal
//                     setEditingTask(null);
//                     setActiveActivity(null);
//                     // 2. Show visual feedback
//                     setShowSuccessToast(true);
//                     // 3. Trigger parent refresh if provided
//                     if(refreshData) refreshData();
//                     // 4. Fallback: Local onEditTask update call
//                     if(onEditTask)  onEditTask();
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
//           {searchTerm && (
//             <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors">
//               <X size={18} />
//             </button>
//           )}
//         </div>

//         <button 
//           onClick={handleExport}
//           className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
//         >
//           <FileSpreadsheet size={18} />
//           <span className="text-xs font-bold uppercase tracking-widest">Export ({filteredActivities.length})</span>
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
//                   <div className="md:hidden flex items-center gap-2">
//                     <Link href={`/mm/activities/${act.id}`} onClick={(e) => e.stopPropagation()} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
//                       <ExternalLink size={18} />
//                     </Link>
//                     <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                   </div>
//                 </div>

//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1">
//                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md">Activity</span>
//                     <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
//                       {taskCount} {taskCount === 1 ? 'Task' : 'Tasks'}
//                     </span>
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
//                   <Link href={`/mm/activities/${act.id}`} onClick={(e) => e.stopPropagation()} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-lg text-[9px] font-black uppercase transition-all">
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
//                       <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-4 group relative hover:border-indigo-200 transition-all">
//                         <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
//                           {permissions?.canEdit && (
//                             <button 
//                               onClick={(e) => { e.stopPropagation(); setActiveActivity(act); setEditingTask(task); }}
//                               className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
//                             >
//                               <Edit3 size={14} />
//                             </button>
//                           )}
//                           {permissions?.canDelete && (
//                             <button 
//                               onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) onDeleteTask(act.id, task.id); }}
//                               className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
//                             >
//                               <Trash2 size={14} />
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
// 'use client'
// import { AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Construction, ListChecks, Search, User, FileSpreadsheet, X, Clock, LayoutGrid, Target, Trash2, Edit3, ExternalLink, Save } from "lucide-react";
// import React, { useState, useMemo } from "react";
// import { ItemActions } from "../SubComponents";
// import Link from "next/link";
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import MM_TaskForm from "../TaskForm";
// // Import your custom form component
// //import MM_TaskForm from "../MM_TaskForm"; 

// export const ActivityTableView = ({ 
//   activities, 
//   onEdit, 
//   onDelete, 
//   onAddTask, 
//   onEditTask, 
//   onDeleteTask, 
//   permissions 
// }: any) => {
//   const [expandedId, setExpandedId] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
  
//   // --- STATE FOR MODAL CONTROL ---
//   const [editingTask, setEditingTask] = useState<any | null>(null);
//   const [activeActivity, setActiveActivity] = useState<any | null>(null);

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

//   // --- EXCELJS EXPORT HANDLER ---
//   const handleExport = async () => {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Operational Report');

//     worksheet.columns = [
//       { header: 'Type', key: 'type', width: 12 },
//       { header: 'Description', key: 'title', width: 40 },
//       { header: 'Owner', key: 'owner', width: 25 },
//       { header: 'Status', key: 'status', width: 15 },
//       { header: 'Deadline', key: 'date', width: 15 },
//       { header: 'Actual Cost', key: 'cost', width: 15 },
//     ];

//     filteredActivities.forEach((act: any) => {
//       const totalCost = (act.actualLaborCost || 0) + (act.actualMaterialCost || 0);
//       worksheet.addRow({
//         type: 'ACTIVITY',
//         title: act.description,
//         owner: act.supervisor,
//         status: act.stage,
//         date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : '',
//         cost: totalCost
//       }).font = { bold: true };

//       act.tasks?.forEach((t: any) => {
//         worksheet.addRow({
//           type: '  ↳ TASK',
//           title: t.title,
//           owner: t.assignedTo,
//           status: t.status,
//           date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
//           cost: ''
//         });
//       });
//     });

//     const buffer = await workbook.xlsx.writeBuffer();
//     saveAs(new Blob([buffer]), `Activity_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//   };

//   return (
//     <div className="w-full space-y-6">
      
//       {/* 🛠️ TASK FORM MODAL (MM_TaskForm) */}
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
//                     setEditingTask(null);
//                     setActiveActivity(null);
//                     // Trigger a refresh if necessary via parent props
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
//           {searchTerm && (
//             <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors">
//               <X size={18} />
//             </button>
//           )}
//         </div>

//         <button 
//           onClick={handleExport}
//           className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
//         >
//           <FileSpreadsheet size={18} />
//           <span className="text-xs font-bold uppercase tracking-widest">Export ({filteredActivities.length})</span>
//         </button>
//       </div>

//       {/* --- RESPONSIVE CONTAINER --- */}
//       <div className="space-y-4">
//         {filteredActivities.map((act: any) => {
//           const totalCost = (act.actualLaborCost || 0) + (act.actualMaterialCost || 0);
//           const taskCount = act.tasks?.length || 0;
//           const hasTasks = taskCount > 0;
//           const isExpanded = expandedId === act.id;
//           const progress = taskCount 
//             ? Math.round((act.tasks.filter((t: any) => t.status === 'COMPLETED').length / taskCount) * 100) 
//             : 0;

//           return (
//             <div key={act.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50">
              
//               {/* ACTIVITY CARD HEADER */}
//               <div 
//                 className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
//                 onClick={() => hasTasks && setExpandedId(isExpanded ? null : act.id)}
//               >
//                 <div className="flex items-center justify-between md:justify-start gap-4">
//                   <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
//                     <LayoutGrid size={24} />
//                   </div>
//                   <div className="md:hidden flex items-center gap-2">
//                     <Link 
//                       href={`/mm/activities/${act.id}`} 
//                       onClick={(e) => e.stopPropagation()} 
//                       className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
//                     >
//                       <ExternalLink size={18} />
//                     </Link>
//                     <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                   </div>
//                 </div>

//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1">
//                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md">Activity</span>
//                     <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
//                       {taskCount} {taskCount === 1 ? 'Task' : 'Tasks'}
//                     </span>
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
//                   <Link 
//                     href={`/mm/activities/${act.id}`} 
//                     onClick={(e) => e.stopPropagation()} 
//                     className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-lg text-[9px] font-black uppercase transition-all"
//                   >
//                     Full Report <ExternalLink size={10} />
//                   </Link>
//                   <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                 </div>

//                 <div className="flex items-center justify-center text-slate-400">
//                    {hasTasks && (isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
//                 </div>
//               </div>

//               {/* EXPANDED TASKS */}
//               {isExpanded && (
//                 <div className="bg-slate-50/50 p-5 md:p-8 border-t border-slate-100">
//                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
//                     <ListChecks size={16} /> Sub-Tasks ({taskCount})
//                   </h4>
                  
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {act.tasks.map((task: any) => (
//                       <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-4 group relative">
                        
//                         <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
//                           {permissions?.canEdit && (
//                             <button 
//                               onClick={(e) => { 
//                                 e.stopPropagation(); 
//                                 setActiveActivity(act); // Store the activity context
//                                 setEditingTask(task);   // Store the task context
//                               }}
//                               className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
//                             >
//                               <Edit3 size={14} />
//                             </button>
//                           )}
//                           {permissions?.canDelete && (
//                             <button 
//                               onClick={(e) => { 
//                                 e.stopPropagation(); 
//                                 if(confirm('Delete this task?')) onDeleteTask(act.id, task.id); 
//                               }}
//                               className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
//                             >
//                               <Trash2 size={14} />
//                             </button>
//                           )}
//                         </div>

//                         <div className="flex justify-between items-start pr-12">
//                           <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
//                             {task.status}
//                           </span>
//                         </div>

//                         <p className="text-sm font-bold text-slate-800 leading-snug">{task.title}</p>

//                         <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
//                           <div className="flex flex-col gap-0.5">
//                             <span className="text-[8px] font-black text-slate-400 uppercase">Assigned</span>
//                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 truncate">
//                                <User size={12} className="text-indigo-500" />
//                                <span className="truncate">{task.assignedTo || 'TBD'}</span>
//                             </div>
//                           </div>
//                           <div className="flex flex-col gap-0.5">
//                             <span className="text-[8px] font-black text-slate-400 uppercase">Due Date</span>
//                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
//                                <Clock size={12} className="text-amber-500" />
//                                <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
//                             </div>
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
// 'use client'
// import { AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Construction, ListChecks, Search, User, FileSpreadsheet, X, Clock, LayoutGrid, Target, Trash2, Edit3, ExternalLink } from "lucide-react";
// import React, { useState, useMemo } from "react";
// import { ItemActions } from "../SubComponents";
// import Link from "next/link";
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';

// export const ActivityTableView = ({ 
//   activities, 
//   onEdit, 
//   onDelete, 
//   onAddTask, 
//   onEditTask, 
//   onDeleteTask, 
//   permissions 
// }: any) => {
//   const [expandedId, setExpandedId] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');

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

//   // --- EXCELJS EXPORT HANDLER ---
//   const handleExport = async () => {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Operational Report');

//     worksheet.columns = [
//       { header: 'Type', key: 'type', width: 12 },
//       { header: 'Description', key: 'title', width: 40 },
//       { header: 'Owner', key: 'owner', width: 25 },
//       { header: 'Status', key: 'status', width: 15 },
//       { header: 'Deadline', key: 'date', width: 15 },
//       { header: 'Actual Cost', key: 'cost', width: 15 },
//     ];

//     filteredActivities.forEach((act: any) => {
//       const totalCost = (act.actualLaborCost || 0) + (act.actualMaterialCost || 0);
//       worksheet.addRow({
//         type: 'ACTIVITY',
//         title: act.description,
//         owner: act.supervisor,
//         status: act.stage,
//         date: act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : '',
//         cost: totalCost
//       }).font = { bold: true };

//       act.tasks?.forEach((t: any) => {
//         worksheet.addRow({
//           type: '  ↳ TASK',
//           title: t.title,
//           owner: t.assignedTo,
//           status: t.status,
//           date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
//           cost: ''
//         });
//       });
//     });

//     const buffer = await workbook.xlsx.writeBuffer();
//     saveAs(new Blob([buffer]), `Activity_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//   };

//   return (
//     <div className="w-full space-y-6">
      
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
//           {searchTerm && (
//             <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors">
//               <X size={18} />
//             </button>
//           )}
//         </div>

//         <button 
//           onClick={handleExport}
//           className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
//         >
//           <FileSpreadsheet size={18} />
//           <span className="text-xs font-bold uppercase tracking-widest">Export ({filteredActivities.length})</span>
//         </button>
//       </div>

//       {/* --- RESPONSIVE CONTAINER --- */}
//       <div className="space-y-4">
//         {filteredActivities.map((act: any) => {
//           const totalCost = (act.actualLaborCost || 0) + (act.actualMaterialCost || 0);
//           const hasTasks = act.tasks?.length > 0;
//           const isExpanded = expandedId === act.id;
//           const progress = act.tasks?.length 
//             ? Math.round((act.tasks.filter((t: any) => t.status === 'COMPLETED').length / act.tasks.length) * 100) 
//             : 0;

//           return (
//             <div key={act.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50">
              
//               {/* ACTIVITY CARD HEADER */}
//               <div 
//                 className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
//                 onClick={() => hasTasks && setExpandedId(isExpanded ? null : act.id)}
//               >
//                 <div className="flex items-center justify-between md:justify-start gap-4">
//                   <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
//                     <LayoutGrid size={24} />
//                   </div>
//                   <div className="md:hidden flex items-center gap-2">
//                     <Link 
//                       href={`/mm/activities/${act.id}`} 
//                       onClick={(e) => e.stopPropagation()} 
//                       className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
//                     >
//                       <ExternalLink size={18} />
//                     </Link>
//                     <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                   </div>
//                 </div>

//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1">
//                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md">Activity</span>
//                     {/* ADD THE TASK COUNT HERE */}
//                   <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
//                     {act.tasks?.length || 0} {act.tasks?.length === 1 ? 'Task' : 'Tasks'}
//                   </span>
//                     <h3 className="text-base font-bold text-slate-900 truncate">{act.description}</h3>
//                   </div>
//                   <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500 font-medium">
//                     <div className="flex items-center gap-1.5"><Construction size={14} className="text-slate-400" /> {act.supervisor}</div>
//                     <div className="flex items-center gap-1.5 font-bold text-slate-900"><Target size={14} className="text-emerald-500" /> ${totalCost.toLocaleString()}</div>
//                   </div>
//                 </div>

//                 {/* PROGRESS SECTION (DESKTOP) */}
//                 <div className="hidden md:flex flex-col items-end gap-1 w-32">
//                    <span className="text-[10px] font-black text-slate-400 uppercase">{progress}% Done</span>
//                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
//                       <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
//                    </div>
//                 </div>

//                 <div className="hidden md:flex items-center gap-3">
//                   <Link 
//                     href={`/mm/activities/${act.id}`} 
//                     onClick={(e) => e.stopPropagation()} 
//                     className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-lg text-[9px] font-black uppercase transition-all"
//                   >
//                     Full Report <ExternalLink size={10} />
//                   </Link>
//                   <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} onAddTask={onAddTask} permissions={permissions} />
//                 </div>

//                 <div className="flex items-center justify-center text-slate-400">
//                    {hasTasks && (isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
//                 </div>
//               </div>

//               {/* EXPANDED TASKS */}
//               {isExpanded && (
//                 <div className="bg-slate-50/50 p-5 md:p-8 border-t border-slate-100">
//                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
//                     <ListChecks size={16} /> Sub-Tasks ({act.tasks.length})
//                   </h4>
                  
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {act.tasks.map((task: any) => (
//                       <div key={task.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-4 group relative">
                        
//                         {/* TASK ACTIONS */}
//                         <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
//                           {permissions?.canEdit && (
//                             <button 
//                               onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
//                               className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
//                             >
//                               <Edit3 size={14} />
//                             </button>
//                           )}
//                           {permissions?.canDelete && (
//                             <button 
//                               onClick={(e) => { 
//                                 e.stopPropagation(); 
//                                 if(confirm('Delete this task?')) onDeleteTask(act.id, task.id); 
//                               }}
//                               className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
//                             >
//                               <Trash2 size={14} />
//                             </button>
//                           )}
//                         </div>

//                         <div className="flex justify-between items-start pr-12">
//                           <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
//                             {task.status}
//                           </span>
//                         </div>

//                         <p className="text-sm font-bold text-slate-800 leading-snug">{task.title}</p>

//                         <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
//                           <div className="flex flex-col gap-0.5">
//                             <span className="text-[8px] font-black text-slate-400 uppercase">Assigned</span>
//                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 truncate">
//                                <User size={12} className="text-indigo-500" />
//                                <span className="truncate">{task.assignedTo || 'TBD'}</span>
//                             </div>
//                           </div>
//                           <div className="flex flex-col gap-0.5">
//                             <span className="text-[8px] font-black text-slate-400 uppercase">Due Date</span>
//                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
//                                <Clock size={12} className="text-amber-500" />
//                                <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
//                             </div>
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