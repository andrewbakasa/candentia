'use client';

import React, { useState, useEffect } from 'react';
import { Wrench, MapPin, Activity, Save, X, Settings, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  initialData?: any; // Receives the workshop record for Edit mode
  onClose: () => void;
  onSuccess: () => void;
}

export default function MM_WorkshopForm({ initialData, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    location: initialData?.location || '',
    specialization: initialData?.specialization || 'MECHANICAL',
    capacity: initialData?.capacity || 0,
    isActive: initialData?.isActive ?? true
  });

  // Keep state in sync if a different workshop is selected for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        location: initialData.location,
        specialization: initialData.specialization,
        capacity: initialData.capacity,
        isActive: initialData.isActive
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const method = initialData ? 'PATCH' : 'POST';
      const endpoint = initialData ? `/mm/api/workshops/${initialData.id}` : '/mm/api/workshops';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.message || `Failed to ${initialData ? 'update' : 'register'} workshop`);
      }
    } catch (err) {
      setError('Connection error: Failed to reach NRZ Asset Registry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center bg-indigo-50/50">
        <div>
          <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2">
            <Settings className="text-indigo-600" size={24} /> 
            {initialData ? 'Update' : 'Register'} Workshop
          </h2>
          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">
            Infrastructure & Asset Setup
          </p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-white rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* Workshop Status Toggle (Only visible in Edit or prominent in Create) */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className={formData.isActive ? "text-emerald-500" : "text-slate-300"} />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Operational Status</span>
          </div>
          <button
            type="button"
            onClick={() => setFormData({...formData, isActive: !formData.isActive})}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
              formData.isActive 
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                : "bg-slate-200 text-slate-600 border border-slate-300"
            }`}
          >
            {formData.isActive ? 'Active' : 'Inactive / Under Maintenance'}
          </button>
        </div>

        {/* Workshop Name */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Workshop Name</label>
          <input 
            required 
            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-bold text-slate-700 bg-white transition-all"
            placeholder="e.g., Bulawayo Mechanical Workshop"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Specialization */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
              <Wrench size={12} className="text-indigo-500"/> Specialization
            </label>
            <select 
              required 
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 bg-slate-50 font-bold text-slate-700"
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
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
              <Activity size={12} className="text-indigo-500"/> Daily Capacity
            </label>
            <input 
              type="number" 
              required
              placeholder="Slots/Units"
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-bold text-slate-700"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
            <MapPin size={12} className="text-indigo-500"/> Geographic Location
          </label>
          <input 
            required 
            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-bold text-slate-700"
            placeholder="e.g., Raylton HQ, Bulawayo"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
            <X size={16} className="shrink-0" /> {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-slate-300"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {initialData ? 'Update Workshop Asset' : 'Register Workshop Asset'}
        </button>
      </form>
    </div>
  );
}