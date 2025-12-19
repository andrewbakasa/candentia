'use client';

import React, { useState } from 'react';
import { Save, X, Target, DollarSign, AlertCircle, UserCheck } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function MM_StrategicPlanForm({ onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    description: '',
    totalBudget: 0,
    executiveId: '' // Now treated as a manual text input for the name/ID
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/mm/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to create plan');
      }
    } catch (err) {
      setError('Communication error with NRZ Server');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200">
        <div className="p-6 border-b flex justify-between items-center bg-indigo-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <Target size={24} /> New Strategic Plan
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex gap-2 border border-red-100">
              <AlertCircle size={18}/> {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fiscal Year</label>
              <input 
                type="number" 
                required
                className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Budget Ceiling ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                <input 
                  type="number" 
                  required
                  placeholder="0.00"
                  className="w-full border rounded-lg p-2.5 pl-7 outline-none focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => setFormData({...formData, totalBudget: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Strategic Objective</label>
            <textarea 
              required 
              className="w-full border rounded-lg p-2.5 h-24 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Describe the high-level maintenance strategy for this period..."
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
              <UserCheck size={16} className="text-indigo-600" /> Authorized Executive
            </label>
            <input 
              type="text"
              required
              placeholder="Enter Executive Name or ID..."
              className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.executiveId}
              onChange={(e) => setFormData({...formData, executiveId: e.target.value})}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              Initialize Strategic Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// 'use client';

// import React, { useState } from 'react';
// import { Save, X, Target, DollarSign, AlertCircle } from 'lucide-react';

// interface Props {
//   executives: { id: string, name: string }[];
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function MM_StrategicPlanForm({ executives, onClose, onSuccess }: Props) {
//   const [formData, setFormData] = useState({
//     year: new Date().getFullYear(),
//     description: '',
//     totalBudget: 0,
//     executiveId: ''
//   });
//   const [error, setError] = useState('');

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       const res = await fetch('/api/mm/strategic-plans', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });

//       if (res.ok) {
//         onSuccess();
//         onClose();
//       } else {
//         const err = await res.json();
//         setError(err.message || 'Failed to create plan');
//       }
//     } catch (err) {
//       setError('Communication error');
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200">
//         <div className="p-6 border-b flex justify-between items-center bg-indigo-50 rounded-t-2xl">
//           <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
//             <Target size={24} /> New Strategic Plan
//           </h2>
//           <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-4">
//           {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex gap-2"><AlertCircle size={18}/>{error}</div>}
          
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-semibold text-slate-700 mb-1">Fiscal Year</label>
//               <input 
//                 type="number" required
//                 className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
//                 value={formData.year}
//                 onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-semibold text-slate-700 mb-1">Budget Ceiling ($)</label>
//               <input 
//                 type="number" required
//                 className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
//                 placeholder="0.00"
//                 onChange={(e) => setFormData({...formData, totalBudget: parseFloat(e.target.value)})}
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-semibold text-slate-700 mb-1">Strategic Objective</label>
//             <textarea 
//               required className="w-full border rounded-lg p-2.5 h-24 outline-none focus:ring-2 focus:ring-indigo-500"
//               placeholder="Outline the primary maintenance goals for this period..."
//               onChange={(e) => setFormData({...formData, description: e.target.value})}
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-semibold text-slate-700 mb-1">Assigned Executive</label>
//             <select 
//               required className="w-full border rounded-lg p-2.5 outline-none"
//               onChange={(e) => setFormData({...formData, executiveId: e.target.value})}
//             >
//               <option value="">Select Lead Executive...</option>
//               {executives.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
//             </select>
//           </div>

//           <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg mt-2">
//             Initialize Strategic Plan
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }