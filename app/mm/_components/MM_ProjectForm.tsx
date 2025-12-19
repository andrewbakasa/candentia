'use client';

import React, { useState } from 'react';
import { LayoutGrid, Wrench, User, DollarSign, X } from 'lucide-react';

interface Props {
  planId: string;
  strategicBudget: number;
  workshops: { id: string, name: string }[];
  managers: { id: string, name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function MM_ProjectForm({ planId, strategicBudget, workshops, managers, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    allocatedBudget: 0,
    workshopId: '',
    managerId: '',
    planId: planId
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.allocatedBudget > strategicBudget) {
      setError(`Allocation exceeds Strategic Plan balance of $${strategicBudget.toLocaleString()}`);
      return;
    }

    try {
      const res = await fetch('/mm/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) { onSuccess(); onClose(); }
    } catch (err) { setError('Failed to save project'); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200">
        <div className="p-6 border-b flex justify-between items-center bg-emerald-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-emerald-900">Create Workshop Project</h2>
            <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Strategic Plan ID: {planId.slice(-6)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name</label>
            <input 
              required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Refurbishment of 10 Class 34 Locomotives"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Wrench size={14}/> Target Workshop
              </label>
              <select 
                required className="w-full border rounded-lg p-2.5 outline-none"
                onChange={(e) => setFormData({...formData, workshopId: e.target.value})}
              >
                <option value="">Select Workshop...</option>
                {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign size={14}/> Project Budget
              </label>
              <input 
                type="number" required
                className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={(e) => setFormData({...formData, allocatedBudget: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <User size={14}/> Project Manager
            </label>
            <select 
              required className="w-full border rounded-lg p-2.5 outline-none"
              onChange={(e) => setFormData({...formData, managerId: e.target.value})}
            >
              <option value="">Assign Manager...</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {error && <p className="text-red-600 text-xs font-bold">{error}</p>}

          <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
            <LayoutGrid size={20} /> Authorize Project
          </button>
        </form>
      </div>
    </div>
  );
}