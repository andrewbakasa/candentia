'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, Wrench, User, DollarSign, X, Loader2, Target } from 'lucide-react';

interface StrategicPlan {
  id: string;
  year: number;
  totalBudget: number;
  description?: string;
}

interface Props {
  strategies: StrategicPlan[]; // Now passing all plans
  workshops: { id: string, name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function MM_ProjectForm({ strategies, workshops, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    allocatedBudget: 0,
    workshopId: '',
    managerId: '', 
    planId: '' // Initially empty to force selection
  });
  const [error, setError] = useState('');

  // Find the currently selected plan to determine the budget ceiling
  const selectedPlan = useMemo(() => 
    strategies.find(s => s.id === formData.planId), 
  [formData.planId, strategies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Financial Performance Check (Guideline 1 of 2025)
    if (!formData.planId) {
      setError("Please select a Strategic Plan first");
      setLoading(false);
      return;
    }

    if (formData.allocatedBudget <= 0) {
      setError("Budget must be greater than $0");
      setLoading(false);
      return;
    }

    if (selectedPlan && formData.allocatedBudget > selectedPlan.totalBudget) {
      setError(`Allocation exceeds the FY ${selectedPlan.year} Plan balance of $${selectedPlan.totalBudget.toLocaleString()}`);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/mm/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) { 
        onSuccess(); 
        onClose(); 
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to authorize project');
      }
    } catch (err) { 
      setError('Connection error: Failed to reach the server'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-emerald-50">
          <div>
            <h2 className="text-xl font-bold text-emerald-900">Authorize Workshop Project</h2>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
              Project Authorization Form
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* 1. Strategic Plan Selection - NEW */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Target size={14} className="text-emerald-600"/> Parent Strategic Plan
            </label>
            <select 
              required
              disabled={loading}
              className="w-full border border-slate-200 rounded-lg p-3 outline-none bg-slate-50 focus:bg-white transition-all"
              value={formData.planId}
              onChange={(e) => setFormData({...formData, planId: e.target.value})}
            >
              <option value="">Select Plan (Fiscal Year)...</option>
              {strategies.map(plan => (
                <option key={plan.id} value={plan.id}>
                  FY {plan.year} - {plan.description?.substring(0, 30)}... (${plan.totalBudget.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Project Title</label>
            <input 
              required 
              disabled={loading}
              className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50"
              placeholder="e.g., Heavy Maintenance: Class 34 Loco Fleet"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Workshop Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Wrench size={14} className="text-emerald-600"/> Target Workshop
              </label>
              <select 
                required 
                disabled={loading}
                className="w-full border border-slate-200 rounded-lg p-3 outline-none bg-slate-50 focus:bg-white disabled:opacity-50"
                value={formData.workshopId}
                onChange={(e) => setFormData({...formData, workshopId: e.target.value})}
              >
                <option value="">Select Facility...</option>
                {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            {/* Budget Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <DollarSign size={14} className="text-emerald-600"/> Allocated Budget
              </label>
              <input 
                type="number" 
                required
                disabled={loading}
                className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white disabled:opacity-50"
                placeholder="0.00"
                onChange={(e) => setFormData({...formData, allocatedBudget: parseFloat(e.target.value)})}
              />
              {selectedPlan && (
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">
                  Max Ceiling: ${selectedPlan.totalBudget.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Project Manager Name */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <User size={14} className="text-emerald-600"/> Project Lead / Manager
            </label>
            <input 
              required 
              type="text"
              disabled={loading}
              className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50"
              placeholder="Enter full name"
              value={formData.managerId}
              onChange={(e) => setFormData({...formData, managerId: e.target.value})}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[11px] font-bold flex items-center gap-2 animate-shake">
              <X size={14} className="shrink-0" /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LayoutGrid size={20} />}
            Authorize Maintenance Project
          </button>
        </form>
      </div>
    </div>
  );
}