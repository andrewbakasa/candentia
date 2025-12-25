'use client';
import React, { useState, useEffect } from 'react';
import { X, Save, Clock, AlertCircle, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

// Define the options matching your specific Enum for clear mapping
const DELAY_OPTIONS = [
    { value: 'REWORK_REQUIRED', label: 'QA Failure / Rework Required' },
    { value: 'MATERIAL_SHORTAGE', label: 'Material Shortage (BoQ/PO)' },
    { value: 'FUNDING_LACK', label: 'Funding Lack (Budget Ceiling)' },
    { value: 'EQUIPMENT_DOWN', label: 'Equipment / Infrastructure Failure' },
    { value: 'LABOR_UNAVAILABLE', label: 'Labor / Skill Shortage' },
    { value: 'SAFETY_HALT', label: 'Safety Halt / Audit' },
    { value: 'THIRD_PARTY_REPAIR', label: 'Third Party Specialist' },
    { value: 'UTILITY_OUTAGE', label: 'Utility Outage (Power/Water)' },
    { value: 'SPARES_CANNIBALIZATION', label: 'Spares Cannibalization' },
    { value: 'OTHER', label: 'Other / Uncategorized' },
];

export default function MM_ProcessDelayForm({ initialData, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const isEditMode = Boolean(initialData?.id);

    const [formData, setFormData] = useState({
        activityId: initialData?.activityId || '', 
        type: initialData?.type || 'EQUIPMENT_DOWN', // Default must match enum
        description: initialData?.description || '',
        impactHours: initialData?.impactHours || 0,
        costImpact: initialData?.costImpact || 0,
        isReworkTriggered: initialData?.isReworkTriggered || false,
        materialReqId: initialData?.materialReqId || null
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                activityId: initialData.activityId || prev.activityId,
                type: initialData.type || prev.type,
                description: initialData.description || prev.description,
                impactHours: initialData.impactHours || prev.impactHours,
                costImpact: initialData.costImpact || prev.costImpact,
                isReworkTriggered: initialData.isReworkTriggered ?? prev.isReworkTriggered,
                ...(isEditMode ? initialData : {})
            }));
        }
    }, [initialData, isEditMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const method = isEditMode ? 'PATCH' : 'POST';
            const url = isEditMode ? `/mm/api/delays/${initialData.id}` : `/mm/api/delays`;
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await res.json();

            if (res.ok) {
                toast.success('Delay record synchronized with ledger');
                onSuccess();
            } else {
                throw new Error(result.message || 'Prisma Validation Failed');
            }
        } catch (err: any) {
            console.error("Delay Sync Error:", err);
            toast.error(err.message || "Internal Server Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-rose-100">
                
                {/* HEADER */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-600 text-white rounded-xl shadow-sm">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                {isEditMode ? 'Amend Delay' : 'Log Process Delay'}
                            </h2>
                            <p className="text-[9px] text-rose-600 font-bold uppercase tracking-widest mt-0.5">
                                Guideline 1 of 2025 • Workshop Operations
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* TYPE SELECT */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Reason Category</label>
                        <select 
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                        >
                            {DELAY_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Incident Description</label>
                        <textarea 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium h-24 outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                            placeholder="Detail the cause (e.g., ZESA outage or Artisan shortage)..."
                            required
                        />
                    </div>

                    {/* METRICS GRID */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Impact (Hours)</label>
                            <input 
                                type="number" 
                                value={formData.impactHours}
                                onChange={(e) => setFormData({...formData, impactHours: parseFloat(e.target.value) || 0})}
                                className="w-full bg-transparent text-lg font-black outline-none text-slate-900"
                            />
                        </div>
                        <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100">
                            <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1 block">Cost Impact ($)</label>
                            <input 
                                type="number" 
                                value={formData.costImpact}
                                onChange={(e) => setFormData({...formData, costImpact: parseFloat(e.target.value) || 0})}
                                className="w-full bg-transparent text-lg font-black outline-none text-rose-600"
                            />
                        </div>
                    </div>

                    {/* REWORK TOGGLE */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-amber-500" />
                            <div>
                                <p className="text-[10px] font-black text-slate-800 uppercase">Trigger Rework?</p>
                                <p className="text-[8px] text-slate-400 font-bold uppercase">Updates Rework Ledger</p>
                            </div>
                        </div>
                        <input 
                            type="checkbox"
                            checked={formData.isReworkTriggered}
                            onChange={(e) => setFormData({...formData, isReworkTriggered: e.target.checked})}
                            className="w-5 h-5 accent-rose-600 rounded"
                        />
                    </div>

                    {/* SUBMIT */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-black uppercase text-xs shadow-lg transition-all flex items-center justify-center gap-2 
                            ${loading ? 'bg-slate-100 text-slate-400' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100 active:scale-[0.98]'}`}
                    >
                        {loading ? 'Processing...' : <><Save size={16}/> Save to Project Ledger</>}
                    </button>
                </form>
            </div>
        </div>
    );
}