'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, Target, DollarSign, AlertCircle, UserCheck, Loader2 } from 'lucide-react';

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
    executiveId: initialData?.executiveId || '' 
  });

  // Sync state if initialData changes while component is mounted
  useEffect(() => {
    if (initialData) {
      setFormData({
        year: initialData.year,
        description: initialData.description,
        totalBudget: initialData.totalBudget,
        executiveId: initialData.executiveId
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Determine if we are updating or creating
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
        setError(err.message || `Failed to ${initialData ? 'update' : 'create'} plan`);
      }
    } catch (err) {
      setError('Communication error with NRZ Server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white">
      {/* Header - Styled for the Modal Container */}
      <div className="p-6 border-b flex justify-between items-center bg-slate-50">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Target size={24} className="text-blue-600" /> 
          {initialData ? 'Edit' : 'New'} Strategic Plan
        </h2>
        {/* Close button for desktop/mobile consistency */}
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm flex gap-3 border border-red-100 animate-in fade-in zoom-in duration-200">
            <AlertCircle size={20} className="shrink-0"/> 
            <span className="font-semibold">{error}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Fiscal Year</label>
            <input 
              type="number" 
              required
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-blue-500 bg-slate-50 font-bold text-slate-700"
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Budget Ceiling ($)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input 
                type="number" 
                step="0.01"
                required
                placeholder="0.00"
                className="w-full border-2 border-slate-100 rounded-xl p-3 pl-8 outline-none focus:border-blue-500 font-bold text-slate-700"
                value={formData.totalBudget}
                onChange={(e) => setFormData({...formData, totalBudget: parseFloat(e.target.value)})}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Strategic Objective</label>
          <textarea 
            required 
            className="w-full border-2 border-slate-100 rounded-xl p-4 h-32 outline-none focus:border-blue-500 resize-none text-slate-700 font-medium"
            placeholder="Outline the high-level maintenance strategy and milestones for this fiscal year..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-2">
            <UserCheck size={14} className="text-blue-600" /> Authorized Executive
          </label>
          <input 
            type="text"
            required
            placeholder="Enter Name of Approving Executive..."
            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-blue-500 text-slate-700 font-bold"
            value={formData.executiveId}
            onChange={(e) => setFormData({...formData, executiveId: e.target.value})}
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:bg-slate-400"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {initialData ? 'Update Strategic Plan' : 'Initialize Strategic Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
// 'use client';

// import React, { useState } from 'react';
// import { Save, X, Target, DollarSign, AlertCircle, UserCheck } from 'lucide-react';

// interface Props {
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function MM_StrategicPlanForm({ onClose, onSuccess }: Props) {
//   const [formData, setFormData] = useState({
//     year: new Date().getFullYear(),
//     description: '',
//     totalBudget: 0,
//     executiveId: '' // Now treated as a manual text input for the name/ID
//   });
//   const [error, setError] = useState('');

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
    
//     try {
//       const res = await fetch('/mm/api/strategies', {
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
//       setError('Communication error with NRZ Server');
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200">
//         <div className="p-6 border-b flex justify-between items-center bg-indigo-50 rounded-t-2xl">
//           <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
//             <Target size={24} /> New Strategic Plan
//           </h2>
//           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
//             <X size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-4">
//           {error && (
//             <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex gap-2 border border-red-100">
//               <AlertCircle size={18}/> {error}
//             </div>
//           )}
          
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-semibold text-slate-700 mb-1">Fiscal Year</label>
//               <input 
//                 type="number" 
//                 required
//                 className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
//                 value={formData.year}
//                 onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-semibold text-slate-700 mb-1">Budget Ceiling ($)</label>
//               <div className="relative">
//                 <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
//                 <input 
//                   type="number" 
//                   required
//                   placeholder="0.00"
//                   className="w-full border rounded-lg p-2.5 pl-7 outline-none focus:ring-2 focus:ring-indigo-500"
//                   onChange={(e) => setFormData({...formData, totalBudget: parseFloat(e.target.value)})}
//                 />
//               </div>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-semibold text-slate-700 mb-1">Strategic Objective</label>
//             <textarea 
//               required 
//               className="w-full border rounded-lg p-2.5 h-24 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
//               placeholder="Describe the high-level maintenance strategy for this period..."
//               onChange={(e) => setFormData({...formData, description: e.target.value})}
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
//               <UserCheck size={16} className="text-indigo-600" /> Authorized Executive
//             </label>
//             <input 
//               type="text"
//               required
//               placeholder="Enter Executive Name or ID..."
//               className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
//               value={formData.executiveId}
//               onChange={(e) => setFormData({...formData, executiveId: e.target.value})}
//             />
//           </div>

//           <div className="pt-2">
//             <button 
//               type="submit" 
//               className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
//             >
//               Initialize Strategic Plan
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }