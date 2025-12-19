'use client';

import React, { useState } from 'react';
import { Calendar, Users, Package, Save, X, Plus, AlertCircle } from 'lucide-react';

interface Props {
  projectId: string;
  projectBudget: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MM_ActivityForm({ projectId, projectBudget, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    description: '',
    supervisorId: '',
    allocatedBudget: 0,
    scheduledStart: '',
    scheduledEnd: '',
    requirements: [] as string[],
    currentReq: ''
  });

  const [error, setError] = useState('');

  const handleAddRequirement = () => {
    if (formData.currentReq.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, formData.currentReq.trim()],
        currentReq: ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Logic Check: Budget Validation
    if (formData.allocatedBudget > projectBudget) {
      setError(`Activity budget exceeds remaining project balance of $${projectBudget.toLocaleString()}`);
      return;
    }

    try {
      const res = await fetch('/mm/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, projectId }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to create activity');
      }
    } catch (err) {
      setError('Server communication error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-800">Add Maintenance Activity</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-100">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Task Info */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Description of Work</label>
            <textarea 
              required
              className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none h-20"
              placeholder="e.g., Overhaul of DE11 Traction Motor Bearings..."
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Supervisor</label>
              <select 
                required
                className="w-full border rounded-lg p-2.5 outline-none"
                onChange={(e) => setFormData({...formData, supervisorId: e.target.value})}
              >
                <option value="">Select Supervisor...</option>
                {/* Dynamically populated from User table */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Allocated Budget ($)</label>
              <input 
                required type="number"
                className="w-full border rounded-lg p-2.5 outline-none"
                onChange={(e) => setFormData({...formData, allocatedBudget: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          {/* Timeline Management (Variance Data) */}
          <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div>
              <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Scheduled Start</label>
              <input 
                required type="date"
                className="w-full border-blue-200 border rounded p-2"
                onChange={(e) => setFormData({...formData, scheduledStart: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Scheduled End</label>
              <input 
                required type="date"
                className="w-full border-blue-200 border rounded p-2"
                onChange={(e) => setFormData({...formData, scheduledEnd: e.target.value})}
              />
            </div>
          </div>

          {/* Material Requirements (Triggers PO) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
              <Package size={16} /> Spares & Requirements
            </label>
            <div className="flex gap-2">
              <input 
                className="flex-1 border rounded-lg p-2 outline-none"
                placeholder="Add item (e.g., Gasket Set, Synthetic Oil)"
                value={formData.currentReq}
                onChange={(e) => setFormData({...formData, currentReq: e.target.value})}
              />
              <button 
                type="button" 
                onClick={handleAddRequirement}
                className="bg-slate-800 text-white px-4 rounded-lg hover:bg-black"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.requirements.map((req, i) => (
                <span key={i} className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1 rounded-full shadow-sm">
                  {req}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 border rounded-xl font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              <Save size={20} /> Deploy Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}