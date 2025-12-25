'use client';

import React, { useState, useEffect } from 'react';
import { 
    AlertTriangle, X, Save, Loader2, Info, Clock, 
    DollarSign, Activity, FileText, Package 
} from 'lucide-react';
import { toast } from 'sonner';

interface ActivityItem {
    id: string;
    description: string;
    projectId: string;
}

interface MaterialRequirement {
    id: string;
    material: { itemCode: string; description: string };
}

interface Props {
    initialData?: any; // Used when editing existing delay
    activities: ActivityItem[]; // Master list for selection
    materialRequirements: MaterialRequirement[];
    preselectedActivityId?: string; // Used when "Creating New" from an Activity View
    onClose: () => void;
    onSuccess: () => void;
}

const DELAY_TYPES = [
    { value: 'REWORK_REQUIRED', label: 'Rework Required (Engineering)', color: 'text-red-600' },
    { value: 'MATERIAL_SHORTAGE', label: 'Material Shortage (Procurement)', color: 'text-orange-600' },
    { value: 'FUNDING_LACK', label: 'Funding/Budget Lack (HQ)', color: 'text-amber-600' },
    { value: 'EQUIPMENT_DOWN', label: 'Infrastructure Breakdown (Workshop)', color: 'text-purple-600' },
    { value: 'LABOR_UNAVAILABLE', label: 'Specialized Labor Shortage', color: 'text-blue-600' },
    { value: 'SPARES_CANNIBALIZATION', label: 'Spares Cannibalization', color: 'text-cyan-600' },
];

export default function MM_ProcessDelayForm({ 
    initialData, 
    activities, 
    materialRequirements, 
    preselectedActivityId,
    onClose, 
    onSuccess 
}: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Unified state: projectId is inferred from the chosen activity
    const [formData, setFormData] = useState({
        type: initialData?.type || 'MATERIAL_SHORTAGE',
        activityId: initialData?.activityId || preselectedActivityId || '',
        materialReqId: initialData?.materialReqId || '',
        description: initialData?.description || '',
        impactHours: initialData?.impactHours || 0,
        costImpact: initialData?.costImpact || 0,
        isReworkTriggered: initialData?.isReworkTriggered || false,
    });

    // Automatically update the rework flag if the type is Rework Required
    useEffect(() => {
        if (formData.type === 'REWORK_REQUIRED') {
            setFormData(prev => ({ ...prev, isReworkTriggered: true }));
        }
    }, [formData.type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Find the project associated with the activity to ensure the API gets the correct scope
        const selectedActivity = activities.find(a => a.id === formData.activityId);
        
        const payload = {
            ...formData,
            projectId: selectedActivity?.projectId // Derived from Activity
        };

        try {
            const method = initialData ? 'PATCH' : 'POST';
            const endpoint = initialData ? `/mm/api/delays/${initialData.id}` : '/mm/api/delays';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("Operational Variance Authorized");
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                setError(err.message || 'Validation failed');
            }
        } catch (err) {
            setError('ERP Uplink Failed: Workshop Connectivity Offline');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-white flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b flex justify-between items-center bg-white sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            {initialData ? 'Update Variance' : 'Log Delay Incident'}
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">NRZ Operational Leakage Tracker</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} className="text-slate-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 text-xs font-black border-2 border-red-100">
                        <Info size={18} />
                        <span className="uppercase tracking-wider">{error}</span>
                    </div>
                )}

                {/* Main Linkage: Activity */}
                <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <Activity size={14}/> Activity Context
                    </label>
                    <select 
                        required
                        className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all"
                        value={formData.activityId}
                        onChange={(e) => setFormData({...formData, activityId: e.target.value})}
                    >
                        <option value="">Choose workshop activity...</option>
                        {activities.map(a => (
                            <option key={a.id} value={a.id}>{a.description}</option>
                        ))}
                    </select>
                </div>

                {/* Categorization Card */}
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Incident Category</label>
                        <select 
                            required
                            className="w-full bg-white border-2 border-slate-200/60 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                        >
                            {DELAY_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {formData.type === 'MATERIAL_SHORTAGE' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
                            <label className="text-[11px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                <Package size={14}/> Missing Component
                            </label>
                            <select 
                                className="w-full bg-white border-2 border-orange-100 rounded-2xl p-4 font-bold text-slate-700"
                                value={formData.materialReqId}
                                onChange={(e) => setFormData({...formData, materialReqId: e.target.value})}
                            >
                                <option value="">Select from BoQ...</option>
                                {materialRequirements.map(m => (
                                    <option key={m.id} value={m.id}>{m.material.itemCode} - {m.material.description}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Impact Metrics */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <Clock size={14}/> Stoppage (Hrs)
                        </label>
                        <input 
                            type="number" step="0.5"
                            className="w-full border-2 border-slate-100 rounded-2xl p-4 font-black text-slate-700 focus:border-indigo-500 outline-none bg-white shadow-sm"
                            value={formData.impactHours}
                            onChange={(e) => setFormData({...formData, impactHours: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <DollarSign size={14}/> Cost Leakage ($)
                        </label>
                        <input 
                            type="number"
                            className="w-full border-2 border-slate-100 rounded-2xl p-4 font-black text-slate-900 focus:border-emerald-500 outline-none bg-white shadow-sm"
                            value={formData.costImpact}
                            onChange={(e) => setFormData({...formData, costImpact: parseFloat(e.target.value)})}
                        />
                    </div>
                </div>

                {/* Audit Narrative */}
                <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <FileText size={14}/> Bottleneck Narrative
                    </label>
                    <textarea 
                        required
                        className="w-full border-2 border-slate-100 rounded-3xl p-5 h-32 outline-none focus:border-indigo-500 font-medium text-slate-600 bg-white"
                        placeholder="Provide details for internal audit (e.g. ZESA Power loss or Spare part theft)..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                {/* Footer Submit */}
                <div className="pb-4">
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-indigo-600 flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-slate-200 disabled:bg-slate-200"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        <span className="uppercase tracking-[0.3em] text-xs">
                            Commit Record to Ledger
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
}