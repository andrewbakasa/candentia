'use client'

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  AlertCircle, 
  FileSpreadsheet, 
  Clock, 
  DollarSign, 
  Construction, 
  Layout, 
  Filter 
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// --- SEARCH CONFIGURATION (Guideline 1 of 2025) ---
const DELAY_SEARCH_SCOPES: SearchScope[] = [
  { key: 'projectName', label: 'Project Name' },
  { key: 'type', label: 'Incident Type' },
  { key: 'description', label: 'Incident Description' },
  { key: 'activity', label: 'Activity Context' },
];

export function DelayListView({ delays, onEdit }: { delays: any[], onEdit: (r: any) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchFields, setActiveSearchFields] = useState<string[]>(
    ['projectName', 'type', 'description']
  );

  // --- FILTER LOGIC ---
  const filteredDelays = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return delays;

    return delays.filter((delay) => {
      return activeSearchFields.some((field) => {
        let val = '';
        if (field === 'projectName') val = delay.activity?.project?.name || '';
        else if (field === 'activity') val = delay.activity?.description || '';
        else val = delay[field] || '';

        return String(val).toLowerCase().includes(term);
      });
    });
  }, [delays, searchTerm, activeSearchFields]);

  const totalImpactCost = filteredDelays.reduce((acc, curr) => acc + (curr.costImpact || 0), 0);
  const totalHours = filteredDelays.reduce((acc, curr) => acc + (curr.impactHours || 0), 0);

  const handleExport = async () => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Operational Delays');

        worksheet.columns = [
          { header: 'Project', key: 'project', width: 25 },
          { header: 'Incident Type', key: 'type', width: 25 },
          { header: 'Description', key: 'description', width: 40 },
          { header: 'Activity Context', key: 'activity', width: 30 },
          { header: 'Impact Hours', key: 'hours', width: 15 },
          { header: 'Cost Impact ($)', key: 'cost', width: 20 },
          { header: 'Status', key: 'status', width: 15 },
        ];

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };

        filteredDelays.forEach(delay => {
          worksheet.addRow({
            project: delay.activity?.project?.name || 'N/A',
            type: delay.type?.replace('_', ' ') || 'GENERAL',
            description: delay.description,
            activity: delay.activity?.description || 'N/A',
            hours: delay.impactHours,
            cost: delay.costImpact,
            status: delay.isReworkTriggered ? 'REWORK' : 'DELAY'
          });
        });

        worksheet.getColumn('cost').numFmt = '"$"#,##0.00';
        
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Operational_Delays_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Operational report generated successfully");
    } catch (error) {
        toast.error("Failed to generate report");
    }
  };

  return (
    <div className="space-y-6">
    
     {/* 📊 PREMIUM CONTROL & KPI BAR */}
    <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-2 items-stretch">
        
        {/* 1. LEFT: SEARCH SECTION */}
        <div className="flex-1 p-4">
          <SearchFilterEngine 
            scopes={DELAY_SEARCH_SCOPES}
            initialActiveScopes={activeSearchFields}
            onSearchChange={setSearchTerm}
            onScopesChange={setActiveSearchFields}
            placeholder="Search via operational scopes..."
          />
        </div>

        {/* 2. CENTER: KPI INDICATORS (The Improved Summary) */}
        <div className="flex items-center gap-4 px-6 py-2 bg-slate-50/50 rounded-[1.8rem] border border-slate-100 mx-4 lg:mx-0">
          {/* Cost Metric */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm border border-rose-200">
              <DollarSign size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest leading-none">Cost Impact</span>
              <span className="text-sm font-black text-slate-900">${totalImpactCost.toLocaleString()}</span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Time Metric */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200">
              <Clock size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Time Loss</span>
              <span className="text-sm font-black text-slate-900">{totalHours} <span className="text-[10px] text-slate-400">HRS</span></span>
            </div>
          </div>
        </div>

        {/* 3. RIGHT: EXPORT ACTION */}
        <div className="p-4 flex items-center">
          <button 
            onClick={handleExport}
            className="w-full lg:w-auto h-12 flex items-center justify-center gap-3 px-8 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-100 text-[10px] font-black uppercase tracking-widest"
          >
            <FileSpreadsheet size={18} />
            <span>Export</span>
          </button>
        </div>

      </div>
    </div>

      {/* 📱 VIEWPORT CONTENT AREA */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {filteredDelays.length > 0 ? (
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Context & Project</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Incident Type</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Time Impact</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Cost Impact</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                    {filteredDelays.map((delay) => (
                        <tr key={delay.id} onClick={() => onEdit(delay)} className="hover:bg-indigo-50/30 cursor-pointer transition-colors group">
                        <td className="p-6">
                            <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter flex items-center gap-1">
                                <Layout size={10} /> {delay.activity?.project?.name || 'Unassigned Project'}
                            </span>
                            <div className="flex items-center gap-2 text-sm text-slate-900 font-bold">
                                <Construction size={14} className="text-slate-400" />
                                {delay.activity?.description || 'General Context'}
                            </div>
                            </div>
                        </td>
                        <td className="p-6">
                            <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${delay.isReworkTriggered ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                <AlertCircle size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-700">{delay.type?.replace('_', ' ')}</p>
                                <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{delay.description}</p>
                            </div>
                            </div>
                        </td>
                        <td className="p-6 text-right text-sm font-bold text-slate-700">{delay.impactHours} hrs</td>
                        <td className="p-6 text-right font-black text-slate-900">${delay.costImpact.toLocaleString()}</td>
                        <td className="p-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${delay.isReworkTriggered ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                            {delay.isReworkTriggered ? 'REWORK' : 'DELAY'}
                            </span>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="h-64 flex flex-col items-center justify-center gap-2">
                <AlertCircle className="text-slate-200" size={40} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No matching delay records</p>
            </div>
        )}

        {/* MOBILE CARDS */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredDelays.map((delay) => (
            <div key={delay.id} onClick={() => onEdit(delay)} className="p-5 active:bg-slate-50 transition-colors space-y-4">
              <div className="flex flex-col gap-1">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md">
                      <Layout size={10} /> {delay.activity?.project?.name || 'Unassigned Project'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${delay.isReworkTriggered ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                      {delay.isReworkTriggered ? 'REWORK' : 'DELAY'}
                    </span>
                 </div>
                 <p className="text-sm font-bold text-slate-900 mt-2">{delay.activity?.description || 'General Context'}</p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <div className={`p-2 rounded-lg ${delay.isReworkTriggered ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                  <AlertCircle size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{delay.type?.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-600 italic line-clamp-1">{delay.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
                  <Clock size={16} className="text-slate-400" />
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Impact</p>
                    <p className="text-xs font-bold text-slate-700">{delay.impactHours} hrs</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
                  <DollarSign size={16} className="text-rose-500" />
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Cost</p>
                    <p className="text-xs font-bold text-slate-900">${delay.costImpact.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// 'use client'
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { 
//   AlertCircle, 
//   FileSpreadsheet, 
//   Search, 
//   Clock, 
//   DollarSign, 
//   Construction, 
//   Layout, 
//   Filter 
// } from 'lucide-react';
// import { useMemo, useState } from 'react';
// import { toast } from 'sonner';

// // --- SEARCH CONFIGURATION (Guideline 1 of 2025) ---
// export const searchableDelayFields = {
//     projectName: { label: 'Project Name', type: 'string' },
//     type: { label: 'Incident Type', type: 'string' },
//     description: { label: 'Incident Description', type: 'string' },
//     activity: { label: 'Activity Context', type: 'string' },
// };

// export type DelaySearchKey = keyof typeof searchableDelayFields;

// export function DelayListView({ delays, onEdit }: { delays: any[], onEdit: (r: any) => void }) {
//   const [searchTerm, setSearchTerm] = useState("");
//   // Default to searching common operational attributes
//   const [activeSearchFields, setActiveSearchFields] = useState<DelaySearchKey[]>(
//     ['projectName', 'type', 'description']
//   );

//   // --- FILTER LOGIC (Limited to activeSearchFields) ---
//   const filteredDelays = useMemo(() => {
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return delays;

//     return delays.filter((delay) => {
//       return activeSearchFields.some((field) => {
//         let val = '';
//         if (field === 'projectName') val = delay.activity?.project?.name || '';
//         else if (field === 'activity') val = delay.activity?.description || '';
//         else val = delay[field] || '';

//         return String(val).toLowerCase().includes(term);
//       });
//     });
//   }, [delays, searchTerm, activeSearchFields]);

//   const totalImpactCost = filteredDelays.reduce((acc, curr) => acc + (curr.costImpact || 0), 0);
//   const totalHours = filteredDelays.reduce((acc, curr) => acc + (curr.impactHours || 0), 0);

//   // --- EXCELJS EXPORT HANDLER ---
//   const handleExport = async () => {
//     try {
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Operational Delays');

//         worksheet.columns = [
//           { header: 'Project', key: 'project', width: 25 },
//           { header: 'Incident Type', key: 'type', width: 25 },
//           { header: 'Description', key: 'description', width: 40 },
//           { header: 'Activity Context', key: 'activity', width: 30 },
//           { header: 'Impact Hours', key: 'hours', width: 15 },
//           { header: 'Cost Impact ($)', key: 'cost', width: 20 },
//           { header: 'Status', key: 'status', width: 15 },
//         ];

//         worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
//         worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };

//         filteredDelays.forEach(delay => {
//           worksheet.addRow({
//             project: delay.activity?.project?.name || 'N/A',
//             type: delay.type?.replace('_', ' ') || 'GENERAL',
//             description: delay.description,
//             activity: delay.activity?.description || 'N/A',
//             hours: delay.impactHours,
//             cost: delay.costImpact,
//             status: delay.isReworkTriggered ? 'REWORK' : 'DELAY'
//           });
//         });

//         worksheet.getColumn('cost').numFmt = '"$"#,##0.00';
        
//         const buffer = await workbook.xlsx.writeBuffer();
//         saveAs(new Blob([buffer]), `Operational_Delays_${new Date().toISOString().split('T')[0]}.xlsx`);
//         toast.success("Operational report generated successfully");
//     } catch (error) {
//         toast.error("Failed to generate report");
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* 📊 SUMMARY & SEARCH BAR */}
//       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//         <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
//           <div className="relative w-full lg:max-w-md">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//             <input 
//               type="text"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               placeholder={`Search via ${activeSearchFields.length} active scopes...`}
//               className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-10 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
//             />
//           </div>
          
//           <button 
//             onClick={handleExport}
//             className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 text-xs font-black uppercase tracking-widest"
//           >
//             <FileSpreadsheet size={18} />
//             <span>Export Report ({filteredDelays.length})</span>
//           </button>
//         </div>

//         {/* DYNAMIC FIELD SELECTOR */}
//         <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2 border-t border-slate-50">
//             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-fit">
//                 <Filter size={14} className="text-indigo-500" />
//                 Active Search Fields:
//             </div>
//             <div className="flex flex-wrap gap-2">
//                 {(Object.keys(searchableDelayFields) as DelaySearchKey[]).map((key) => {
//                     const isActive = activeSearchFields.includes(key);
//                     return (
//                         <button
//                             key={key}
//                             onClick={() => {
//                                 if (isActive) {
//                                     setActiveSearchFields(activeSearchFields.filter(f => f !== key));
//                                 } else {
//                                     setActiveSearchFields([...activeSearchFields, key]);
//                                 }
//                             }}
//                             className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
//                                  isActive 
//                                 ? 'bg-yellow-400 border-indigo-600 text-white shadow-md' 
//                                 : 'bg-white border-slate-200 text-slate-400 hover:border-yellow-300'
//                             }`}
//                         >
//                             {searchableDelayFields[key].label}
//                         </button>
//                     );
//                 })}
//             </div>
//         </div>

//         <div className="grid grid-cols-2 gap-4 pt-4">
//           <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
//             <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1 text-center md:text-left">Cost Impact</p>
//             <p className="text-xl font-black text-rose-600 text-center md:text-left">${totalImpactCost.toLocaleString()}</p>
//           </div>
//           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
//             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center md:text-left">Time Loss</p>
//             <p className="text-xl font-black text-slate-900 text-center md:text-left">{totalHours} <span className="text-xs font-medium">hrs</span></p>
//           </div>
//         </div>
//       </div>

//       {/* 📱 VIEWPORT CONTENT AREA (REMAINS SAME AS ORIGINAL FOR UI) */}
//       <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
//         {filteredDelays.length > 0 ? (
//             <div className="hidden md:block overflow-x-auto">
//                 <table className="w-full text-left border-collapse">
//                     <thead className="bg-slate-50/80 border-b border-slate-100">
//                     <tr>
//                         <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Context & Project</th>
//                         <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Incident Type</th>
//                         <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Time Impact</th>
//                         <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Cost Impact</th>
//                         <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
//                     </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-50">
//                     {filteredDelays.map((delay) => (
//                         <tr key={delay.id} onClick={() => onEdit(delay)} className="hover:bg-indigo-50/30 cursor-pointer transition-colors group">
//                         <td className="p-6">
//                             <div className="flex flex-col gap-1">
//                             <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter flex items-center gap-1">
//                                 <Layout size={10} /> {delay.activity?.project?.name || 'Unassigned Project'}
//                             </span>
//                             <div className="flex items-center gap-2 text-sm text-slate-900 font-bold">
//                                 <Construction size={14} className="text-slate-400" />
//                                 {delay.activity?.description || 'General Context'}
//                             </div>
//                             </div>
//                         </td>
//                         <td className="p-6">
//                             <div className="flex items-center gap-3">
//                             <div className={`p-2.5 rounded-xl ${delay.isReworkTriggered ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
//                                 <AlertCircle size={18} />
//                             </div>
//                             <div className="min-w-0">
//                                 <p className="text-sm font-bold text-slate-700">{delay.type?.replace('_', ' ')}</p>
//                                 <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{delay.description}</p>
//                             </div>
//                             </div>
//                         </td>
//                         <td className="p-6 text-right text-sm font-bold text-slate-700">{delay.impactHours} hrs</td>
//                         <td className="p-6 text-right font-black text-slate-900">${delay.costImpact.toLocaleString()}</td>
//                         <td className="p-6 text-center">
//                             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${delay.isReworkTriggered ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
//                             {delay.isReworkTriggered ? 'REWORK' : 'DELAY'}
//                             </span>
//                         </td>
//                         </tr>
//                     ))}
//                     </tbody>
//                 </table>
//             </div>
//         ) : (
//             <div className="h-64 flex flex-col items-center justify-center gap-2">
//                 <AlertCircle className="text-slate-200" size={40} />
//                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No matching delay records</p>
//             </div>
//         )}

//         {/* MOBILE CARDS */}
//         <div className="md:hidden divide-y divide-slate-100">
//           {filteredDelays.map((delay) => (
//             <div key={delay.id} onClick={() => onEdit(delay)} className="p-5 active:bg-slate-50 transition-colors space-y-4">
//               <div className="flex flex-col gap-1">
//                  <div className="flex justify-between items-center">
//                     <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md">
//                       <Layout size={10} /> {delay.activity?.project?.name || 'Unassigned Project'}
//                     </span>
//                     <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${delay.isReworkTriggered ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
//                       {delay.isReworkTriggered ? 'REWORK' : 'DELAY'}
//                     </span>
//                  </div>
//                  <p className="text-sm font-bold text-slate-900 mt-2">{delay.activity?.description || 'General Context'}</p>
//               </div>

//               <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
//                 <div className={`p-2 rounded-lg ${delay.isReworkTriggered ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
//                   <AlertCircle size={18} />
//                 </div>
//                 <div>
//                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{delay.type?.replace('_', ' ')}</p>
//                   <p className="text-xs text-slate-600 italic line-clamp-1">{delay.description}</p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
//                   <Clock size={16} className="text-slate-400" />
//                   <div>
//                     <p className="text-[8px] font-black text-slate-400 uppercase">Impact</p>
//                     <p className="text-xs font-bold text-slate-700">{delay.impactHours} hrs</p>
//                   </div>
//                 </div>
//                 <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
//                   <DollarSign size={16} className="text-rose-500" />
//                   <div>
//                     <p className="text-[8px] font-black text-slate-400 uppercase">Cost</p>
//                     <p className="text-xs font-bold text-slate-900">${delay.costImpact.toLocaleString()}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
// 'use client'
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { AlertCircle, FileSpreadsheet, Search, Clock, DollarSign, Construction, Layout } from 'lucide-react';
// import { useMemo, useState } from 'react';

// export function DelayListView({ delays, onEdit }: { delays: any[], onEdit: (r: any) => void }) {
//   const [searchTerm, setSearchTerm] = useState("");

//   // --- FILTER LOGIC ---
//   const filteredDelays = useMemo(() => {
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return delays;

//     return delays.filter((delay) => 
//       delay.type?.toLowerCase().includes(term) ||
//       delay.description?.toLowerCase().includes(term) ||
//       delay.activity?.description?.toLowerCase().includes(term) ||
//       delay.activity?.project?.name?.toLowerCase().includes(term) // Search by Project Name
//     );
//   }, [delays, searchTerm]);

//   const totalImpactCost = filteredDelays.reduce((acc, curr) => acc + (curr.costImpact || 0), 0);
//   const totalHours = filteredDelays.reduce((acc, curr) => acc + (curr.impactHours || 0), 0);

//   // --- EXCELJS EXPORT HANDLER ---
//   const handleExport = async () => {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Operational Delays');

//     worksheet.columns = [
//       { header: 'Project', key: 'project', width: 25 }, // Added Project to Excel
//       { header: 'Incident Type', key: 'type', width: 25 },
//       { header: 'Description', key: 'description', width: 40 },
//       { header: 'Activity Context', key: 'activity', width: 30 },
//       { header: 'Impact Hours', key: 'hours', width: 15 },
//       { header: 'Cost Impact ($)', key: 'cost', width: 20 },
//       { header: 'Status', key: 'status', width: 15 },
//     ];

//     worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
//     worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };

//     filteredDelays.forEach(delay => {
//       worksheet.addRow({
//         project: delay.activity?.project?.name || 'N/A',
//         type: delay.type.replace('_', ' '),
//         description: delay.description,
//         activity: delay.activity?.description || 'N/A',
//         hours: delay.impactHours,
//         cost: delay.costImpact,
//         status: delay.isReworkTriggered ? 'REWORK' : 'DELAY'
//       });
//     });

//     worksheet.getColumn('cost').numFmt = '"$"#,##0.00';
    
//     const buffer = await workbook.xlsx.writeBuffer();
//     saveAs(new Blob([buffer]), `Operational_Delays_${new Date().toISOString().split('T')[0]}.xlsx`);
//   };

//   return (
//     <div className="space-y-6">
//       {/* 📊 SUMMARY & SEARCH BAR */}
//       <div className="flex flex-col gap-4 bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm">
//         <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
//           <div className="relative w-full lg:max-w-md">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//             <input 
//               type="text"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               placeholder="Search by project, activity, or incident..."
//               className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-10 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
//             />
//           </div>
          
//           <button 
//             onClick={handleExport}
//             className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 text-xs font-black uppercase tracking-widest"
//           >
//             <FileSpreadsheet size={18} />
//             <span>Export Report ({filteredDelays.length})</span>
//           </button>
//         </div>

//         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
//           <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 text-center md:text-left">
//             <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Cost Impact</p>
//             <p className="text-xl font-black text-rose-600">${totalImpactCost.toLocaleString()}</p>
//           </div>
//           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 text-center md:text-left">
//             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Time Loss</p>
//             <p className="text-xl font-black text-slate-900">{totalHours} <span className="text-xs font-medium">hrs</span></p>
//           </div>
//         </div>
//       </div>

//       {/* 📱 MOBILE LIST VIEW / 🖥️ DESKTOP TABLE VIEW */}
//       <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
//         {/* DESKTOP TABLE */}
//         <div className="hidden md:block overflow-x-auto">
//           <table className="w-full text-left border-collapse">
//             <thead className="bg-slate-50/80 border-b border-slate-100">
//               <tr>
//                 <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Context & Project</th>
//                 <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Incident Type</th>
//                 <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Time Impact</th>
//                 <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Cost Impact</th>
//                 <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {filteredDelays.map((delay) => (
//                 <tr key={delay.id} onClick={() => onEdit(delay)} className="hover:bg-indigo-50/30 cursor-pointer transition-colors group">
//                   <td className="p-6">
//                     <div className="flex flex-col gap-1">
//                       <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter flex items-center gap-1">
//                         <Layout size={10} /> {delay.activity?.project?.name || 'Unassigned Project'}
//                       </span>
//                       <div className="flex items-center gap-2 text-sm text-slate-900 font-bold">
//                         <Construction size={14} className="text-slate-400" />
//                         {delay.activity?.description || 'General Context'}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="p-6">
//                     <div className="flex items-center gap-3">
//                       <div className={`p-2.5 rounded-xl ${delay.isReworkTriggered ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
//                         <AlertCircle size={18} />
//                       </div>
//                       <div className="min-w-0">
//                         <p className="text-sm font-bold text-slate-700">{delay.type.replace('_', ' ')}</p>
//                         <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{delay.description}</p>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="p-6 text-right text-sm font-bold text-slate-700">{delay.impactHours} hrs</td>
//                   <td className="p-6 text-right font-black text-slate-900">${delay.costImpact.toLocaleString()}</td>
//                   <td className="p-6 text-center">
//                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${delay.isReworkTriggered ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
//                       {delay.isReworkTriggered ? 'REWORK' : 'DELAY'}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* MOBILE CARDS */}
//         <div className="md:hidden divide-y divide-slate-100">
//           {filteredDelays.map((delay) => (
//             <div key={delay.id} onClick={() => onEdit(delay)} className="p-5 active:bg-slate-50 transition-colors space-y-4">
//               <div className="flex flex-col gap-1">
//                  <div className="flex justify-between items-center">
//                     <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md">
//                       <Layout size={10} /> {delay.activity?.project?.name || 'Unassigned Project'}
//                     </span>
//                     <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${delay.isReworkTriggered ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
//                       {delay.isReworkTriggered ? 'REWORK' : 'DELAY'}
//                     </span>
//                  </div>
//                  <p className="text-sm font-bold text-slate-900 mt-2">{delay.activity?.description || 'General Context'}</p>
//               </div>

//               <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
//                 <div className={`p-2 rounded-lg ${delay.isReworkTriggered ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
//                   <AlertCircle size={18} />
//                 </div>
//                 <div>
//                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{delay.type.replace('_', ' ')}</p>
//                   <p className="text-xs text-slate-600 italic">{delay.description}</p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
//                   <Clock size={16} className="text-slate-400" />
//                   <div>
//                     <p className="text-[8px] font-black text-slate-400 uppercase">Impact</p>
//                     <p className="text-xs font-bold text-slate-700">{delay.impactHours} hrs</p>
//                   </div>
//                 </div>
//                 <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
//                   <DollarSign size={16} className="text-rose-500" />
//                   <div>
//                     <p className="text-[8px] font-black text-slate-400 uppercase">Cost</p>
//                     <p className="text-xs font-bold text-slate-900">${delay.costImpact.toLocaleString()}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }