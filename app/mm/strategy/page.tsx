'use client';

import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, AlertCircle, Trash2, Edit } from 'lucide-react';

interface Strategy {
  id: string;
  year: number;
  totalBudget: number;
  description: string;
}

export default function MMStrategyPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ year: 2025, totalBudget: 0, description: '' });

  // Fetch Strategies
  const fetchStrategies = async () => {
    const res = await fetch('/api/mm/strategy');
    const data = await res.json();
    setStrategies(data);
  };

  useEffect(() => { fetchStrategies(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/mm/strategy', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowModal(false);
      fetchStrategies();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this Strategic Plan? This will affect child projects.")) {
      await fetch(`/api/mm/strategy/${id}`, { method: 'DELETE' });
      fetchStrategies();
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="text-blue-600" /> MM Strategic Plans
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {strategies.map((plan) => (
          <div key={plan.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <span className="text-3xl font-bold text-blue-600">{plan.year}</span>
              <div className="flex gap-2">
                <button className="text-slate-400 hover:text-blue-600"><Edit size={18} /></button>
                <button onClick={() => handleDelete(plan.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-4 h-12 overflow-hidden">{plan.description}</p>
            <div className="border-t pt-4">
              <span className="text-slate-500 text-xs uppercase font-semibold">Allocated Budget</span>
              <p className="text-xl font-mono font-bold text-slate-800">${plan.totalBudget.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Simplified Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Create Strategic Plan</h2>
            <div className="space-y-4">
              <input type="number" placeholder="Year" className="w-full border p-2 rounded" 
                onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} />
              <input type="number" placeholder="Budget Ceiling" className="w-full border p-2 rounded" 
                onChange={(e) => setFormData({...formData, totalBudget: parseFloat(e.target.value)})} />
              <textarea placeholder="Description" className="w-full border p-2 rounded" 
                onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded">Cancel</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}