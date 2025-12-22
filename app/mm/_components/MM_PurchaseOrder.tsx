'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, ShieldCheck, Box, AlertCircle, Receipt, Loader2, Trash2, Store, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmAction from './ConfirmAction';

interface Props {
  initialData?: any;
  strategies: any[];
  projects: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function MM_PurchaseOrderForm({ initialData, strategies = [], projects = [], onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 1. Core Form State
  const [vendorName, setVendorName] = useState(initialData?.vendorname || '');
  const [poNumber, setPoNumber] = useState(initialData?.poNumber || '');
  const [selectedProjectId, setSelectedProjectId] = useState(initialData?.projectId || '');
  
  // 2. Preselection Logic (Matches IDs from existing line items)
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>(() => {
    if (!initialData?.lineItems) return [];
    return initialData.lineItems
      .map((li: any) => li.materialRequirementId || li.requirementId)
      .filter(Boolean);
  });

  // 3. Strategy & Project Filtering Logic
  const [selectedStrategyId, setSelectedStrategyId] = useState(() => {
    if (initialData?.project?.planId) return initialData.project.planId;
    const parentProject = projects.find(p => p.id === initialData?.projectId);
    return parentProject?.planId || '';
  });

  const filteredProjects = useMemo(() => {
    if (!selectedStrategyId) return [];
    return projects.filter(p => p.planId === selectedStrategyId);
  }, [selectedStrategyId, projects]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
  [selectedProjectId, projects]);

  const availableMaterials = activeProject?.materialRequirements || [];

  // 4. Calculations for Financial Compliance
  const selectedItems = useMemo(() => 
    availableMaterials.filter((m: any) => selectedReqIds.includes(m.id)),
  [availableMaterials, selectedReqIds]);

  const totalCommitment = useMemo(() => 
    selectedItems.reduce((acc: number, curr: any) => acc + (curr.quantityRequired * curr.estimatedUnitCost), 0),
  [selectedItems]);

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

  // 5. Actions: DELETE (Revoke)
  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/mm/api/purchaseorders/${initialData.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("PO Revoked & Costs Reverted");
        onSuccess();
      } else {
        const d = await res.json();
        setError(d.message || "Failed to revoke PO");
      }
    } catch (err) {
      toast.error("Ledger revert failed");
    } finally {
      setLoading(false);
    }
  };

  // 6. Actions: SUBMIT (POST/PATCH)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStrategy) return setError("STRATEGIC AUTHORIZATION REQUIRED");
    if (!vendorName.trim()) return setError("VENDOR/SUPPLIER NAME REQUIRED");
    if (selectedReqIds.length === 0) return setError("NO MATERIALS SELECTED");
    
    // Budget Ceiling Check (Guideline 1)
    if (totalCommitment > (selectedStrategy.totalBudget || Infinity)) {
      return setError(`EXCEEDS STRATEGIC CEILING: $${selectedStrategy.totalBudget.toLocaleString()}`);
    }
    
    setLoading(true);
    setError('');
    try {
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/mm/api/purchaseorders/${initialData.id}` : '/mm/api/purchaseorders';
      
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poNumber,
          vendorName, 
          projectId: selectedProjectId,
          lineItems: selectedItems.map((item: any) => ({
            requirementId: item.id,
            itemCode: item.itemCode,
            description: item.description,
            quantity: item.quantityRequired,
            unitPrice: item.estimatedUnitCost
          }))
        }),
      });

      if (res.ok) {
        toast.success(isEdit ? 'Procurement Record Updated' : 'Procurement Ledger Created');
        onSuccess();
      } else {
        const d = await res.json();
        setError(d.message || 'ERP Gateway Authorization Failed');
      }
    } catch (err) {
      setError('ERP Gateway Connection Timeout');
    } finally {
      setLoading(false);
    }
  };

  const toggleMaterial = (id: string) => {
    setSelectedReqIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-[90vh] bg-slate-50 rounded-t-3xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg"><Receipt size={20}/></div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">
              {initialData ? 'Edit Procurement Order' : 'New Procurement Order'}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
                {initialData ? `ID: ${initialData.id}` : 'Drafting New Entry...'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X/></button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <div className="w-80 border-r p-6 space-y-6 bg-white overflow-y-auto">
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">1. Strategy Authorization</label>
              <select 
                value={selectedStrategyId} 
                onChange={(e) => {setSelectedStrategyId(e.target.value); setSelectedProjectId(''); setSelectedReqIds([]);}} 
                className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500"
                required
              >
                <option value="">Select Strategy...</option>
                {strategies.map(s => <option key={s.id} value={s.id}>{s.year} - {s.description || s.title}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">2. Vendor / Supplier</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                <input 
                  placeholder="Enter Vendor Name" 
                  className="w-full p-3 pl-10 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500" 
                  value={vendorName} 
                  onChange={(e) => setVendorName(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">3. Maintenance Project</label>
              <select 
                disabled={!selectedStrategyId} 
                value={selectedProjectId} 
                onChange={(e) => {setSelectedProjectId(e.target.value); setSelectedReqIds([]);}} 
                className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500 disabled:opacity-50"
                required
              >
                <option value="">Select Project...</option>
                {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">4. PO Reference Number</label>
              <input 
                placeholder="PO-2025-XXXX" 
                className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500 font-mono" 
                value={poNumber} 
                onChange={(e) => setPoNumber(e.target.value)} 
                required 
              />
            </div>
          </div>

          {selectedStrategy && (
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
               <div className="flex items-center gap-2 mb-2">
                 <Info size={14} className="text-indigo-600"/>
                 <span className="text-[10px] font-black text-indigo-600 uppercase">Strategic Ceiling</span>
               </div>
               <p className="text-lg font-black text-slate-900">${selectedStrategy.totalBudget?.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Main Selection Area */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="mb-4 flex justify-between items-end">
             <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Bill of Quantities</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Select items to include in this procurement</p>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase">Items Selected</span>
                <p className="text-sm font-black text-indigo-600">{selectedReqIds.length}</p>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {!selectedProjectId ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 gap-3">
                <Box size={48} strokeWidth={1} className="opacity-20 animate-pulse"/>
                <p className="text-[10px] font-black uppercase tracking-widest">Select a project to load materials</p>
              </div>
            ) : availableMaterials.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p className="text-[10px] font-black uppercase">No Material Requirements Found for this Project</p>
              </div>
            ) : (
              availableMaterials.map((m: any) => {
                const isSelected = selectedReqIds.includes(m.id);
                return (
                  <div 
                    key={m.id} 
                    onClick={() => toggleMaterial(m.id)} 
                    className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center active:scale-[0.98] ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 bg-white'}`}>
                        {isSelected && <ShieldCheck size={12} className="text-white" />}
                      </div>
                      <div>
                        <p className={`text-xs font-black transition-colors ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{m.description}</p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{m.itemCode} • Qty: {m.quantityRequired} {m.uom || 'units'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xs text-slate-900">${(m.estimatedUnitCost * m.quantityRequired).toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">${m.estimatedUnitCost}/ea</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-6 border-t flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-6">
              {initialData && (
                <ConfirmAction 
                  onConfirm={handleDelete} 
                  itemId={initialData.id}
                  action="Delete" 
                  heading="Revoke Procurement Order"
                  description="Warning: This action will revert the project's actual cost ledger and release these materials back into the planning pool."
                  triggerButton={
                    <button type="button" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase">
                      <Trash2 size={16} /> Revoke
                    </button>
                  }
                />
              )}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Total Commitment</p>
                <p className={`text-2xl font-black tracking-tighter transition-colors ${totalCommitment > (selectedStrategy?.totalBudget || Infinity) ? 'text-red-600' : 'text-slate-900'}`}>
                    ${totalCommitment.toLocaleString()}
                </p>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || selectedReqIds.length === 0} 
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs flex items-center gap-3 disabled:opacity-20 hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all uppercase tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18}/> {initialData ? 'Update Ledger' : 'Authorize & Commit'}</>}
            </button>
          </div>
        </div>
      </form>
      
      {error && (
        <div className="p-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 animate-bounce">
          <AlertCircle size={16}/> {error}
        </div>
      )}
    </div>
  );
}
// 'use client';

// import React, { useState, useMemo } from 'react';
// import { X, ShieldCheck, Box, AlertCircle, Receipt, Loader2, Trash2, Store } from 'lucide-react';
// import toast from 'react-hot-toast';
// import ConfirmAction from './ConfirmAction';

// interface Props {
//   initialData?: any;
//   strategies: any[];
//   projects: any[];
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function MM_PurchaseOrderForm({ initialData, strategies = [], projects = [], onClose, onSuccess }: Props) {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   // New State for Vendor
//   const [vendorName, setVendorName] = useState(initialData?.vendorname  || '');
//   const [poNumber, setPoNumber] = useState(initialData?.poNumber || '');
  
//   const [selectedProjectId, setSelectedProjectId] = useState(initialData?.projectId || '');
//   const [selectedStrategyId, setSelectedStrategyId] = useState(() => {
//     if (initialData?.project?.planId) return initialData.project.planId;
//     const parentProject = projects.find(p => p.id === initialData?.projectId);
//     return parentProject?.planId || '';
//   });

//   const [selectedReqIds, setSelectedReqIds] = useState<string[]>(
//     initialData?.lineItems?.map((li: any) => li.materialRequirementId || li.requirementId) || []
//   );

//   const filteredProjects = useMemo(() => {
//     if (!selectedStrategyId) return [];
//     return projects.filter(p => p.planId === selectedStrategyId);
//   }, [selectedStrategyId, projects]);

//   const activeProject = useMemo(() => 
//     projects.find(p => p.id === selectedProjectId), 
//   [selectedProjectId, projects]);

//   const availableMaterials = activeProject?.materialRequirements || [];
//   const selectedItems = useMemo(() => 
//     availableMaterials.filter((m: any) => selectedReqIds.includes(m.id)),
//   [availableMaterials, selectedReqIds]);

//   const totalCommitment = selectedItems.reduce((acc: number, curr: any) => acc + (curr.quantityRequired * curr.estimatedUnitCost), 0);
//   const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

//   const handleDelete = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch(`/mm/api/purchaseorders/${initialData.id}`, { method: 'DELETE' });
//       if (res.ok) {
//         toast.success("PO Revoked & Ledger Cleaned");
//         onSuccess();
//       } else {
//         const d = await res.json();
//         setError(d.message || "Failed to revoke PO");
//       }
//     } catch (err) {
//       toast.error("Ledger revert failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedStrategy) return setError("STRATEGIC AUTHORIZATION REQUIRED");
//     if (!vendorName.trim()) return setError("VENDOR/SUPPLIER NAME REQUIRED");
    
//     if (totalCommitment > selectedStrategy.totalBudget) {
//       return setError(`EXCEEDS STRATEGIC CEILING: $${selectedStrategy.totalBudget.toLocaleString()}`);
//     }
    
//     setLoading(true);
//     setError('');
//     try {
//       const method = initialData?.id ? 'PATCH' : 'POST';
//       const url = initialData?.id ? `/mm/api/purchaseorders/${initialData?.id}` : '/mm/api/purchaseorders';
      
//       const res = await fetch(url, {
//         method,
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           id: initialData?.id,
//           poNumber,
//           vendorName, // Added to payload
//           projectId: selectedProjectId,
//           totalAmount: totalCommitment, // Matches model
//           lineItems: selectedItems.map((item: any) => ({
//             requirementId: item.id,
//             itemCode: item.itemCode,
//             description: item.description,
//             quantity: item.quantityRequired,
//             unitPrice: item.estimatedUnitCost
//           }))
//         }),
//       });

//       if (res.ok) {
//         toast.success(initialData ? 'Procurement Record Updated' : 'Procurement Ledger Created');
//         onSuccess();
//       } else {
//         const d = await res.json();
//         setError(d.message || 'Gateway Authorization Failed');
//       }
//     } catch (err) {
//       setError('ERP Gateway Connection Timeout');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col h-[85vh] bg-slate-50">
//       <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-indigo-500 rounded-lg"><Receipt size={20}/></div>
//           <div>
//             <h2 className="text-sm font-black uppercase tracking-widest">
//               {initialData ? 'Edit Procurement Order' : 'New Procurement Order'}
//             </h2>
//             {initialData && <p className="text-[10px] text-indigo-300 font-mono">{initialData.id}</p>}
//           </div>
//         </div>
//         <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X/></button>
//       </div>

//       <form onSubmit={handleSubmit} className="flex-1 flex overflow-hidden">
//         <div className="w-80 border-r p-6 space-y-6 bg-white overflow-y-auto">
//           <div className="space-y-4">
//             {/* 1. Strategy */}
//             <div>
//               <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">1. Strategy</label>
//               <select 
//                 value={selectedStrategyId} 
//                 onChange={(e) => {setSelectedStrategyId(e.target.value); setSelectedProjectId(''); setSelectedReqIds([]);}} 
//                 className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500"
//               >
//                 <option value="">Select Strategy...</option>
//                 {strategies.map(s => <option key={s.id} value={s.id}>{s.year} - {s.description || s.title}</option>)}
//               </select>
//             </div>

//             {/* 2. Vendor Name Field */}
//             <div>
//               <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">2. Vendor / Supplier</label>
//               <div className="relative">
//                 <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
//                 <input 
//                   placeholder="Enter Vendor Name" 
//                   className="w-full p-3 pl-10 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500" 
//                   value={vendorName} 
//                   onChange={(e) => setVendorName(e.target.value)} 
//                   required 
//                 />
//               </div>
//             </div>

//             {/* 3. Maintenance Project */}
//             <div>
//               <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">3. Maintenance Project</label>
//               <select 
//                 disabled={!selectedStrategyId} 
//                 value={selectedProjectId} 
//                 onChange={(e) => {setSelectedProjectId(e.target.value); setSelectedReqIds([]);}} 
//                 className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500 disabled:opacity-50"
//               >
//                 <option value="">Select Project...</option>
//                 {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//               </select>
//             </div>

//             {/* 4. PO Number */}
//             <div>
//               <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">4. Reference Number</label>
//               <input 
//                 placeholder="NRZ-2025-XXX" 
//                 className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500" 
//                 value={poNumber} 
//                 onChange={(e) => setPoNumber(e.target.value)} 
//                 required 
//               />
//             </div>
//           </div>
//         </div>

//         {/* BoQ Picker */}
//         <div className="flex-1 flex flex-col p-6 overflow-hidden">
//           <div className="flex-1 overflow-y-auto space-y-2 pr-2">
//             {!selectedProjectId ? (
//               <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-[2.5rem] text-slate-400 gap-3">
//                 <Box size={40} strokeWidth={1} className="opacity-20"/>
//                 <p className="text-[10px] font-black uppercase">Awaiting Project Selection</p>
//               </div>
//             ) : (
//               availableMaterials.map((m: any) => (
//                 <div 
//                   key={m.id} 
//                   onClick={() => setSelectedReqIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])} 
//                   className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedReqIds.includes(m.id) ? 'border-indigo-600 bg-indigo-50' : 'bg-white border-slate-100'}`}
//                 >
//                   <div>
//                     <p className="text-xs font-black text-slate-800">{m.description}</p>
//                     <p className="text-[10px] font-mono text-slate-400">{m.itemCode} • Qty: {m.quantityRequired}</p>
//                   </div>
//                   <p className="font-black text-xs text-slate-900">${(m.estimatedUnitCost * m.quantityRequired).toLocaleString()}</p>
//                 </div>
//               ))
//             )}
//           </div>

//           <div className="mt-6 pt-6 border-t flex justify-between items-center">
//             <div className="flex items-center gap-4">
//               {initialData && (
//                 <ConfirmAction 
//                   onConfirm={handleDelete} 
//                   itemId={initialData.id}
//                   action="Delete" 
//                   heading="Revoke PO"
//                   description="Are you sure? This will revert project actual costs and reset BoQ items."
//                   showHint={false} 
//                   triggerButton={
//                     <button type="button" className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase">
//                       <Trash2 size={14} /> Revoke PO
//                     </button>
//                   }
//                 />
//               )}
//               <div>
//                 <p className="text-[10px] font-black text-slate-400 uppercase">Total Commitment</p>
//                 <p className="text-2xl font-black text-slate-900 tracking-tighter">${totalCommitment.toLocaleString()}</p>
//               </div>
//             </div>

//             <button 
//               type="submit"
//               disabled={loading || selectedReqIds.length === 0} 
//               className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs flex items-center gap-3 disabled:opacity-30 hover:bg-indigo-600 transition-all uppercase tracking-widest"
//             >
//               {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18}/> {initialData ? 'Update Record' : 'Commit to Ledger'}</>}
//             </button>
//           </div>
//         </div>
//       </form>
      
//       {error && (
//         <div className="p-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
//           <AlertCircle size={16}/> {error}
//         </div>
//       )}
//     </div>
//   );
// }
