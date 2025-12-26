'use client'
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AlertCircle, FileSpreadsheet, Search, Clock, DollarSign, Construction, Layout } from 'lucide-react';
import { useMemo, useState } from 'react';

export function DelayListView({ delays, onEdit }: { delays: any[], onEdit: (r: any) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  // --- FILTER LOGIC ---
  const filteredDelays = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return delays;

    return delays.filter((delay) => 
      delay.type?.toLowerCase().includes(term) ||
      delay.description?.toLowerCase().includes(term) ||
      delay.activity?.description?.toLowerCase().includes(term) ||
      delay.activity?.project?.name?.toLowerCase().includes(term) // Search by Project Name
    );
  }, [delays, searchTerm]);

  const totalImpactCost = filteredDelays.reduce((acc, curr) => acc + (curr.costImpact || 0), 0);
  const totalHours = filteredDelays.reduce((acc, curr) => acc + (curr.impactHours || 0), 0);

  // --- EXCELJS EXPORT HANDLER ---
  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Operational Delays');

    worksheet.columns = [
      { header: 'Project', key: 'project', width: 25 }, // Added Project to Excel
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
        type: delay.type.replace('_', ' '),
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
  };

  return (
    <div className="space-y-6">
      {/* 📊 SUMMARY & SEARCH BAR */}
      <div className="flex flex-col gap-4 bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by project, activity, or incident..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-10 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
            />
          </div>
          
          <button 
            onClick={handleExport}
            className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 text-xs font-black uppercase tracking-widest"
          >
            <FileSpreadsheet size={18} />
            <span>Export Report ({filteredDelays.length})</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 text-center md:text-left">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Cost Impact</p>
            <p className="text-xl font-black text-rose-600">${totalImpactCost.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 text-center md:text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Time Loss</p>
            <p className="text-xl font-black text-slate-900">{totalHours} <span className="text-xs font-medium">hrs</span></p>
          </div>
        </div>
      </div>

      {/* 📱 MOBILE LIST VIEW / 🖥️ DESKTOP TABLE VIEW */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        {/* DESKTOP TABLE */}
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
                        <p className="text-sm font-bold text-slate-700">{delay.type.replace('_', ' ')}</p>
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{delay.type.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-600 italic">{delay.description}</p>
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
// import { AlertCircle, FileSpreadsheet, Search, Clock, DollarSign, ArrowRight, Construction } from 'lucide-react';
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
//       delay.activity?.description?.toLowerCase().includes(term)
//     );
//   }, [delays, searchTerm]);

//   const totalImpactCost = filteredDelays.reduce((acc, curr) => acc + (curr.costImpact || 0), 0);
//   const totalHours = filteredDelays.reduce((acc, curr) => acc + (curr.impactHours || 0), 0);

//   // --- EXCELJS EXPORT HANDLER ---
//   const handleExport = async () => {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Operational Delays');

//     worksheet.columns = [
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
//               placeholder="Search incidents or activities..."
//               className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-10 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
//             />
//           </div>
          
//           <div className="flex items-center gap-3 w-full lg:w-auto">
//             <button 
//               onClick={handleExport}
//               className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 text-xs font-black uppercase tracking-widest"
//             >
//               <FileSpreadsheet size={18} />
//               <span>Export ({filteredDelays.length})</span>
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
//           <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
//             <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Cost Impact</p>
//             <p className="text-xl font-black text-rose-600">${totalImpactCost.toLocaleString()}</p>
//           </div>
//           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
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
//                 <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Incident Type</th>
//                 <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Context</th>
//                 <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Impact</th>
//                 <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Cost Impact</th>
//                 <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {filteredDelays.map((delay) => (
//                 <tr key={delay.id} onClick={() => onEdit(delay)} className="hover:bg-indigo-50/30 cursor-pointer transition-colors group">
//                   <td className="p-6">
//                     <div className="flex items-center gap-3">
//                       <div className={`p-2.5 rounded-xl ${delay.isReworkTriggered ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
//                         <AlertCircle size={18} />
//                       </div>
//                       <div className="min-w-0">
//                         <p className="text-sm font-bold text-slate-900">{delay.type.replace('_', ' ')}</p>
//                         <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{delay.description}</p>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="p-6">
//                     <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
//                       <Construction size={14} className="text-slate-400" />
//                       {delay.activity?.description || 'General Context'}
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
//               <div className="flex justify-between items-start">
//                 <div className="flex items-center gap-3">
//                   <div className={`p-2 rounded-lg ${delay.isReworkTriggered ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
//                     <AlertCircle size={18} />
//                   </div>
//                   <div>
//                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{delay.type.replace('_', ' ')}</p>
//                     <p className="text-sm font-bold text-slate-900">{delay.activity?.description || 'General Context'}</p>
//                   </div>
//                 </div>
//                 <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${delay.isReworkTriggered ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'}`}>
//                   {delay.isReworkTriggered ? 'REWORK' : 'DELAY'}
//                 </span>
//               </div>

//               <p className="text-xs text-slate-500 leading-relaxed italic">{delay.description}</p>

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

//         {filteredDelays.length === 0 && (
//           <div className="p-20 text-center">
//             <div className="inline-flex p-4 bg-slate-50 rounded-full text-slate-300 mb-4">
//               <Search size={32} />
//             </div>
//             <p className="text-slate-500 font-medium">No incidents found matching your search.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }