'use client';

import React, { useState } from 'react';
import { X, Save, Tag, Hash, Activity, DollarSign, AlertCircle, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MM_MaterialForm({ initialData, projects, projectPlan, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        itemCode: initialData?.itemCode || '',
        description: initialData?.description || '',
        quantityRequired: initialData?.quantityRequired || 1,
        estimatedUnitCost: initialData?.estimatedUnitCost || 0,
        projectId: initialData?.projectId || '', // Corrected from activityId
        activityLabel: initialData?.activityLabel || '', // Added per your schema
        status: initialData?.status || 'DRAFT'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const totalEntryCost = formData.quantityRequired * formData.estimatedUnitCost;

        // Validation against Strategic Ceiling
        if (!projectPlan) {
            setError("Strategic Plan reference missing. Authorization denied.");
            setLoading(false);
            return;
        }

        if (totalEntryCost > projectPlan.totalBudget) {
            setError(`Over-allocation: This entry ($${totalEntryCost.toLocaleString()}) exceeds the project ceiling of $${projectPlan.totalBudget.toLocaleString()}`);
            setLoading(false);
            return;
        }

        try {
            const method = initialData ? 'PATCH' : 'POST';
            const endpoint = initialData ? `/mm/api/materials/${initialData.id}` : '/mm/api/materials';

            const res = await fetch(endpoint, {
                method,
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
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Material Entry</h2>
                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest italic">Guideline 1 Compliance Active</p>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={18} className="text-slate-400" />
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3">
                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                    <p className="text-xs font-bold text-red-700">{error}</p>
                </div>
            )}

            <div className="p-6 space-y-5 overflow-y-auto">
                {/* Item Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Item Code</label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold outline-none focus:border-indigo-500 transition-all"
                                placeholder="MAT-001"
                                value={formData.itemCode}
                                onChange={(e) => setFormData({...formData, itemCode: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Material Description</label>
                        <input 
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                            placeholder="e.g. Structural Steel Beam 10m"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                </div>

                {/* Mapping to Project and Labeling */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Parent Project</label>
                        <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select 
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none appearance-none"
                                value={formData.projectId}
                                onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                            >
                                <option value="">Select Project...</option>
                                {projects?.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Activity Reference</label>
                        <div className="relative">
                            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                                placeholder="e.g. Phase 1 Foundation"
                                value={formData.activityLabel}
                                onChange={(e) => setFormData({...formData, activityLabel: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Costs */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Quantity</label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="number"
                                required
                                min="1"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                                value={formData.quantityRequired}
                                onChange={(e) => setFormData({...formData, quantityRequired: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Est. Unit Cost ($)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                            <input 
                                type="number"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                                value={formData.estimatedUnitCost}
                                onChange={(e) => setFormData({...formData, estimatedUnitCost: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>

                {/* Entry Impact */}
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Budget Impact</span>
                    <span className="text-lg font-black text-indigo-900">${(formData.quantityRequired * formData.estimatedUnitCost).toLocaleString()}</span>
                </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                <button 
                    type="submit"
                    disabled={loading}
                    className={`w-full font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-indigo-600 text-white'}`}
                >
                    {loading ? 'Authorizing...' : <><Save size={18}/> Commit to BoQ Registry</>}
                </button>
            </div>
        </form>
    );
}