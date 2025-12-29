'use client';

import React, { useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from "sonner";
import { 
  MapPin, Activity, Box, HardHat, FileSpreadsheet, ArrowRight, Warehouse 
} from 'lucide-react';
import { ItemActions } from '../SubComponents';
import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// --- SEARCH CONFIGURATION ---
export const WORKSHOP_SCOPES: SearchScope[] = [
  { key: 'name', label: 'Workshop Name' },
  { key: 'location', label: 'Location' },
  { key: 'type', label: 'Specialization' },
];

export const WorkshopListView = ({ workshops, onEdit, onDelete, permissions }: any) => {

  console.log("workshops", workshops)
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['name', 'location']);

  // --- FILTER LOGIC ---
  const filteredWorkshops = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return workshops || [];

    return workshops?.filter((workshop: any) => {
      return activeSearchFields.some(field => {
        const val = workshop[field];
        return String(val || '').toLowerCase().includes(term);
      });
    });
  }, [workshops, searchTerm, activeSearchFields]);

  // --- EXCEL EXPORT LOGIC ---
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Workshops Report');

      worksheet.columns = [
        { header: 'Workshop Name', key: 'name', width: 30 },
        { header: 'Location', key: 'location', width: 25 },
        { header: 'Specialization', key: 'type', width: 20 },
        { header: 'Capacity', key: 'capacity', width: 15 },
        { header: 'Active Projects', key: 'projects', width: 15 },
        { header: 'Load Factor (%)', key: 'load', width: 15 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };

      filteredWorkshops.forEach((ws: any) => {
        const projectCount = ws.projectCount || 0;
        const loadFactor = Math.round((projectCount / (ws.capacity || 1)) * 100);
        worksheet.addRow({
          name: ws.name,
          location: ws.location || 'N/A',
          specialization: ws.type || 'N/A',
          capacity: ws.capacity || 0,
          projects: projectCount,
          load: `${loadFactor}%`,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Workshops_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Exported ${filteredWorkshops.length} workshops`);
    } catch (error) {
      toast.error("Failed to generate Excel report");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 🔍 SEARCH & EXPORT BAR */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between">
          <div className="flex-1">
            <SearchFilterEngine 
                scopes={WORKSHOP_SCOPES}
                initialActiveScopes={activeSearchFields}
                onSearchChange={setSearchTerm}
                onScopesChange={setActiveSearchFields}
                placeholder="Search workshops by name, location or specialty..."
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

      {/* --- DESKTOP VIEW (Table) --- */}
      <div className="hidden lg:block overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Workshop / Location</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialization</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Load Factor (%)</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity Metrics</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredWorkshops.map((ws: any) => {
              const projectCount = ws.projectCount || 0;
              const loadFactor = Math.round((projectCount / (ws.capacity || 1)) * 100);
              return (
                <tr key={ws.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Warehouse size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{ws.name}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin size={10}/> {ws.location || 'Undisclosed'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                      ws.type === 'MECHANICAL' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                    }`}>
                      {ws.type || 'GENERAL'}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1 w-32">
                      <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase">
                        <span>Utilization</span>
                        <span className={loadFactor > 90 ? 'text-red-600' : 'text-slate-700'}>{loadFactor}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${loadFactor > 90 ? 'bg-red-500' : 'bg-indigo-600'}`} 
                          style={{ width: `${Math.min(loadFactor, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-baseline gap-2">
                       <span className="text-xs font-black text-slate-700">{projectCount}</span>
                       <span className="text-[9px] text-slate-400 font-bold uppercase">/ {ws.capacity} Projects</span>
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <ItemActions id={ws.id} item={ws} onEdit={onEdit} onDelete={onDelete} permissions={permissions} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- MOBILE VIEW (Action Cards) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {filteredWorkshops?.map((workshop: any) => {
          const projectCount = workshop.projectCount || 0;
          const loadFactor = Math.round((projectCount / (workshop.capacity || 1)) * 100);
          
          return (
            <div key={workshop.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Activity size={20} />
                </div>
                <ItemActions id={workshop.id} item={workshop} onEdit={onEdit} onDelete={onDelete} permissions={permissions} />
              </div>

              <h3 className="text-base font-black text-slate-800 mb-1">{workshop.name}</h3>
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-6">
                <MapPin size={12} /> {workshop.location}
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-slate-400 uppercase">Load Status</p>
                   <p className={`text-xs font-black ${loadFactor > 90 ? 'text-red-600' : 'text-slate-800'}`}>{loadFactor}% Utilized</p>
                </div>
                <div className="space-y-1 text-right">
                   <p className="text-[8px] font-black text-slate-400 uppercase">Active Load</p>
                   <p className="text-xs font-black text-indigo-600">{projectCount} / {workshop.capacity}</p>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full transition-all duration-1000 ${loadFactor > 90 ? 'bg-red-500' : 'bg-indigo-600'}`} 
                  style={{ width: `${Math.min(loadFactor, 100)}%` }}
                />
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{workshop.type}</span>
                 <ArrowRight size={14} className="text-slate-300" />
              </div>
            </div>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {filteredWorkshops?.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zero Workshop matches found</p>
        </div>
      )}
    </div>
  );
};
// 'use client';

// import React, { useMemo, useState } from 'react';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { toast } from "sonner";
// import { 
//   MapPin, Activity, Box, HardHat, FileSpreadsheet
// } from 'lucide-react';
// import { ItemActions } from '../SubComponents';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// // --- SEARCH CONFIGURATION ---
// export const WORKSHOP_SCOPES: SearchScope[] = [
//   { key: 'name', label: 'Workshop Name' },
//   { key: 'location', label: 'Location' },
//   { key: 'specialization', label: 'Specialization' },
// ];

// export const WorkshopListView = ({ workshops, onEdit, onDelete, permissions }: any) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['name', 'location']);

//   // --- FILTER LOGIC ---
//   const filteredWorkshops = useMemo(() => {
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return workshops || [];

//     return workshops?.filter((workshop: any) => {
//       return activeSearchFields.some(field => {
//         const val = workshop[field];
//         return String(val || '').toLowerCase().includes(term);
//       });
//     });
//   }, [workshops, searchTerm, activeSearchFields]);

//   // --- EXCEL EXPORT LOGIC ---
//   const handleExport = async () => {
//     try {
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet('Workshops Report');

//       worksheet.columns = [
//         { header: 'Workshop Name', key: 'name', width: 30 },
//         { header: 'Location', key: 'location', width: 25 },
//         { header: 'Specialization', key: 'specialization', width: 20 },
//         { header: 'Capacity', key: 'capacity', width: 15 },
//         { header: 'Active Projects', key: 'projects', width: 15 },
//         { header: 'Load Factor (%)', key: 'load', width: 15 },
//       ];

//       worksheet.getRow(1).font = { bold: true };
//       worksheet.getRow(1).fill = {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: 'F1F5F9' }
//       };

//       filteredWorkshops.forEach((ws: any) => {
//         const projectCount = ws.projectCount || 0;
//         const loadFactor = Math.round((projectCount / (ws.capacity || 1)) * 100);
        
//         worksheet.addRow({
//           name: ws.name,
//           location: ws.location || 'N/A',
//           specialization: ws.specialization || 'N/A',
//           capacity: ws.capacity || 0,
//           projects: projectCount,
//           load: `${loadFactor}%`,
//         });
//       });

//       const buffer = await workbook.xlsx.writeBuffer();
//       saveAs(new Blob([buffer]), `Workshops_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
//       toast.success(`Exported ${filteredWorkshops.length} workshops successfully`);
//     } catch (error) {
//       console.error("Export Error:", error);
//       toast.error("Failed to generate Excel report");
//     }
//   };

//   return (
//     <div className="space-y-6">
      
//       {/* 🔍 SEARCH & EXPORT BAR USING ENGINE */}
//       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between">
//           <div className="flex-1">
//             <SearchFilterEngine 
//                 scopes={WORKSHOP_SCOPES}
//                 initialActiveScopes={activeSearchFields}
//                 onSearchChange={setSearchTerm}
//                 onScopesChange={setActiveSearchFields}
//                 placeholder="Search workshops by name, location or specialty..."
//             />
//           </div>

//           <button 
//             onClick={handleExport}
//             className="h-16 px-8 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-3"
//           >
//             <FileSpreadsheet size={20} />
//             <span className="text-[11px] font-black uppercase tracking-widest">Export ({filteredWorkshops.length})</span>
//           </button>
//         </div>
//       </div>

//       {/* WORKSHOP GRID */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2 md:p-0">
//         {filteredWorkshops?.map((workshop: any) => {
//           const projectCount = workshop.projectCount || 0;
//           const loadFactor = Math.round((projectCount / (workshop.capacity || 1)) * 100);
          
//           return (
//             <div key={workshop.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-300 transition-all group relative">
//               <div className="absolute top-4 right-4 z-10">
//                  <ItemActions id={workshop.id} item={workshop} onEdit={onEdit} onDelete={onDelete} permissions={permissions} />
//               </div>

//               <div className="p-5 border-b border-slate-50 bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
//                 <div className="p-2.5 w-fit bg-white shadow-sm border border-slate-100 text-indigo-600 rounded-xl mb-3">
//                   <Activity size={20} />
//                 </div>
//                 <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest border uppercase ${
//                   workshop.specialization === 'MECHANICAL' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'
//                 }`}>
//                   {workshop.specialization}
//                 </span>
//               </div>
              
//               <div className="p-6 flex flex-col flex-1">
//                 <h3 className="text-lg font-black text-slate-800 mb-1 tracking-tight truncate pr-12">{workshop.name}</h3>
//                 <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-6">
//                   <MapPin size={12} className="text-slate-400" /> {workshop.location}
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-4">
//                   <div className="flex flex-col gap-1">
//                     <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                       <Box size={10}/> Capacity
//                     </div>
//                     <span className="text-sm font-black text-slate-700">{workshop.capacity} Units</span>
//                   </div>
//                   <div className="flex flex-col gap-1">
//                     <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                       <HardHat size={10}/> Projects
//                     </div>
//                     <span className="text-sm font-black text-indigo-600">{projectCount} Active</span>
//                   </div>
//                 </div>

//                 <div className="mt-auto space-y-2">
//                   <div className="flex justify-between items-center">
//                     <span className="text-[10px] font-black text-slate-400 uppercase">Load Factor</span>
//                     <span className={`text-[10px] font-black ${loadFactor > 90 ? 'text-red-600' : 'text-slate-700'}`}>{loadFactor}%</span>
//                   </div>
//                   <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
//                     <div 
//                       className={`h-full rounded-full transition-all duration-1000 ${
//                         loadFactor > 90 ? 'bg-red-500' : loadFactor > 70 ? 'bg-amber-500' : 'bg-indigo-500'
//                       }`} 
//                       style={{ width: `${Math.min(loadFactor, 100)}%` }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* EMPTY STATE */}
//       {filteredWorkshops?.length === 0 && (
//         <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
//           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching workshops found</p>
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
//   MapPin, Activity, Box, HardHat, Search, X, Filter, FileSpreadsheet
// } from 'lucide-react';
// import { ItemActions } from '../SubComponents';

// // --- SEARCH CONFIGURATION ---
// export const searchableWorkshopFields = {
//   name: { label: 'Workshop Name' },
//   location: { label: 'Location' },
//   specialization: { label: 'Specialization' },
// };

// export type WorkshopSearchKey = keyof typeof searchableWorkshopFields;

// export const WorkshopListView = ({ workshops, onEdit, onDelete, permissions }: any) => {
//   const [searchTerm, setSearchTerm] = useState('');
  
//   // Default search scopes
//   const [activeSearchFields, setActiveSearchFields] = useState<WorkshopSearchKey[]>(
//     ['name', 'location']
//   );

//   // --- FILTER LOGIC ---
//   const filteredWorkshops = useMemo(() => {
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return workshops || [];

//     return workshops?.filter((workshop: any) => {
//       const matchesName = activeSearchFields.includes('name') && 
//         workshop.name?.toLowerCase().includes(term);
      
//       const matchesLocation = activeSearchFields.includes('location') && 
//         workshop.location?.toLowerCase().includes(term);
      
//       const matchesSpecialization = activeSearchFields.includes('specialization') && 
//         workshop.specialization?.toLowerCase().includes(term);

//       return matchesName || matchesLocation || matchesSpecialization;
//     });
//   }, [workshops, searchTerm, activeSearchFields]);

//   // --- EXCEL EXPORT LOGIC ---
//   const handleExport = async () => {
//     try {
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet('Workshops Report');

//       worksheet.columns = [
//         { header: 'Workshop Name', key: 'name', width: 30 },
//         { header: 'Location', key: 'location', width: 25 },
//         { header: 'Specialization', key: 'specialization', width: 20 },
//         { header: 'Capacity', key: 'capacity', width: 15 },
//         { header: 'Active Projects', key: 'projects', width: 15 },
//         { header: 'Load Factor (%)', key: 'load', width: 15 },
//       ];

//       // Style Header
//       worksheet.getRow(1).font = { bold: true };
//       worksheet.getRow(1).fill = {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: 'F1F5F9' }
//       };

//       filteredWorkshops.forEach((ws: any) => {
//         const projectCount = ws.projectCount || 0;
//         const loadFactor = Math.round((projectCount / (ws.capacity || 1)) * 100);
        
//         worksheet.addRow({
//           name: ws.name,
//           location: ws.location || 'N/A',
//           specialization: ws.specialization || 'N/A',
//           capacity: ws.capacity || 0,
//           projects: projectCount,
//           load: `${loadFactor}%`,
//         });
//       });

//       const buffer = await workbook.xlsx.writeBuffer();
//       saveAs(new Blob([buffer]), `Workshops_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
//       toast.success(`Exported ${filteredWorkshops.length} workshops successfully`);
//     } catch (error) {
//       console.error("Export Error:", error);
//       toast.error("Failed to generate Excel report");
//     }
//   };

//   return (
//     <div className="space-y-6">
      
//       {/* 🔍 SEARCH & EXPORT BAR */}
//       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
//           <div className="relative w-full max-w-md group">
//             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//             <input
//               type="text"
//               placeholder="Search workshops..."
//               className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             {searchTerm && (
//               <button 
//                 onClick={() => setSearchTerm('')}
//                 className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400"
//               >
//                 <X size={16} />
//               </button>
//             )}
//           </div>

//           <button 
//             onClick={handleExport}
//             className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
//           >
//             <FileSpreadsheet size={18} />
//             <span className="text-[10px] font-black uppercase tracking-widest">Export ({filteredWorkshops.length})</span>
//           </button>
//         </div>

//         {/* DYNAMIC SCOPE SELECTOR */}
//         <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2 border-t border-slate-50">
//             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
//                 <Filter size={14} className="text-indigo-500" />
//                 Filter By:
//             </div>
//             <div className="flex flex-wrap gap-2">
//                 {(Object.keys(searchableWorkshopFields) as WorkshopSearchKey[]).map((key) => {
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
//                             {searchableWorkshopFields[key].label}
//                         </button>
//                     );
//                 })}
//             </div>
//         </div>
//       </div>

//       {/* WORKSHOP GRID */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2 md:p-0">
//         {filteredWorkshops?.map((workshop: any) => {
//           const projectCount = workshop.projectCount || 0;
//           const loadFactor = Math.round((projectCount / (workshop.capacity || 1)) * 100);
          
//           return (
//             <div key={workshop.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-300 transition-all group relative">
//               <div className="absolute top-4 right-4 z-10">
//                  <ItemActions id={workshop.id} item={workshop} onEdit={onEdit} onDelete={onDelete} permissions={permissions} />
//               </div>

//               <div className="p-5 border-b border-slate-50 bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
//                 <div className="p-2.5 w-fit bg-white shadow-sm border border-slate-100 text-indigo-600 rounded-xl mb-3">
//                   <Activity size={20} />
//                 </div>
//                 <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest border uppercase ${
//                   workshop.specialization === 'MECHANICAL' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'
//                 }`}>
//                   {workshop.specialization}
//                 </span>
//               </div>
              
//               <div className="p-6 flex flex-col flex-1">
//                 <h3 className="text-lg font-black text-slate-800 mb-1 tracking-tight truncate pr-12">{workshop.name}</h3>
//                 <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-6">
//                   <MapPin size={12} className="text-slate-400" /> {workshop.location}
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-4">
//                   <div className="flex flex-col gap-1">
//                     <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                       <Box size={10}/> Capacity
//                     </div>
//                     <span className="text-sm font-black text-slate-700">{workshop.capacity} Units</span>
//                   </div>
//                   <div className="flex flex-col gap-1">
//                     <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                       <HardHat size={10}/> Projects
//                     </div>
//                     <span className="text-sm font-black text-indigo-600">{projectCount} Active</span>
//                   </div>
//                 </div>

//                 <div className="mt-auto space-y-2">
//                   <div className="flex justify-between items-center">
//                     <span className="text-[10px] font-black text-slate-400 uppercase">Load Factor</span>
//                     <span className={`text-[10px] font-black ${loadFactor > 90 ? 'text-red-600' : 'text-slate-700'}`}>{loadFactor}%</span>
//                   </div>
//                   <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
//                     <div 
//                       className={`h-full rounded-full transition-all duration-1000 ${
//                         loadFactor > 90 ? 'bg-red-500' : loadFactor > 70 ? 'bg-amber-500' : 'bg-indigo-500'
//                       }`} 
//                       style={{ width: `${Math.min(loadFactor, 100)}%` }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* EMPTY STATE */}
//       {filteredWorkshops?.length === 0 && (
//         <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
//           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching workshops found</p>
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


// export const WorkshopListView = ({ workshops, onEdit, onDelete,permissions}: any) => {
//   const [searchTerm, setSearchTerm] = useState('');

//   // 🛠️ Filter Logic: Matches Name, Location, or Specialization
//   const filteredWorkshops = workshops?.filter((workshop: any) =>
//     workshop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     workshop.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     workshop.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="space-y-6">
//       {/* 🔍 SEARCH INPUT - Consistent with Activity/Project/Strategy views */}
//       <div className="relative group max-w-md px-2 md:px-0">
//         <div className="absolute inset-y-0 left-0 pl-4 md:left-4 flex items-center pointer-events-none">
//           <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//         </div>
//         <input
//           type="text"
//           placeholder="Search workshops, locations, or types..."
//           className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>

//       {/* WORKSHOP GRID */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2 md:p-0">
//         {filteredWorkshops?.map((workshop: any) => {
//           const projectCount = workshop.projectCount//_count?.mm_projects || 0;
//           const loadFactor = Math.round((projectCount / (workshop.capacity || 1)) * 100);
          
//           return (
//             <div key={workshop.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-300 transition-all group relative">
//               <div className="absolute top-4 right-4 z-10">
//                  <ItemActions id={workshop.id} item={workshop} onEdit={onEdit} onDelete={onDelete} permissions={permissions} />
//               </div>

//               <div className="p-5 border-b border-slate-50 bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
//                 <div className="p-2.5 w-fit bg-white shadow-sm border border-slate-100 text-indigo-600 rounded-xl mb-3">
//                   <Activity size={20} />
//                 </div>
//                 <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest border uppercase ${
//                   workshop.specialization === 'MECHANICAL' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'
//                 }`}>
//                   {workshop.specialization}
//                 </span>
//               </div>
              
//               <div className="p-6 flex flex-col flex-1">
//                 <h3 className="text-lg font-black text-slate-800 mb-1 tracking-tight truncate pr-12">{workshop.name}</h3>
//                 <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-6">
//                   <MapPin size={12} className="text-slate-400" /> {workshop.location}
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-4">
//                   <div className="flex flex-col gap-1">
//                     <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                       <Box size={10}/> Capacity
//                     </div>
//                     <span className="text-sm font-black text-slate-700">{workshop.capacity} Units</span>
//                   </div>
//                   <div className="flex flex-col gap-1">
//                     <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                       <HardHat size={10}/> Projects
//                     </div>
//                     <span className="text-sm font-black text-indigo-600">{projectCount} Active</span>
//                   </div>
//                 </div>

//                 <div className="mt-auto space-y-2">
//                   <div className="flex justify-between items-center">
//                     <span className="text-[10px] font-black text-slate-400 uppercase">Load Factor</span>
//                     <span className={`text-[10px] font-black ${loadFactor > 90 ? 'text-red-600' : 'text-slate-700'}`}>{loadFactor}%</span>
//                   </div>
//                   <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
//                     <div 
//                       className={`h-full rounded-full transition-all duration-1000 ${
//                         loadFactor > 90 ? 'bg-red-500' : loadFactor > 70 ? 'bg-amber-500' : 'bg-indigo-500'
//                       }`} 
//                       style={{ width: `${Math.min(loadFactor, 100)}%` }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* EMPTY STATE */}
//       {filteredWorkshops?.length === 0 && (
//         <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
//           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching workshops found</p>
//         </div>
//       )}
//     </div>
//   );
// };
