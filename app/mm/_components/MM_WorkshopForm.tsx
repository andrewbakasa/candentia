'use client';

import React, { useState } from 'react';
import { Wrench, MapPin, Activity, Save, X, Settings } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function MM_WorkshopForm({ onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    specialization: 'MECHANICAL', // Default enum-style value
    capacity: 0,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/mm/api/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to register workshop');
      }
    } catch (err) {
      setError('Connection error: Could not reach workshop API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header - Purple/Indigo theme to differentiate from Projects */}
        <div className="p-6 border-b flex justify-between items-center bg-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
              <Settings className="text-indigo-600" size={24} /> 
              Register New Workshop
            </h2>
            <p className="text-xs text-indigo-600 font-medium uppercase tracking-widest mt-1">Maintenance Infrastructure Setup</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Workshop Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Workshop Name</label>
            <input 
              required 
              className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white"
              placeholder="e.g., Bulawayo Mechanical Workshop"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Specialization */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Wrench size={14} className="text-indigo-500"/> Specialization
              </label>
              <select 
                required 
                className="w-full border border-slate-200 rounded-lg p-3 outline-none bg-slate-50 focus:bg-white"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
              >
                <option value="MECHANICAL">Mechanical</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="CIVIL">Civil Engineering</option>
                <option value="LOGISTICS">Logistics & Supply</option>
              </select>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Activity size={14} className="text-indigo-500"/> Daily Capacity
              </label>
              <input 
                type="number" 
                required
                placeholder="Slots/Units"
                className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin size={14} className="text-indigo-500"/> Geographic Location
            </label>
            <input 
              required 
              className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
              placeholder="e.g., Raylton, Bulawayo HQ"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold">
              <X size={14} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5" /> : <Save size={20} />}
            Register Workshop Asset
          </button>
        </form>
      </div>
    </div>
  );
}