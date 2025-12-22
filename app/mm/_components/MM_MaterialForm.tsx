'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Tag, Hash, Activity, DollarSign, AlertCircle, Briefcase, Search, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MM_MaterialForm({ initialData, projects, strategies, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    
    const [formData, setFormData] = useState({
        itemCode: initialData?.itemCode || '',
        description: initialData?.description || '',
        quantityRequired: initialData?.quantityRequired || 1,
        estimatedUnitCost: initialData?.estimatedUnitCost || 0,
        projectId: initialData?.projectId || '',
        activityLabel: initialData?.activityLabel || '',
        status: initialData?.status || 'DRAFT'
    });

    // 1. Fetch Master Catalog for Part Validation
    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const res = await fetch('/mm/api/mastermaterials');
                const data = await res.json();
                if (Array.isArray(data)) setMasterCatalog(data);
            } catch (err) {
                console.error("Failed to load catalog");
            }
        };
        fetchCatalog();
    }, []);

    // 2. Dynamic Strategic Plan Lookup (Resolves the "Missing Reference" error)
    useEffect(() => {
        if (formData.projectId && projects && strategies) {
            const project = projects.find((p: any) => p.id === formData.projectId);
            if (project) {
                const plan = strategies.find((s: any) => s.id === project.planId);
                setSelectedPlan(plan);
                setError(''); // Clear error if plan is found
            }
        } else {
            setSelectedPlan(null);
        }
    }, [formData.projectId, projects, strategies]);

    const handleItemSelection = (code: string) => {
        const selectedItem = masterCatalog.find(item => item.itemCode === code);
        if (selectedItem) {
            setFormData({
                ...formData,
                itemCode: code,
                description: selectedItem.description,
                estimatedUnitCost: selectedItem.lastKnownCost || 0
            });
        } else {
            setFormData({ ...formData, itemCode: code });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const totalEntryCost = formData.quantityRequired * formData.estimatedUnitCost;

        // Validation against Strategic Ceiling (Guideline 1 / Section 2)
        if (!selectedPlan) {
            setError("Strategic Plan reference missing. Authorization denied. Please select a valid Project.");
            setLoading(false);
            return;
        }

        if (totalEntryCost > selectedPlan.totalBudget) {
            setError(`Over-allocation: This entry ($${totalEntryCost.toLocaleString()}) exceeds the strategic ceiling of $${selectedPlan.totalBudget.toLocaleString()} for ${selectedPlan.name}`);
            setLoading(false);
            return;
        }

        try {
            const isEdit = !!initialData?.id;
            const endpoint = isEdit ? `/mm/api/materialrequirements/${initialData.id}` : '/mm/api/materialrequirements';

            const res = await fetch(endpoint, {
                method: isEdit ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success('BoQ Registry Synchronized');
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                setError(data.message || 'Authorization failed at ERP Gateway');
            }
        } catch (err) {
            setError('Network error: Could not reach NRZ ERP Gateway');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Project BoQ Entry</h2>
                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest italic">Guideline 1 Compliance Mode</p>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={18} className="text-slate-400" />
                </button>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3">
                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                    <p className="text-xs font-bold text-red-700">{error}</p>
                </div>
            )}

            <div className="p-6 space-y-5 overflow-y-auto">
                {/* 1. Project Selection (Required first for budget lookup) */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Parent Project Selection</label>
                    <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            required
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                            value={formData.projectId}
                            onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                        >
                            <option value="">Select Target Project...</option>
                            {projects?.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. Budget Visibility Card */}
                {selectedPlan && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                        <Info className="text-emerald-600" size={16} />
                        <div>
                            <p className="text-[9px] font-black text-emerald-600 uppercase">Active Ceiling: {selectedPlan.name}</p>
                            <p className="text-xs font-bold text-emerald-900">${selectedPlan.totalBudget?.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Catalogue Part No.</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <select 
                                required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold outline-none focus:border-indigo-500 appearance-none"
                                value={formData.itemCode}
                                onChange={(e) => handleItemSelection(e.target.value)}
                            >
                                <option value="">Select Part...</option>
                                {masterCatalog.map(item => (
                                    <option key={item.id} value={item.itemCode}>{item.itemCode} - {item.description.substring(0, 20)}...</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Requirement Description</label>
                        <input 
                            required
                            readOnly={!!formData.itemCode}
                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold outline-none text-slate-500"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Activity Reference</label>
                        <div className="relative">
                            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                                placeholder="e.g. Mechanical Refurbishment"
                                value={formData.activityLabel}
                                onChange={(e) => setFormData({...formData, activityLabel: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Qty</label>
                            <input 
                                type="number"
                                required
                                min="1"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                                value={formData.quantityRequired}
                                onChange={(e) => setFormData({...formData, quantityRequired: Number(e.target.value)})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Unit Cost ($)</label>
                            <input 
                                type="number"
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                                value={formData.estimatedUnitCost}
                                onChange={(e) => setFormData({...formData, estimatedUnitCost: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl flex justify-between items-center shadow-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Entry Commitment</span>
                    <span className="text-xl font-black text-white">${(formData.quantityRequired * formData.estimatedUnitCost).toLocaleString()}</span>
                </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                <button 
                    type="submit"
                    disabled={loading}
                    className={`w-full font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                    {loading ? 'Validating against Plan...' : <><Save size={18}/> Authorize BoQ Entry</>}
                </button>
            </div>
        </form>
    );
}
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { X, Save, Tag, Hash, Activity, DollarSign, AlertCircle, Briefcase, Search } from 'lucide-react';
// import toast from 'react-hot-toast';

// export default function MM_MaterialForm({ initialData, projects, projectPlan, onClose, onSuccess }: any) {
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
    
//     const [formData, setFormData] = useState({
//         itemCode: initialData?.itemCode || '',
//         description: initialData?.description || '',
//         quantityRequired: initialData?.quantityRequired || 1,
//         estimatedUnitCost: initialData?.estimatedUnitCost || 0,
//         projectId: initialData?.projectId || '',
//         activityLabel: initialData?.activityLabel || '',
//         status: initialData?.status || 'DRAFT'
//     });

//     // Fetch Master Catalog to link items correctly
//     useEffect(() => {
//         const fetchCatalog = async () => {
//             try {
//                 const res = await fetch('/mm/api/mastermaterials');
//                 const data = await res.json();
//                 if (Array.isArray(data)) setMasterCatalog(data);
//             } catch (err) {
//                 console.error("Failed to load catalog");
//             }
//         };
//         fetchCatalog();
//     }, []);

//     // Auto-fill description and cost when an item code is selected
//     const handleItemSelection = (code: string) => {
//         const selectedItem = masterCatalog.find(item => item.itemCode === code);
//         if (selectedItem) {
//             setFormData({
//                 ...formData,
//                 itemCode: code,
//                 description: selectedItem.description,
//                 estimatedUnitCost: selectedItem.lastKnownCost || 0
//             });
//         } else {
//             setFormData({ ...formData, itemCode: code });
//         }
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setError('');

//         const totalEntryCost = formData.quantityRequired * formData.estimatedUnitCost;

//         // Validation against Strategic Ceiling (Guideline 1)
//         if (!projectPlan) {
//             setError("Strategic Plan reference missing. Authorization denied.");
//             setLoading(false);
//             return;
//         }

//         if (totalEntryCost > projectPlan.totalBudget) {
//             setError(`Over-allocation: This entry ($${totalEntryCost.toLocaleString()}) exceeds the project ceiling of $${projectPlan.totalBudget.toLocaleString()}`);
//             setLoading(false);
//             return;
//         }

//         try {
//             const isEdit = !!initialData?.id;
//             // Updated endpoint to reflect materialrequirements model
//             const endpoint = isEdit ? `/mm/api/materialrequirements/${initialData.id}` : '/mm/api/materialrequirements';

//             const res = await fetch(endpoint, {
//                 method: isEdit ? 'PATCH' : 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(formData),
//             });

//             if (res.ok) {
//                 toast.success('BoQ Registry Synchronized');
//                 onSuccess();
//                 onClose();
//             } else {
//                 const data = await res.json();
//                 setError(data.message || 'Authorization failed at ERP Gateway');
//             }
//         } catch (err) {
//             setError('Network error: Could not reach NRZ ERP Gateway');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
//             {/* Header */}
//             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
//                 <div>
//                     <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Project BoQ Entry</h2>
//                     <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest italic">Requirement Model V2</p>
//                 </div>
//                 <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
//                     <X size={18} className="text-slate-400" />
//                 </button>
//             </div>

//             {error && (
//                 <div className="mx-6 mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3">
//                     <AlertCircle className="text-red-500 shrink-0" size={18} />
//                     <p className="text-xs font-bold text-red-700">{error}</p>
//                 </div>
//             )}

//             <div className="p-6 space-y-5 overflow-y-auto">
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     {/* Item Code Search/Select */}
//                     <div className="md:col-span-1 space-y-1.5">
//                         <label className="text-[10px] font-black text-slate-400 uppercase">Catalogue Part No.</label>
//                         <div className="relative">
//                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
//                             <select 
//                                 required
//                                 className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold outline-none focus:border-indigo-500 appearance-none"
//                                 value={formData.itemCode}
//                                 onChange={(e) => handleItemSelection(e.target.value)}
//                             >
//                                 <option value="">Select Part...</option>
//                                 {masterCatalog.map(item => (
//                                     <option key={item.id} value={item.itemCode}>{item.itemCode} - {item.description.substring(0, 20)}...</option>
//                                 ))}
//                             </select>
//                         </div>
//                     </div>
                    
//                     <div className="md:col-span-2 space-y-1.5">
//                         <label className="text-[10px] font-black text-slate-400 uppercase">Requirement Description</label>
//                         <input 
//                             required
//                             readOnly={!!formData.itemCode} // Lock description if linked to catalog
//                             className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold outline-none cursor-not-allowed text-slate-500"
//                             value={formData.description}
//                         />
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div className="space-y-1.5">
//                         <label className="text-[10px] font-black text-slate-400 uppercase">Parent Project</label>
//                         <div className="relative">
//                             <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
//                             <select 
//                                 required
//                                 className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none appearance-none"
//                                 value={formData.projectId}
//                                 onChange={(e) => setFormData({...formData, projectId: e.target.value})}
//                             >
//                                 <option value="">Select Project...</option>
//                                 {projects?.map((p: any) => (
//                                     <option key={p.id} value={p.id}>{p.name}</option>
//                                 ))}
//                             </select>
//                         </div>
//                     </div>
//                     <div className="space-y-1.5">
//                         <label className="text-[10px] font-black text-slate-400 uppercase">Activity Reference</label>
//                         <div className="relative">
//                             <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
//                             <input 
//                                 className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
//                                 placeholder="e.g. Mechanical Refurbishment"
//                                 value={formData.activityLabel}
//                                 onChange={(e) => setFormData({...formData, activityLabel: e.target.value})}
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-1.5">
//                         <label className="text-[10px] font-black text-slate-400 uppercase">Quantity Required</label>
//                         <div className="relative">
//                             <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
//                             <input 
//                                 type="number"
//                                 required
//                                 min="1"
//                                 className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
//                                 value={formData.quantityRequired}
//                                 onChange={(e) => setFormData({...formData, quantityRequired: Number(e.target.value)})}
//                             />
//                         </div>
//                     </div>
//                     <div className="space-y-1.5">
//                         <label className="text-[10px] font-black text-slate-400 uppercase">Standard Unit Cost ($)</label>
//                         <div className="relative">
//                             <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
//                             <input 
//                                 type="number"
//                                 required
//                                 className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
//                                 value={formData.estimatedUnitCost}
//                                 onChange={(e) => setFormData({...formData, estimatedUnitCost: Number(e.target.value)})}
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
//                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Total BoQ Allocation</span>
//                     <span className="text-lg font-black text-indigo-900">${(formData.quantityRequired * formData.estimatedUnitCost).toLocaleString()}</span>
//                 </div>
//             </div>

//             <div className="p-6 border-t border-slate-100 bg-slate-50/30">
//                 <button 
//                     type="submit"
//                     disabled={loading}
//                     className={`w-full font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-indigo-600 text-white'}`}
//                 >
//                     {loading ? 'Processing...' : <><Save size={18}/> Authorize BoQ Entry</>}
//                 </button>
//             </div>
//         </form>
//     );
// }
// 'use client';

// import React, { useState } from 'react';
// import { X, Save, Tag, Hash, Activity, DollarSign, AlertCircle, Briefcase } from 'lucide-react';
// import toast from 'react-hot-toast';

// export default function MM_MaterialForm({ initialData, projects, projectPlan, onClose, onSuccess }: any) {
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
    
//     const [formData, setFormData] = useState({
//         itemCode: initialData?.itemCode || '',
//         description: initialData?.description || '',
//         quantityRequired: initialData?.quantityRequired || 1,
//         estimatedUnitCost: initialData?.estimatedUnitCost || 0,
//         projectId: initialData?.projectId || '', // Corrected from activityId
//         activityLabel: initialData?.activityLabel || '', // Added per your schema
//         status: initialData?.status || 'DRAFT'
//     });

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setError('');

//         const totalEntryCost = formData.quantityRequired * formData.estimatedUnitCost;

//         // Validation against Strategic Ceiling
//         if (!projectPlan) {
//             setError("Strategic Plan reference missing. Authorization denied.");
//             setLoading(false);
//             return;
//         }

//         if (totalEntryCost > projectPlan.totalBudget) {
//             setError(`Over-allocation: This entry ($${totalEntryCost.toLocaleString()}) exceeds the project ceiling of $${projectPlan.totalBudget.toLocaleString()}`);
//             setLoading(false);
//             return;
//         }

//         try {
//             const method = initialData ? 'PATCH' : 'POST';
//             const endpoint = initialData ? `/mm/api/materials/${initialData.id}` : '/mm/api/materials';

//             const res = await fetch(endpoint, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(formData),
//             });

//             if (res.ok) {
//                 toast.success('BoQ Registry Synchronized');
//                 onSuccess();
//                 onClose();
//             } else {
//                 const data = await res.json();
//                 setError(data.message || 'Authorization failed at ERP Gateway');
//             }
//         } catch (err) {
//             setError('Network error: Could not reach NRZ ERP Gateway');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
//             {/* Header */}
//             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
//                 <div>
//                     <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Material Entry</h2>
//                     <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest italic">Guideline 1 Compliance Active</p>
//                 </div>
//                 <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
//                     <X size={18} className="text-slate-400" />
//                 </button>
//             </div>

//             {/* Error Display */}
//             {error && (
//                 <div className="mx-6 mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3">
//                     <AlertCircle className="text-red-500 shrink-0" size={18} />
//                     <p className="text-xs font-bold text-red-700">{error}</p>
//                 </div>
//             )}

//             <div className="p-6 space-y-5 overflow-y-auto">
//                 {/* Item Details */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div className="md:col-span-1 space-y-1.5">
//                         <label className="text-[10px] font-black text-slate-400 uppercase">Item Code</label>
//                         <div className="relative">
//                             <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
//                             <input 
//                                 required
//                                 className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold outline-none focus:border-indigo-500 transition-all"
//                                 placeholder="MAT-001"
//                                 value={formData.itemCode}
//                                 onChange={(e) => setFormData({...formData, itemCode: e.target.value})}
//                             />
//                         </div>
//                     </div>
//                     <div className="md:col-span-2 space-y-1.5">
//                         <label className="text-[10px] font-black text-slate-400 uppercase">Material Description</label>
//                         <input 
//                             required
//                             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
//                             placeholder="e.g. Structural Steel Beam 10m"
//                             value={formData.description}
//                             onChange={(e) => setFormData({...formData, description: e.target.value})}
//                         />
//                     </div>
//                 </div>

//                 {/* Mapping to Project and Labeling */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div className="space-y-1.5">
//                         <label className="text-[10px] font-black text-slate-400 uppercase">Parent Project</label>
//                         <div className="relative">
//                             <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
//                             <select 
//                                 required
//                                 className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none appearance-none"
//                                 value={formData.projectId}
//                                 onChange={(e) => setFormData({...formData, projectId: e.target.value})}
//                             >
//                                 <option value="">Select Project...</option>
//                                 {projects?.map((p: any) => (
//                                     <option key={p.id} value={p.id}>{p.name}</option>
//                                 ))}
//                             </select>
//                         </div>
//                     </div>
//                     <div className="space-y-1.5">
//                         <label className="text-[10px] font-black text-slate-400 uppercase">Activity Reference</label>
//                         <div className="relative">
//                             <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
//                             <input 
//                                 className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
//                                 placeholder="e.g. Phase 1 Foundation"
//                                 value={formData.activityLabel}
//                                 onChange={(e) => setFormData({...formData, activityLabel: e.target.value})}
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 {/* Costs */}
//                 <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-1.5">
//                         <label className="text-[10px] font-black text-slate-400 uppercase">Quantity</label>
//                         <div className="relative">
//                             <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
//                             <input 
//                                 type="number"
//                                 required
//                                 min="1"
//                                 className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
//                                 value={formData.quantityRequired}
//                                 onChange={(e) => setFormData({...formData, quantityRequired: Number(e.target.value)})}
//                             />
//                         </div>
//                     </div>
//                     <div className="space-y-1.5">
//                         <label className="text-[10px] font-black text-slate-400 uppercase">Est. Unit Cost ($)</label>
//                         <div className="relative">
//                             <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
//                             <input 
//                                 type="number"
//                                 required
//                                 className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
//                                 value={formData.estimatedUnitCost}
//                                 onChange={(e) => setFormData({...formData, estimatedUnitCost: Number(e.target.value)})}
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 {/* Entry Impact */}
//                 <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
//                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Budget Impact</span>
//                     <span className="text-lg font-black text-indigo-900">${(formData.quantityRequired * formData.estimatedUnitCost).toLocaleString()}</span>
//                 </div>
//             </div>

//             <div className="p-6 border-t border-slate-100 bg-slate-50/30">
//                 <button 
//                     type="submit"
//                     disabled={loading}
//                     className={`w-full font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-indigo-600 text-white'}`}
//                 >
//                     {loading ? 'Authorizing...' : <><Save size={18}/> Commit to BoQ Registry</>}
//                 </button>
//             </div>
//         </form>
//     );
// }