'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, Target, DollarSign, AlertCircle, UserCheck, Loader2, ShieldCheck } from 'lucide-react';

interface Props {
  initialData?: any; // Receives the record if in Edit mode
  onClose: () => void;
  onSuccess: () => void;
}

export default function MM_StrategicPlanForm({ initialData, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    year: initialData?.year || new Date().getFullYear(),
    description: initialData?.description || '',
    totalBudget: initialData?.totalBudget || 0,
    assignedExecutive: initialData?.assignedExecutive || '' // Aligned with updated model
  });

  // Sync state for Edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        year: initialData.year,
        description: initialData.description,
        totalBudget: initialData.totalBudget,
        assignedExecutive: initialData.assignedExecutive || ''
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const method = initialData ? 'PATCH' : 'POST';
      const endpoint = initialData 
        ? `/mm/api/strategies/${initialData.id}` 
        : '/mm/api/strategies';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        // Handle unique constraint for 'year' from backend
        setError(err.message || `Failed to ${initialData ? 'update' : 'create'} plan`);
      }
    } catch (err) {
      setError('Communication error with Strategic Server');
      console.log("Error:", err)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white max-h-[95vh] overflow-y-auto rounded-t-3xl md:rounded-3xl">
      {/* Header - Corporate Branding */}
      <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Target size={24} className="text-indigo-600" /> 
            {initialData ? 'Modify' : 'Initialize'} Strategic Plan
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">
            Reference: Guideline 1 of 2025 - Maintenance Models
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs flex gap-3 border border-red-100 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={18} className="shrink-0"/> 
            <span className="font-bold uppercase tracking-tight">{error}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Fiscal Year - Unique Constraint */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
              Fiscal Year
            </label>
            <input 
              type="number" 
              required
              disabled={!!initialData} // Usually, we don't change the year of a strategy once set
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 bg-slate-50 font-black text-slate-700 disabled:opacity-50"
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
            />
          </div>

          {/* Budget Ceiling */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
              <DollarSign size={12} className="text-indigo-600"/> HQ Strategic Ceiling ($)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
              <input 
                type="number" 
                step="0.01"
                required
                placeholder="0.00"
                className="w-full border-2 border-slate-100 rounded-xl p-3 pl-8 outline-none focus:border-indigo-500 font-black text-slate-700"
                value={formData.totalBudget}
                onChange={(e) => setFormData({...formData, totalBudget: parseFloat(e.target.value)})}
              />
            </div>
          </div>
        </div>

        {/* Strategic Objective */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Maintenance Strategy Objective</label>
          <textarea 
            required 
            className="w-full border-2 border-slate-100 rounded-2xl p-4 h-40 outline-none focus:border-indigo-500 resize-none text-slate-700 font-medium leading-relaxed"
            placeholder="Outline the high-level roadmap, including infrastructure goals and risk mitigation per Sec 2.2..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        {/* Assigned Executive - String Field */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} className="text-indigo-600" /> Authorized Approving Executive
          </label>
          <input 
            type="text"
            required
            placeholder="e.g., General Manager Operations"
            className="w-full border-2 border-white rounded-xl p-3 outline-none focus:border-indigo-500 text-slate-700 font-bold shadow-sm"
            value={formData.assignedExecutive}
            onChange={(e) => setFormData({...formData, assignedExecutive: e.target.value})}
          />
          <p className="text-[9px] text-slate-400 mt-2 italic font-medium">
            * This individual will be held accountable for the fiscal performance and feasibility of this model.
          </p>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:bg-slate-400"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {initialData ? 'Commit Plan Updates' : 'Authorize Strategic Rollout'}
          </button>
        </div>
      </form>
    </div>
  );
}