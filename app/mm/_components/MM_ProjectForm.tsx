'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, Wrench, User, DollarSign, X, Loader2, Target, AlertCircle, Save, TrendingUp } from 'lucide-react';
import { truncateString } from '@/lib/utils';

interface StrategicPlan {
  id: string;
  year: number;
  totalBudget: number;
  description?: string;
}

interface Props {
  initialData?: any; 
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
    projectManager: initialData?.projectManager || '', // Aligned with updated model
    planId: initialData?.planId || '',
    status: initialData?.status || 'PLANNED'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        allocatedBudget: initialData.allocatedBudget,
        workshopId: initialData.workshopId,
        projectManager: initialData.projectManager || '',
        planId: initialData.planId || '',
        status: initialData.status
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
    
    // Guideline 1 Compliance: Validation against Strategic Ceiling
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
    <div className="w-full bg-white max-h-[90vh] overflow-y-auto rounded-t-3xl">
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <LayoutGrid size={24} className="text-emerald-600" />
            {initialData ? 'Modify' : 'Authorize'} Project
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            NRZ Maintenance & Workshop Allocation
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* Cost Tracking Indicator (Visible in Edit Mode) */}
        {initialData && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-emerald-600" size={20} />
              <div>
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Actual Expenditure to Date</p>
                <p className="text-lg font-black text-emerald-900">${initialData.totalActualCost?.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Budget Utilization</p>
              <p className="text-sm font-bold text-slate-600">
                {((initialData.totalActualCost / initialData.allocatedBudget) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Strategic Plan Selection */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
            <Target size={12} className="text-emerald-600"/> Parent Strategic Plan
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
                FY {plan.year} - {truncateString(plan?.description || "", 30)} (Cap: ${plan.totalBudget.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Project Title */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Project Identification</label>
          <input 
            required 
            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold text-slate-700 placeholder:text-slate-300"
            placeholder="e.g., Heavy Overhaul: Locomotive 1012"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Workshop Selection */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
              <Wrench size={12} className="text-emerald-600"/> Responsible Workshop
            </label>
            <select 
              required 
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 bg-slate-50 font-bold text-slate-700"
              value={formData.workshopId}
              onChange={(e) => setFormData({...formData, workshopId: e.target.value})}
            >
              <option value="">Select Facility...</option>
              {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          {/* Allocation */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
              <DollarSign size={12} className="text-emerald-600"/> Budget Allocation ($)
            </label>
            <input 
              type="number" 
              required
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold text-slate-700"
              value={formData.allocatedBudget}
              onChange={(e) => setFormData({...formData, allocatedBudget: parseFloat(e.target.value)})}
            />
          </div>
        </div>

        {/* Project Manager - Updated to match projectManager String field */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
            <User size={12} className="text-emerald-600"/> Appointed Project Manager
          </label>
          <input 
            required 
            type="text"
            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold text-slate-700"
            placeholder="Enter full name of responsible lead"
            value={formData.projectManager}
            onChange={(e) => setFormData({...formData, projectManager: e.target.value})}
          />
        </div>

        {/* Project Status */}
        {initialData && (
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Operational Status</label>
            <select 
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 bg-white font-bold text-slate-700"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl shadow-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-slate-300"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {initialData ? 'Commit Project Changes' : 'Authorize Project Rollout'}
        </button>
      </form>
    </div>
  );
}
// 'use client';

// import React, { useState, useEffect, useMemo } from 'react';
// import { LayoutGrid, Wrench, User, DollarSign, X, Loader2, Target, AlertCircle } from 'lucide-react';
// import { truncateString } from '@/lib/utils';

// interface StrategicPlan {
//   id: string;
//   year: number;
//   totalBudget: number;
//   description?: string;
// }

// interface Props {
//   initialData?: any; // For Edit Mode
//   strategies: StrategicPlan[];
//   workshops: { id: string, name: string }[];
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function MM_ProjectForm({ initialData, strategies, workshops, onClose, onSuccess }: Props) {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const [formData, setFormData] = useState({
//     name: initialData?.name || '',
//     allocatedBudget: initialData?.allocatedBudget || 0,
//     workshopId: initialData?.workshopId || '',
//     managerId: initialData?.managerId || '', 
//     planId: initialData?.planId || ''
//   });

//   // Keep state in sync if initialData changes
//   useEffect(() => {
//     if (initialData) {
//       setFormData({
//         name: initialData.name,
//         allocatedBudget: initialData.allocatedBudget,
//         workshopId: initialData.workshopId,
//         managerId: initialData.managerId,
//         planId: initialData.planId
//       });
//     }
//   }, [initialData]);

//   const selectedPlan = useMemo(() => 
//     strategies.find(s => s.id === formData.planId), 
//   [formData.planId, strategies]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
    
//     // Business Logic Validations (Guideline 1)
//     if (!formData.planId) {
//       setError("Strategic Plan selection is required for authorization.");
//       setLoading(false);
//       return;
//     }

//     if (selectedPlan && formData.allocatedBudget > selectedPlan.totalBudget) {
//       setError(`Over-allocation: FY ${selectedPlan.year} ceiling is $${selectedPlan.totalBudget.toLocaleString()}`);
//       setLoading(false);
//       return;
//     }

//     try {
//       const method = initialData ? 'PATCH' : 'POST';
//       const endpoint = initialData ? `/mm/api/projects/${initialData.id}` : '/mm/api/projects';

//       const res = await fetch(endpoint, {
//         method,
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });

//       if (res.ok) { 
//         onSuccess(); 
//         onClose(); 
//       } else {
//         const data = await res.json();
//         setError(data.message || 'Authorization failed');
//       }
//     } catch (err) { 
//       setError('Network error: Could not reach NRZ ERP Gateway'); 
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="w-full bg-white">
//       {/* Header */}
//       <div className="p-6 border-b flex justify-between items-center bg-slate-50">
//         <div>
//           <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
//             <LayoutGrid size={24} className="text-emerald-600" />
//             {initialData ? 'Update' : 'Authorize'} Project
//           </h2>
//           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
//             Workshop Resource Allocation
//           </p>
//         </div>
//         <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
//           <X size={20} />
//         </button>
//       </div>

//       <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
//         {/* Strategic Plan Selection */}
//         <div>
//           <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">
//             Parent Strategic Plan
//           </label>
//           <select 
//             required
//             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 bg-slate-50 font-bold text-slate-700 transition-all"
//             value={formData.planId}
//             onChange={(e) => setFormData({...formData, planId: e.target.value})}
//           >
//             <option value="">Select FY Plan...</option>
//             {strategies.map(plan => (
//               <option key={plan.id} value={plan.id}>
//                 FY {plan.year} {truncateString(plan?.description||"",20)} (Ceiling: ${plan.totalBudget.toLocaleString()})
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Project Title */}
//         <div>
//           <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Project Title</label>
//           <input 
//             required 
//             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold text-slate-700 placeholder:text-slate-300"
//             placeholder="e.g., Refurbishment of Class 34 Loco"
//             value={formData.name}
//             onChange={(e) => setFormData({...formData, name: e.target.value})}
//           />
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {/* Workshop Selection */}
//           <div>
//             <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//               <Wrench size={12} className="text-emerald-600"/> Target Facility
//             </label>
//             <select 
//               required 
//               className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 bg-slate-50 font-bold text-slate-700"
//               value={formData.workshopId}
//               onChange={(e) => setFormData({...formData, workshopId: e.target.value})}
//             >
//               <option value="">Select Workshop...</option>
//               {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
//             </select>
//           </div>

//           {/* Budget Input */}
//           <div>
//             <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//               <DollarSign size={12} className="text-emerald-600"/> Allocation
//             </label>
//             <div className="relative">
//                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
//                <input 
//                 type="number" 
//                 required
//                 className="w-full border-2 border-slate-100 rounded-xl p-3 pl-7 outline-none focus:border-emerald-500 font-bold text-slate-700"
//                 value={formData.allocatedBudget}
//                 onChange={(e) => setFormData({...formData, allocatedBudget: parseFloat(e.target.value)})}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Project Lead */}
//         <div>
//           <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//             <User size={12} className="text-emerald-600"/> Project Lead
//           </label>
//           <input 
//             required 
//             type="text"
//             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold text-slate-700"
//             placeholder="Full Name of Lead Engineer"
//             value={formData.managerId}
//             onChange={(e) => setFormData({...formData, managerId: e.target.value})}
//           />
//         </div>

//         {error && (
//           <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
//             <AlertCircle size={16} className="shrink-0" /> {error}
//           </div>
//         )}

//         <button 
//           type="submit" 
//           disabled={loading}
//           className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black shadow-xl shadow-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-slate-300"
//         >
//           {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
//           {initialData ? 'Update Authorization' : 'Authorize Project'}
//         </button>
//       </form>
//     </div>
//   );
// }

// // Minimal Save icon for the button logic
// function Save({ size }: { size: number }) {
//   return <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
// }