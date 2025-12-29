'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from "sonner";
import { 
  MapPin, User as UserIcon, Calendar, Clock, AlertTriangle, 
  TrendingUp, BarChart3, Layers, ArrowRight, FileSpreadsheet,
  Briefcase, CheckCircle2, Timer, Construction, History
} from 'lucide-react';
import { ItemActions } from '../SubComponents';
import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

const PROJECT_SCOPES: SearchScope[] = [
  { key: 'name', label: 'Project Name' },
  { key: 'projectManager', label: 'Project Manager' },
  { key: 'workshopName', label: 'Workshop/Location' },
];

export const ProjectGridView = ({ projects, onEdit, onDelete, permissions }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['name', 'projectManager']);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return projects || [];
    return projects?.filter((project: any) => {
      const dataToSearch = { 
        ...project, 
        workshopName: project.responsibleWorkshop?.name || 'Central' 
      };
      return activeSearchFields.some(field => 
        String((dataToSearch as any)[field] || '').toLowerCase().includes(term)
      );
    });
  }, [projects, searchTerm, activeSearchFields]);

  const handleExport = async () => {
     try {
       const workbook = new ExcelJS.Workbook();
       const worksheet = workbook.addWorksheet('SVE Projects Report');
       worksheet.columns = [
         { header: 'Project Name', key: 'name', width: 30 },
         { header: 'Status', key: 'status', width: 15 },
         { header: 'Manager', key: 'manager', width: 25 },
         { header: 'Sched. Start', key: 'start', width: 15 },
         { header: 'Sched. End', key: 'end', width: 15 },
         { header: 'Progress (%)', key: 'progress', width: 12 },
         { header: 'Budget ($)', key: 'budget', width: 15 },
         { header: 'Actual Cost ($)', key: 'cost', width: 15 },
       ];
       worksheet.getRow(1).font = { bold: true };
       worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
       filteredProjects.forEach((proj: any) => {
         worksheet.addRow({
           name: proj.name,
           status: proj.status,
           manager: proj.projectManager,
           start: proj.scheduledStart ? new Date(proj.scheduledStart).toLocaleDateString() : 'N/A',
           end: proj.scheduledEnd ? new Date(proj.scheduledEnd).toLocaleDateString() : 'N/A',
           progress: proj.progress || 0,
           budget: proj.allocatedBudget || 0,
           cost: proj.totalActualCost || 0,
         });
       });
       const buffer = await workbook.xlsx.writeBuffer();
       saveAs(new Blob([buffer]), `Project_SVE_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
       toast.success(`Exported ${filteredProjects.length} projects successfully`);
     } catch (error) {
       toast.error("Excel generation failed");
     }
  };

  return (
    <div className="space-y-6">
      {/* 🔍 SEARCH & EXPORT BAR */}
      <div className="bg-white p-4 lg:p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="w-full lg:flex-1">
            <SearchFilterEngine 
                scopes={PROJECT_SCOPES}
                initialActiveScopes={activeSearchFields}
                onSearchChange={setSearchTerm}
                onScopesChange={setActiveSearchFields}
                placeholder="Search projects..."
            />
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0">
              <div className="flex flex-col text-left lg:text-right lg:pr-4 lg:border-r border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-tight">Active Ledger</span>
                <span className="text-sm font-black text-indigo-600 flex items-center gap-1.5 lg:justify-end">
                  <Layers size={14} className="text-indigo-400" />
                  {filteredProjects.length} Projects
                </span>
              </div>
              <button onClick={handleExport} className="h-16 px-6 lg:px-8 bg-emerald-600 text-white rounded-[1.25rem] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-3 shrink-0 group">
                <div className="p-2 bg-emerald-500/50 rounded-lg group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
                  <span className="text-[8px] font-medium opacity-80 uppercase tracking-tighter">Excel Report</span>
                </div>
              </button>
          </div>
        </div>
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden lg:block overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project / Workshop</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Activity SVE</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Variance</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Progress</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProjects.map((project: any) => {
              const { activities, projectStatus } = project.sveMetrics || {};
              
              // --- TIMELINE CALCULATIONS ---
              const now = new Date();
              const start = project.scheduledStart ? new Date(project.scheduledStart) : null;
              const end = project.scheduledEnd ? new Date(project.scheduledEnd) : null;
              
              let daysLeft = 0;
              let timePercent = 0;
              
              if (end) {
                daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                if (start) {
                    const totalDuration = end.getTime() - start.getTime();
                    const elapsed = now.getTime() - start.getTime();
                    timePercent = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;
                }
              }

              return (
                <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-5">
                    <div className="flex flex-col">
                      <Link href={`/mm/projects/${project.id}`} className="text-sm font-bold text-slate-800 hover:text-indigo-600">
                        {project.name}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <Construction size={10}/> {project.responsibleWorkshop?.name || 'HQ'}
                      </span>
                    </div>
                  </td>

                  <td className="p-5">
                    <div className="flex justify-center items-center gap-2">
                      <div className="flex flex-col items-center px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="text-[9px] font-black text-emerald-600 leading-none">{activities?.completed || 0}</span>
                        <span className="text-[7px] font-bold text-emerald-500 uppercase">Done</span>
                      </div>
                      <div className={`flex flex-col items-center px-3 py-1 rounded-lg border ${activities?.overdue > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                        <span className={`text-[9px] font-black leading-none ${activities?.overdue > 0 ? 'text-red-600' : 'text-slate-400'}`}>{activities?.overdue || 0}</span>
                        <span className="text-[7px] font-bold text-slate-400 uppercase">Late</span>
                      </div>
                    </div>
                  </td>

                  {/* NEW TIMELINE COLUMN */}
                  <td className="p-5 w-64">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase">
                        <span className="text-slate-500 flex items-center gap-1">
                            <Timer size={10} className="text-indigo-500" /> {daysLeft} Days Remaining
                        </span>
                        <span className={timePercent > 90 && project.progress < 90 ? 'text-red-500 font-black' : 'text-slate-400'}>
                            {Math.round(timePercent)}% Time Used
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-700 ${timePercent > 90 && project.progress < 80 ? 'bg-red-500' : 'bg-slate-400'}`} 
                            style={{ width: `${timePercent}%` }} 
                        />
                      </div>
                    </div>
                  </td>

                  <td className="p-5 w-64">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase">
                        <span className={projectStatus === 'OVERDUE' ? 'text-red-600 animate-pulse' : 'text-indigo-600'}>
                          {projectStatus} ({project.progress}%)
                        </span>
                        <span className="text-slate-400">Tasks: {project.sveMetrics?.taskCompletionRate}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-700 ${projectStatus === 'OVERDUE' ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  </td>

                  <td className="p-5 text-right">
                    <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- MOBILE GRID VIEW --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {filteredProjects?.map((project: any) => {
          const { projectStatus } = project.sveMetrics || {};
          const now = new Date();
          const end = project.scheduledEnd ? new Date(project.scheduledEnd) : null;
          const daysLeft = end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

          return (
            <div key={project.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <h3 className="text-base font-black text-slate-800 leading-tight">{project.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1">
                        <Timer size={10}/> {daysLeft}d left
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{project.projectManager}</span>
                  </div>
                </div>
                <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
              </div>

              {/* Progress & Timeline visual for Mobile */}
              <div className="space-y-3 mb-5">
                <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                        <span>Work Done</span>
                        <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-700 ${projectStatus === 'OVERDUE' ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${project.progress}%` }} />
                    </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-end">
                 <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase">Budget Utilization</span>
                    <p className={`text-sm font-black ${project.totalActualCost > project.allocatedBudget ? 'text-red-600' : 'text-slate-800'}`}>
                      ${project.totalActualCost?.toLocaleString()}
                    </p>
                 </div>
                 <Link href={`/mm/projects/${project.id}`} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                    <ArrowRight size={16} />
                 </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
// 'use client';

// import React, { useMemo, useState } from 'react';
// import Link from 'next/link';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { toast } from "sonner";
// import { 
//   MapPin, User as UserIcon, Calendar, Clock, AlertTriangle, 
//   TrendingUp, BarChart3, Layers, ArrowRight, FileSpreadsheet,
//   Briefcase, CheckCircle2, Timer, Construction
// } from 'lucide-react';
// import { ItemActions } from '../SubComponents';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// const PROJECT_SCOPES: SearchScope[] = [
//   { key: 'name', label: 'Project Name' },
//   { key: 'projectManager', label: 'Project Manager' },
//   { key: 'workshopName', label: 'Workshop/Location' },
// ];

// export const ProjectGridView = ({ projects, onEdit, onDelete, permissions }: any) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['name', 'projectManager']);

//   const filteredProjects = useMemo(() => {
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return projects || [];
//     return projects?.filter((project: any) => {
//       const dataToSearch = { 
//         ...project, 
//         workshopName: project.responsibleWorkshop?.name || 'Central' 
//       };
//       return activeSearchFields.some(field => 
//         String((dataToSearch as any)[field] || '').toLowerCase().includes(term)
//       );
//     });
//   }, [projects, searchTerm, activeSearchFields]);
//    const handleExport = async () => {
//      try {
//        const workbook = new ExcelJS.Workbook();
//        const worksheet = workbook.addWorksheet('SVE Projects Report');
//        worksheet.columns = [
//          { header: 'Project Name', key: 'name', width: 30 },
//          { header: 'Status', key: 'status', width: 15 },
//          { header: 'Manager', key: 'manager', width: 25 },
//          { header: 'Sched. Start', key: 'start', width: 15 },
//          { header: 'Sched. End', key: 'end', width: 15 },
//          { header: 'Progress (%)', key: 'progress', width: 12 },
//          { header: 'Budget ($)', key: 'budget', width: 15 },
//          { header: 'Actual Cost ($)', key: 'cost', width: 15 },
//        ];
//        worksheet.getRow(1).font = { bold: true };
//        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
//        filteredProjects.forEach((proj: any) => {
//          worksheet.addRow({
//            name: proj.name,
//            status: proj.status,
//            manager: proj.projectManager,
//            start: proj.scheduledStart ? new Date(proj.scheduledStart).toLocaleDateString() : 'N/A',
//            end: proj.scheduledEnd ? new Date(proj.scheduledEnd).toLocaleDateString() : 'N/A',
//            progress: proj.progress || 0,
//            budget: proj.allocatedBudget || 0,
//            cost: proj.totalActualCost || 0,
//          });
//        });
//        const buffer = await workbook.xlsx.writeBuffer();
//        saveAs(new Blob([buffer]), `Project_SVE_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
//        toast.success(`Exported ${filteredProjects.length} projects successfully`);
//      } catch (error) {
//        toast.error("Excel generation failed");
//      }
//    };
//   return (
//     <div className="space-y-6">
      
//      {/* 🔍 SEARCH & EXPORT BAR */}
// <div className="bg-white p-4 lg:p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
//   <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
    
//     {/* Left: Search Engine - occupies remaining space */}
//     <div className="w-full lg:flex-1">
//       <SearchFilterEngine 
//           scopes={PROJECT_SCOPES}
//           initialActiveScopes={activeSearchFields}
//           onSearchChange={setSearchTerm}
//           onScopesChange={setActiveSearchFields}
//           placeholder="Search projects..."
//       />
//     </div>

//     {/* Right: Stats & Actions - aligned to the center of the Search Bar */}
//     <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0">
        
//         {/* Statistics Ledger */}
//         <div className="flex flex-col text-left lg:text-right lg:pr-4 lg:border-r border-slate-100">
//           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-tight">
//             Active Ledger
//           </span>
//           <span className="text-sm font-black text-indigo-600 flex items-center gap-1.5 lg:justify-end">
//             <Layers size={14} className="text-indigo-400" />
//             {filteredProjects.length} Projects
//           </span>
//         </div>

//         {/* Action Button - Height matches h-16 of search engine */}
//         <button 
//           onClick={handleExport}
//           className="h-16 px-6 lg:px-8 bg-emerald-600 text-white rounded-[1.25rem] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-3 shrink-0 group"
//         >
//           <div className="p-2 bg-emerald-500/50 rounded-lg group-hover:scale-110 transition-transform">
//             <FileSpreadsheet size={18} />
//           </div>
//           <div className="flex flex-col items-start leading-none">
//             <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
//             <span className="text-[8px] font-medium opacity-80 uppercase tracking-tighter">Excel Report</span>
//           </div>
//         </button>

//     </div>
//   </div>
// </div>

//       {/* --- DESKTOP TABLE VIEW --- */}
//       <div className="hidden lg:block overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
//         <table className="w-full text-left border-collapse">
//           <thead>
//             <tr className="bg-slate-50/50 border-b border-slate-100">
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project / Workshop</th>
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Activity SVE</th>
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Progress</th>
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost Variance</th>
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-50">
//             {filteredProjects.map((project: any) => {
//               const { activities, projectStatus } = project.sveMetrics || {};
//               const isOverBudget = project.totalActualCost > project.allocatedBudget;
              
//               return (
//                 <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
//                   <td className="p-5">
//                     <div className="flex flex-col">
//                       <Link href={`/mm/projects/${project.id}`} className="text-sm font-bold text-slate-800 hover:text-indigo-600">
//                         {project.name}
//                       </Link>
//                       <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
//                         <Construction size={10}/> {project.responsibleWorkshop?.name || 'HQ'}
//                       </span>
//                     </div>
//                   </td>

//                   {/* SVE METRICS COLUMN */}
//                   <td className="p-5">
//                     <div className="flex justify-center items-center gap-2">
//                       <div className="flex flex-col items-center px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
//                         <span className="text-[9px] font-black text-emerald-600 leading-none">{activities?.completed || 0}</span>
//                         <span className="text-[7px] font-bold text-emerald-500 uppercase">Done</span>
//                       </div>
//                       <div className={`flex flex-col items-center px-3 py-1 rounded-lg border ${activities?.overdue > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
//                         <span className={`text-[9px] font-black leading-none ${activities?.overdue > 0 ? 'text-red-600' : 'text-slate-400'}`}>{activities?.overdue || 0}</span>
//                         <span className="text-[7px] font-bold text-slate-400 uppercase">Late</span>
//                       </div>
//                       <div className={`flex flex-col items-center px-3 py-1 rounded-lg border ${activities?.delayed > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
//                         <span className={`text-[9px] font-black leading-none ${activities?.delayed > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{activities?.delayed || 0}</span>
//                         <span className="text-[7px] font-bold text-slate-400 uppercase">Risk</span>
//                       </div>
//                     </div>
//                   </td>

//                   <td className="p-5 w-64">
//                     <div className="space-y-1.5">
//                       <div className="flex justify-between items-center text-[9px] font-black uppercase">
//                         <span className={projectStatus === 'OVERDUE' ? 'text-red-600 animate-pulse' : 'text-indigo-600'}>
//                           {projectStatus} ({project.progress}%)
//                         </span>
//                         <span className="text-slate-400">Tasks: {project.sveMetrics?.taskCompletionRate}%</span>
//                       </div>
//                       <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
//                         <div className={`h-full transition-all duration-700 ${projectStatus === 'OVERDUE' ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${project.progress}%` }} />
//                       </div>
//                     </div>
//                   </td>

//                   <td className="p-5">
//                     <div className="flex flex-col text-xs font-black">
//                       <span className={isOverBudget ? 'text-red-600' : 'text-slate-700'}>${project.totalActualCost?.toLocaleString()}</span>
//                       <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Budget Max: ${project.allocatedBudget?.toLocaleString()}</span>
//                     </div>
//                   </td>

//                   <td className="p-5 text-right">
//                     <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* --- MOBILE GRID VIEW --- */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
//         {filteredProjects?.map((project: any) => {
//           const { activities, projectStatus, tasks } = project.sveMetrics || {};
          
//           return (
//             <div key={project.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col shadow-sm relative overflow-hidden">
//               {projectStatus === 'OVERDUE' && (
//                 <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest">Delayed</div>
//               )}
              
//               <div className="flex justify-between items-start mb-4">
//                 <div className="flex gap-2">
//                    <div className="flex flex-col">
//                       <h3 className="text-base font-black text-slate-800 leading-tight">{project.name}</h3>
//                       <span className="text-[10px] font-bold text-slate-400 uppercase">{project.projectManager}</span>
//                    </div>
//                 </div>
//                 <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
//               </div>

//               {/* SVE Stats Pill for Mobile */}
//               <div className="flex items-center gap-2 mb-4">
//                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
//                     <CheckCircle2 size={10} className="text-emerald-500"/>
//                     <span className="text-[9px] font-black text-slate-600">{activities?.completed}</span>
//                  </div>
//                  <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg border border-red-100">
//                     <Clock size={10} className="text-red-500"/>
//                     <span className="text-[9px] font-black text-red-600">{activities?.overdue}</span>
//                  </div>
//                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
//                     <AlertTriangle size={10} className="text-amber-500"/>
//                     <span className="text-[9px] font-black text-amber-600">{activities?.delayed}</span>
//                  </div>
//               </div>

//               <div className="space-y-1.5 mb-5">
//                 <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase">
//                     <span>Overall Progress</span>
//                     <span className="text-slate-800">{project.progress}%</span>
//                 </div>
//                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
//                     <div className={`h-full transition-all duration-700 ${projectStatus === 'OVERDUE' ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${project.progress}%` }} />
//                 </div>
//               </div>

//               <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-end">
//                  <div>
//                     <span className="text-[8px] font-black text-slate-400 uppercase">Total Spend</span>
//                     <p className={`text-sm font-black ${project.totalActualCost > project.allocatedBudget ? 'text-red-600' : 'text-slate-800'}`}>
//                       ${project.totalActualCost?.toLocaleString()}
//                     </p>
//                  </div>
//                  <Link href={`/mm/projects/${project.id}`} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
//                     <ArrowRight size={16} />
//                  </Link>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };
// 'use client';

// import React, { useMemo, useState } from 'react';
// import Link from 'next/link';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { toast } from "sonner";
// import { 
//   MapPin, User as UserIcon, Calendar, Clock, AlertTriangle, 
//   TrendingUp, BarChart3, Layers, ArrowRight, FileSpreadsheet,
//   Briefcase, ExternalLink
// } from 'lucide-react';
// import { ItemActions } from '../SubComponents';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// const PROJECT_SCOPES: SearchScope[] = [
//   { key: 'name', label: 'Project Name' },
//   { key: 'projectManager', label: 'Project Manager' },
//   { key: 'workshopName', label: 'Workshop/Location' },
// ];

// export const ProjectGridView = ({ projects, onEdit, onDelete, permissions }: any) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['name', 'projectManager']);

//   const filteredProjects = useMemo(() => {
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return projects || [];
//     return projects?.filter((project: any) => {
//       const dataToSearch = { 
//         ...project, 
//         workshopName: project.responsibleWorkshop?.name || 'Central' 
//       };
//       return activeSearchFields.some(field => 
//         String((dataToSearch as any)[field] || '').toLowerCase().includes(term)
//       );
//     });
//   }, [projects, searchTerm, activeSearchFields]);

//   const handleExport = async () => {
//     try {
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet('SVE Projects Report');
//       worksheet.columns = [
//         { header: 'Project Name', key: 'name', width: 30 },
//         { header: 'Status', key: 'status', width: 15 },
//         { header: 'Manager', key: 'manager', width: 25 },
//         { header: 'Sched. Start', key: 'start', width: 15 },
//         { header: 'Sched. End', key: 'end', width: 15 },
//         { header: 'Progress (%)', key: 'progress', width: 12 },
//         { header: 'Budget ($)', key: 'budget', width: 15 },
//         { header: 'Actual Cost ($)', key: 'cost', width: 15 },
//       ];
//       worksheet.getRow(1).font = { bold: true };
//       worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
//       filteredProjects.forEach((proj: any) => {
//         worksheet.addRow({
//           name: proj.name,
//           status: proj.status,
//           manager: proj.projectManager,
//           start: proj.scheduledStart ? new Date(proj.scheduledStart).toLocaleDateString() : 'N/A',
//           end: proj.scheduledEnd ? new Date(proj.scheduledEnd).toLocaleDateString() : 'N/A',
//           progress: proj.progress || 0,
//           budget: proj.allocatedBudget || 0,
//           cost: proj.totalActualCost || 0,
//         });
//       });
//       const buffer = await workbook.xlsx.writeBuffer();
//       saveAs(new Blob([buffer]), `Project_SVE_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
//       toast.success(`Exported ${filteredProjects.length} projects successfully`);
//     } catch (error) {
//       toast.error("Excel generation failed");
//     }
//   };

//   return (
//     <div className="space-y-6">
      
//       {/* 🔍 SEARCH & EXPORT BAR */}
//       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between">
//           <div className="flex-1">
//             <SearchFilterEngine 
//                 scopes={PROJECT_SCOPES}
//                 initialActiveScopes={activeSearchFields}
//                 onSearchChange={setSearchTerm}
//                 onScopesChange={setActiveSearchFields}
//                 placeholder="Search projects..."
//             />
//           </div>
//           <button 
//             onClick={handleExport}
//             className="h-16 px-8 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-3"
//           >
//             <FileSpreadsheet size={20} />
//             <span className="text-[11px] font-black uppercase tracking-widest">Export Master List</span>
//           </button>
//         </div>
//       </div>

//       {/* --- DESKTOP TABLE VIEW --- */}
//       <div className="hidden lg:block overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
//         <table className="w-full text-left border-collapse">
//           <thead>
//             <tr className="bg-slate-50/50 border-b border-slate-100">
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project / Manager</th>
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Baseline</th>
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-64">Live Timeline (SVE)</th>
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost Variance</th>
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-50">
//             {filteredProjects.map((project: any) => {
//               const start = project.scheduledStart ? new Date(project.scheduledStart) : null;
//               const end = project.scheduledEnd ? new Date(project.scheduledEnd) : null;
//               const isDelayed = end && end < new Date() && project.status !== 'COMPLETED';
//               const isOverBudget = project.totalActualCost > project.allocatedBudget;
//               return (
//                 <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
//                   <td className="p-5">
//                     <div className="flex flex-col">
//                       <Link href={`/mm/projects/${project.id}`} className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors">
//                         {project.name}
//                       </Link>
//                       <div className="flex items-center gap-2 text-[10px] text-slate-400">
//                         <UserIcon size={10}/> {project.projectManager || 'Unassigned'}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="p-5">
//                     <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
//                       <div className="flex flex-col">
//                         <span className="text-[8px] text-slate-400 uppercase">Start</span>
//                         <span>{start ? start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}</span>
//                       </div>
//                       <ArrowRight size={12} className="text-slate-300" />
//                       <div className="flex flex-col">
//                         <span className="text-[8px] text-slate-400 uppercase">End</span>
//                         <span className={isDelayed ? 'text-red-600 animate-pulse' : ''}>
//                            {end ? end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}
//                         </span>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="p-5">
//                     <div className="space-y-1.5">
//                       <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight">
//                         <span className={isDelayed ? 'text-red-500' : 'text-indigo-600'}>
//                           {isDelayed ? 'Critical Variance' : `Progress: ${project.progress}%`}
//                         </span>
//                         <span className="text-slate-400">{project.status?.replace('_', ' ')}</span>
//                       </div>
//                       <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
//                         <div className={`absolute top-0 left-0 h-full transition-all duration-700 ${project.status === 'COMPLETED' ? 'bg-emerald-500' : isDelayed ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${project.progress}%` }} />
//                       </div>
//                     </div>
//                   </td>
//                   <td className="p-5">
//                     <div className="flex flex-col text-xs font-black">
//                       <span className={isOverBudget ? 'text-red-600' : 'text-slate-700'}>${project.totalActualCost?.toLocaleString()}</span>
//                       <span className="text-[9px] text-slate-400 font-bold">/ ${project.allocatedBudget?.toLocaleString()}</span>
//                     </div>
//                   </td>
//                   <td className="p-5 text-right">
//                     <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* --- UPDATED MOBILE GRID VIEW (With Timelines Re-integrated) --- */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
//         {filteredProjects?.map((project: any) => {
//           const start = project.scheduledStart ? new Date(project.scheduledStart) : null;
//           const end = project.scheduledEnd ? new Date(project.scheduledEnd) : null;
//           const isDelayed = end && end < new Date() && project.status !== 'COMPLETED';
//           const isCompleted = project.status === 'COMPLETED';

//           return (
//             <div key={project.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col shadow-sm">
//               <div className="flex justify-between items-start mb-4">
//                 <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
//                   isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
//                   isDelayed ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-blue-50 text-blue-600 border-blue-100'
//                 }`}>
//                   {project.status?.replace('_', ' ')}
//                 </span>
//                 <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
//               </div>
              
//               <Link href={`/mm/projects/${project.id}`}>
//                 <h3 className="text-base font-black text-slate-800 mb-1 hover:text-indigo-600">{project.name}</h3>
//               </Link>

//               <div className="flex flex-wrap gap-3 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
//                  <div className="flex items-center gap-1"><MapPin size={12}/> {project.responsibleWorkshop?.name || 'Central'}</div>
//                  <div className="flex items-center gap-1"><UserIcon size={12}/> {project.projectManager || 'N/A'}</div>
//               </div>

//               {/* NEW: MOBILE TIMELINE DATES */}
//               <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
//                   <div className="flex flex-col">
//                     <span className="text-[8px] font-black text-slate-400 uppercase">Start Date</span>
//                     <span className="text-[10px] font-black text-slate-700">{start ? start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}</span>
//                   </div>
//                   <ArrowRight size={14} className="text-slate-300" />
//                   <div className="flex flex-col text-right">
//                     <span className="text-[8px] font-black text-slate-400 uppercase">End Date</span>
//                     <span className={`text-[10px] font-black ${isDelayed ? 'text-red-500' : 'text-slate-700'}`}>
//                       {end ? end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}
//                     </span>
//                   </div>
//               </div>

//               <div className="space-y-1.5 mb-5">
//                 <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase">
//                     <span>Execution Progress</span>
//                     <span className={isDelayed ? 'text-red-600 font-black' : 'text-slate-800'}>{project.progress}%</span>
//                 </div>
//                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
//                     <div className={`h-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : isDelayed ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${project.progress}%` }} />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-2 mt-auto">
//                 <div className="px-3 py-2 rounded-xl bg-white border border-slate-100">
//                     <span className="text-[8px] font-black text-slate-400 uppercase">Spend</span>
//                     <p className="text-xs font-black text-slate-800">${project.totalActualCost?.toLocaleString()}</p>
//                 </div>
//                 <div className="px-3 py-2 rounded-xl bg-white border border-slate-100 text-right">
//                     <span className="text-[8px] font-black text-slate-400 uppercase">Baseline</span>
//                     <p className="text-xs font-black text-slate-400">${project.allocatedBudget?.toLocaleString()}</p>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {filteredProjects?.length === 0 && (
//         <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
//           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No projects found</p>
//         </div>
//       )}
//     </div>
//   );
// };
// 'use client';

// import React, { useMemo, useState } from 'react';
// import Link from 'next/link';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { toast } from "sonner";
// import { 
//   MapPin, User as UserIcon, Calendar, Clock, AlertTriangle, 
//   TrendingUp, BarChart3, Layers, ArrowRight, FileSpreadsheet,
//   Briefcase, ExternalLink
// } from 'lucide-react';
// import { ItemActions } from '../SubComponents';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// // --- SEARCH CONFIGURATION ---
// const PROJECT_SCOPES: SearchScope[] = [
//   { key: 'name', label: 'Project Name' },
//   { key: 'projectManager', label: 'Project Manager' },
//   { key: 'workshopName', label: 'Workshop/Location' },
// ];

// export const ProjectGridView = ({ projects, onEdit, onDelete, permissions }: any) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['name', 'projectManager']);

//   // --- FILTER LOGIC ---
//   const filteredProjects = useMemo(() => {
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return projects || [];
//     return projects?.filter((project: any) => {
//       const dataToSearch = { 
//         ...project, 
//         workshopName: project.responsibleWorkshop?.name || 'Central' 
//       };
//       return activeSearchFields.some(field => 
//         String((dataToSearch as any)[field] || '').toLowerCase().includes(term)
//       );
//     });
//   }, [projects, searchTerm, activeSearchFields]);

//   // --- EXCEL EXPORT (Financial Performance & Feasibility Tracking) ---
//   const handleExport = async () => {
//     try {
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet('SVE Projects Report');

//       worksheet.columns = [
//         { header: 'Project Name', key: 'name', width: 30 },
//         { header: 'Status', key: 'status', width: 15 },
//         { header: 'Manager', key: 'manager', width: 25 },
//         { header: 'Sched. Start', key: 'start', width: 15 },
//         { header: 'Sched. End', key: 'end', width: 15 },
//         { header: 'Progress (%)', key: 'progress', width: 12 },
//         { header: 'Budget ($)', key: 'budget', width: 15 },
//         { header: 'Actual Cost ($)', key: 'cost', width: 15 },
//       ];

//       worksheet.getRow(1).font = { bold: true };
//       worksheet.getRow(1).fill = { 
//         type: 'pattern', 
//         pattern: 'solid', 
//         fgColor: { argb: 'F1F5F9' } 
//       };

//       filteredProjects.forEach((proj: any) => {
//         worksheet.addRow({
//           name: proj.name,
//           status: proj.status,
//           manager: proj.projectManager,
//           start: proj.scheduledStart ? new Date(proj.scheduledStart).toLocaleDateString() : 'N/A',
//           end: proj.scheduledEnd ? new Date(proj.scheduledEnd).toLocaleDateString() : 'N/A',
//           progress: proj.progress || 0,
//           budget: proj.allocatedBudget || 0,
//           cost: proj.totalActualCost || 0,
//         });
//       });

//       const buffer = await workbook.xlsx.writeBuffer();
//       saveAs(new Blob([buffer]), `Project_SVE_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
//       toast.success(`Exported ${filteredProjects.length} projects successfully`);
//     } catch (error) {
//       toast.error("Excel generation failed");
//     }
//   };

//   return (
//     <div className="space-y-6">
      
//       {/* 🔍 SEARCH & EXPORT BAR */}
//       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between">
//           <div className="flex-1">
//             <SearchFilterEngine 
//                 scopes={PROJECT_SCOPES}
//                 initialActiveScopes={activeSearchFields}
//                 onSearchChange={setSearchTerm}
//                 onScopesChange={setActiveSearchFields}
//                 placeholder="Search projects by name, manager or workshop..."
//             />
//           </div>

//           <button 
//             onClick={handleExport}
//             className="h-16 px-8 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-3"
//           >
//             <FileSpreadsheet size={20} />
//             <span className="text-[11px] font-black uppercase tracking-widest">Export Master List</span>
//           </button>
//         </div>
//       </div>

//       {/* --- DESKTOP TABLE VIEW (Optimized for Executive Review) --- */}
//       <div className="hidden lg:block overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
//         <table className="w-full text-left border-collapse">
//           <thead>
//             <tr className="bg-slate-50/50 border-b border-slate-100">
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project / Manager</th>
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Baseline</th>
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-64">Live Timeline (SVE)</th>
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost Variance</th>
//               <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-50">
//             {filteredProjects.map((project: any) => {
//               const start = project.scheduledStart ? new Date(project.scheduledStart) : null;
//               const end = project.scheduledEnd ? new Date(project.scheduledEnd) : null;
//               const isDelayed = end && end < new Date() && project.status !== 'COMPLETED';
//               const isOverBudget = project.totalActualCost > project.allocatedBudget;
              
//               return (
//                 <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
//                   <td className="p-5">
//                     <div className="flex flex-col">
//                       <Link href={`/mm/projects/${project.id}`} className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors">
//                         {project.name}
//                       </Link>
//                       <div className="flex items-center gap-2 text-[10px] text-slate-400">
//                         <UserIcon size={10}/> {project.projectManager || 'Unassigned'}
//                       </div>
//                     </div>
//                   </td>
                  
//                   <td className="p-5">
//                     <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
//                       <div className="flex flex-col">
//                         <span className="text-[8px] text-slate-400 uppercase">Start</span>
//                         <span>{start ? start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}</span>
//                       </div>
//                       <ArrowRight size={12} className="text-slate-300" />
//                       <div className="flex flex-col">
//                         <span className="text-[8px] text-slate-400 uppercase">End</span>
//                         <span className={isDelayed ? 'text-red-600 animate-pulse' : ''}>
//                            {end ? end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}
//                         </span>
//                       </div>
//                     </div>
//                   </td>

//                   <td className="p-5">
//                     <div className="space-y-1.5">
//                       <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight">
//                         <span className={isDelayed ? 'text-red-500' : 'text-indigo-600'}>
//                           {isDelayed ? 'Critical Variance' : `Progress: ${project.progress}%`}
//                         </span>
//                         <span className="text-slate-400">{project.status?.replace('_', ' ')}</span>
//                       </div>
//                       <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
//                         <div 
//                           className={`absolute top-0 left-0 h-full transition-all duration-700 ${
//                             project.status === 'COMPLETED' ? 'bg-emerald-500' : isDelayed ? 'bg-red-500' : 'bg-indigo-600'
//                           }`} 
//                           style={{ width: `${project.progress}%` }} 
//                         />
//                       </div>
//                     </div>
//                   </td>

//                   <td className="p-5">
//                     <div className="flex flex-col">
//                       <div className="flex items-baseline gap-1">
//                         <span className={`text-xs font-black ${isOverBudget ? 'text-red-600' : 'text-slate-700'}`}>
//                           ${project.totalActualCost?.toLocaleString()}
//                         </span>
//                         <span className="text-[9px] text-slate-400 font-bold">/ ${project.allocatedBudget?.toLocaleString()}</span>
//                       </div>
//                       {isOverBudget && <span className="text-[8px] font-black text-red-500 uppercase">Budget Ceiling Breach</span>}
//                     </div>
//                   </td>

//                   <td className="p-5 text-right">
//                     <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* --- MOBILE GRID VIEW (High-Engagement Cards) --- */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
//         {filteredProjects?.map((project: any) => {
//           const isDelayed = project.scheduledEnd && new Date(project.scheduledEnd) < new Date() && project.status !== 'COMPLETED';
//           const isCompleted = project.status === 'COMPLETED';

//           return (
//             <div key={project.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col shadow-sm">
//               <div className="flex justify-between items-start mb-4">
//                 <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
//                   isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
//                   isDelayed ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-blue-50 text-blue-600 border-blue-100'
//                 }`}>
//                   {project.status?.replace('_', ' ')}
//                 </span>
//                 <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
//               </div>
              
//               <Link href={`/mm/projects/${project.id}`}>
//                 <h3 className="text-base font-black text-slate-800 mb-1 hover:text-indigo-600">{project.name}</h3>
//               </Link>

//               <div className="flex flex-wrap gap-3 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
//                  <div className="flex items-center gap-1"><MapPin size={12}/> {project.responsibleWorkshop?.name || 'Central'}</div>
//                  <div className="flex items-center gap-1"><UserIcon size={12}/> {project.projectManager || 'N/A'}</div>
//               </div>

//               {/* Metrics Grid */}
//               <div className="bg-slate-50 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-4 border border-slate-100">
//                  <div className="space-y-1">
//                     <p className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1"><Layers size={10}/> Utilization</p>
//                     <p className="text-[10px] font-black text-slate-700">85% Resources</p>
//                  </div>
//                  <div className="space-y-1 text-right">
//                     <p className="text-[8px] font-black text-slate-400 uppercase flex items-center justify-end gap-1"><BarChart3 size={10}/> Priority</p>
//                     <p className="text-[10px] font-black text-indigo-600 uppercase">Strategic Level 4</p>
//                  </div>
//               </div>

//               <div className="space-y-1.5 mb-5">
//                 <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase">
//                     <span>Progress</span>
//                     <span className={isDelayed ? 'text-red-600' : 'text-slate-800'}>{project.progress}%</span>
//                 </div>
//                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
//                     <div 
//                         className={`h-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : isDelayed ? 'bg-red-500' : 'bg-indigo-600'}`} 
//                         style={{ width: `${project.progress}%` }} 
//                     />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-2 mt-auto">
//                 <div className="px-3 py-2 rounded-xl bg-white border border-slate-100">
//                     <span className="text-[8px] font-black text-slate-400 uppercase">Total Spend</span>
//                     <p className="text-xs font-black text-slate-800">${project.totalActualCost?.toLocaleString()}</p>
//                 </div>
//                 <div className="px-3 py-2 rounded-xl bg-white border border-slate-100 text-right">
//                     <span className="text-[8px] font-black text-slate-400 uppercase">Valuation</span>
//                     <p className="text-xs font-black text-emerald-600">ROI Cap 2.5x</p>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {filteredProjects?.length === 0 && (
//         <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
//           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Zero matching projects in current scope</p>
//         </div>
//       )}
//     </div>
//   );
// };