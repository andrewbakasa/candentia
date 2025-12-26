'use client';
import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, Plus, Package, Edit2, Trash2, 
  ChevronRight, Search, X
} from 'lucide-react';

interface ProcurementPortfolioProps {
  project: any;
  onAddBoQ: (projectId: string) => void;
  onIssuePO: (projectId: string) => void;
  onEditRecord: (record: any, type: 'boq' | 'po') => void;
  onDeleteRecord: (id: string, type: 'materials' | 'pos') => void;
}

const ProcurementPortfolio: React.FC<ProcurementPortfolioProps> = ({
  project,
  onAddBoQ,
  onIssuePO,
  onEditRecord,
  onDeleteRecord
}) => {
  const [procurementTab, setProcurementTab] = useState<'materials' | 'pos'>('materials');
  const [expandedPOs, setExpandedPOs] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- SEARCH LOGIC: MATERIAL BoQ ---
  const filteredMaterials = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return project.materialRequirements || [];
    return project.materialRequirements?.filter((mat: any) => 
      mat.material?.description?.toLowerCase().includes(term) ||
      mat.material?.itemCode?.toLowerCase().includes(term)
    );
  }, [project.materialRequirements, searchTerm]);

  // --- SEARCH LOGIC: PO REGISTRY (Preservation Rule) ---
  const filteredPOs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return project.purchaseOrders || [];
    
    return project.purchaseOrders?.filter((po: any) => {
      const poMatch = po.poNumber?.toLowerCase().includes(term) || 
                      po.vendorname?.toLowerCase().includes(term);
      const lineItemMatch = po.lineItems?.some((item: any) => 
        item.description?.toLowerCase().includes(term) || 
        item.itemCode?.toLowerCase().includes(term)
      );
      return poMatch || lineItemMatch;
    });
  }, [project.purchaseOrders, searchTerm]);

  const togglePO = (id: string) => {
    setExpandedPOs(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-10">
      {/* HEADER SECTION */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShoppingCart size={18} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                4. Procurement Portfolio
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic leading-none mt-1">
                ERP Transaction Layer
              </p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setProcurementTab('materials')}
                className={`px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all ${
                  procurementTab === 'materials' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Material BoQ
              </button>
              <button 
                onClick={() => setProcurementTab('pos')}
                className={`px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all ${
                  procurementTab === 'pos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                PO Registry
              </button>
            </div>
          </div>
        </div>

        {/* INTEGRATED SEARCH BAR */}
        <div className="flex-1 max-w-md relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <Search size={16} />
          </div>
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={procurementTab === 'materials' ? "Search materials or codes..." : "Search POs, Vendors, or items..."}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-10 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <button 
            onClick={() => onAddBoQ(project.id)} 
            className="flex-1 lg:flex-none justify-center p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Plus size={14} className="text-indigo-600" /> <span>Add BoQ</span>
          </button>
          <button 
            onClick={() => onIssuePO(project.id)} 
            className="flex-1 lg:flex-none justify-center p-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"
          >
            <Package size={14} /> <span>Issue PO</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {procurementTab === 'materials' ? (
          <MaterialView 
            materials={filteredMaterials} 
            searchTerm={searchTerm}
            onEdit={(mat: any) => onEditRecord(mat, 'boq')}
            onDelete={(id: string) => onDeleteRecord(id, 'materials')}
          />
        ) : (
          <PurchaseOrderView 
            purchaseOrders={filteredPOs}
            searchTerm={searchTerm}
            expandedPOs={expandedPOs}
            togglePO={togglePO}
            onEdit={(po: any) => onEditRecord(po, 'po')}
            onDelete={(id: string) => onDeleteRecord(id, 'pos')}
          />
        )}
      </div>
    </section>
  );
};

// --- UPDATED SUB-COMPONENTS ---

const MaterialView = ({ materials, searchTerm, onEdit, onDelete }: any) => (
  <>
    {materials?.length === 0 && <EmptySearchState />}
    <div className="lg:hidden divide-y divide-slate-100">
      {materials?.map((mat: any) => (
        <div key={mat.id} className="p-4 bg-white space-y-3">
          <div className="flex justify-between items-start">
            <div className="max-w-[70%]">
              <p className={`text-sm font-black leading-tight ${searchTerm && mat.material?.description.toLowerCase().includes(searchTerm.toLowerCase()) ? 'text-indigo-600' : 'text-slate-900'}`}>
                {mat.material?.description}
              </p>
              <p className="text-[10px] font-mono text-indigo-500 mt-1">{mat.material?.itemCode}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(mat)} className="p-2 bg-slate-50 text-slate-400 rounded-lg"><Edit2 size={14}/></button>
              <button onClick={() => onDelete(mat.id)} className="p-2 bg-rose-50 text-rose-500 rounded-lg"><Trash2 size={14}/></button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl">
            <Stat label="Qty" value={`${mat.quantityRequired} ${mat.material?.unitOfMeasure}`} />
            <Stat label="Est. Unit" value={`$${mat.estimatedUnitCost?.toLocaleString()}`} />
            <Stat label="Total" value={`$${(mat.quantityRequired * (mat.estimatedUnitCost || 0)).toLocaleString()}`} highlight />
          </div>
        </div>
      ))}
    </div>

    <table className="hidden lg:table w-full text-left">
      <thead className="bg-slate-50 border-b border-slate-100">
        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <th className="px-8 py-4">Item Description</th>
          <th className="px-4 py-4">Quantity</th>
          <th className="px-4 py-4">Est. Cost</th>
          <th className="px-4 py-4">Total</th>
          <th className="px-8 py-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {materials?.map((mat: any) => {
          const isMatch = searchTerm && mat.material?.description.toLowerCase().includes(searchTerm.toLowerCase());
          return (
            <tr key={mat.id} className={`hover:bg-slate-50/50 transition-colors text-sm ${isMatch ? 'bg-indigo-50/10' : ''}`}>
              <td className="px-8 py-4 font-bold">
                <span className={isMatch ? 'text-indigo-600' : 'text-slate-700'}>{mat.material?.description}</span>
                <span className="text-[10px] font-mono text-slate-400 ml-2">{mat.material?.itemCode}</span>
              </td>
              <td className="px-4 py-4 text-slate-600 font-medium">{mat.quantityRequired} {mat.material?.unitOfMeasure}</td>
              <td className="px-4 py-4 text-slate-600 font-medium">${mat.estimatedUnitCost?.toLocaleString()}</td>
              <td className="px-4 py-4 font-black text-indigo-600">${(mat.quantityRequired * (mat.estimatedUnitCost || 0)).toLocaleString()}</td>
              <td className="px-8 py-4 text-right space-x-2">
                <button onClick={() => onEdit(mat)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={14}/></button>
                <button onClick={() => onDelete(mat.id)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </>
);

const PurchaseOrderView = ({ purchaseOrders, searchTerm, expandedPOs, togglePO, onEdit, onDelete }: any) => {
  // Auto-expand if we are searching and there is a match inside
  const effectiveExpanded = useMemo(() => {
    if (!searchTerm) return expandedPOs;
    return purchaseOrders.map((po: any) => po.id);
  }, [searchTerm, purchaseOrders, expandedPOs]);

  return (
    <>
      {purchaseOrders?.length === 0 && <EmptySearchState />}
      <div className="lg:hidden divide-y divide-slate-100">
        {purchaseOrders?.map((po: any) => (
          <div key={po.id} className="p-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase">{po.poNumber}</p>
                <h3 className="font-bold text-slate-900">{po.vendorname}</h3>
              </div>
              <StatusBadge status={po.status} />
            </div>
            <div className="flex justify-between items-end">
              <Stat label="Commitment Value" value={`$${po.totalValue?.toLocaleString()}`} valueClass="text-lg text-emerald-600" />
              <div className="flex gap-2">
                <button onClick={() => togglePO(po.id)} className="p-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold px-3">
                  {effectiveExpanded.includes(po.id) ? 'Hide Items' : 'Show Items'}
                </button>
                <button onClick={() => onEdit(po)} className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Edit2 size={14}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <table className="hidden lg:table w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <th className="px-8 py-4">PO Number</th>
            <th className="px-4 py-4">Vendor</th>
            <th className="px-4 py-4">Items</th>
            <th className="px-4 py-4">Total Value</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-8 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {purchaseOrders?.map((po: any) => {
            const isExpanded = effectiveExpanded.includes(po.id);
            const isPoMatch = searchTerm && (po.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || po.vendorname?.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return (
              <React.Fragment key={po.id}>
                <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
                  <td className={`px-8 py-4 font-black ${isPoMatch ? 'text-indigo-600' : 'text-slate-900'}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => togglePO(po.id)} className="p-1 hover:bg-slate-200 rounded-md text-indigo-600 transition-colors">
                        <ChevronRight size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      {po.poNumber}
                    </div>
                  </td>
                  <td className={`px-4 py-4 font-medium ${isPoMatch ? 'text-indigo-600' : 'text-slate-600'}`}>{po.vendorname}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                      {po.lineItems?.length || 0} Items
                    </span>
                  </td>
                  <td className="px-4 py-4 font-black text-emerald-600">${po.totalValue?.toLocaleString()}</td>
                  <td className="px-4 py-4"><StatusBadge status={po.status} /></td>
                  <td className="px-8 py-4 text-right space-x-2">
                    <button onClick={() => onEdit(po)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={14}/></button>
                    <button onClick={() => onDelete(po.id)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
                  </td>
                </tr>
                {isExpanded && <ExpandedLineItems items={po.lineItems} searchTerm={searchTerm} />}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

// --- HELPER COMPONENTS ---

const EmptySearchState = () => (
  <div className="p-12 text-center">
    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
      <Search className="text-slate-300" size={24} />
    </div>
    <p className="text-xs font-black text-slate-900 uppercase">No Matches Found</p>
    <p className="text-[10px] text-slate-400 font-bold mt-1">Try adjusting your search or filters</p>
  </div>
);

const Stat = ({ label, value, highlight = false, valueClass = "" }: any) => (
  <div className={label === 'Total' ? 'text-right' : ''}>
    <p className={`text-[8px] font-black uppercase ${highlight ? 'text-indigo-400' : 'text-slate-400'}`}>{label}</p>
    <p className={valueClass || `text-xs font-bold ${highlight ? 'text-indigo-600 font-black' : 'text-slate-700'}`}>{value}</p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
    status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
  }`}>
    {status}
  </span>
);

const ExpandedLineItems = ({ items, searchTerm }: any) => (
  <tr className="bg-slate-50/30">
    <td colSpan={6} className="px-12 py-4">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
            <tr className="uppercase font-bold tracking-widest">
              <th className="px-4 py-3">Item Code</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Total Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items?.map((item: any) => {
              const itemMatch = searchTerm && (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()));
              return (
                <tr key={item.id} className={`hover:bg-slate-50/50 ${itemMatch ? 'bg-indigo-50/30' : ''}`}>
                  <td className={`px-4 py-2.5 font-mono ${itemMatch ? 'text-indigo-600 font-bold' : 'text-indigo-400'}`}>{item.itemCode}</td>
                  <td className={`px-4 py-2.5 ${itemMatch ? 'text-indigo-600 font-black' : 'text-slate-600'}`}>{item.description}</td>
                  <td className="px-4 py-2.5 text-right font-black text-slate-900">${item.totalPrice?.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </td>
  </tr>
);

export default ProcurementPortfolio;
// import React, { useState } from 'react';
// import { 
//   ShoppingCart, Plus, Package, Edit2, Trash2, 
//   ChevronRight, Search 
// } from 'lucide-react';

// interface ProcurementPortfolioProps {
//   project: any;
//   onAddBoQ: (projectId: string) => void;
//   onIssuePO: (projectId: string) => void;
//   onEditRecord: (record: any, type: 'boq' | 'po') => void;
//   onDeleteRecord: (id: string, type: 'materials' | 'pos') => void;
// }

// const ProcurementPortfolio: React.FC<ProcurementPortfolioProps> = ({
//   project,
//   onAddBoQ,
//   onIssuePO,
//   onEditRecord,
//   onDeleteRecord
// }) => {
//   const [procurementTab, setProcurementTab] = useState<'materials' | 'pos'>('materials');
//   const [expandedPOs, setExpandedPOs] = useState<string[]>([]);

//   const togglePO = (id: string) => {
//     setExpandedPOs(prev => 
//       prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
//     );
//   };

//   return (
//     <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-10">
//       {/* HEADER SECTION */}
//       <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
//             <ShoppingCart size={18} />
//           </div>
//           <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
//             <div>
//               <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
//                 4. Procurement Portfolio
//               </h2>
//               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
//                 ERP Transaction Layer
//               </p>
//             </div>
            
//             {/* TAB SWITCHER */}
//             <div className="flex bg-slate-100 p-1 rounded-xl">
//               <button 
//                 onClick={() => setProcurementTab('materials')}
//                 className={`px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all ${
//                   procurementTab === 'materials' 
//                     ? 'bg-white text-indigo-600 shadow-sm' 
//                     : 'text-slate-400 hover:text-slate-600'
//                 }`}
//               >
//                 Material BoQ
//               </button>
//               <button 
//                 onClick={() => setProcurementTab('pos')}
//                 className={`px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all ${
//                   procurementTab === 'pos' 
//                     ? 'bg-white text-indigo-600 shadow-sm' 
//                     : 'text-slate-400 hover:text-slate-600'
//                 }`}
//               >
//                 PO Registry
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* ACTION BUTTONS */}
//         <div className="flex items-center gap-2 w-full lg:w-auto">
//           <button 
//             onClick={() => onAddBoQ(project.id)} 
//             className="flex-1 lg:flex-none justify-center p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-50 transition-colors"
//           >
//             <Plus size={14} className="text-indigo-600" /> 
//             <span className="sm:inline">Add BoQ</span>
//           </button>
//           <button 
//             onClick={() => onIssuePO(project.id)} 
//             className="flex-1 lg:flex-none justify-center p-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"
//           >
//             <Package size={14} /> 
//             <span className="sm:inline">Issue PO</span>
//           </button>
//         </div>
//       </div>

//       <div className="overflow-x-auto">
//         {procurementTab === 'materials' ? (
//           <MaterialView 
//             materials={project.materialRequirements} 
//             onEdit={(mat: any) => onEditRecord(mat, 'boq')}
//             onDelete={(id: string) => onDeleteRecord(id, 'materials')}
//           />
//         ) : (
//           <PurchaseOrderView 
//             purchaseOrders={project.purchaseOrders}
//             expandedPOs={expandedPOs}
//             togglePO={togglePO}
//             onEdit={(po: any) => onEditRecord(po, 'po')}
//             onDelete={(id: string) => onDeleteRecord(id, 'pos')}
//           />
//         )}
//       </div>
//     </section>
//   );
// };

// // --- SUB-COMPONENTS FOR CLEANER CODE ---

// const MaterialView = ({ materials, onEdit, onDelete }: any) => (
//   <>
//     {/* MOBILE LIST */}
//     <div className="lg:hidden divide-y divide-slate-100">
//       {materials?.map((mat: any) => (
//         <div key={mat.id} className="p-4 bg-white space-y-3">
//           <div className="flex justify-between items-start">
//             <div className="max-w-[70%]">
//               <p className="text-sm font-black text-slate-900 leading-tight">{mat.material?.description}</p>
//               <p className="text-[10px] font-mono text-indigo-500 mt-1">{mat.material?.itemCode}</p>
//             </div>
//             <div className="flex gap-1">
//               <button onClick={() => onEdit(mat)} className="p-2 bg-slate-50 text-slate-400 rounded-lg"><Edit2 size={14}/></button>
//               <button onClick={() => onDelete(mat.id)} className="p-2 bg-rose-50 text-rose-500 rounded-lg"><Trash2 size={14}/></button>
//             </div>
//           </div>
//           <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl">
//             <Stat label="Qty" value={`${mat.quantityRequired} ${mat.material?.unitOfMeasure}`} />
//             <Stat label="Est. Unit" value={`$${mat.estimatedUnitCost?.toLocaleString()}`} />
//             <Stat label="Total" value={`$${(mat.quantityRequired * (mat.estimatedUnitCost || 0)).toLocaleString()}`} highlight />
//           </div>
//         </div>
//       ))}
//     </div>

//     {/* DESKTOP TABLE */}
//     <table className="hidden lg:table w-full text-left">
//       <thead className="bg-slate-50 border-b border-slate-100">
//         <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//           <th className="px-8 py-4">Item Description</th>
//           <th className="px-4 py-4">Quantity</th>
//           <th className="px-4 py-4">Est. Cost</th>
//           <th className="px-4 py-4">Total</th>
//           <th className="px-8 py-4 text-right">Actions</th>
//         </tr>
//       </thead>
//       <tbody className="divide-y divide-slate-100 bg-white">
//         {materials?.map((mat: any) => (
//           <tr key={mat.id} className="hover:bg-slate-50/50 transition-colors text-sm">
//             <td className="px-8 py-4 font-bold text-slate-700">
//               {mat.material?.description} 
//               <span className="text-[10px] font-mono text-slate-400 ml-2">{mat.material?.itemCode}</span>
//             </td>
//             <td className="px-4 py-4 text-slate-600 font-medium">{mat.quantityRequired} {mat.material?.unitOfMeasure}</td>
//             <td className="px-4 py-4 text-slate-600 font-medium">${mat.estimatedUnitCost?.toLocaleString()}</td>
//             <td className="px-4 py-4 font-black text-indigo-600">${(mat.quantityRequired * (mat.estimatedUnitCost || 0)).toLocaleString()}</td>
//             <td className="px-8 py-4 text-right space-x-2">
//               <button onClick={() => onEdit(mat)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={14}/></button>
//               <button onClick={() => onDelete(mat.id)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   </>
// );

// const PurchaseOrderView = ({ purchaseOrders, expandedPOs, togglePO, onEdit, onDelete }: any) => (
//   <>
//     {/* PO MOBILE */}
//     <div className="lg:hidden divide-y divide-slate-100">
//       {purchaseOrders?.map((po: any) => (
//         <div key={po.id} className="p-4 bg-white">
//           <div className="flex justify-between items-center mb-3">
//             <div>
//               <p className="text-[10px] font-black text-indigo-600 uppercase">{po.poNumber}</p>
//               <h3 className="font-bold text-slate-900">{po.vendorname}</h3>
//             </div>
//             <StatusBadge status={po.status} />
//           </div>
//           <div className="flex justify-between items-end">
//             <Stat label="Commitment Value" value={`$${po.totalValue?.toLocaleString()}`} valueClass="text-lg text-emerald-600" />
//             <div className="flex gap-2">
//               <button onClick={() => togglePO(po.id)} className="p-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold px-3">
//                 {expandedPOs.includes(po.id) ? 'Hide Items' : 'Show Items'}
//               </button>
//               <button onClick={() => onEdit(po)} className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Edit2 size={14}/></button>
//             </div>
//           </div>
//           {expandedPOs.includes(po.id) && (
//             <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2 duration-200">
//               {po.lineItems?.map((item: any) => (
//                 <div key={item.id} className="flex justify-between text-[11px] bg-slate-50 p-2 rounded-lg">
//                   <span className="text-slate-600">{item.description}</span>
//                   <span className="font-black text-slate-900">${item.totalPrice?.toLocaleString()}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       ))}
//     </div>

//     {/* PO DESKTOP */}
//     <table className="hidden lg:table w-full text-left">
//       {/* ... Table Head (similar to your original code) ... */}
//       <tbody className="divide-y divide-slate-100 bg-white">
//         {purchaseOrders?.map((po: any) => {
//           const isExpanded = expandedPOs.includes(po.id);
//           return (
//             <React.Fragment key={po.id}>
//               <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
//                 <td className="px-8 py-4 font-black text-slate-900">
//                   <div className="flex items-center gap-3">
//                     <button onClick={() => togglePO(po.id)} className="p-1 hover:bg-slate-200 rounded-md text-indigo-600 transition-colors">
//                       <ChevronRight size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
//                     </button>
//                     {po.poNumber}
//                   </div>
//                 </td>
//                 <td className="px-4 py-4 text-slate-600 font-medium">{po.vendorname}</td>
//                 <td className="px-4 py-4">
//                   <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-tighter">
//                     {po.lineItems?.length || 0} Items
//                   </span>
//                 </td>
//                 <td className="px-4 py-4 font-black text-emerald-600">${po.totalValue?.toLocaleString()}</td>
//                 <td className="px-4 py-4"><StatusBadge status={po.status} /></td>
//                 <td className="px-8 py-4 text-right space-x-2">
//                   <button onClick={() => onEdit(po)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={14}/></button>
//                   <button onClick={() => onDelete(po.id)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
//                 </td>
//               </tr>
//               {isExpanded && <ExpandedLineItems items={po.lineItems} />}
//             </React.Fragment>
//           );
//         })}
//       </tbody>
//     </table>
//   </>
// );

// // --- HELPER UI COMPONENTS ---

// const Stat = ({ label, value, highlight = false, valueClass = "" }: any) => (
//   <div className={label === 'Total' ? 'text-right' : ''}>
//     <p className={`text-[8px] font-black uppercase ${highlight ? 'text-indigo-400' : 'text-slate-400'}`}>{label}</p>
//     <p className={valueClass || `text-xs font-bold ${highlight ? 'text-indigo-600 font-black' : 'text-slate-700'}`}>{value}</p>
//   </div>
// );

// const StatusBadge = ({ status }: { status: string }) => (
//   <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
//     status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
//   }`}>
//     {status}
//   </span>
// );

// const ExpandedLineItems = ({ items }: any) => (
//   <tr className="bg-slate-50/30">
//     <td colSpan={6} className="px-12 py-4">
//       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
//         <table className="w-full text-left text-[11px]">
//           <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
//             <tr className="uppercase font-bold tracking-widest">
//               <th className="px-4 py-3">Item Code</th>
//               <th className="px-4 py-3">Description</th>
//               <th className="px-4 py-3 text-right">Total Price</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-50">
//             {items?.map((item: any) => (
//               <tr key={item.id} className="hover:bg-slate-50/50">
//                 <td className="px-4 py-2.5 font-mono text-indigo-600">{item.itemCode}</td>
//                 <td className="px-4 py-2.5 text-slate-600">{item.description}</td>
//                 <td className="px-4 py-2.5 text-right font-black text-slate-900">${item.totalPrice?.toLocaleString()}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </td>
//   </tr>
// );

// export default ProcurementPortfolio;