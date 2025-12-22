'use client';

import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, Box, AlertCircle, Receipt, Loader2, Trash2 } from 'lucide-react';
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
  
  const [selectedProjectId, setSelectedProjectId] = useState(initialData?.projectId || '');
  const [selectedStrategyId, setSelectedStrategyId] = useState(() => {
    if (initialData?.project?.planId) return initialData.project.planId;
    const parentProject = projects.find(p => p.id === initialData?.projectId);
    return parentProject?.planId || '';
  });

  const [poNumber, setPoNumber] = useState(initialData?.poNumber || '');
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>(
    initialData?.lineItems?.map((li: any) => li.materialRequirementId || li.requirementId) || []
  );

  const filteredProjects = useMemo(() => {
    if (!selectedStrategyId) return [];
    return projects.filter(p => p.planId === selectedStrategyId);
  }, [selectedStrategyId, projects]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
  [selectedProjectId, projects]);

  const availableMaterials = activeProject?.materialRequirements || [];
  const selectedItems = useMemo(() => 
    availableMaterials.filter((m: any) => selectedReqIds.includes(m.id)),
  [availableMaterials, selectedReqIds]);

  const totalCommitment = selectedItems.reduce((acc: number, curr: any) => acc + (curr.quantityRequired * curr.estimatedUnitCost), 0);
  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

  /**
   * 🗑️ Handle PO Deletion (Revoke)
   */
  const handleDelete = async () => {
    //if (!window.confirm("CRITICAL: Revoking this PO will revert Project Actual Costs and reset Material statuses. Proceed?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/mm/api/purchaseorders/${initialData.id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        toast.success("PO Revoked & Ledger Cleaned");
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

  /**
   * 💾 Handle Create/Update
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStrategy) return setError("STRATEGIC AUTHORIZATION REQUIRED");
    
    if (totalCommitment > selectedStrategy.totalBudget) {
      return setError(`EXCEEDS STRATEGIC CEILING: $${selectedStrategy.totalBudget.toLocaleString()}`);
    }
    
    setLoading(true);
    setError('');
    try {
      const method = initialData?.id ? 'PATCH' : 'POST';
      const res = await fetch('/mm/api/purchaseorders', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: initialData?.id,
          poNumber,
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
        toast.success(initialData ? 'Procurement Record Updated' : 'Procurement Ledger Created');
        onSuccess();
      } else {
        const d = await res.json();
        setError(d.message || 'Gateway Authorization Failed');
      }
    } catch (err) {
      setError('ERP Gateway Connection Timeout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-slate-50">
      <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg"><Receipt size={20}/></div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">
              {initialData ? 'Edit Procurement Order' : 'New Procurement Order'}
            </h2>
            {initialData && <p className="text-[10px] text-indigo-300 font-mono">{initialData.id}</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X/></button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r p-6 space-y-6 bg-white overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">1. Strategy</label>
              <select 
                value={selectedStrategyId} 
                onChange={(e) => {setSelectedStrategyId(e.target.value); setSelectedProjectId(''); setSelectedReqIds([]);}} 
                className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500"
              >
                <option value="">Select Strategy...</option>
                {strategies.map(s => <option key={s.id} value={s.id}>{s.year} - {s.description || s.title}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">2. Maintenance Project</label>
              <select 
                disabled={!selectedStrategyId} 
                value={selectedProjectId} 
                onChange={(e) => {setSelectedProjectId(e.target.value); setSelectedReqIds([]);}} 
                className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500 disabled:opacity-50"
              >
                <option value="">Select Project...</option>
                {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">3. Reference Number</label>
              <input 
                placeholder="NRZ-2025-XXX" 
                className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500" 
                value={poNumber} 
                onChange={(e) => setPoNumber(e.target.value)} 
                required 
              />
            </div>
          </div>
        </div>

        {/* BoQ Picker */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {!selectedProjectId ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-[2.5rem] text-slate-400 gap-3">
                <Box size={40} strokeWidth={1} className="opacity-20"/>
                <p className="text-[10px] font-black uppercase">Awaiting Project Selection</p>
              </div>
            ) : (
              availableMaterials.map((m: any) => (
                <div 
                  key={m.id} 
                  onClick={() => setSelectedReqIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])} 
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedReqIds.includes(m.id) ? 'border-indigo-600 bg-indigo-50' : 'bg-white border-slate-100'}`}
                >
                  <div>
                    <p className="text-xs font-black text-slate-800">{m.description}</p>
                    <p className="text-[10px] font-mono text-slate-400">{m.itemCode} • Qty: {m.quantityRequired}</p>
                  </div>
                  <p className="font-black text-xs text-slate-900">${(m.estimatedUnitCost * m.quantityRequired).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-6 border-t flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* DELETE BUTTON - ONLY IN EDIT MODE */}
              {initialData && (
                <ConfirmAction 
                                      onConfirm={handleDelete} 
                                      itemId={initialData.id}
                                      action="Delete" 
                                      heading="Delete Task"
                                      description="Are you sure? This will be permanently removed from the activity logs."
                                      showHint={false} 
                                      triggerButton={
                                        <button className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                          <Trash2 size={14} /> Revoke PO
                                        </button>
                                      }
                                    />
                // <button 
                //   type="button"
                //   onClick={handleDelete}
                //   disabled={loading}
                //   className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors flex items-center gap-2 text-xs font-black uppercase"
                // >
                //   <Trash2 size={18}/>
                //   Revoke PO
                // </button>
              )}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Total Commitment</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">${totalCommitment.toLocaleString()}</p>
              </div>
            </div>

            <button 
              disabled={loading || selectedReqIds.length === 0} 
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs flex items-center gap-3 disabled:opacity-30 hover:bg-indigo-600 transition-all uppercase tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18}/> {initialData ? 'Update Record' : 'Commit to Ledger'}</>}
            </button>
          </div>
        </div>
      </form>
      
      {error && (
        <div className="p-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
          <AlertCircle size={16}/> {error}
        </div>
      )}
    </div>
  );
}
// 'use client';

// import React, { useState, useMemo, useEffect } from 'react';
// import { X, ShieldCheck, Target, Box, AlertCircle, Receipt, Loader2 } from 'lucide-react';
// import toast from 'react-hot-toast';

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
  
//   // 1. Initialize Project ID first
//   const [selectedProjectId, setSelectedProjectId] = useState(initialData?.projectId || '');
  
//   // 2. Derive Strategy ID from the Project if editing, otherwise use provided IDs
//   const [selectedStrategyId, setSelectedStrategyId] = useState(() => {
//     if (initialData?.project?.planId) return initialData.project.planId;
//     // If we only have projectId, find the project in our list to get the planId
//     const parentProject = projects.find(p => p.id === initialData?.projectId);
//     return parentProject?.planId || '';
//   });

//   const [poNumber, setPoNumber] = useState(initialData?.poNumber || '');
  
//   // 3. Pre-populate selected line items if editing
//   const [selectedReqIds, setSelectedReqIds] = useState<string[]>(
//     initialData?.lineItems?.map((li: any) => li.materialRequirementId || li.requirementId) || []
//   );

//   // Filter projects based on the selected strategy
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


//   // Inside MM_PurchaseOrderForm.tsx

// const handleDelete = async () => {
//   if (!window.confirm("CRITICAL: Revoking this PO will revert Project Actual Costs. Proceed?")) return;
  
//   setLoading(true);
//   try {
//     const res = await fetch(`/mm/api/purchaseorders?id=${initialData.id}`, {
//       method: 'DELETE'
//     });
    
//     if (res.ok) {
//       toast.success("PO Revoked & Ledger Cleaned");
//       onSuccess();
//     }
//   } catch (err) {
//     toast.error("Ledger revert failed");
//   } finally {
//     setLoading(false);
//   }
// };
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedStrategy) return setError("STRATEGIC AUTHORIZATION REQUIRED");
    
//     // Financial Ceiling Check (Guideline 1 Compliance)
//     if (totalCommitment > selectedStrategy.totalBudget) {
//       return setError(`EXCEEDS STRATEGIC CEILING: $${selectedStrategy.totalBudget.toLocaleString()}`);
//     }
    
//     setLoading(true);
//     try {
//       const url = initialData?.id ? '/mm/api/purchaseorders':`/mm/api/purchaseorders/${initialData?.id}`;
//       const method = initialData?.id ? 'PATCH' : 'POST';

//       const res = await fetch(url, {
//         method,
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           id: initialData?.id,
//           poNumber,
//           projectId: selectedProjectId,
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
//         {/* Sidebar: Configuration */}
//         <div className="w-80 border-r p-6 space-y-6 bg-white overflow-y-auto">
//           <div className="space-y-4">
//             <div>
//               <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">1. Strategy (Financial Plan)</label>
//               <select 
//                 value={selectedStrategyId} 
//                 onChange={(e) => {setSelectedStrategyId(e.target.value); setSelectedProjectId(''); setSelectedReqIds([]);}} 
//                 className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500"
//               >
//                 <option value="">Select Strategy...</option>
//                 {strategies.map(s => <option key={s.id} value={s.id}>{s.year} - {s.description || s.title}</option>)}
//               </select>
//             </div>

//             <div>
//               <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">2. Maintenance Project</label>
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

//             <div>
//               <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">3. Reference Number</label>
//               <input 
//                 placeholder="NRZ-2025-XXX" 
//                 className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500" 
//                 value={poNumber} 
//                 onChange={(e) => setPoNumber(e.target.value)} 
//                 required 
//               />
//             </div>
            
//             {selectedStrategy && (
//               <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
//                 <p className="text-[9px] font-black text-blue-400 uppercase">Available Plan Budget</p>
//                 <p className="text-lg font-black text-blue-900">${selectedStrategy.totalBudget?.toLocaleString()}</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Main Section: BoQ Selection */}
//         <div className="flex-1 flex flex-col p-6 overflow-hidden">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-xs font-black uppercase tracking-tight text-slate-500">Bill of Quantities Selection</h3>
//             <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">
//               {selectedReqIds.length} Items Selected
//             </span>
//           </div>

//           <div className="flex-1 overflow-y-auto space-y-2 pr-2">
//             {!selectedProjectId ? (
//               <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-[2.5rem] text-slate-400 gap-3">
//                 <Box size={40} strokeWidth={1} className="opacity-20"/>
//                 <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Project Selection</p>
//               </div>
//             ) : availableMaterials.length === 0 ? (
//               <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-[2.5rem] text-slate-400 gap-3">
//                 <AlertCircle size={40} strokeWidth={1} className="opacity-20"/>
//                 <p className="text-[10px] font-black uppercase tracking-widest text-center px-10">No materials defined in this project BoQ</p>
//               </div>
//             ) : (
//               availableMaterials.map((m: any) => (
//                 <div 
//                   key={m.id} 
//                   onClick={() => setSelectedReqIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])} 
//                   className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center group ${selectedReqIds.includes(m.id) ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'bg-white border-slate-100 hover:border-slate-300'}`}
//                 >
//                   <div className="flex items-center gap-4">
//                     <div className={`w-2 h-2 rounded-full ${selectedReqIds.includes(m.id) ? 'bg-indigo-600 animate-pulse' : 'bg-slate-200'}`} />
//                     <div>
//                       <p className="text-xs font-black text-slate-800">{m.description}</p>
//                       <p className="text-[10px] font-mono text-slate-400">{m.itemCode} • Qty: {m.quantityRequired}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="font-black text-xs text-slate-900">${(m.estimatedUnitCost * m.quantityRequired).toLocaleString()}</p>
//                     <p className="text-[9px] font-bold text-slate-400 uppercase">Est. Value</p>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>

//           <div className="mt-6 pt-6 border-t flex justify-between items-end">
//             <div>
//               <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Procurement Commitment</p>
//               <p className="text-3xl font-black text-slate-900 tracking-tighter">${totalCommitment.toLocaleString()}</p>
//             </div>
//             <button 
//               disabled={loading || selectedReqIds.length === 0} 
//               className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs flex items-center gap-3 disabled:opacity-30 hover:bg-indigo-600 transition-all shadow-xl uppercase tracking-widest"
//             >
//               {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18}/> {initialData ? 'Update Record' : 'Commit to Ledger'}</>}
//             </button>
//           </div>
//         </div>
//       </form>
      
//       {error && (
//         <div className="p-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-bottom-full">
//           <AlertCircle size={16}/> {error}
//         </div>
//       )}
//     </div>
//   );
// }