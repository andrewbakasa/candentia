'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, Wrench, User, DollarSign, X, Loader2, Target, AlertCircle } from 'lucide-react';

interface StrategicPlan {
  id: string;
  year: number;
  totalBudget: number;
  description?: string;
}

interface Props {
  initialData?: any; // For Edit Mode
  strategies: StrategicPlan[];
  workshops: { id: string, name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function MM_ProjectForm({ initialData, strategies, workshops, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    allocatedBudget: initialData?.allocatedBudget || 0,
    workshopId: initialData?.workshopId || '',
    managerId: initialData?.managerId || '', 
    planId: initialData?.planId || ''
  });

  // Keep state in sync if initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        allocatedBudget: initialData.allocatedBudget,
        workshopId: initialData.workshopId,
        managerId: initialData.managerId,
        planId: initialData.planId
      });
    }
  }, [initialData]);

  const selectedPlan = useMemo(() => 
    strategies.find(s => s.id === formData.planId), 
  [formData.planId, strategies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Business Logic Validations (Guideline 1)
    if (!formData.planId) {
      setError("Strategic Plan selection is required for authorization.");
      setLoading(false);
      return;
    }

    if (selectedPlan && formData.allocatedBudget > selectedPlan.totalBudget) {
      setError(`Over-allocation: FY ${selectedPlan.year} ceiling is $${selectedPlan.totalBudget.toLocaleString()}`);
      setLoading(false);
      return;
    }

    try {
      const method = initialData ? 'PATCH' : 'POST';
      const endpoint = initialData ? `/mm/api/projects/${initialData.id}` : '/mm/api/projects';

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
        setError(data.message || 'Authorization failed');
      }
    } catch (err) { 
      setError('Network error: Could not reach NRZ ERP Gateway'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <LayoutGrid size={24} className="text-emerald-600" />
            {initialData ? 'Update' : 'Authorize'} Project
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Workshop Resource Allocation
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* Strategic Plan Selection */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">
            Parent Strategic Plan
          </label>
          <select 
            required
            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 bg-slate-50 font-bold text-slate-700 transition-all"
            value={formData.planId}
            onChange={(e) => setFormData({...formData, planId: e.target.value})}
          >
            <option value="">Select FY Plan...</option>
            {strategies.map(plan => (
              <option key={plan.id} value={plan.id}>
                FY {plan.year} (Ceiling: ${plan.totalBudget.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Project Title */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Project Title</label>
          <input 
            required 
            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold text-slate-700 placeholder:text-slate-300"
            placeholder="e.g., Refurbishment of Class 34 Loco"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Workshop Selection */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
              <Wrench size={12} className="text-emerald-600"/> Target Facility
            </label>
            <select 
              required 
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 bg-slate-50 font-bold text-slate-700"
              value={formData.workshopId}
              onChange={(e) => setFormData({...formData, workshopId: e.target.value})}
            >
              <option value="">Select Workshop...</option>
              {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          {/* Budget Input */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
              <DollarSign size={12} className="text-emerald-600"/> Allocation
            </label>
            <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
               <input 
                type="number" 
                required
                className="w-full border-2 border-slate-100 rounded-xl p-3 pl-7 outline-none focus:border-emerald-500 font-bold text-slate-700"
                value={formData.allocatedBudget}
                onChange={(e) => setFormData({...formData, allocatedBudget: parseFloat(e.target.value)})}
              />
            </div>
          </div>
        </div>

        {/* Project Lead */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
            <User size={12} className="text-emerald-600"/> Project Lead
          </label>
          <input 
            required 
            type="text"
            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold text-slate-700"
            placeholder="Full Name of Lead Engineer"
            value={formData.managerId}
            onChange={(e) => setFormData({...formData, managerId: e.target.value})}
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black shadow-xl shadow-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-slate-300"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {initialData ? 'Update Authorization' : 'Authorize Project'}
        </button>
      </form>
    </div>
  );
}

// Minimal Save icon for the button logic
function Save({ size }: { size: number }) {
  return <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
}
// 'use client';

// import React, { useState, useEffect, useMemo } from 'react';
// import { LayoutGrid, Wrench, User, DollarSign, X, Loader2, Target } from 'lucide-react';

// interface StrategicPlan {
//   id: string;
//   year: number;
//   totalBudget: number;
//   description?: string;
// }

// interface Props {
//   strategies: StrategicPlan[]; // Now passing all plans
//   workshops: { id: string, name: string }[];
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function MM_ProjectForm({ strategies, workshops, onClose, onSuccess }: Props) {
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     name: '',
//     allocatedBudget: 0,
//     workshopId: '',
//     managerId: '', 
//     planId: '' // Initially empty to force selection
//   });
//   const [error, setError] = useState('');

//   // Find the currently selected plan to determine the budget ceiling
//   const selectedPlan = useMemo(() => 
//     strategies.find(s => s.id === formData.planId), 
//   [formData.planId, strategies]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
    
//     // Financial Performance Check (Guideline 1 of 2025)
//     if (!formData.planId) {
//       setError("Please select a Strategic Plan first");
//       setLoading(false);
//       return;
//     }

//     if (formData.allocatedBudget <= 0) {
//       setError("Budget must be greater than $0");
//       setLoading(false);
//       return;
//     }

//     if (selectedPlan && formData.allocatedBudget > selectedPlan.totalBudget) {
//       setError(`Allocation exceeds the FY ${selectedPlan.year} Plan balance of $${selectedPlan.totalBudget.toLocaleString()}`);
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await fetch('/mm/api/projects', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });

//       if (res.ok) { 
//         onSuccess(); 
//         onClose(); 
//       } else {
//         const data = await res.json();
//         setError(data.message || 'Failed to authorize project');
//       }
//     } catch (err) { 
//       setError('Connection error: Failed to reach the server'); 
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
//         {/* Header */}
//         <div className="p-6 border-b flex justify-between items-center bg-emerald-50">
//           <div>
//             <h2 className="text-xl font-bold text-emerald-900">Authorize Workshop Project</h2>
//             <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
//               Project Authorization Form
//             </p>
//           </div>
//           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
//             <X size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
//           {/* 1. Strategic Plan Selection - NEW */}
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
//               <Target size={14} className="text-emerald-600"/> Parent Strategic Plan
//             </label>
//             <select 
//               required
//               disabled={loading}
//               className="w-full border border-slate-200 rounded-lg p-3 outline-none bg-slate-50 focus:bg-white transition-all"
//               value={formData.planId}
//               onChange={(e) => setFormData({...formData, planId: e.target.value})}
//             >
//               <option value="">Select Plan (Fiscal Year)...</option>
//               {strategies.map(plan => (
//                 <option key={plan.id} value={plan.id}>
//                   FY {plan.year} - {plan.description?.substring(0, 30)}... (${plan.totalBudget.toLocaleString()})
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Project Name */}
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-1.5">Project Title</label>
//             <input 
//               required 
//               disabled={loading}
//               className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50"
//               placeholder="e.g., Heavy Maintenance: Class 34 Loco Fleet"
//               value={formData.name}
//               onChange={(e) => setFormData({...formData, name: e.target.value})}
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             {/* Workshop Selection */}
//             <div>
//               <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
//                 <Wrench size={14} className="text-emerald-600"/> Target Workshop
//               </label>
//               <select 
//                 required 
//                 disabled={loading}
//                 className="w-full border border-slate-200 rounded-lg p-3 outline-none bg-slate-50 focus:bg-white disabled:opacity-50"
//                 value={formData.workshopId}
//                 onChange={(e) => setFormData({...formData, workshopId: e.target.value})}
//               >
//                 <option value="">Select Facility...</option>
//                 {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
//               </select>
//             </div>

//             {/* Budget Input */}
//             <div>
//               <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
//                 <DollarSign size={14} className="text-emerald-600"/> Allocated Budget
//               </label>
//               <input 
//                 type="number" 
//                 required
//                 disabled={loading}
//                 className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white disabled:opacity-50"
//                 placeholder="0.00"
//                 onChange={(e) => setFormData({...formData, allocatedBudget: parseFloat(e.target.value)})}
//               />
//               {selectedPlan && (
//                 <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">
//                   Max Ceiling: ${selectedPlan.totalBudget.toLocaleString()}
//                 </span>
//               )}
//             </div>
//           </div>

//           {/* Project Manager Name */}
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
//               <User size={14} className="text-emerald-600"/> Project Lead / Manager
//             </label>
//             <input 
//               required 
//               type="text"
//               disabled={loading}
//               className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50"
//               placeholder="Enter full name"
//               value={formData.managerId}
//               onChange={(e) => setFormData({...formData, managerId: e.target.value})}
//             />
//           </div>

//           {error && (
//             <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[11px] font-bold flex items-center gap-2 animate-shake">
//               <X size={14} className="shrink-0" /> {error}
//             </div>
//           )}

//           <button 
//             type="submit" 
//             disabled={loading}
//             className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
//           >
//             {loading ? <Loader2 className="animate-spin" size={20} /> : <LayoutGrid size={20} />}
//             Authorize Maintenance Project
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }