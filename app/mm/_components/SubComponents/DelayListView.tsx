'use client'

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  AlertCircle, FileSpreadsheet, Layout, 
  CalendarCheck, History, ExternalLink, 
  Edit3 
} from 'lucide-react';
import { toast } from 'sonner';
import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

const DELAY_SEARCH_SCOPES: SearchScope[] = [
  { key: 'projectName', label: 'Project' }, 
  { key: 'type', label: 'Type' }, 
  { key: 'description', label: 'Description' }, 
  { key: 'activity', label: 'Activity' }
];

export function DelayListView({ delays, onEdit }: { delays: any[], onEdit: (record: any) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['projectName', 'type', 'description']);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // --- PARALLEL FILTER ENGINE ---
  const { filteredDelays, totalImpactCost, totalHours } = useMemo(() => {
    const now = new Date();
    const term = searchTerm.toLowerCase().trim();
    const result = delays.filter(d => {
      const isHistorical = d.activity?.actualEnd && (d.activity.scheduledEnd ? new Date(d.activity.scheduledEnd) < now : false);
      const passesTimeline = !showActiveOnly || !isHistorical;
      if (!passesTimeline) return false;
      if (!term) return true;
      return activeSearchFields.some(f => {
        const val = f === 'projectName' ? d.activity?.project?.name : f === 'activity' ? d.activity?.description : d[f];
        return String(val || '').toLowerCase().includes(term);
      });
    });
    return { filteredDelays: result, totalImpactCost: result.reduce((a, c) => a + (c.costImpact || 0), 0), totalHours: result.reduce((a, c) => a + (c.impactHours || 0), 0) };
  }, [delays, searchTerm, activeSearchFields, showActiveOnly]);

  // --- EXCELJS AUDIT EXPORT ---
  const handleExport = async () => {
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Operational Audit');
      
      ws.columns = [
        { header: 'REF #', key: 'id', width: 10 },
        { header: 'PROJECT', key: 'project', width: 25 },
        { header: 'ACTIVITY', key: 'activity', width: 35 },
        { header: 'INCIDENT TYPE', key: 'type', width: 20 },
        { header: 'DESCRIPTION', key: 'desc', width: 45 },
        { header: 'LOST HOURS', key: 'hours', width: 15 },
        { header: 'COST IMPACT', key: 'cost', width: 15 }
      ];

      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Indigo-600

      filteredDelays.forEach((d, i) => {
        ws.addRow({
          id: i + 1,
          project: d.activity?.project?.name || 'N/A',
          activity: d.activity?.description || 'N/A',
          type: d.type?.replace(/_/g, ' '),
          desc: d.description,
          hours: d.impactHours,
          cost: d.costImpact
        });
      });

      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Delay_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Audit report exported successfully");
    } catch (e) {
      toast.error("Export failed");
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col lg:flex-row gap-2 items-center">
        <div className="flex-1 p-4 w-full">
          <SearchFilterEngine scopes={DELAY_SEARCH_SCOPES} initialActiveScopes={activeSearchFields} onSearchChange={setSearchTerm} onScopesChange={setActiveSearchFields} />
        </div>
        <div className="flex items-center gap-2 px-2 pb-4 lg:pb-0">
          <button onClick={() => setShowActiveOnly(!showActiveOnly)} className={`flex items-center gap-2 px-6 h-12 rounded-2xl text-[10px] font-black uppercase border transition-all ${showActiveOnly ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            {showActiveOnly ? <CalendarCheck size={16} /> : <History size={16} />} <span>{showActiveOnly ? 'Active' : 'History'}</span>
          </button>
          
          <div className="flex items-center gap-6 px-8 py-2 bg-slate-50/50 rounded-2xl border border-slate-100 h-12">
            <div className="flex flex-col"><span className="text-[8px] font-black text-rose-500 uppercase leading-none mb-1">Leakage</span><span className="text-sm font-black text-slate-900 leading-none">${totalImpactCost.toLocaleString()}</span></div>
            <div className="flex flex-col"><span className="text-[8px] font-black text-indigo-500 uppercase leading-none mb-1">Time</span><span className="text-sm font-black text-slate-900 leading-none">{totalHours}h</span></div>
          </div>

          <button onClick={handleExport} className="h-12 w-12 lg:w-auto flex items-center justify-center lg:px-6 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            <FileSpreadsheet size={20} />
            <span className="hidden lg:inline ml-2 text-[10px] font-black uppercase tracking-widest">Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        {/* DESKTOP TABLE */}
        <table className="w-full text-left hidden md:table border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-100">
            <tr>
              <th className="p-5 text-[10px] font-black uppercase text-slate-400 w-12 text-center">#</th>
              <th className="p-5 text-[10px] font-black uppercase text-slate-400">Context</th>
              <th className="p-5 text-[10px] font-black uppercase text-slate-400">Incident</th>
              <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-right">Impact</th>
              <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredDelays.map((d, i) => (
              <tr key={d.id} className="hover:bg-slate-50/50 group transition-all">
                <td className="p-5 text-center text-[10px] font-black text-slate-300 italic">{i + 1}</td>
                <td className="p-5">
                  <span className="text-[9px] font-black text-indigo-500 uppercase flex items-center gap-1 mb-1"><Layout size={10} /> {d.activity?.project?.name || 'Shared'}</span>
                  <div className="text-sm text-slate-900 font-bold flex items-center gap-2">
                    {d.activity?.description}
                    {(!d.activity?.actualEnd && d.activity?.scheduledEnd && new Date(d.activity.scheduledEnd) < new Date()) && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]" />}
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${d.isReworkTriggered ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}><AlertCircle size={18} /></div>
                    <div><p className="text-xs font-black text-slate-700 uppercase tracking-tight">{d.type?.replace(/_/g, ' ')}</p><p className="text-[11px] text-slate-400 line-clamp-1 italic">{d.description}</p></div>
                  </div>
                </td>
                <td className="p-5 text-right">
                  <p className="text-sm font-black text-slate-900">${d.costImpact.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-400">{d.impactHours}h</p>
                </td>
                <td className="p-5">
                  <div className="flex items-center justify-center gap-2">
                    {d.activityId && (
                      <Link href={`/mm/activities/${d.activityId}`} className="p-2 rounded-lg bg-slate-50 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-slate-200 transition-all text-slate-400" title="View Activity">
                        <ExternalLink size={14} />
                      </Link>
                    )}
                    <button onClick={() => onEdit(d)} className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white transition-all shadow-sm" title="Edit Record">
                      <Edit3 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* MOBILE VIEW */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredDelays.map((d, i) => (
            <div key={d.id} className="p-5 active:bg-slate-50 relative flex flex-col gap-3">
              <div className="absolute top-4 right-4 flex items-center gap-3">
                 {d.activityId && (
                    <Link href={`/mm/activities/${d.activityId}`} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 text-indigo-500">
                      <ExternalLink size={14} />
                    </Link>
                 )}
                 <span className="text-[10px] font-black text-slate-200 italic">#{i + 1}</span>
              </div>

              <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 self-start px-2 py-0.5 rounded uppercase">{d.activity?.project?.name}</span>
              <p className="text-sm font-bold text-slate-900 leading-tight pr-12">{d.activity?.description}</p>
              
              <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <div className="flex gap-4">
                  <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Hours</p><p className="text-xs font-bold">{d.impactHours}</p></div>
                  <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Cost</p><p className="text-xs font-black text-rose-600">${d.costImpact.toLocaleString()}</p></div>
                </div>
                
                <button 
                  onClick={() => onEdit(d)}
                  className="flex items-center gap-2 pl-4 pr-2 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 transition-transform active:scale-95"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest">Edit</span>
                  <Edit3 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// 'use client'

// import React, { useMemo, useState } from 'react';
// import Link from 'next/link';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { 
//   AlertCircle, FileSpreadsheet, Clock, Layout, 
//   CalendarCheck, ChevronRight, History, ExternalLink, 
//   Edit3 // Added Edit Icon
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// const DELAY_SEARCH_SCOPES: SearchScope[] = [{ key: 'projectName', label: 'Project' }, { key: 'type', label: 'Type' }, { key: 'description', label: 'Description' }, { key: 'activity', label: 'Activity' }];

// export function DelayListView({ delays, onEdit }: { delays: any[], onEdit: (record: any) => void }) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['projectName', 'type', 'description']);
//   const [showActiveOnly, setShowActiveOnly] = useState(true);

//   const { filteredDelays, totalImpactCost, totalHours } = useMemo(() => {
//     const now = new Date();
//     const term = searchTerm.toLowerCase().trim();
//     const result = delays.filter(d => {
//       const isHistorical = d.activity?.actualEnd && (d.activity.scheduledEnd ? new Date(d.activity.scheduledEnd) < now : false);
//       const passesTimeline = !showActiveOnly || !isHistorical;
//       if (!passesTimeline) return false;
//       if (!term) return true;
//       return activeSearchFields.some(f => {
//         const val = f === 'projectName' ? d.activity?.project?.name : f === 'activity' ? d.activity?.description : d[f];
//         return String(val || '').toLowerCase().includes(term);
//       });
//     });
//     return { filteredDelays: result, totalImpactCost: result.reduce((a, c) => a + (c.costImpact || 0), 0), totalHours: result.reduce((a, c) => a + (c.impactHours || 0), 0) };
//   }, [delays, searchTerm, activeSearchFields, showActiveOnly]);

//   return (
//     <div className="space-y-6">
//       {/* HEADER CONTROLS */}
//       <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col lg:flex-row gap-2 items-center">
//         <div className="flex-1 p-4 w-full"><SearchFilterEngine scopes={DELAY_SEARCH_SCOPES} initialActiveScopes={activeSearchFields} onSearchChange={setSearchTerm} onScopesChange={setActiveSearchFields} /></div>
//         <div className="flex items-center gap-2 px-2">
//           <button onClick={() => setShowActiveOnly(!showActiveOnly)} className={`flex items-center gap-2 px-6 h-12 rounded-2xl text-[10px] font-black uppercase border transition-all ${showActiveOnly ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
//             {showActiveOnly ? <CalendarCheck size={16} /> : <History size={16} />} <span>{showActiveOnly ? 'Active' : 'History'}</span>
//           </button>
//           <div className="flex items-center gap-6 px-8 py-2 bg-slate-50/50 rounded-2xl border border-slate-100 h-12">
//             <div className="flex flex-col"><span className="text-[8px] font-black text-rose-500 uppercase leading-none mb-1">Leakage</span><span className="text-sm font-black text-slate-900 leading-none">${totalImpactCost.toLocaleString()}</span></div>
//             <div className="flex flex-col"><span className="text-[8px] font-black text-indigo-500 uppercase leading-none mb-1">Time</span><span className="text-sm font-black text-slate-900 leading-none">{totalHours}h</span></div>
//           </div>
//         </div>
//       </div>

//       <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
//         <table className="w-full text-left hidden md:table border-collapse">
//           <thead className="bg-slate-50/80 border-b border-slate-100">
//             <tr>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400 w-12 text-center">#</th>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400">Context</th>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400">Incident</th>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-right">Impact</th>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-50">
//             {filteredDelays.map((d, i) => (
//               <tr key={d.id} className="hover:bg-slate-50/50 group transition-all">
//                 <td className="p-5 text-center text-[10px] font-black text-slate-300 italic">{i + 1}</td>
//                 <td className="p-5">
//                   <span className="text-[9px] font-black text-indigo-500 uppercase flex items-center gap-1 mb-1"><Layout size={10} /> {d.activity?.project?.name || 'Shared'}</span>
//                   <div className="text-sm text-slate-900 font-bold flex items-center gap-2">
//                     {d.activity?.description}
//                     {(!d.activity?.actualEnd && d.activity?.scheduledEnd && new Date(d.activity.scheduledEnd) < new Date()) && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]" />}
//                   </div>
//                 </td>
//                 <td className="p-5">
//                   <div className="flex items-center gap-3">
//                     <div className={`p-2 rounded-xl ${d.isReworkTriggered ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}><AlertCircle size={18} /></div>
//                     <div><p className="text-xs font-black text-slate-700 uppercase tracking-tight">{d.type?.replace(/_/g, ' ')}</p><p className="text-[11px] text-slate-400 line-clamp-1 italic">{d.description}</p></div>
//                   </div>
//                 </td>
//                 <td className="p-5 text-right">
//                   <p className="text-sm font-black text-slate-900">${d.costImpact.toLocaleString()}</p>
//                   <p className="text-[10px] font-bold text-slate-400">{d.impactHours}h</p>
//                 </td>
//                 <td className="p-5">
//                   <div className="flex items-center justify-center gap-2">
//                     {/* Activity External Link */}
//                     {d.activityId && (
//                       <Link href={`/mm/activities/${d.activityId}`} className="p-2 rounded-lg bg-slate-50 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-slate-200 transition-all text-slate-400" title="View Activity">
//                         <ExternalLink size={14} />
//                       </Link>
//                     )}
//                     {/* Primary Edit Action */}
//                     <button onClick={() => onEdit(d)} className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white transition-all shadow-sm" title="Edit Record">
//                       <Edit3 size={14} />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {/* 📱 MOBILE VIEW (Strategically Updated) */}
//         <div className="md:hidden divide-y divide-slate-100">
//           {filteredDelays.map((d, i) => (
//             <div key={d.id} className="p-5 active:bg-slate-50 relative flex flex-col gap-3">
//               {/* Top Right: Index and External Link Portal */}
//               <div className="absolute top-4 right-4 flex items-center gap-3">
//                  {d.activityId && (
//                     <Link href={`/mm/activities/${d.activityId}`} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 text-indigo-500">
//                       <ExternalLink size={14} />
//                     </Link>
//                  )}
//                  <span className="text-[10px] font-black text-slate-200 italic">#{i + 1}</span>
//               </div>

//               <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 self-start px-2 py-0.5 rounded uppercase">{d.activity?.project?.name}</span>
//               <p className="text-sm font-bold text-slate-900 leading-tight pr-12">{d.activity?.description}</p>
              
//               {/* Bottom Card Action Zone */}
//               <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
//                 <div className="flex gap-4">
//                   <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Hours</p><p className="text-xs font-bold">{d.impactHours}</p></div>
//                   <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Cost</p><p className="text-xs font-black text-rose-600">${d.costImpact.toLocaleString()}</p></div>
//                 </div>
                
//                 {/* Mobile Primary Edit Link */}
//                 <button 
//                   onClick={() => onEdit(d)}
//                   className="flex items-center gap-2 pl-4 pr-2 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 transition-transform active:scale-95"
//                 >
//                   <span className="text-[9px] font-black uppercase tracking-widest">Edit</span>
//                   <Edit3 size={14} />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
// 'use client'

// import React, { useMemo, useState } from 'react';
// import Link from 'next/link';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { AlertCircle, FileSpreadsheet, Clock, Layout, CalendarCheck, ChevronRight, History, ExternalLink } from 'lucide-react';
// import { toast } from 'sonner';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// const DELAY_SEARCH_SCOPES: SearchScope[] = [{ key: 'projectName', label: 'Project' }, { key: 'type', label: 'Type' }, { key: 'description', label: 'Description' }, { key: 'activity', label: 'Activity' }];

// export function DelayListView({ delays, onEdit }: { delays: any[], onEdit: (record: any) => void }) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['projectName', 'type', 'description']);
//   const [showActiveOnly, setShowActiveOnly] = useState(true);

//   // --- PARALLEL FILTER ENGINE ---
//   const { filteredDelays, totalImpactCost, totalHours } = useMemo(() => {
//     const now = new Date();
//     const term = searchTerm.toLowerCase().trim();

//     const result = delays.filter(d => {
//       // 1. Parallel Filter A: Timeline Visibility
//       const isHistorical = d.activity?.actualEnd && (d.activity.scheduledEnd ? new Date(d.activity.scheduledEnd) < now : false);
//       const passesTimeline = !showActiveOnly || !isHistorical;
//       if (!passesTimeline) return false;

//       // 2. Parallel Filter B: Search Term Match
//       if (!term) return true;
//       return activeSearchFields.some(f => {
//         const val = f === 'projectName' ? d.activity?.project?.name : f === 'activity' ? d.activity?.description : d[f];
//         return String(val || '').toLowerCase().includes(term);
//       });
//     });

//     return { filteredDelays: result, totalImpactCost: result.reduce((a, c) => a + (c.costImpact || 0), 0), totalHours: result.reduce((a, c) => a + (c.impactHours || 0), 0) };
//   }, [delays, searchTerm, activeSearchFields, showActiveOnly]);

//   const handleExport = async () => {
//     try {
//       const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Operational Audit');
//       ws.columns = [{header:'Project', key:'p', width: 25}, {header:'Type', key:'t', width: 20}, {header:'Desc', key:'d', width: 40}, {header:'Cost', key:'c', width: 15}];
//       filteredDelays.forEach(d => ws.addRow({p: d.activity?.project?.name || 'Global', t: d.type, d: d.description, c: d.costImpact}));
//       saveAs(new Blob([await wb.xlsx.writeBuffer()]), `Delay_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
//       toast.success("Audit report exported");
//     } catch (e) { toast.error("Export failed"); }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col lg:flex-row gap-2 items-center">
//         <div className="flex-1 p-4 w-full"><SearchFilterEngine scopes={DELAY_SEARCH_SCOPES} initialActiveScopes={activeSearchFields} onSearchChange={setSearchTerm} onScopesChange={setActiveSearchFields} /></div>
//         <div className="flex items-center gap-2 px-2">
//           <button onClick={() => setShowActiveOnly(!showActiveOnly)} className={`flex items-center gap-2 px-6 h-12 rounded-2xl text-[10px] font-black uppercase transition-all border ${showActiveOnly ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
//             {showActiveOnly ? <CalendarCheck size={16} /> : <History size={16} />} <span>{showActiveOnly ? 'Active' : 'All History'}</span>
//           </button>
//           <div className="flex items-center gap-6 px-8 py-2 bg-slate-50/50 rounded-2xl border border-slate-100 h-12">
//             <div className="flex flex-col"><span className="text-[8px] font-black text-rose-500 uppercase leading-none mb-1">Leakage</span><span className="text-sm font-black text-slate-900 leading-none">${totalImpactCost.toLocaleString()}</span></div>
//             <div className="flex flex-col"><span className="text-[8px] font-black text-indigo-500 uppercase leading-none mb-1">Time</span><span className="text-sm font-black text-slate-900 leading-none">{totalHours}h</span></div>
//           </div>
//           <button onClick={handleExport} className="h-12 flex items-center gap-3 px-8 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-700 transition-all"><FileSpreadsheet size={18} /> Export</button>
//         </div>
//       </div>

//       <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
//         <table className="w-full text-left hidden md:table border-collapse">
//           <thead className="bg-slate-50/80 border-b border-slate-100">
//             <tr>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400 w-12 text-center">#</th>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400">Context & Activity</th>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400">Delay Incident</th>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-right">Impact</th>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-center">Status</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-50">
//             {filteredDelays.map((d, i) => (
//               <tr key={d.id} className="hover:bg-slate-50/50 cursor-pointer group transition-all">
//                 <td className="p-5 text-center text-[10px] font-black text-slate-300 group-hover:text-indigo-500 italic">{i + 1}</td>
//                 <td className="p-5" onClick={() => onEdit(d)}>
//                   <span className="text-[9px] font-black text-indigo-500 uppercase flex items-center gap-1 mb-1"><Layout size={10} /> {d.activity?.project?.name || 'Shared'}</span>
//                   <div className="text-sm text-slate-900 font-bold flex items-center gap-2">
//                     {d.activity?.description}
//                     {(!d.activity?.actualEnd && d.activity?.scheduledEnd && new Date(d.activity.scheduledEnd) < new Date()) && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]" />}
//                     {d.activityId && <Link href={`/mm/activities/${d.activityId}`} onClick={(e) => e.stopPropagation()} className="p-1 text-slate-300 hover:text-indigo-600 transition-all"><ExternalLink size={12} /></Link>}
//                   </div>
//                 </td>
//                 <td className="p-5" onClick={() => onEdit(d)}>
//                   <div className="flex items-center gap-3">
//                     <div className={`p-2 rounded-xl ${d.isReworkTriggered ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}><AlertCircle size={18} /></div>
//                     <div><p className="text-xs font-black text-slate-700 uppercase">{d.type?.replace(/_/g, ' ')}</p><p className="text-[11px] text-slate-400 line-clamp-1 italic">{d.description}</p></div>
//                   </div>
//                 </td>
//                 <td className="p-5 text-right"><p className="text-sm font-black text-slate-900">${d.costImpact.toLocaleString()}</p><p className="text-[10px] font-bold text-slate-400">{d.impactHours}h</p></td>
//                 <td className="p-5 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black ${d.isReworkTriggered ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'}`}>{d.isReworkTriggered ? 'REWORK' : 'DELAY'}</span></td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {/* 📱 MOBILE VIEW */}
//         <div className="md:hidden divide-y divide-slate-100">
//           {filteredDelays.map((d, i) => (
//             <div key={d.id} onClick={() => onEdit(d)} className="p-5 active:bg-slate-50 relative flex flex-col gap-3">
//               <span className="absolute top-5 right-5 text-[10px] font-black text-slate-200 italic">#{i + 1}</span>
//               <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 self-start px-2 py-0.5 rounded uppercase tracking-widest">{d.activity?.project?.name}</span>
//               <p className="text-sm font-bold text-slate-900 leading-tight">{d.activity?.description}</p>
//               <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
//                 <div className="flex gap-4">
//                   <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Hours</p><p className="text-xs font-bold">{d.impactHours}</p></div>
//                   <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Cost</p><p className="text-xs font-black text-rose-600">${d.costImpact.toLocaleString()}</p></div>
//                 </div>
//                 <ChevronRight size={16} className="text-slate-300" />
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
// 'use client'

// import React, { useMemo, useState } from 'react';
// import Link from 'next/link';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { 
//   AlertCircle, FileSpreadsheet, Clock, Layout, 
//   CalendarCheck, ChevronRight, History, ExternalLink 
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// const DELAY_SEARCH_SCOPES: SearchScope[] = [
//   { key: 'projectName', label: 'Project' }, 
//   { key: 'type', label: 'Type' }, 
//   { key: 'description', label: 'Description' }, 
//   { key: 'activity', label: 'Activity' }
// ];

// export function DelayListView({ delays, onEdit }: { delays: any[], onEdit: (record: any) => void }) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['projectName', 'type', 'description']);
//   const [showActiveOnly, setShowActiveOnly] = useState(true);

//   // --- ONE-LINE LOGIC ENGINE ---
//   const { filteredDelays, totalImpactCost, totalHours } = useMemo(() => {
//     const now = new Date();
//     // Filter out completed + past due items if showActiveOnly is true
//     const processed = showActiveOnly ? delays.filter(d => !d.activity || !(d.activity.actualEnd && (d.activity.scheduledEnd ? new Date(d.activity.scheduledEnd) < now : false))) : delays;
//     // Multi-scope search implementation
//     const term = searchTerm.toLowerCase().trim();
//     const searchable = term ? processed.filter(d => activeSearchFields.some(f => String(f === 'projectName' ? d.activity?.project?.name : f === 'activity' ? d.activity?.description : d[f] || '').toLowerCase().includes(term))) : processed;

//     return { filteredDelays: searchable, totalImpactCost: searchable.reduce((a, c) => a + (c.costImpact || 0), 0), totalHours: searchable.reduce((a, c) => a + (c.impactHours || 0), 0) };
//   }, [delays, searchTerm, activeSearchFields, showActiveOnly]);

//   const handleExport = async () => {
//     try {
//       const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Operational Audit');
//       ws.columns = [{header:'Project', key:'p', width: 25}, {header:'Type', key:'t', width: 20}, {header:'Desc', key:'d', width: 40}, {header:'Cost', key:'c', width: 15}];
//       ws.getRow(1).font = { bold: true };
//       filteredDelays.forEach(d => ws.addRow({p: d.activity?.project?.name || 'Global', t: d.type, d: d.description, c: d.costImpact}));
//       saveAs(new Blob([await wb.xlsx.writeBuffer()]), `Delay_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
//       toast.success("Audit report exported successfully");
//     } catch (e) { toast.error("Export failed"); }
//   };

//   return (
//     <div className="space-y-6">
//       {/* 📊 KPI & SEARCH HEADER */}
//       <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col lg:flex-row gap-2 items-center">
//         <div className="flex-1 p-4 w-full">
//           <SearchFilterEngine 
//             scopes={DELAY_SEARCH_SCOPES} 
//             initialActiveScopes={activeSearchFields} 
//             onSearchChange={setSearchTerm} 
//             onScopesChange={setActiveSearchFields} 
//           />
//         </div>

//         <div className="flex items-center gap-2 px-2">
//           <button onClick={() => setShowActiveOnly(!showActiveOnly)} className={`flex items-center gap-2 px-6 h-12 rounded-2xl text-[10px] font-black uppercase transition-all border ${showActiveOnly ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
//             {showActiveOnly ? <CalendarCheck size={16} /> : <History size={16} />} <span>{showActiveOnly ? 'Active' : 'All History'}</span>
//           </button>
          
//           <div className="flex items-center gap-6 px-8 py-2 bg-slate-50/50 rounded-2xl border border-slate-100 h-12">
//             <div className="flex flex-col"><span className="text-[8px] font-black text-rose-500 uppercase">Leakage</span><span className="text-sm font-black text-slate-900">${totalImpactCost.toLocaleString()}</span></div>
//             <div className="flex flex-col"><span className="text-[8px] font-black text-indigo-500 uppercase">Time</span><span className="text-sm font-black text-slate-900">{totalHours}h</span></div>
//           </div>

//           <button onClick={handleExport} className="h-12 flex items-center gap-3 px-8 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">
//             <FileSpreadsheet size={18} /> Export
//           </button>
//         </div>
//       </div>

//       {/* 💻 MAIN TABLE */}
//       <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
//         <table className="w-full text-left hidden md:table border-collapse">
//           <thead className="bg-slate-50/80 border-b border-slate-100">
//             <tr>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400 w-12 text-center">#</th>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400">Context & Activity</th>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400">Delay Incident</th>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-right">Impact</th>
//               <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-center">Status</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-50">
//             {filteredDelays.map((d, i) => {
//               const isOverdue = !d.activity?.actualEnd && d.activity?.scheduledEnd && new Date(d.activity.scheduledEnd) < new Date();
//               return (
//                 <tr key={d.id} className="hover:bg-slate-50/80 cursor-pointer group transition-all">
//                   <td className="p-5 text-center text-[10px] font-black text-slate-300 group-hover:text-indigo-500">{i + 1}</td>
//                   <td className="p-5" onClick={() => onEdit(d)}>
//                     <span className="text-[9px] font-black text-indigo-500 uppercase flex items-center gap-1 mb-1"><Layout size={10} /> {d.activity?.project?.name || 'Shared'}</span>
//                     <div className="text-sm text-slate-900 font-bold flex items-center gap-2">
//                       {d.activity?.description}
//                       {isOverdue && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />}
//                       {d.activityId && (
//                         <Link href={`/mm/activities/${d.activityId}`} onClick={(e) => e.stopPropagation()} className="p-1 rounded-md bg-transparent hover:bg-white text-slate-300 hover:text-indigo-600 border border-transparent hover:border-slate-100 transition-all">
//                           <ExternalLink size={12} />
//                         </Link>
//                       )}
//                     </div>
//                   </td>
//                   <td className="p-5" onClick={() => onEdit(d)}>
//                     <div className="flex items-center gap-3">
//                       <div className={`p-2 rounded-xl ${d.isReworkTriggered ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}><AlertCircle size={18} /></div>
//                       <div>
//                         <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{d.type?.replace(/_/g, ' ')}</p>
//                         <p className="text-[11px] text-slate-400 line-clamp-1 italic">{d.description}</p>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="p-5 text-right" onClick={() => onEdit(d)}>
//                     <p className="text-sm font-black text-slate-900">${d.costImpact.toLocaleString()}</p>
//                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{d.impactHours} hrs lost</p>
//                   </td>
//                   <td className="p-5 text-center" onClick={() => onEdit(d)}>
//                     <div className="flex items-center justify-center gap-3">
//                       <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${d.isReworkTriggered ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
//                         {d.isReworkTriggered ? 'REWORK' : 'DELAY'}
//                       </span>
//                       <ChevronRight size={14} className="text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>

//         {/* 📱 MOBILE VIEW */}
//         <div className="md:hidden divide-y divide-slate-100">
//           {filteredDelays.map((d, i) => (
//             <div key={d.id} onClick={() => onEdit(d)} className="p-5 active:bg-slate-50 relative flex flex-col gap-3">
//               <span className="absolute top-5 right-5 text-[10px] font-black text-slate-200 tracking-tighter">REF #{i + 1}</span>
//               <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 self-start px-2 py-0.5 rounded uppercase tracking-widest">{d.activity?.project?.name}</span>
//               <p className="text-sm font-bold text-slate-900 leading-tight">{d.activity?.description}</p>
//               <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
//                 <div className="flex gap-4">
//                   <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Hours</p><p className="text-xs font-bold">{d.impactHours}</p></div>
//                   <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Cost</p><p className="text-xs font-black text-rose-600">${d.costImpact.toLocaleString()}</p></div>
//                 </div>
//                 <div className={`px-2 py-1 rounded-lg text-[8px] font-black text-white ${d.isReworkTriggered ? 'bg-rose-500' : 'bg-amber-500'}`}>
//                   {d.isReworkTriggered ? 'REWORK' : 'DELAY'}
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

// import React, { useMemo, useState } from 'react';
// import Link from 'next/link'; // Added for routing
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { 
//   AlertCircle, 
//   FileSpreadsheet, 
//   Clock, 
//   DollarSign, 
//   Construction, 
//   Layout, 
//   CalendarCheck, 
//   CalendarX,
//   ChevronRight,
//   History,
//   ExternalLink // Added for activity link
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// /** * --- SEARCH CONFIGURATION ---
//  * Aligned with Guideline 1: Cost & Infrastructure Standards 2025
//  */
// const DELAY_SEARCH_SCOPES: SearchScope[] = [
//   { key: 'projectName', label: 'Project Name' },
//   { key: 'type', label: 'Incident Type' },
//   { key: 'description', label: 'Incident Description' },
//   { key: 'activity', label: 'Activity Context' },
// ];

// interface DelayListViewProps {
//   delays: any[];
//   onEdit: (record: any) => void;
// }

// export function DelayListView({ delays, onEdit }: DelayListViewProps) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [activeSearchFields, setActiveSearchFields] = useState<string[]>(
//     ['projectName', 'type', 'description']
//   );
  
//   const [showActiveOnly, setShowActiveOnly] = useState(true);
//   // --- CORE FILTER ENGINE ---
//   const { filteredDelays, totalImpactCost, totalHours } = useMemo(() => {
//     const now = new Date();
    
//     let processed = delays;

//     // 1. TIMELINE RELEVANCE FILTER (Logic Update)
//     if (showActiveOnly) {
//       processed = delays.filter(delay => {
//         const act = delay.activity;
        
//         // If there is no activity context linked, keep it (Global operational item)
//         if (!act) return true; 

//         // UPDATED: Activity is completed if actualEnd has been recorded
//         const isCompleted = act.actualEnd !== null && act.actualEnd !== undefined;
        
//         // Past due if the scheduled deadline is behind us
//         const isPastDue = act.scheduledEnd ? new Date(act.scheduledEnd) < now : false;

//         /**
//          * LOGIC: Remove only records that are BOTH finished AND past their scheduled time.
//          * This ensures that:
//          * - Ongoing delays stay visible.
//          * - Overdue but uncompleted delays stay visible.
//          * - Completed items that were finished "today" or in future remain visible (until past due).
//          */
//         return !(isCompleted && isPastDue);
//       });
//     }

//     // 2. SEARCH ENGINE LOGIC
//     const term = searchTerm.toLowerCase().trim();
//     const searchableData = term 
//       ? processed.filter((delay) => {
//           return activeSearchFields.some((field) => {
//             let val = '';
//             if (field === 'projectName') val = delay.activity?.project?.name || '';
//             else if (field === 'activity') val = delay.activity?.description || '';
//             else val = delay[field] || '';
//             return String(val).toLowerCase().includes(term);
//           });
//         })
//       : processed;

//     // 3. KPI CALCULATIONS
//     const cost = searchableData.reduce((acc, curr) => acc + (curr.costImpact || 0), 0);
//     const hours = searchableData.reduce((acc, curr) => acc + (curr.impactHours || 0), 0);

//     return { filteredDelays: searchableData, totalImpactCost: cost, totalHours: hours };
//   }, [delays, searchTerm, activeSearchFields, showActiveOnly]);
  

//   const handleExport = async () => {
//     try {
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet('Operational Audit');
//       worksheet.columns = [
//         { header: 'Project', key: 'project', width: 25 },
//         { header: 'Type', key: 'type', width: 20 },
//         { header: 'Description', key: 'desc', width: 40 },
//         { header: 'Activity', key: 'activity', width: 30 },
//         { header: 'Hours', key: 'hours', width: 12 },
//         { header: 'Cost ($)', key: 'cost', width: 15 },
//         { header: 'Rework', key: 'rework', width: 12 },
//       ];
//       worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
//       worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
//       filteredDelays.forEach(d => {
//         worksheet.addRow({
//           project: d.activity?.project?.name || 'Global',
//           type: d.type?.replace(/_/g, ' '),
//           desc: d.description,
//           activity: d.activity?.description || 'N/A',
//           hours: d.impactHours,
//           cost: d.costImpact,
//           rework: d.isReworkTriggered ? 'YES' : 'NO'
//         });
//       });
//       const buffer = await workbook.xlsx.writeBuffer();
//       saveAs(new Blob([buffer]), `Audit_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
//       toast.success("Operational report generated");
//     } catch (e) {
//       toast.error("Export failed");
//     }
//   };

//   return (
//     <div className="space-y-6">
      
//       {/* 📊 HEADER CONTROLS */}
//       <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40">
//         <div className="flex flex-col lg:flex-row gap-2 items-stretch">
          
//           <div className="flex-1 p-4">
//             <SearchFilterEngine 
//               scopes={DELAY_SEARCH_SCOPES}
//               initialActiveScopes={activeSearchFields}
//               onSearchChange={setSearchTerm}
//               onScopesChange={setActiveSearchFields}
//               placeholder="Filter by project or risk type..."
//             />
//           </div>

//           <div className="flex items-center px-2">
//             <button
//               onClick={() => setShowActiveOnly(!showActiveOnly)}
//               className={`flex items-center gap-2 px-6 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
//                 showActiveOnly 
//                 ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-200' 
//                 : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
//               }`}
//             >
//               {showActiveOnly ? <CalendarCheck size={16} /> : <History size={16} />}
//               <span>{showActiveOnly ? 'Active Risks' : 'All History'}</span>
//             </button>
//           </div>

//           <div className="flex items-center gap-6 px-8 py-2 bg-slate-50/50 rounded-[1.8rem] border border-slate-100 mx-4 lg:mx-0">
//             <div className="flex flex-col">
//               <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Total Leakage</span>
//               <span className="text-sm font-black text-slate-900">${totalImpactCost.toLocaleString()}</span>
//             </div>
//             <div className="h-8 w-[1px] bg-slate-200" />
//             <div className="flex flex-col">
//               <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Time Lost</span>
//               <span className="text-sm font-black text-slate-900">{totalHours}h</span>
//             </div>
//           </div>

//           <div className="p-4 flex items-center">
//             <button 
//               onClick={handleExport}
//               className="w-full lg:w-auto h-12 flex items-center justify-center gap-3 px-8 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 text-[10px] font-black uppercase tracking-widest"
//             >
//               <FileSpreadsheet size={18} />
//               <span>Export</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* 💻 TABLE VIEWPORT */}
//       <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
//         {filteredDelays.length > 0 ? (
//           <div className="hidden md:block overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead className="bg-slate-50/80 border-b border-slate-100">
//                 <tr>
//                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Project Context</th>
//                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Incident Details</th>
//                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Impact</th>
//                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Audit Status</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-50">
//                 {filteredDelays.map((delay) => {
//                   const isOverdue = delay.activity?.scheduledEnd && new Date(delay.activity.scheduledEnd) < new Date() && delay.activity.status !== 'COMPLETED';
//                   const activityId = delay.activityId;
//                  // console.log("delay........",delay)
                  
//                   return (
//                     <tr key={delay.id} className="hover:bg-indigo-50/40 cursor-pointer transition-colors group">
//                       <td className="p-6">
//                         <div className="flex flex-col gap-1">
//                           <span  key={delay.id} onClick={() => onEdit(delay)} className="text-[9px] font-black text-indigo-500 uppercase flex items-center gap-1">
//                             <Layout size={10} /> {delay.activity?.project?.name || 'Global Shared'}
//                           </span>
//                           <div className="text-sm text-slate-900 font-bold flex items-center gap-2">
//                             {delay.activity?.description || 'General Context'}
//                             {isOverdue && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                            
//                             {/* --- ACTIVITY DETAIL LINK --- */}
//                             {activityId && (
//                               <Link 
//                                 href={`/mm/activities/${activityId}`}
//                                 onClick={(e) => e.stopPropagation()} // Prevents triggering row edit
//                                 className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-slate-300 hover:text-indigo-600 transition-all ml-1"
//                                 title="View Activity Details"
//                               >
//                                 <ExternalLink size={12} />
//                               </Link>
//                            )} 
//                           </div>
//                         </div>
//                       </td>
//                       <td className="p-6">
//                         <div className="flex items-center gap-3">
//                           <div className={`p-2.5 rounded-xl ${delay.isReworkTriggered ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
//                             <AlertCircle size={18} />
//                           </div>
//                           <div>
//                             <p className="text-sm font-bold text-slate-700">{delay.type?.replace(/_/g, ' ')}</p>
//                             <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[250px]">{delay.description}</p>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="p-6 text-right">
//                         <p className="text-sm font-black text-slate-900">${delay.costImpact.toLocaleString()}</p>
//                         <p className="text-[10px] font-bold text-slate-400">{delay.impactHours} hrs</p>
//                       </td>
//                       <td className="p-6 text-center">
//                         <div className="flex items-center justify-center gap-2">
//                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
//                             delay.isReworkTriggered ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'
//                           }`}>
//                             {delay.isReworkTriggered ? 'REWORK' : 'DELAY'}
//                           </span>
//                           <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="h-[400px] flex flex-col items-center justify-center text-center p-10">
//             <AlertCircle size={32} className="text-slate-200 mb-4" />
//             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">No matching risks</h3>
//           </div>
//         )}
//       </div>
//       {/* MOBILE CARDS */}
//          <div className="md:hidden divide-y divide-slate-100">
//            {filteredDelays.map((delay) => (
//              <div key={delay.id} onClick={() => onEdit(delay)} className="p-5 active:bg-slate-50 transition-colors space-y-4">
//                <div className="flex flex-col gap-1">
//                   <div className="flex justify-between items-center">
//                      <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md">
//                        <Layout size={10} /> {delay.activity?.project?.name || 'Unassigned Project'}
//                      </span>
//                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${delay.isReworkTriggered ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
//                        {delay.isReworkTriggered ? 'REWORK' : 'DELAY'}
//                      </span>
//                   </div>
//                   <p className="text-sm font-bold text-slate-900 mt-2">{delay.activity?.description || 'General Context'}</p>
//                </div>

//                <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
//                  <div className={`p-2 rounded-lg ${delay.isReworkTriggered ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
//                    <AlertCircle size={18} />
//                  </div>
//                  <div>
//                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{delay.type?.replace('_', ' ')}</p>
//                    <p className="text-xs text-slate-600 italic line-clamp-1">{delay.description}</p>
//                  </div>
//                </div>

//                <div className="grid grid-cols-2 gap-3">
//                  <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
//                    <Clock size={16} className="text-slate-400" />
//                    <div>
//                      <p className="text-[8px] font-black text-slate-400 uppercase">Impact</p>
//                      <p className="text-xs font-bold text-slate-700">{delay.impactHours} hrs</p>
//                    </div>
//                  </div>
//                  <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
//                    <DollarSign size={16} className="text-rose-500" />
//                    <div>
//                      <p className="text-[8px] font-black text-slate-400 uppercase">Cost</p>
//                      <p className="text-xs font-bold text-slate-900">${delay.costImpact.toLocaleString()}</p>
//                    </div>
//                  </div>
//                </div>
//              </div>
//            ))}
//          </div>
//      </div>
//   );
// }
// 'use client'

// import React, { useMemo, useState } from 'react';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { 
//   AlertCircle, 
//   FileSpreadsheet, 
//   Clock, 
//   DollarSign, 
//   Construction, 
//   Layout, 
//   Filter, 
//   CalendarCheck, 
//   CalendarX,
//   ChevronRight,
//   History
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// /** * --- SEARCH CONFIGURATION ---
//  * Aligned with Guideline 1: Cost & Infrastructure Standards 2025
//  */
// const DELAY_SEARCH_SCOPES: SearchScope[] = [
//   { key: 'projectName', label: 'Project Name' },
//   { key: 'type', label: 'Incident Type' },
//   { key: 'description', label: 'Incident Description' },
//   { key: 'activity', label: 'Activity Context' },
// ];

// interface DelayListViewProps {
//   delays: any[];
//   onEdit: (record: any) => void;
// }

// export function DelayListView({ delays, onEdit }: DelayListViewProps) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [activeSearchFields, setActiveSearchFields] = useState<string[]>(
//     ['projectName', 'type', 'description']
//   );
  
//   // Toggle for filtering out "Closed/Irrelevant" timelines
//   const [showActiveOnly, setShowActiveOnly] = useState(true);

//   // --- CORE FILTER ENGINE ---
//   const { filteredDelays, totalImpactCost, totalHours } = useMemo(() => {
//     const now = new Date();
    
//     // 1. Initial Timeline Relevance Filter
//     let processed = delays;
//     if (showActiveOnly) {
//       processed = delays.filter(delay => {
//         const act = delay.activity;
//         if (!act) return true; // Keep global unlinked records

//         const isCompleted = act.status === 'COMPLETED';
//         const isPastDue = act.scheduledEnd ? new Date(act.scheduledEnd) < now : false;

//         // RULE: Hide only if it is BOTH finished AND the clock has run out.
//         // This keeps "Overdue but working" items visible.
//         return !(isCompleted && isPastDue);
//       });
//     }

//     // 2. Search Engine Logic
//     const term = searchTerm.toLowerCase().trim();
//     const searchableData = term 
//       ? processed.filter((delay) => {
//           return activeSearchFields.some((field) => {
//             let val = '';
//             if (field === 'projectName') val = delay.activity?.project?.name || '';
//             else if (field === 'activity') val = delay.activity?.description || '';
//             else val = delay[field] || '';
//             return String(val).toLowerCase().includes(term);
//           });
//         })
//       : processed;

//     // 3. KPI Calculations
//     const cost = searchableData.reduce((acc, curr) => acc + (curr.costImpact || 0), 0);
//     const hours = searchableData.reduce((acc, curr) => acc + (curr.impactHours || 0), 0);

//     return { filteredDelays: searchableData, totalImpactCost: cost, totalHours: hours };
//   }, [delays, searchTerm, activeSearchFields, showActiveOnly]);

//   // --- EXPORT LOGIC ---
//   const handleExport = async () => {
//     try {
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet('Operational Audit');

//       worksheet.columns = [
//         { header: 'Project', key: 'project', width: 25 },
//         { header: 'Type', key: 'type', width: 20 },
//         { header: 'Description', key: 'desc', width: 40 },
//         { header: 'Activity', key: 'activity', width: 30 },
//         { header: 'Hours', key: 'hours', width: 12 },
//         { header: 'Cost ($)', key: 'cost', width: 15 },
//         { header: 'Rework', key: 'rework', width: 12 },
//       ];

//       worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
//       worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };

//       filteredDelays.forEach(d => {
//         worksheet.addRow({
//           project: d.activity?.project?.name || 'Global',
//           type: d.type?.replace(/_/g, ' '),
//           desc: d.description,
//           activity: d.activity?.description || 'N/A',
//           hours: d.impactHours,
//           cost: d.costImpact,
//           rework: d.isReworkTriggered ? 'YES' : 'NO'
//         });
//       });

//       const buffer = await workbook.xlsx.writeBuffer();
//       saveAs(new Blob([buffer]), `Audit_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
//       toast.success("Operational report generated");
//     } catch (e) {
//       toast.error("Export failed");
//     }
//   };

//   return (
//     <div className="space-y-6">
      
//       {/* 📊 CONTROL & KPI HEADER */}
//       <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40">
//         <div className="flex flex-col lg:flex-row gap-2 items-stretch">
          
//           <div className="flex-1 p-4">
//             <SearchFilterEngine 
//               scopes={DELAY_SEARCH_SCOPES}
//               initialActiveScopes={activeSearchFields}
//               onSearchChange={setSearchTerm}
//               onScopesChange={setActiveSearchFields}
//               placeholder="Filter by project or risk type..."
//             />
//           </div>

//           {/* TIMELINE FILTER TOGGLE */}
//           <div className="flex items-center px-2">
//             <button
//               onClick={() => setShowActiveOnly(!showActiveOnly)}
//               className={`flex items-center gap-2 px-6 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
//                 showActiveOnly 
//                 ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-200' 
//                 : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
//               }`}
//             >
//               {showActiveOnly ? <CalendarCheck size={16} /> : <History size={16} />}
//               <span>{showActiveOnly ? 'Active Risks' : 'All History'}</span>
//             </button>
//           </div>

//           {/* KPI INDICATORS */}
//           <div className="flex items-center gap-6 px-8 py-2 bg-slate-50/50 rounded-[1.8rem] border border-slate-100 mx-4 lg:mx-0">
//             <div className="flex flex-col">
//               <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Total Leakage</span>
//               <span className="text-sm font-black text-slate-900">${totalImpactCost.toLocaleString()}</span>
//             </div>
//             <div className="h-8 w-[1px] bg-slate-200" />
//             <div className="flex flex-col">
//               <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Time Lost</span>
//               <span className="text-sm font-black text-slate-900">{totalHours}h</span>
//             </div>
//           </div>

//           <div className="p-4 flex items-center">
//             <button 
//               onClick={handleExport}
//               className="w-full lg:w-auto h-12 flex items-center justify-center gap-3 px-8 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 text-[10px] font-black uppercase tracking-widest"
//             >
//               <FileSpreadsheet size={18} />
//               <span>Export</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* 💻 TABLE VIEWPORT */}
//       <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
//         {filteredDelays.length > 0 ? (
//           <div className="hidden md:block overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead className="bg-slate-50/80 border-b border-slate-100">
//                 <tr>
//                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Project Context</th>
//                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Incident Details</th>
//                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Impact</th>
//                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Audit Status</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-50">
//                 {filteredDelays.map((delay) => {
//                   const isOverdue = delay.activity?.scheduledEnd && new Date(delay.activity.scheduledEnd) < new Date() && delay.activity.status !== 'COMPLETED';
                  
//                   return (
//                     <tr key={delay.id} onClick={() => onEdit(delay)} className="hover:bg-indigo-50/40 cursor-pointer transition-colors group">
//                       <td className="p-6">
//                         <div className="flex flex-col gap-1">
//                           <span className="text-[9px] font-black text-indigo-500 uppercase flex items-center gap-1">
//                             <Layout size={10} /> {delay.activity?.project?.name || 'Global Shared'}
//                           </span>
//                           <div className="text-sm text-slate-900 font-bold flex items-center gap-2">
//                             {delay.activity?.description || 'General Context'}
//                             {isOverdue && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Overdue Activity" />}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="p-6">
//                         <div className="flex items-center gap-3">
//                           <div className={`p-2.5 rounded-xl ${delay.isReworkTriggered ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
//                             <AlertCircle size={18} />
//                           </div>
//                           <div>
//                             <p className="text-sm font-bold text-slate-700">{delay.type?.replace(/_/g, ' ')}</p>
//                             <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[250px]">{delay.description}</p>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="p-6 text-right">
//                         <p className="text-sm font-black text-slate-900">${delay.costImpact.toLocaleString()}</p>
//                         <p className="text-[10px] font-bold text-slate-400">{delay.impactHours} hrs</p>
//                       </td>
//                       <td className="p-6 text-center">
//                         <div className="flex items-center justify-center gap-2">
//                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
//                             delay.isReworkTriggered ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'
//                           }`}>
//                             {delay.isReworkTriggered ? 'REWORK' : 'DELAY'}
//                           </span>
//                           <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="h-[400px] flex flex-col items-center justify-center text-center p-10">
//             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
//               <AlertCircle size={32} className="text-slate-200" />
//             </div>
//             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">No matching risks</h3>
//             <p className="text-[11px] text-slate-400 font-bold uppercase mt-2">Try switching to All History or adjusting search scopes</p>
//           </div>
//         )}

//         {/* 📱 MOBILE VIEW (Adaptive Cards) */}
//         <div className="md:hidden divide-y divide-slate-100">
//           {filteredDelays.map((delay) => (
//             <div key={delay.id} onClick={() => onEdit(delay)} className="p-5 active:bg-slate-50 transition-colors">
//               <div className="flex justify-between items-start mb-3">
//                 <span className="text-[9px] font-black text-indigo-500 uppercase bg-indigo-50 px-2 py-1 rounded-lg">
//                   {delay.activity?.project?.name || 'Global'}
//                 </span>
//                 <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${delay.isReworkTriggered ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
//                   {delay.isReworkTriggered ? 'REWORK' : 'DELAY'}
//                 </span>
//               </div>
//               <p className="text-sm font-bold text-slate-900 mb-4">{delay.activity?.description || 'General Context'}</p>
//               <div className="flex justify-between items-end">
//                 <div className="flex items-center gap-2">
//                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
//                       <Clock size={14} />
//                    </div>
//                    <p className="text-xs font-bold text-slate-600">{delay.impactHours}h</p>
//                 </div>
//                 <p className="text-lg font-black text-rose-600">${delay.costImpact.toLocaleString()}</p>
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
// import { 
//   AlertCircle, 
//   FileSpreadsheet, 
//   Clock, 
//   DollarSign, 
//   Construction, 
//   Layout, 
//   Filter 
// } from 'lucide-react';
// import { useMemo, useState } from 'react';
// import { toast } from 'sonner';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// // --- SEARCH CONFIGURATION (Guideline 1 of 2025) ---
// const DELAY_SEARCH_SCOPES: SearchScope[] = [
//   { key: 'projectName', label: 'Project Name' },
//   { key: 'type', label: 'Incident Type' },
//   { key: 'description', label: 'Incident Description' },
//   { key: 'activity', label: 'Activity Context' },
// ];

// export function DelayListView({ delays, onEdit }: { delays: any[], onEdit: (r: any) => void }) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [activeSearchFields, setActiveSearchFields] = useState<string[]>(
//     ['projectName', 'type', 'description']
//   );

//   // --- FILTER LOGIC ---
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
    
//      {/* 📊 PREMIUM CONTROL & KPI BAR */}
//     <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-sm">
//       <div className="flex flex-col lg:flex-row gap-2 items-stretch">
        
//         {/* 1. LEFT: SEARCH SECTION */}
//         <div className="flex-1 p-4">
//           <SearchFilterEngine 
//             scopes={DELAY_SEARCH_SCOPES}
//             initialActiveScopes={activeSearchFields}
//             onSearchChange={setSearchTerm}
//             onScopesChange={setActiveSearchFields}
//             placeholder="Search via operational scopes..."
//           />
//         </div>

//         {/* 2. CENTER: KPI INDICATORS (The Improved Summary) */}
//         <div className="flex items-center gap-4 px-6 py-2 bg-slate-50/50 rounded-[1.8rem] border border-slate-100 mx-4 lg:mx-0">
//           {/* Cost Metric */}
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm border border-rose-200">
//               <DollarSign size={18} />
//             </div>
//             <div className="flex flex-col">
//               <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest leading-none">Cost Impact</span>
//               <span className="text-sm font-black text-slate-900">${totalImpactCost.toLocaleString()}</span>
//             </div>
//           </div>

//           {/* Vertical Divider */}
//           <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

//           {/* Time Metric */}
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200">
//               <Clock size={18} />
//             </div>
//             <div className="flex flex-col">
//               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Time Loss</span>
//               <span className="text-sm font-black text-slate-900">{totalHours} <span className="text-[10px] text-slate-400">HRS</span></span>
//             </div>
//           </div>
//         </div>

//         {/* 3. RIGHT: EXPORT ACTION */}
//         <div className="p-4 flex items-center">
//           <button 
//             onClick={handleExport}
//             className="w-full lg:w-auto h-12 flex items-center justify-center gap-3 px-8 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-100 text-[10px] font-black uppercase tracking-widest"
//           >
//             <FileSpreadsheet size={18} />
//             <span>Export ({filteredDelays.length})</span>
//           </button>
//         </div>

//       </div>
//     </div>

//       {/* 📱 VIEWPORT CONTENT AREA */}
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

//         

//   );
// }
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