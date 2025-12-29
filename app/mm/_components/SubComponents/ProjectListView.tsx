'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from "sonner";
import { 
  MapPin, User as UserIcon, Calendar, Clock, AlertTriangle, 
  TrendingUp, BarChart3, Layers, ArrowRight, FileSpreadsheet,
  Briefcase, ExternalLink
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
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between">
          <div className="flex-1">
            <SearchFilterEngine 
                scopes={PROJECT_SCOPES}
                initialActiveScopes={activeSearchFields}
                onSearchChange={setSearchTerm}
                onScopesChange={setActiveSearchFields}
                placeholder="Search projects..."
            />
          </div>
          <button 
            onClick={handleExport}
            className="h-16 px-8 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-3"
          >
            <FileSpreadsheet size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">Export Master List</span>
          </button>
        </div>
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden lg:block overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project / Manager</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Baseline</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-64">Live Timeline (SVE)</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost Variance</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProjects.map((project: any) => {
              const start = project.scheduledStart ? new Date(project.scheduledStart) : null;
              const end = project.scheduledEnd ? new Date(project.scheduledEnd) : null;
              const isDelayed = end && end < new Date() && project.status !== 'COMPLETED';
              const isOverBudget = project.totalActualCost > project.allocatedBudget;
              return (
                <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-5">
                    <div className="flex flex-col">
                      <Link href={`/mm/projects/${project.id}`} className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors">
                        {project.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <UserIcon size={10}/> {project.projectManager || 'Unassigned'}
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-400 uppercase">Start</span>
                        <span>{start ? start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}</span>
                      </div>
                      <ArrowRight size={12} className="text-slate-300" />
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-400 uppercase">End</span>
                        <span className={isDelayed ? 'text-red-600 animate-pulse' : ''}>
                           {end ? end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight">
                        <span className={isDelayed ? 'text-red-500' : 'text-indigo-600'}>
                          {isDelayed ? 'Critical Variance' : `Progress: ${project.progress}%`}
                        </span>
                        <span className="text-slate-400">{project.status?.replace('_', ' ')}</span>
                      </div>
                      <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`absolute top-0 left-0 h-full transition-all duration-700 ${project.status === 'COMPLETED' ? 'bg-emerald-500' : isDelayed ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col text-xs font-black">
                      <span className={isOverBudget ? 'text-red-600' : 'text-slate-700'}>${project.totalActualCost?.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-400 font-bold">/ ${project.allocatedBudget?.toLocaleString()}</span>
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

      {/* --- UPDATED MOBILE GRID VIEW (With Timelines Re-integrated) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {filteredProjects?.map((project: any) => {
          const start = project.scheduledStart ? new Date(project.scheduledStart) : null;
          const end = project.scheduledEnd ? new Date(project.scheduledEnd) : null;
          const isDelayed = end && end < new Date() && project.status !== 'COMPLETED';
          const isCompleted = project.status === 'COMPLETED';

          return (
            <div key={project.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                  isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  isDelayed ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {project.status?.replace('_', ' ')}
                </span>
                <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
              </div>
              
              <Link href={`/mm/projects/${project.id}`}>
                <h3 className="text-base font-black text-slate-800 mb-1 hover:text-indigo-600">{project.name}</h3>
              </Link>

              <div className="flex flex-wrap gap-3 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                 <div className="flex items-center gap-1"><MapPin size={12}/> {project.responsibleWorkshop?.name || 'Central'}</div>
                 <div className="flex items-center gap-1"><UserIcon size={12}/> {project.projectManager || 'N/A'}</div>
              </div>

              {/* NEW: MOBILE TIMELINE DATES */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Start Date</span>
                    <span className="text-[10px] font-black text-slate-700">{start ? start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-300" />
                  <div className="flex flex-col text-right">
                    <span className="text-[8px] font-black text-slate-400 uppercase">End Date</span>
                    <span className={`text-[10px] font-black ${isDelayed ? 'text-red-500' : 'text-slate-700'}`}>
                      {end ? end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}
                    </span>
                  </div>
              </div>

              <div className="space-y-1.5 mb-5">
                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase">
                    <span>Execution Progress</span>
                    <span className={isDelayed ? 'text-red-600 font-black' : 'text-slate-800'}>{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : isDelayed ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${project.progress}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <div className="px-3 py-2 rounded-xl bg-white border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Spend</span>
                    <p className="text-xs font-black text-slate-800">${project.totalActualCost?.toLocaleString()}</p>
                </div>
                <div className="px-3 py-2 rounded-xl bg-white border border-slate-100 text-right">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Baseline</span>
                    <p className="text-xs font-black text-slate-400">${project.allocatedBudget?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects?.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No projects found</p>
        </div>
      )}
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