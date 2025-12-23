'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Activity, DollarSign, AlertCircle, Briefcase, Search, Info, Package } from 'lucide-react';
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

    useEffect(() => {
        if (formData.projectId && projects && strategies) {
            const project = projects.find((p: any) => p.id === formData.projectId);
            if (project) {
                const plan = strategies.find((s: any) => s.id === project.planId);
                setSelectedPlan(plan);
                setError('');
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

        if (!selectedPlan) {
            setError("Strategic Plan reference missing. Authorization denied.");
            setLoading(false);
            return;
        }

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
        /* The container now uses h-[90vh] or h-full with flex-col to force the footer to stay in view */
        <div className="flex flex-col h-full max-h-[95vh] md:max-h-[90vh] bg-white rounded-t-3xl overflow-hidden shadow-2xl">
            
            {/* STICKY HEADER */}
            <div className="shrink-0 p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Package size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Project BoQ Entry</h2>
                        <p className="text-[9px] md:text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">Intergrated Hub</p>
                    </div>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                <div className="p-5 md:p-8 space-y-6">
                    
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-xs font-bold text-red-700 leading-tight">{error}</p>
                        </div>
                    )}

                    {/* Section 1: Strategic Context */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Parent Project Selection</label>
                            <div className="relative group">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <select 
                                    required
                                    className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none shadow-sm"
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

                        {selectedPlan && (
                            <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><DollarSign size={16}/></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Budget Ceiling</p>
                                        <p className="text-sm font-black text-slate-900">${selectedPlan.totalBudget?.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase">Status</p>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{selectedPlan.name}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <hr className="border-slate-100" />

                    {/* Section 2: Material Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-1 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Catalogue Part No.</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                <select 
                                    required
                                    className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-mono font-bold outline-none focus:border-indigo-500 appearance-none shadow-sm transition-all"
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
                                className="w-full px-5 py-3.5 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold outline-none text-slate-600"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Section 3: Financials & Activity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Activity Reference</label>
                            <div className="relative group">
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input 
                                    className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 shadow-sm transition-all"
                                    placeholder="e.g. Mechanical Refurbishment"
                                    value={formData.activityLabel}
                                    onChange={(e) => setFormData({...formData, activityLabel: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Qty</label>
                                <input 
                                    type="number"
                                    required
                                    min="1"
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 shadow-sm transition-all text-center"
                                    value={formData.quantityRequired}
                                    onChange={(e) => setFormData({...formData, quantityRequired: Number(e.target.value)})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Unit Cost ($)</label>
                                <input 
                                    type="number"
                                    required
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 shadow-sm transition-all text-center"
                                    value={formData.estimatedUnitCost}
                                    onChange={(e) => setFormData({...formData, estimatedUnitCost: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Commitment Summary Card */}
                    <div className="p-6 bg-slate-900 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl border border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <DollarSign size={20}/>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Commitment</p>
                                <p className="text-2xl font-black text-white leading-none mt-1">${(formData.quantityRequired * formData.estimatedUnitCost).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="hidden md:block h-10 w-[1px] bg-slate-800"></div>
                        <div className="text-center md:text-right">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter italic">Authorized via Shareholders Guideline 1 of 2025</p>
                        </div>
                    </div>
                </div>
            </form>

            {/* FIXED FOOTER */}
            <div className="shrink-0 p-5 md:p-6 border-t border-slate-100 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
                <button 
                    onClick={handleSubmit}
                    type="submit"
                    disabled={loading}
                    className={`w-full font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest active:scale-95 ${loading ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>ERP Authorizing...</span>
                        </div>
                    ) : (
                        <><Save size={18}/> Authorize BoQ Entry</>
                    )}
                </button>
            </div>
        </div>
    );
}