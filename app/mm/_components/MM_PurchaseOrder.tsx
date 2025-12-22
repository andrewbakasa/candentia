'use client';

import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, Box, AlertCircle, Receipt, Loader2, Trash2, Store, Info, Hash, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

// Define Status Enum to match Prisma MM_POStatus
const PO_STATUS_OPTIONS = [
  'AWAITING_FUNDING',
  'FUNDED',
  'ORDERED',
  'RECEIVED',
  'CANCELLED'
];

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
  
  const [vendorName, setVendorName] = useState(initialData?.vendorname || '');
  const [poNumber, setPoNumber] = useState(initialData?.poNumber || '');
  const [status, setStatus] = useState(initialData?.status || 'AWAITING_FUNDING');
  const [selectedProjectId, setSelectedProjectId] = useState(initialData?.projectId || '');
  
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>(() => {
    if (!initialData?.lineItems) return [];
    return initialData.lineItems
      .map((li: any) => li.materialRequirementId || li.requirementId)
      .filter(Boolean);
  });

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

  const selectedItems = useMemo(() => 
    availableMaterials.filter((m: any) => selectedReqIds.includes(m.id)),
  [availableMaterials, selectedReqIds]);

  const totalCommitment = useMemo(() => 
    selectedItems.reduce((acc: number, curr: any) => acc + (curr.quantityRequired * curr.estimatedUnitCost), 0),
  [selectedItems]);

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStrategy) return setError("STRATEGIC AUTHORIZATION REQUIRED");
    if (!poNumber.trim()) return setError("PURCHASE ORDER NUMBER REQUIRED");
    if (!vendorName.trim()) return setError("VENDOR/SUPPLIER NAME REQUIRED");
    if (selectedReqIds.length === 0) return setError("NO MATERIALS SELECTED");
    
    // Check against Guideline 1 Budget Ceilings
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
          status,
          vendorName, 
          projectId: selectedProjectId,
          lineItems: selectedItems.map((item: any) => ({
            requirementId: item.id,
            itemCode: item.material?.itemCode || "N/A", 
            description: item.material?.description || item.description || "No Description",
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
      <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg"><Receipt size={20}/></div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">
              {initialData ? 'Edit Procurement Order' : 'New Procurement Order'}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
                {initialData ? `ID: ${initialData.id}` : 'Drafting New Entry (Compliance Guideline 1)'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X/></button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex overflow-hidden">
        {/* SIDEBAR INPUTS */}
        <div className="w-80 border-r p-6 space-y-6 bg-white overflow-y-auto">
          <div className="space-y-5">
            {/* 1. PO Number */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">1. PO Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  className="w-full p-3 pl-10 bg-slate-100 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="e.g. PO-2025-001"
                  value={poNumber} 
                  onChange={(e) => setPoNumber(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* NEW: 2. Lifecycle Status */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">2. Lifecycle Status</label>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)} 
                  className="w-full p-3 pl-10 bg-slate-100 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                  required
                >
                  {PO_STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <p className="mt-1.5 text-[9px] text-indigo-500 font-bold italic">Note: STATUS FUNDED triggers cash-flow timestamp.</p>
            </div>

            {/* 3. Strategy */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">3. Strategy Authorization</label>
              <select value={selectedStrategyId} onChange={(e) => {setSelectedStrategyId(e.target.value); setSelectedProjectId(''); setSelectedReqIds([]);}} className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500" required>
                <option value="">Select Strategy...</option>
                {strategies.map(s => <option key={s.id} value={s.id}>{s.year} - {s.description || s.title}</option>)}
              </select>
            </div>

            {/* 4. Vendor */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">4. Vendor / Supplier</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input className="w-full p-3 pl-10 bg-slate-100 rounded-xl text-xs font-bold border-none" placeholder="Search Supplier Registry..." value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
              </div>
            </div>

            {/* 5. Project */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">5. Maintenance Project</label>
              <select value={selectedProjectId} onChange={(e) => {setSelectedProjectId(e.target.value); setSelectedReqIds([]);}} className="w-full p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-indigo-500" required>
                <option value="">Select Project...</option>
                {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600">
                <AlertCircle size={14}/>
                <p className="text-[10px] font-bold uppercase">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* MAIN BoQ SELECTION AREA */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="mb-4 flex justify-between items-end">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Bill of Quantities Selection</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Authorized items from project registry</p>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {!selectedProjectId ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 gap-3">
                <Box size={48} strokeWidth={1} className="opacity-20 animate-pulse"/>
                <p className="text-[10px] font-black uppercase tracking-widest text-center px-10">Select a project to load approved material requirements</p>
              </div>
            ) : availableMaterials.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p className="text-[10px] font-black uppercase">No Approved Materials Found for this Project</p>
              </div>
            ) : (
              availableMaterials.map((m: any) => {
                const isSelected = selectedReqIds.includes(m.id);
                return (
                  <div 
                    key={m.id} 
                    onClick={() => toggleMaterial(m.id)} 
                    className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center active:scale-[0.98] ${
                      isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 bg-white'}`}>
                        {isSelected && <ShieldCheck size={12} className="text-white" />}
                      </div>
                      <div>
                        <p className={`text-xs font-black ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                          {m.material?.description || m.description || 'No Description'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                          {m.material?.itemCode || 'BOQ-ITEM'} • Qty: {m.quantityRequired} {m.material?.unitOfMeasure || 'units'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xs text-slate-900">${((m.estimatedUnitCost || 0) * m.quantityRequired).toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">${m.estimatedUnitCost}/ea</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER ACTION */}
          <div className="mt-6 pt-6 border-t flex justify-between items-center">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Total Commitment</p>
                <p className={`text-2xl font-black tracking-tighter ${totalCommitment > (selectedStrategy?.totalBudget || Infinity) ? 'text-rose-600' : 'text-slate-900'}`}>
                    ${totalCommitment.toLocaleString()}
                </p>
             </div>
             <button type="submit" disabled={loading || selectedReqIds.length === 0} className="bg-slate-900 hover:bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-slate-200 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18}/> {initialData ? 'Update Record' : 'Authorize & Commit'}</>}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}