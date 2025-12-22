'use client';

import React, { useState } from 'react';
import { X, Save, Package, Hash, Ruler, DollarSign, Tag, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MM_MasterMaterialForm({ initialData, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    itemCode: initialData?.itemCode || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    unitOfMeasure: initialData?.unitOfMeasure || 'units',
    lastKnownCost: initialData?.lastKnownCost || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/mm/api/mastermaterials/${initialData.id}` : '/mm/api/mastermaterials';
      
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lastKnownCost: formData.lastKnownCost ? Number(formData.lastKnownCost) : null,
        }),
      });

      if (res.ok) {
        toast.success(isEdit ? 'Catalog Entry Updated' : 'New Part Registered');
        onSuccess();
      } else {
        const d = await res.json();
        setError(d.message || 'Validation Failed');
      }
    } catch (err) {
      setError('Connection to Catalog Ledger Failed');
    } finally {
      setLoading(false);
    }
  };

  const categories = ["Mechanical", "Electrical", "Civil", "Permanent Way", "Signalling", "Tools", "Safety"];
  const uoms = ["units", "meters", "kg", "liters", "sets", "pairs", "rolls"];

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
      {/* Header */}
      <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg"><Package size={20}/></div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Master Catalog Entry</h2>
            <p className="text-[10px] text-slate-400 font-mono">NRZ Material Registry System</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X/></button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
        <div className="grid grid-cols-2 gap-6">
          
          {/* Item Code */}
          <div className="col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-wider">Item / Part Code</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              <input 
                required
                disabled={!!initialData} // Prevent changing unique ID after creation
                placeholder="e.g. M-10293-X"
                className="w-full p-3 pl-10 bg-slate-50 rounded-xl text-xs font-bold border border-slate-100 outline-emerald-500 disabled:opacity-50 font-mono"
                value={formData.itemCode}
                onChange={(e) => setFormData({...formData, itemCode: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          {/* Category */}
          <div className="col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-wider">Department Category</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              <select 
                className="w-full p-3 pl-10 bg-slate-50 rounded-xl text-xs font-bold border border-slate-100 outline-emerald-500 appearance-none"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select Category...</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-wider">Official Description</label>
            <textarea 
              required
              rows={3}
              placeholder="Enter precise technical description for procurement..."
              className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border border-slate-100 outline-emerald-500"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Unit of Measure */}
          <div className="col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-wider">Unit of Measure (UoM)</label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              <select 
                className="w-full p-3 pl-10 bg-slate-50 rounded-xl text-xs font-bold border border-slate-100 outline-emerald-500 appearance-none"
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({...formData, unitOfMeasure: e.target.value})}
              >
                {uoms.map(uom => <option key={uom} value={uom}>{uom}</option>)}
              </select>
            </div>
          </div>

          {/* Last Known Cost */}
          <div className="col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-wider">Estimated Unit Cost ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              <input 
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full p-3 pl-10 bg-slate-50 rounded-xl text-xs font-bold border border-slate-100 outline-emerald-500"
                value={formData.lastKnownCost}
                onChange={(e) => setFormData({...formData, lastKnownCost: e.target.value})}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase">
            <AlertCircle size={16}/> {error}
          </div>
        )}

        <div className="pt-4 border-t flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200"
          >
            {loading ? <Loader2 className="animate-spin" size={16}/> : <><Save size={16}/> {initialData ? 'Update Record' : 'Register Material'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}