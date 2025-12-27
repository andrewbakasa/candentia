

// export default ProcurementListView;
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, 
    Layers, 
    ShoppingCart, 
    Box, 
    DollarSign, 
    Clock, 
    ArrowUpRight, 
    Filter,
    ChevronDown
} from 'lucide-react';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
// --- SEARCH CONFIGURATION (Guideline 1 of 2025) ---
// Defining attributes for Feasibility, Strategy, and Financial Performance
export const searchableFields = {
    vendorname: { label: 'Vendor/Partner', type: 'string' },
    itemCode: { label: 'Item/Asset Code', type: 'string' },
    description: { label: 'Description', type: 'string' },
    projectName: { label: 'Project/Model Name', type: 'string' },
    category: { label: 'Strategic Category', type: 'string' },
    status: { label: 'Execution Status', type: 'string' },
};

export type SearchableFieldKey = keyof typeof searchableFields;


// Default search behaviors defined by Tab Context
const TAB_DEFAULTS: Record<string, SearchableFieldKey[]> = {
    mastermaterials: ['itemCode', 'description', 'category'], // Catalogue
    purchaseorders: ['vendorname', 'itemCode', 'status'],      // POs
    boq: ['projectName', 'description', 'category'],          // BOQ
    default: ['projectName', 'description', 'vendorname']
};

const SearchFieldSelector = ({ 
    activeFields, 
    onFieldsChange 
}: { 
    activeFields: SearchableFieldKey[], 
    onFieldsChange: (fields: SearchableFieldKey[]) => void 
}) => {
    return (
        <div className="flex flex-wrap gap-2">
            {(Object.keys(searchableFields) as SearchableFieldKey[]).map((key) => {
                const isActive = activeFields.includes(key as SearchableFieldKey);
                return (
                    <button
                        key={key}
                        onClick={() => {
                            const next = isActive 
                                ? activeFields.filter(f => f !== key) 
                                : [...activeFields, key as SearchableFieldKey];
                            onFieldsChange(next);
                        }}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                             isActive 
                                ? 'bg-yellow-400 border-indigo-600 text-white shadow-md' 
                                : 'bg-white border-slate-200 text-slate-400 hover:border-yellow-300'
                        }`}
                    >
                        {searchableFields[key as SearchableFieldKey].label}
                    </button>
                );
            })}
        </div>
    );
};

// --- MAIN VIEW ---
const ProcurementListView = ({ items = [], activeTab, onEdit }: { 
    items: any[], 
    activeTab: string, 
    onEdit: (item: any) => void 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
   
     const [activeSearchFields, setActiveSearchFields] = useState<SearchableFieldKey[]>([]);

      // Sync search targets when tab changes
    useEffect(() => {
        const defaults = TAB_DEFAULTS[activeTab] || TAB_DEFAULTS.default;
        setActiveSearchFields(defaults);
        setSearchTerm(''); 
    }, [activeTab]);


    // Filter Logic Memoized for Performance
    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        const lowSearch = searchTerm.toLowerCase();

        return items.filter(item => {
            return activeSearchFields.some(field => {
                let val = '';
                if (field === 'projectName') val = item.project?.name || '';
                else val = item[field] || item.material?.[field] || '';
                return String(val).toLowerCase().includes(lowSearch);
            });
        });
    }, [items, searchTerm, activeSearchFields]);

    const totalValue = useMemo(() => {
        return filteredItems.reduce((acc, item) => {
            const val = item.lastKnownCost || item.totalValue || (item.quantityRequired * item.estimatedUnitCost) || 0;
            return acc + val;
        }, 0);
    }, [filteredItems]);

    const getSingularLabel = (tab: string) => {
        if (tab === 'mastermaterials') return 'Catalog Item';
        return tab.replace(/ies$/, 'y').replace(/s$/, '');
    };

    return (
        <div className="space-y-6"> 
            {/* SEARCH & FILTERS SECTION */}
            <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                <div className="flex flex-col lg:flex-row items-stretch gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text"
                            placeholder="Search active project attributes..."
                            className="w-full h-16 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl pl-16 pr-6 shadow-sm text-sm font-bold transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 h-16">
                        <div className="flex-1 lg:w-56 flex items-center gap-4 px-6 bg-slate-900 border border-slate-900 rounded-2xl shadow-lg">
                            <div className="flex items-center justify-center w-10 h-10 bg-indigo-500/20 rounded-xl">
                                <DollarSign size={18} className="text-indigo-400" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-[9px] font-black text-indigo-300/60 uppercase tracking-widest leading-none mb-1">Financial Impact</span>
                                <span className="text-sm font-black text-white tabular-nums">
                                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <button 
                             onClick={() => exportToExcel(filteredItems, activeTab)}
                            className="flex items-center gap-4 px-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all"
                        >
                            <Layers size={18} className="text-emerald-600" />
                            <span className="hidden sm:inline text-xs font-bold text-slate-900">Export ({filteredItems.length})</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-fit">
                        <Filter size={14} className="text-indigo-500" />
                        Search Target:
                    </div>
                    <SearchFieldSelector 
                        activeFields={activeSearchFields}
                        onFieldsChange={setActiveSearchFields}
                    />
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="min-h-[400px]">
                {filteredItems.length > 0 ? (
                    <div className="space-y-4">
                        {/* DESKTOP TABLE */}
                        <div className="hidden md:block bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Identification & Strategy</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Timeline</th>
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

                        {/* MOBILE CARDS */}
                        <div className="md:hidden space-y-4">
                            {filteredItems.map((item) => (
                                <MobileCard key={item.id} item={item} onEdit={onEdit} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <EmptyState searchTerm={searchTerm} />
                )}
            </div>

            {/* ACTION FOOTER */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Guideline Ref: 1 of 2025 | Standardized View</p>
                <button className="px-8 h-14 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">
                    Create {getSingularLabel(activeTab)}
                </button>
            </div>
        </div>
    );
};

// --- SUPPORTING UI COMPONENTS ---

const DesktopRow = ({ item, onEdit }: { item: any, onEdit: (item: any) => void }) => (
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
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-xs line-clamp-1">
                    {item.vendorname || item.description || item.material?.description || 'UNSPECIFIED'}
                </p>
            </div>
        </td>
        <td className="px-8 py-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
                    <Clock size={12} className="text-slate-300" />
                    REQ: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                </div>
                {item.fundedAt && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded">
                        <DollarSign size={10} />
                        FUNDED
                    </div>
                )}
            </div>
        </td>
        <td className="px-8 py-6">
            <div className="flex flex-col items-end gap-1">
                <span className="text-base font-black text-slate-900 tabular-nums">
                    ${(item.lastKnownCost || item.totalValue || (item.quantityRequired * item.estimatedUnitCost) || 0).toLocaleString()}
                </span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter
                    ${(item.status || '').toLowerCase() === 'completed' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}
                `}>
                    {item.poLineItem?.purchaseOrder?.status|| item.status || 'Active'}
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

const MobileCard = ({ item, onEdit }: { item: any, onEdit: (item: any) => void }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-start">
            <div className="flex flex-wrap gap-2">
                {/* <span className="font-mono text-[9px] font-black text-white px-2 py-0.5 bg-indigo-600 rounded">
                    {item.material?.itemCode || item.itemCode || "N/A"}
                </span> */}
                  <span className="font-mono text-[9px] font-black text-white px-2 py-0.5 bg-indigo-600 rounded shadow-sm uppercase">
                        {item.material?.itemCode || item.itemCode || item.poNumber || "NEW"}
                    </span>
                    {item.category && (
                        <span className="text-[9px] font-black text-slate-400 uppercase border border-slate-200 px-1.5 py-0.5 rounded">
                            {item.category}
                        </span>
                    )}
            </div>
            <button onClick={() => onEdit(item)} className="p-3 bg-slate-900 text-white rounded-xl shadow-md">
                <ArrowUpRight size={16} strokeWidth={3}/>
            </button>
        </div>
        <div className="space-y-1">
           {item.project?.name && ( <p className="text-xs font-black text-slate-900">{item.project?.name }</p>)}
            <p className="text-[11px] text-slate-500 font-bold"> {item.vendorname || item.description || item.material?.description || 'UNSPECIFIED'}</p>
        </div>
        <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
            <span className="text-lg font-black text-slate-900">
                {/* ${(item.lastKnownCost || 0).toLocaleString()} */}
                ${(item.lastKnownCost || item.totalValue || (item.quantityRequired * item.estimatedUnitCost) || 0).toLocaleString()}
            </span>
            <span className="text-[9px] font-black text-slate-400 uppercase">{item.poLineItem?.purchaseOrder?.status||item.status || 'Active'}</span>
        </div>
    </div>
);

const EmptyState = ({ searchTerm }: { searchTerm: string }) => (
    <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
        <div className="bg-slate-50 p-6 rounded-full">
            <ShoppingCart size={40} className="text-slate-200" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {searchTerm ? `No results for "${searchTerm}"` : 'No Ledger Entries Found'}
        </p>
    </div>
);

export default ProcurementListView;



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