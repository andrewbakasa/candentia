'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from "sonner";
import { 
  MapPin, User as UserIcon, Briefcase, ExternalLink,
  Search, X, Filter, FileSpreadsheet
} from 'lucide-react';
import { ItemActions } from '../SubComponents';

// --- SEARCH CONFIGURATION ---
export const searchableProjectFields = {
  name: { label: 'Project Name' },
  manager: { label: 'Project Manager' },
  workshop: { label: 'Workshop/Location' },
};

export type ProjectSearchKey = keyof typeof searchableProjectFields;

export const ProjectGridView = ({ projects, onEdit, onDelete, permissions }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchFields, setActiveSearchFields] = useState<ProjectSearchKey[]>(
    ['name', 'manager']
  );

  // --- REFACTORED FILTER LOGIC ---
  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return projects || [];

    return projects?.filter((project: any) => {
      const matchesName = activeSearchFields.includes('name') && 
        project.name?.toLowerCase().includes(term);
      
      const matchesManager = activeSearchFields.includes('manager') && 
        project.projectManager?.toLowerCase().includes(term);
      
      const matchesWorkshop = activeSearchFields.includes('workshop') && 
        project.responsibleWorkshop?.name?.toLowerCase().includes(term);

      return matchesName || matchesManager || matchesWorkshop;
    });
  }, [projects, searchTerm, activeSearchFields]);

  // --- EXCEL EXPORT LOGIC ---
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Projects Report');

      // Define Columns
      worksheet.columns = [
        { header: 'Project Name', key: 'name', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Manager', key: 'manager', width: 25 },
        { header: 'Workshop', key: 'workshop', width: 20 },
        { header: 'Progress (%)', key: 'progress', width: 15 },
        { header: 'Actual Cost', key: 'cost', width: 15 },
        { header: 'Budget', key: 'budget', width: 15 },
        { header: 'Variance', key: 'variance', width: 15 },
      ];

      // Styling Header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F1F5F9' }
      };

      // Add Data
      filteredProjects.forEach((proj: any) => {
        const variance = (proj.allocatedBudget || 0) - (proj.totalActualCost || 0);
        worksheet.addRow({
          name: proj.name,
          status: proj.status || 'PLANNED',
          manager: proj.projectManager || 'N/A',
          workshop: proj.responsibleWorkshop?.name || 'Central',
          progress: proj.progress || 0,
          cost: proj.totalActualCost || 0,
          budget: proj.allocatedBudget || 0,
          variance: variance,
        });
      });

      // Generate Buffer and Save
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Projects_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Exported ${filteredProjects.length} projects successfully`);
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to generate Excel report");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 🔍 SEARCH & EXPORT BAR */}
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
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
          >
            <FileSpreadsheet size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Export ({filteredProjects.length})</span>
          </button>
        </div>

        {/* DYNAMIC SCOPE SELECTOR */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                <Filter size={14} className="text-indigo-500" />
                Search Scope:
            </div>
            <div className="flex flex-wrap gap-2">
                {(Object.keys(searchableProjectFields) as ProjectSearchKey[]).map((key) => {
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
                            {searchableProjectFields[key].label}
                        </button>
                    );
                })}
            </div>
        </div>
      </div>

      {/* GRID VIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 md:p-0">
        {filteredProjects?.map((project: any) => {
          const costWarning = project.totalActualCost > project.allocatedBudget;
          
          return (
            <div key={project.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                  project.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                  project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  {project.status?.replace('_', ' ') || 'PLANNED'}
                </span>
                <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
              </div>
              
              <Link href={`/mm/projects/${project.id}`}>
                <h3 className="text-sm font-black text-slate-800 mb-4 hover:text-indigo-600 cursor-pointer flex items-center gap-2">
                  <Briefcase size={14} className="text-slate-400" /> {project.name}
                </h3>
              </Link>
              
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase truncate">
                  <MapPin size={12} className="text-emerald-500" /> {project.responsibleWorkshop?.name || 'Central'}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase truncate">
                  <UserIcon size={12} className="text-blue-500" /> {project.projectManager || 'Unassigned'}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 space-y-3 mt-auto">
                <div>
                  <div className="flex justify-between text-[9px] font-black mb-1.5 text-slate-400 uppercase tracking-widest">
                    <span>Progress</span>
                    <span className="text-blue-600">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Cost</span>
                      <span className={`text-xs font-bold ${costWarning ? 'text-red-600' : 'text-slate-700'}`}>
                        ${project.totalActualCost?.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Budget</span>
                      <span className="text-xs font-bold text-slate-400">
                        ${project.allocatedBudget?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Link 
                    href={`/mm/projects/${project.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Full Project Report <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects?.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching projects found</p>
        </div>
      )}
    </div>
  );
};
// 'use client';

// import React, { useMemo, useState } from 'react';
// import Link from 'next/link';
// import { 
//   MapPin, User as UserIcon, Briefcase, ExternalLink,
//   Search, X, Filter
// } from 'lucide-react';
// import { ItemActions } from '../SubComponents';

// // --- SEARCH CONFIGURATION ---
// export const searchableProjectFields = {
//   name: { label: 'Project Name' },
//   manager: { label: 'Project Manager' },
//   workshop: { label: 'Workshop/Location' },
// };

// export type ProjectSearchKey = keyof typeof searchableProjectFields;

// export const ProjectGridView = ({ projects, onEdit, onDelete, permissions }: any) => {
//   const [searchTerm, setSearchTerm] = useState('');
  
//   // Default search scopes
//   const [activeSearchFields, setActiveSearchFields] = useState<ProjectSearchKey[]>(
//     ['name', 'manager']
//   );

//   // --- REFACTORED FILTER LOGIC ---
//   const filteredProjects = useMemo(() => {
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return projects || [];

//     return projects?.filter((project: any) => {
//       const matchesName = activeSearchFields.includes('name') && 
//         project.name?.toLowerCase().includes(term);
      
//       const matchesManager = activeSearchFields.includes('manager') && 
//         project.projectManager?.toLowerCase().includes(term);
      
//       const matchesWorkshop = activeSearchFields.includes('workshop') && 
//         project.responsibleWorkshop?.name?.toLowerCase().includes(term);

//       return matchesName || matchesManager || matchesWorkshop;
//     });
//   }, [projects, searchTerm, activeSearchFields]);

//   return (
//     <div className="space-y-6">
      
//       {/* 🔍 SEARCH & SCOPE SELECTOR BAR */}
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
//         </div>

//         {/* DYNAMIC SCOPE SELECTOR */}
//         <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2 border-t border-slate-50">
//             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
//                 <Filter size={14} className="text-indigo-500" />
//                 Search Scope:
//             </div>
//             <div className="flex flex-wrap gap-2">
//                 {(Object.keys(searchableProjectFields) as ProjectSearchKey[]).map((key) => {
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
//                             {searchableProjectFields[key].label}
//                         </button>
//                     );
//                 })}
//             </div>
//         </div>
//       </div>

//       {/* GRID VIEW */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 md:p-0">
//         {filteredProjects?.map((project: any) => {
//           const costWarning = project.totalActualCost > project.allocatedBudget;
          
//           return (
//             <div key={project.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
//               <div className="flex justify-between items-start mb-4">
//                 <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
//                   project.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
//                   project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
//                 }`}>
//                   {project.status?.replace('_', ' ') || 'PLANNED'}
//                 </span>
//                 <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
//               </div>
              
//               <Link href={`/mm/projects/${project.id}`}>
//                 <h3 className="text-sm font-black text-slate-800 mb-4 hover:text-indigo-600 cursor-pointer flex items-center gap-2">
//                   <Briefcase size={14} className="text-slate-400" /> {project.name}
//                 </h3>
//               </Link>
              
//               <div className="grid grid-cols-2 gap-3 mb-5">
//                 <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase truncate">
//                   <MapPin size={12} className="text-emerald-500" /> {project.responsibleWorkshop?.name || 'Central'}
//                 </div>
//                 <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase truncate">
//                   <UserIcon size={12} className="text-blue-500" /> {project.projectManager || 'Unassigned'}
//                 </div>
//               </div>

//               <div className="pt-4 border-t border-slate-50 space-y-3 mt-auto">
//                 <div>
//                   <div className="flex justify-between text-[9px] font-black mb-1.5 text-slate-400 uppercase tracking-widest">
//                     <span>Progress</span>
//                     <span className="text-blue-600">{project.progress}%</span>
//                   </div>
//                   <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
//                     <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
//                   </div>
//                 </div>

//                 <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-xl">
//                   <div className="flex justify-between items-center">
//                     <div className="flex flex-col">
//                       <span className="text-[8px] font-black text-slate-400 uppercase">Cost</span>
//                       <span className={`text-xs font-bold ${costWarning ? 'text-red-600' : 'text-slate-700'}`}>
//                         ${project.totalActualCost?.toLocaleString()}
//                       </span>
//                     </div>
//                     <div className="text-right flex flex-col">
//                       <span className="text-[8px] font-black text-slate-400 uppercase">Budget</span>
//                       <span className="text-xs font-bold text-slate-400">
//                         ${project.allocatedBudget?.toLocaleString()}
//                       </span>
//                     </div>
//                   </div>

//                   <Link 
//                     href={`/mm/projects/${project.id}`}
//                     className="w-full flex items-center justify-center gap-2 py-2 bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
//                   >
//                     Full Project Report <ExternalLink size={12} />
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* EMPTY STATE */}
//       {filteredProjects?.length === 0 && (
//         <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
//           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching projects found</p>
//         </div>
//       )}
//     </div>
//   );
// };
// 'use client';

// import React, { useMemo, useState } from 'react';
// import Link from 'next/link';
// import { 
//   Calendar, MapPin, User as UserIcon, Clock, AlertTriangle, 
//   CheckCircle2, Activity, Edit3, Trash2, Box, HardHat, Construction,
//   AlertCircle, UserCheck, ShieldAlert, Target, Briefcase, ExternalLink,
//   ChevronDown, ChevronUp, ListChecks, Plus, User,
//   Search,
//   X,
//   TrendingDown,
//   Filter,
//   FileSpreadsheet
// } from 'lucide-react';
// import { ItemActions } from '../SubComponents';

// export const ProjectGridView = ({ projects, onEdit, onDelete,permissions }: any) => {
//   const [searchTerm, setSearchTerm] = useState('');

//   // 🛠️ Filter Logic: Name, Manager, or Workshop
//   const filteredProjects = projects?.filter((project: any) =>
//     project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     project.projectManager?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     project.responsibleWorkshop?.name?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="space-y-6">
//       {/* 🔍 SEARCH INPUT - Matches Activity View Style */}
//       <div className="relative group max-w-md px-2 md:px-0">
//         <div className="absolute inset-y-0 left-0 pl-4 md:left-4 flex items-center pointer-events-none">
//           <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//         </div>
//         <input
//           type="text"
//           placeholder="Search projects, managers, or workshops..."
//           className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>

//       {/* GRID VIEW */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 md:p-0">
//         {filteredProjects?.map((project: any) => {
//           const costWarning = project.totalActualCost > project.allocatedBudget;
          
//           return (
//             <div key={project.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
//               <div className="flex justify-between items-start mb-4">
//                 <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
//                   project.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
//                   project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
//                 }`}>
//                   {project.status?.replace('_', ' ') || 'PLANNED'}
//                 </span>
//                 <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
//               </div>
              
//               <Link href={`/mm/projects/${project.id}`}>
//                 <h3 className="text-sm font-black text-slate-800 mb-4 hover:text-indigo-600 cursor-pointer flex items-center gap-2">
//                   <Briefcase size={14} className="text-slate-400" /> {project.name}
//                 </h3>
//               </Link>
              
//               <div className="grid grid-cols-2 gap-3 mb-5">
//                 <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase truncate">
//                   <MapPin size={12} className="text-emerald-500" /> {project.responsibleWorkshop?.name || 'Central'}
//                 </div>
//                 <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase truncate">
//                   <UserIcon size={12} className="text-blue-500" /> {project.projectManager || 'Unassigned'}
//                 </div>
//               </div>

//               <div className="pt-4 border-t border-slate-50 space-y-3 mt-auto">
//                 <div>
//                   <div className="flex justify-between text-[9px] font-black mb-1.5 text-slate-400 uppercase tracking-widest">
//                     <span>Progress</span>
//                     <span className="text-blue-600">{project.progress}%</span>
//                   </div>
//                   <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
//                     <div className="bg-blue-600 h-full" style={{ width: `${project.progress}%` }} />
//                   </div>
//                 </div>

//                 <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-xl">
//                   <div className="flex justify-between items-center">
//                     <div className="flex flex-col">
//                       <span className="text-[8px] font-black text-slate-400 uppercase">Cost</span>
//                       <span className={`text-xs font-bold ${costWarning ? 'text-red-600' : 'text-slate-700'}`}>
//                         ${project.totalActualCost?.toLocaleString()}
//                       </span>
//                     </div>
//                     <div className="text-right flex flex-col">
//                       <span className="text-[8px] font-black text-slate-400 uppercase">Budget</span>
//                       <span className="text-xs font-bold text-slate-400">
//                         ${project.allocatedBudget?.toLocaleString()}
//                       </span>
//                     </div>
//                   </div>

//                   <Link 
//                     href={`/mm/projects/${project.id}`}
//                     className="w-full flex items-center justify-center gap-2 py-2 bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
//                   >
//                     Full Project Report <ExternalLink size={12} />
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* EMPTY STATE */}
//       {filteredProjects?.length === 0 && (
//         <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
//           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching projects found</p>
//         </div>
//       )}
//     </div>
//   );
// };