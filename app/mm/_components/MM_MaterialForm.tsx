'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Activity, DollarSign, AlertCircle, Briefcase, Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MM_MaterialForm({ initialData, projects, strategies, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    
    // FIX: Extract itemCode and description from nested initialData object if it exists
    const [formData, setFormData] = useState({
        itemCode: initialData?.material?.itemCode || initialData?.itemCode || '',
        description: initialData?.material?.description || initialData?.description || '',
        quantityRequired: initialData?.quantityRequired || 1,
        estimatedUnitCost: initialData?.estimatedUnitCost || 0,
        projectId: initialData?.projectId || '',
        activityLabel: initialData?.activityLabel || '',
        status: initialData?.status || 'DRAFT'
    });

    // Load Catalog
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

    // FIX: Pre-select the material details once the catalog loads 
    // This ensures that if we have an itemCode but no unit cost/description yet, it populates.
    useEffect(() => {
        if (masterCatalog.length > 0 && formData.itemCode && !formData.description) {
            const matched = masterCatalog.find(i => i.itemCode === formData.itemCode);
            if (matched) {
                setFormData(prev => ({
                    ...prev,
                    description: matched.description,
                    estimatedUnitCost: prev.estimatedUnitCost || matched.lastKnownCost || 0
                }));
            }
        }
    }, [masterCatalog, formData.itemCode]);

    // Strategic Plan selection logic
    useEffect(() => {
        if (formData.projectId && projects && strategies) {
            const project = projects.find((p: any) => p.id === formData.projectId);
            if (project) {
                const plan = strategies.find((s: any) => s.id === project.planId);
                setSelectedPlan(plan);
                setError('');
            }
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

        if (!selectedPlan) {
            setError("Strategic Plan reference missing. Authorization denied.");
            setLoading(false);
            return;
        }

        // Shareholders Guideline 1 of 2025: Budget Ceiling Validation
        if (totalEntryCost > selectedPlan.totalBudget) {
            setError(`Over-allocation: This entry ($${totalEntryCost.toLocaleString()}) exceeds budget.`);
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
                setError(data.message || 'Authorization failed');
            }
        } catch (err) {
            setError('Network error: Gateway unreachable');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[95vh] md:max-h-[90vh] bg-white rounded-t-3xl overflow-hidden shadow-2xl">
            {/* STICKY HEADER */}
            <div className="shrink-0 p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Package size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
                            {initialData?.id ? 'Edit BoQ Entry' : 'New BoQ Entry'}
                        </h2>
                        <p className="text-[9px] md:text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">Intergrated Hub</p>
                    </div>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                </button>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                <div className="p-5 md:p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-xs font-bold text-red-700 leading-tight">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Parent Project</label>
                            <div className="relative group">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select 
                                    required
                                    className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold appearance-none shadow-sm outline-none focus:border-indigo-500"
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-1 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Catalogue Part No.</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <select 
                                    required
                                    className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-mono font-bold appearance-none shadow-sm outline-none focus:border-indigo-500"
                                    value={formData.itemCode}
                                    onChange={(e) => handleItemSelection(e.target.value)}
                                >
                                    <option value="">Select Part...</option>
                                    {masterCatalog.map(item => (
                                        <option key={item.id} value={item.itemCode}>{item.itemCode}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Requirement Description</label>
                            <input 
                                required
                                readOnly={!!formData.itemCode}
                                className="w-full px-5 py-3.5 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 outline-none"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Activity Reference</label>
                            <input 
                                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500"
                                placeholder="Mechanical Refurbishment"
                                value={formData.activityLabel}
                                onChange={(e) => setFormData({...formData, activityLabel: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Qty</label>
                                <input 
                                    type="number" required min="1"
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-center outline-none focus:border-indigo-500"
                                    value={formData.quantityRequired}
                                    onChange={(e) => setFormData({...formData, quantityRequired: Number(e.target.value)})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Unit Cost ($)</label>
                                <input 
                                    type="number" required
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-center outline-none focus:border-indigo-500"
                                    value={formData.estimatedUnitCost}
                                    onChange={(e) => setFormData({...formData, estimatedUnitCost: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <div className="shrink-0 p-5 md:p-6 border-t border-slate-100 bg-white shadow-lg">
                <button 
                    onClick={handleSubmit}
                    type="submit"
                    disabled={loading}
                    className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest ${loading ? 'bg-slate-300 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-lg'}`}
                >
                    {loading ? 'ERP Authorizing...' : <><Save size={18}/> Synchronize Record</>}
                </button>
            </div>
        </div>
    );
}