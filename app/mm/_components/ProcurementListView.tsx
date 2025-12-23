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
            <span className="hidden sm:inline text-xs font-bold text-slate-900">Export {filteredItems.length}</span>
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


export default ProcurementListView;



const exportToExcel1 = async (filteredData: any[], tabName: string) => {
  if (!filteredData || filteredData.length === 0) {
    toast.error("No data to export");
    return;
  }
 console.log("tabName",tabName,filteredData)
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(tabName.toUpperCase());

  const isPO = tabName === 'purchaseorders';
  const isMasterMaterials = tabName === 'mastermaterials';

  // 1. Define Columns Dynamically
  let columns: any[] = [];

  if (isMasterMaterials) {
    columns = [
      { header: 'Item Code', key: 'code', width: 15 },
      { header: 'Description', key: 'desc', width: 40 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'UOM', key: 'uom', width: 10 },
      { header: 'Last Known Cost ($)', key: 'cost', width: 18 },
      { header: 'Total Req. Count', key: 'req_count', width: 15 },
      { header: 'Date Added', key: 'created', width: 15 },
    ];
  } else {
    columns = [
      { header: 'PO / Ref ID', key: 'idnt', width: 20 },
      { header: 'Project', key: 'project', width: 25 },
      { header: 'Vendor', key: 'vendor', width: 30 },
      ...(isPO ? [
        { header: 'Material Code', key: 'li_code', width: 15 },
        { header: 'Line Description', key: 'li_desc', width: 35 },
        { header: 'Qty Ordered', key: 'li_qty', width: 12 },
        { header: 'Unit Price ($)', key: 'li_unit', width: 15 },
      ] : []),
      { header: 'Total Value ($)', key: 'value', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date Created', key: 'created', width: 15 },
    ];
  }
  worksheet.columns = columns;

  // 2. Map Data & Fix ts(2362)
  filteredData.forEach(item => {
    if (isMasterMaterials) {
      worksheet.addRow({
        code: item.itemCode,
        desc: item.description,
        category: item.category,
        uom: item.unitOfMeasure,
        cost: Number(item.lastKnownCost) || 0, // Force Number to avoid ts error
        req_count: item._count?.requirements || 0,
        created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
      });
    } else if (isPO && item.lineItems?.length > 0) {
      item.lineItems.forEach((li: any) => {
        // SOLUTION for ts(2362): Cast to Number before arithmetic
        const qtyOrdered = Number(li.quantityOrdered) || 0;
        const unitPrice = Number(li.unitPrice) || 0;
        const totalPrice = Number(li.totalPrice) || (qtyOrdered * unitPrice);

        worksheet.addRow({
          idnt: item.poNumber || 'N/A',
          project: item.project?.name || 'N/A',
          vendor: item.vendorname || 'N/A',
          li_code: li.itemCode || 'N/A',
          li_desc: li.description || 'N/A',
          li_qty: qtyOrdered,
          li_unit: unitPrice,
          value: totalPrice,
          status: item.status || 'Active',
          created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
        });
      });
    } else {
      worksheet.addRow({
        idnt: item.poNumber || item.itemCode || 'N/A',
        project: item.project?.name || 'N/A',
        vendor: item.vendorname || item.description || 'N/A',
        value: Number(item.totalValue || item.lastKnownCost || 0),
        status: item.status || 'Active',
        created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
      });
    }
  });

  // 3. Header Styling
  const firstRow = worksheet.getRow(1);
  firstRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center' };
  });

  // 4. Formatting Cells
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip Header

    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      // Identify column by header name to apply Currency format
      const column = worksheet.getColumn(cell.col);
      const headerText = column.header ? String(column.header) : "";

      if (headerText.includes('($)') && typeof cell.value === 'number') {
        cell.numFmt = '"$"#,##0.00';
      }
    });
  });

  // 5. File Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `NRZ_Procurement_${tabName}_${new Date().getTime()}.xlsx`);
  
  toast.success(`Successfully exported ${tabName} data.`);
};
const exportToExcel = async (filteredData: any[], tabName: string) => {
  if (!filteredData || filteredData.length === 0) {
    toast.error("No data to export");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(tabName.toUpperCase());

  const isPO = tabName === 'purchaseorders';
  const isMasterMaterials = tabName === 'mastermaterials';
  const isMaterials = tabName === 'materials';

  // 1. Define Columns Dynamically
  let columns: any[] = [];

  if (isMasterMaterials) {
    columns = [
      { header: 'Item Code', key: 'code', width: 15 },
      { header: 'Description', key: 'desc', width: 40 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'UOM', key: 'uom', width: 10 },
      { header: 'Last Known Cost ($)', key: 'cost', width: 18 },
      { header: 'Total Req. Count', key: 'req_count', width: 15 },
      { header: 'Date Added', key: 'created', width: 15 },
    ];
  } else if (isMaterials) {
    columns = [
      { header: 'PO Number', key: 'po_no', width: 15 },
      { header: 'Project Name', key: 'project', width: 25 },
      { header: 'Item Code', key: 'code', width: 15 },
      { header: 'Description', key: 'desc', width: 35 },
      { header: 'Qty Required', key: 'qty', width: 12 },
      { header: 'Est. Unit Cost ($)', key: 'unit', width: 15 },
      { header: 'Total Value ($)', key: 'value', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
    ];
  } else {
    columns = [
      { header: 'PO / Ref ID', key: 'idnt', width: 20 },
      { header: 'Project', key: 'project', width: 25 },
      { header: 'Vendor', key: 'vendor', width: 30 },
      ...(isPO ? [
        { header: 'Material Code', key: 'li_code', width: 15 },
        { header: 'Line Description', key: 'li_desc', width: 35 },
        { header: 'Qty Ordered', key: 'li_qty', width: 12 },
        { header: 'Unit Price ($)', key: 'li_unit', width: 15 },
      ] : []),
      { header: 'Total Value ($)', key: 'value', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date Created', key: 'created', width: 15 },
    ];
  }
  worksheet.columns = columns;

  // 2. Map Data
  filteredData.forEach(item => {
    if (isMasterMaterials) {
      worksheet.addRow({
        code: item.itemCode,
        desc: item.description,
        category: item.category,
        uom: item.unitOfMeasure,
        cost: Number(item.lastKnownCost) || 0,
        req_count: item._count?.requirements || 0,
        created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
      });
    } else if (isMaterials) {
      // Mapping the complex nested Material Requirement object
      const qty = Number(item.quantityRequired) || 0;
      const cost = Number(item.estimatedUnitCost) || 0;
      
      worksheet.addRow({
        po_no: item.poLineItem?.purchaseOrder?.poNumber || 'N/A',
        project: item.project?.name || 'N/A',
        code: item.material?.itemCode || 'N/A',
        desc: item.material?.description || 'N/A',
        qty: qty,
        unit: cost,
        value: qty * cost,
        status: item.poLineItem?.purchaseOrder?.status || 'N/A',
      });
    } else if (isPO && item.lineItems?.length > 0) {
      item.lineItems.forEach((li: any) => {
        const qtyOrdered = Number(li.quantityOrdered) || 0;
        const unitPrice = Number(li.unitPrice) || 0;
        const totalPrice = Number(li.totalPrice) || (qtyOrdered * unitPrice);

        worksheet.addRow({
          idnt: item.poNumber || 'N/A',
          project: item.project?.name || 'N/A',
          vendor: item.vendorname || 'N/A',
          li_code: li.itemCode || 'N/A',
          li_desc: li.description || 'N/A',
          li_qty: qtyOrdered,
          li_unit: unitPrice,
          value: totalPrice,
          status: item.status || 'Active',
          created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
        });
      });
    } else {
      worksheet.addRow({
        idnt: item.poNumber || item.itemCode || 'N/A',
        project: item.project?.name || 'N/A',
        vendor: item.vendorname || item.description || 'N/A',
        value: Number(item.totalValue || item.lastKnownCost || 0),
        status: item.status || 'Active',
        created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
      });
    }
  });

  // 3. Header Styling
  const firstRow = worksheet.getRow(1);
  firstRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center' };
  });

  // 4. Formatting Cells (Currency and Alignment)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      const column = worksheet.getColumn(cell.col);
      const headerText = column.header ? String(column.header) : "";

      if (headerText.includes('($)') && typeof cell.value === 'number') {
        cell.numFmt = '"$"#,##0.00';
      }
    });
  });

  // 5. File Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `NRZ_Procurement_${tabName}_${new Date().getTime()}.xlsx`);
  
  toast.success(`Successfully exported ${tabName} data.`);
};