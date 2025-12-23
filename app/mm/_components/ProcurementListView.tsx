import React, { useState } from 'react';
import { Search, Layers, ShoppingCart, Box, DollarSign, Clock, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const getSingularLabel = (tab: string) => {
  if (tab === 'mastermaterials') return 'Catalog Item';
  return tab.replace(/ies$/, 'y').replace(/s$/, '');
};

function ProcurementListView({ items, activeTab, onEdit }: { 
  items: any[], 
  activeTab: string, 
  onEdit: (item: any) => void 
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    const vendor = (item.vendorname || '').toLowerCase();
    const code = (item.itemCode || item.material?.itemCode || item.poNumber || '').toLowerCase();
    const desc = (item.description || item.material?.description || '').toLowerCase();
    const project = (item.project?.name || '').toLowerCase();
    
    return vendor.includes(searchStr) || code.includes(searchStr) || desc.includes(searchStr) || project.includes(searchStr);
  });

  const totalValue = filteredItems.reduce((acc, item) => {
    const value = item.lastKnownCost || item.totalValue || (item.quantityRequired * item.estimatedUnitCost) || 0;
    return acc + value;
  }, 0);

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
        <div className="bg-slate-50 p-6 rounded-full">
          <ShoppingCart size={40} className="text-slate-200" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">No Ledger Entries Found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6"> 
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search ledger..."
            className="w-full h-16 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl pl-16 pr-6 shadow-sm text-sm font-bold transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3 h-16">
          <div className="flex-1 lg:w-48 flex items-center gap-4 px-6 bg-slate-900 border border-slate-900 rounded-2xl shadow-lg shadow-slate-200">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-500/20 rounded-xl">
              <DollarSign size={18} className="text-indigo-400" />
            </div>
            <div className="flex flex-col items-start pr-2">
              <span className="text-[9px] font-black text-indigo-300/60 uppercase tracking-widest leading-none mb-1">Total</span>
              <span className="text-sm font-black text-white whitespace-nowrap tabular-nums">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <button 
            onClick={() => exportToExcel(filteredItems, activeTab)}
            className="flex items-center gap-4 px-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 group transition-all"
          >
            <Layers size={18} className="text-emerald-600" />
            <span className="hidden sm:inline text-xs font-bold text-slate-900">1 Export {filteredItems.length}</span>
          </button>
        </div>
      </div>

      {/* Responsive View Wrapper */}
      <div className="space-y-4">
        {/* DESKTOP TABLE (Hidden on Mobile) */}
        <div className="hidden md:block bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Core Identification</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Logistics</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Valuation</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item) => (
                <DesktopRow key={item.id} item={item} onEdit={onEdit} />
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS (Hidden on Desktop) */}
        <div className="md:hidden space-y-4">
          {filteredItems.map((item) => (
            <MobileCard key={item.id} item={item} onEdit={onEdit} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="p-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">
              No matching ledger entries for {searchTerm}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button className="px-8 h-14 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
           Create {getSingularLabel(activeTab)}
        </button>
      </div>
    </div>
  );
}

// Separate component for the Mobile Card Layout
function MobileCard({ item, onEdit }: { item: any, onEdit: (item: any) => void }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex flex-wrap gap-2">
          <span className="font-mono text-[9px] font-black text-white px-2 py-0.5 bg-indigo-600 rounded shadow-sm uppercase">
            {item.material?.itemCode || item.itemCode || item.poNumber || "NEW"}
          </span>
          {item.category && (
            <span className="text-[9px] font-black text-slate-400 uppercase border border-slate-200 px-1.5 py-0.5 rounded">
              {item.category}
            </span>
          )}
        </div>
        <button 
          onClick={() => onEdit(item)} 
          className="p-3 bg-slate-900 text-white rounded-xl active:scale-90 transition-all shadow-md"
        >
          <ArrowUpRight size={16} strokeWidth={3}/>
        </button>
      </div>

      <div className="space-y-1">
        {item.project?.name && (
          <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <Box size={12} className="text-indigo-400" />
            {item.project.name}
          </p>
        )}
        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
          <span className="text-slate-300 font-medium uppercase mr-1">{item.vendorname ? "FROM:" : "DESC:"}</span>
          <span className="text-slate-900 font-black">
            {item.vendorname || item.description || item.material?.description || 'UNSPECIFIED'}
          </span>
        </p>
      </div>

      <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
             <Clock size={10} />
             {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
           </div>
           <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter
            ${(item.status || '').toLowerCase() === 'completed' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
            {item.status || 'Active'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-400 uppercase block mb-0.5">Value</span>
          <span className="text-lg font-black text-slate-900 tabular-nums">
            ${(item.lastKnownCost || item.totalValue || (item.quantityRequired * item.estimatedUnitCost) || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Extracted Table Row for Desktop
function DesktopRow({ item, onEdit }: { item: any, onEdit: (item: any) => void }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-all group">
      <td className="px-8 py-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
             <span className="font-mono text-[9px] font-black text-white px-2 py-0.5 bg-indigo-600 rounded shadow-sm uppercase">
                {item.material?.itemCode || item.itemCode || item.poNumber || "NEW"}
             </span>
             {item.category && (
                <span className="text-[9px] font-black text-slate-400 uppercase border border-slate-200 px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
             )}
          </div>
          {item.project?.name && (
            <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Box size={12} className="text-indigo-400" />
              {item.project.name}
            </p>
          )}
          <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-xs">
            <span className="text-slate-900 font-black">
              {item.vendorname || item.description || item.material?.description || 'UNSPECIFIED'}
            </span>
          </p>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            REQ: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
          </div>
          {item.fundedAt && (
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded">
              <DollarSign size={10} />
              FUNDED: {new Date(item.fundedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex flex-col items-end gap-1">
          <span className="text-base font-black text-slate-900 tabular-nums">
            ${(item.lastKnownCost || item.totalValue || (item.quantityRequired * item.estimatedUnitCost) || 0).toLocaleString()}
          </span>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm
            ${(item.status || '').toLowerCase() === 'completed' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}
          `}>
            {item.status || 'Active'}
          </span>
        </div>
      </td>
      <td className="px-8 py-6 text-right">
        <button 
          onClick={() => onEdit(item)} 
          className="inline-flex items-center justify-center p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-lg"
        >
          <ArrowUpRight size={18} strokeWidth={3}/>
        </button>
      </td>
    </tr>
  );
}

const exportToExcel = async (filteredData: any[], tabName: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(tabName.toUpperCase());

  // Detect structure: Project vs Activity/Task
  const isProjectStructure = filteredData.length > 0 && 
    ('activities' in filteredData[0] || 'responsibleWorkshop' in filteredData[0]);
   console.log('filteredData',isProjectStructure)
  // 1. Define Columns
  if (isProjectStructure) {
    worksheet.columns = [
      { header: 'Project ID', key: 'idnt', width: 15 },
      { header: 'Project Name', key: 'name', width: 35 },
      { header: 'Workshop', key: 'workshop', width: 25 },
      { header: 'Manager', key: 'manager', width: 20 },
      { header: 'Budget ($)', key: 'budget', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];
  } else {
    // Activity & Task Expanded Columns
    worksheet.columns = [
      { header: 'Activity/Task Ref', key: 'idnt', width: 20 },
      { header: 'Activity Description', key: 'act_desc', width: 30 },
      { header: 'Task Title', key: 'task_title', width: 35 },
      { header: 'Task Details/Notes', key: 'task_desc', width: 45 },
      { header: 'Assigned To', key: 'assigned', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Est. Hours', key: 'hours', width: 10 },
      { header: 'Allocated Budget ($)', key: 'budget', width: 18 },
      { header: 'Created At', key: 'date', width: 15 },
    ];
  }

  // 2. Data Mapping
  filteredData.forEach(item => {
    if (isProjectStructure) {
      worksheet.addRow({
        idnt: item.id?.substring(0, 8).toUpperCase() || 'N/A',
        name: item.name || 'N/A',
        workshop: item.responsibleWorkshop?.name || 'N/A',
        manager: item.projectManager || 'N/A',
        budget: item.allocatedBudget || 0,
        status: item.status || 'Active',
      });
      console.log('isProjectStructure',isProjectStructure)
    } else {
      // ACTIVITY STRUCTURE: Expand Tasks
      const tasks = item.tasks || [];
      
      if (tasks.length > 0) {
        tasks.forEach((task: any) => {
          worksheet.addRow({
            idnt: task.id?.substring(0, 8).toUpperCase() || item.id?.substring(0, 8).toUpperCase(),
            act_desc: item.description || 'N/A',
            task_title: task.title || 'N/A',
            task_desc: task.description || 'N/A',
            assigned: task.assignedTo || item.supervisor || 'Unassigned',
            status: task.status || 'PENDING',
            hours: task.estimatedHours || 0,
            budget: item.allocatedBudget || 0, // Activity-level budget
            date: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A',
          });
        });
         console.log('tasks',tasks)
      } else {
        // Fallback if Activity has no tasks yet
        worksheet.addRow({
          idnt: item.id?.substring(0, 8).toUpperCase(),
          act_desc: item.description || 'N/A',
          task_title: 'NO TASKS DEFINED',
          assigned: item.supervisor || 'N/A',
          status: item.stage || 'PLANNING',
          budget: item.allocatedBudget || 0,
          date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
        });
      }
    }
  });

  // 3. Styling
  const headerRow = worksheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Number Formatting
  worksheet.getColumn('budget').numFmt = '"$"#,##0.00';
  if (!isProjectStructure) worksheet.getColumn('hours').alignment = { horizontal: 'center' };

  // Zebra Striping
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      });
    }
    // Text Wrapping for long descriptions
    if (rowNumber > 1) {
      row.getCell('task_desc').alignment = { wrapText: true, vertical: 'top' };
      row.getCell('act_desc').alignment = { wrapText: true, vertical: 'top' };
    }
  });

  // 4. Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `NRZ_Detailed_Report_${tabName}.xlsx`);
  
  toast.success(`Exported ${filteredData.length} entries with task details.`);
};

export default ProcurementListView;
// import React, { useState } from 'react';
// import { Search, Layers, ShoppingCart, Box, DollarSign, Clock, ArrowUpRight } from 'lucide-react';
// import { toast } from 'sonner';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// // Helper to handle singular labels for the "Create" button
// const getSingularLabel = (tab: string) => {
//   if (tab === 'mastermaterials') return 'Catalog Item';
//   return tab.replace(/ies$/, 'y').replace(/s$/, '');
// };

// function ProcurementListView({ items, activeTab, onEdit }: { 
//   items: any[], 
//   activeTab: string, 
//   onEdit: (item: any) => void 
// }) {
//   const [searchTerm, setSearchTerm] = useState('');

//   // 1. Filtering Logic
//   const filteredItems = items.filter(item => {
//     const searchStr = searchTerm.toLowerCase();
//     const vendor = (item.vendorname || '').toLowerCase();
//     const code = (item.itemCode || item.material?.itemCode || item.poNumber || '').toLowerCase();
//     const desc = (item.description || item.material?.description || '').toLowerCase();
//     const project = (item.project?.name || '').toLowerCase();
    
//     return vendor.includes(searchStr) || 
//            code.includes(searchStr) || 
//            desc.includes(searchStr) || 
//            project.includes(searchStr);
//   });

//   // 2. Calculation Logic for Total Value
//   const totalValue = filteredItems.reduce((acc, item) => {
//     const value = item.lastKnownCost || 
//                   item.totalValue || 
//                   (item.quantityRequired * item.estimatedUnitCost) || 0;
//     return acc + value;
//   }, 0);

//   // 3. Early return for empty state
//   if (!Array.isArray(items) || items.length === 0) {
//     return (
//       <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
//         <div className="bg-slate-50 p-6 rounded-full">
//           <ShoppingCart size={40} className="text-slate-200" />
//         </div>
//         <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">No Ledger Entries Found</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6"> 
      
//       {/* Header Controls */}
//       <div className="flex flex-col md:flex-row items-stretch gap-4">
        
//         {/* Search Container */}
//         <div className="relative flex-1">
//           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
//           <input 
//             type="text"
//             placeholder="Search ledger by vendor, code, or description..."
//             className="w-full h-16 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl pl-16 pr-6 shadow-sm text-sm font-bold transition-all outline-none placeholder:text-slate-400 placeholder:font-medium"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         {/* Total Valuation Card */}
//         <div className="h-16 flex items-center gap-4 px-6 bg-slate-900 border border-slate-900 rounded-2xl shadow-lg shadow-slate-200 transition-all">
//           <div className="flex items-center justify-center w-10 h-10 bg-indigo-500/20 rounded-xl">
//             <DollarSign size={18} className="text-indigo-400" />
//           </div>
//           <div className="flex flex-col items-start pr-2">
//             <span className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest leading-none mb-1">Total Value</span>
//             <span className="text-sm font-black text-white whitespace-nowrap tabular-nums">
//               ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//             </span>
//           </div>
//         </div>

//         {/* Export Button */}
//         <button 
//           onClick={() => exportToExcel?.(filteredItems, activeTab)}
//           className="h-16 flex items-center gap-4 px-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 hover:border-indigo-200 transition-all group active:scale-[0.98]"
//         >
//           <div className="flex items-center justify-center w-10 h-10 bg-emerald-50 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
//             <Layers size={18} className="text-emerald-600 group-hover:text-white" />
//           </div>
//           <div className="flex flex-col items-start pr-4">
//             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Spreadsheet</span>
//             <span className="text-xs font-bold text-slate-900 whitespace-nowrap">Export {filteredItems.length} Rows</span>
//           </div>
//         </button>
//       </div>

//       {/* Table Section */}
//       <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
//             <thead className="bg-slate-50/80 border-b border-slate-100">
//               <tr>
//                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Core Identification</th>
//                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] hidden md:table-cell">Logistics Timeline</th>
//                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Valuation</th>
//                 <th className="px-8 py-5"></th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {filteredItems.map((item: any) => (
//                 <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
//                   {/* Identification Column */}
//                   <td className="px-8 py-6">
//                     <div className="flex flex-col gap-1.5">
//                       <div className="flex items-center gap-2">
//                          <span className="font-mono text-[9px] font-black text-white px-2 py-0.5 bg-indigo-600 rounded shadow-sm uppercase">
//                             {item.material?.itemCode ? `IC: ${item.material.itemCode}` : 
//                              item.itemCode ? `IC: ${item.itemCode}` : 
//                              item.poNumber ? `PO: ${item.poNumber}` : "NEW"}
//                          </span>
//                          {item.category && (
//                             <span className="text-[9px] font-black text-slate-400 uppercase border border-slate-200 px-1.5 py-0.5 rounded">
//                               {item.category}
//                             </span>
//                          )}
//                       </div>
                      
//                       {item.project?.name && (
//                         <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
//                           <Box size={12} className="text-indigo-400" />
//                           {item.project.name}
//                         </p>
//                       )}
                      
//                       <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-xs">
//                         <span className="text-slate-300 font-medium uppercase mr-1">
//                           {item.vendorname ? "FROM:" : "DESC:"}
//                         </span>
//                         <span className="text-slate-900 font-black">
//                           {item.vendorname || item.description || item.material?.description || 'UNSPECIFIED'}
//                         </span>
//                       </p>
//                     </div>
//                   </td>

//                   {/* Logistics Timeline */}
//                   <td className="px-8 py-6 hidden md:table-cell">
//                     <div className="flex flex-col gap-2">
//                       <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
//                         <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
//                         REQ: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
//                       </div>
//                       {item.fundedAt && (
//                         <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded">
//                           <DollarSign size={10} />
//                           FUNDED: {new Date(item.fundedAt).toLocaleDateString()}
//                         </div>
//                       )}
//                       {item.lastOrderedDate && (
//                         <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
//                           <Clock size={10} />
//                           HISTORY: {item.lastOrderedDate}
//                         </div>
//                       )}
//                     </div>
//                   </td>

//                   {/* Valuation */}
//                   <td className="px-8 py-6">
//                     <div className="flex flex-col items-end gap-1">
//                       <span className="text-base font-black text-slate-900 tabular-nums">
//                         ${(item.lastKnownCost || item.totalValue || (item.quantityRequired * item.estimatedUnitCost) || 0).toLocaleString()}
//                       </span>
//                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm
//                         ${(item.status || '').toLowerCase() === 'completed' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}
//                       `}>
//                         {item.poLineItem?.purchaseOrder?.status || item.status || 'Active'}
//                       </span>
//                     </div>
//                   </td>

//                   {/* Actions */}
//                   <td className="px-8 py-6 text-right">
//                     <button 
//                       onClick={() => onEdit(item)} 
//                       className="inline-flex items-center justify-center p-3.5 bg-gray-300 text-white rounded-2xl hover:bg-gray-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200"
//                     >
//                       <ArrowUpRight size={18} strokeWidth={3}/>
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
        
//         {/* Search Empty State */}
//         {filteredItems.length === 0 && (
//           <div className="p-20 text-center">
//             <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">
//               No matching ledger entries for {searchTerm}
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Floating Create Button Example using the Singular Logic */}
//       <div className="flex justify-end pt-4">
//         <button className="px-8 h-14 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
//            Create {getSingularLabel(activeTab)}
//         </button>
//       </div>
//     </div>
//   );
// }

// export default ProcurementListView;


// const exportToExcel = async (filteredData: any[], tabName: string) => {
//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet(tabName.toUpperCase());

//   const isPO = tabName === 'purchaseorders';
  
//   // 1. Define Columns
//   worksheet.columns = [
//     { header: 'PO / Ref ID', key: 'idnt', width: 20 },
//     { header: 'Project', key: 'project', width: 25 },
//     { header: 'Vendor', key: 'vendor', width: 30 },
//     ...(isPO ? [
//       { header: 'Material Code', key: 'li_code', width: 15 },
//       { header: 'Line Description', key: 'li_desc', width: 35 },
//       { header: 'Qty Ordered', key: 'li_qty', width: 12 },
//       { header: 'Unit Price ($)', key: 'li_unit', width: 15 },
//     ] : []),
//     { header: 'Total Line Value ($)', key: 'value', width: 18 },
//     { header: 'Status', key: 'status', width: 15 },
//     { header: 'Date Created', key: 'created', width: 15 },
//   ];

//   // 2. Map Data
//   filteredData.forEach(item => {
//     const baseData = {
//       idnt: item.poNumber || item.itemCode || 'N/A',
//       project: item.project?.name || 'N/A',
//       vendor: item.vendorname || 'N/A',
//       status: item.status || 'Active',
//       created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
//     };

//     // PO Logic: Drill into lineItems -> materialRequirement
//     if (isPO && item.lineItems?.length > 0) {
//       item.lineItems.forEach((li: any) => {
//         // Accessing the specific requirement object you mentioned
//         const req = li.materialRequirement || {};
        
//         worksheet.addRow({
//           ...baseData,
//           li_code: li.itemCode || 'N/A',
//           li_desc: li.description || 'N/A',
//           li_qty: req.quantityOrdered || 0,
//           li_unit: req.unitPrice || 0,
//           value: req.totalPrice || ((req.quantityOrdered || 0) * (req.unitPrice || 0))
//         });
//       });
//     } else {
//       // Logic for Material Catalog or BoQ Tabs
//       worksheet.addRow({
//         ...baseData,
//         vendor: item.vendorname || item.description || item.material?.description || 'N/A',
//         value: (item.totalValue || item.lastKnownCost || 0),
//       });
//     }
//   });

//   // 3. Header Styling
//   worksheet.getRow(1).eachCell((cell) => {
//     cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
//     cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
//     cell.alignment = { horizontal: 'center' };
//   });

//   // 4. Save File
//   const buffer = await workbook.xlsx.writeBuffer();
//   const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//   saveAs(blob, `NRZ_Procurement_${tabName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  
//   toast.success(`Exported ${filteredData.length} records including material requirements.`);
// };

