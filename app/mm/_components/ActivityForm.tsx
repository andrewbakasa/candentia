'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Package, Save, X, Plus, AlertCircle, Briefcase, Loader2, User, Clock } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  allocatedBudget: number;
}

interface Props {
  initialData?: any; 
  projects: Project[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function MM_ActivityForm({ initialData, projects, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    projectId: initialData?.projectId || '',
    description: initialData?.description || '',
    supervisor: initialData?.supervisor || '', // Aligned with Model
    allocatedBudget: initialData?.allocatedBudget || 0,
    scheduledStart: initialData?.scheduledStart ? formatDate(initialData.scheduledStart) : '',
    scheduledEnd: initialData?.scheduledEnd ? formatDate(initialData.scheduledEnd) : '',
    actualEnd: initialData?.actualEnd ? formatDate(initialData.actualEnd) : '', // New: Variance Engine
    varianceReason: initialData?.varianceReason || '', // New: Guideline 1 Compliance
    requirements: (initialData?.requirements as string[]) || [],
    currentReq: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        projectId: initialData.projectId,
        description: initialData.description,
        supervisor: initialData.supervisor || '',
        allocatedBudget: initialData.allocatedBudget,
        scheduledStart: formatDate(initialData.scheduledStart),
        scheduledEnd: formatDate(initialData.scheduledEnd),
        actualEnd: formatDate(initialData.actualEnd),
        varianceReason: initialData.varianceReason || '',
        requirements: initialData.requirements || [],
        currentReq: ''
      });
    }
  }, [initialData]);

  const selectedProject = useMemo(() => 
    projects.find(p => p.id === formData.projectId),
  [formData.projectId, projects]);

  // Check if activity is overdue for Variance reporting
  const isOverdue = useMemo(() => {
    if (!formData.scheduledEnd) return false;
    return new Date() > new Date(formData.scheduledEnd) && !formData.actualEnd;
  }, [formData.scheduledEnd, formData.actualEnd]);

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
    setLoading(true);
    setError('');

    if (selectedProject && formData.allocatedBudget > selectedProject.allocatedBudget) {
      setError(`Variance Alert: Activity budget ($${formData.allocatedBudget}) exceeds Project balance ($${selectedProject.allocatedBudget})`);
      setLoading(false);
      return;
    }

    try {
      const method = initialData ? 'PATCH' : 'POST';
      const endpoint = initialData ? `/mm/api/activities/${initialData.id}` : '/mm/api/activities';

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
        setError(err.message || 'Deployment failed');
      }
    } catch (err) {
      setError('Communication link failure with NRZ ERP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Package size={24} className="text-indigo-600" />
            {initialData ? 'Update' : 'Deploy'} Maintenance Activity
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">NRZ Maintenance Module v2025</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-xs font-bold border border-red-100">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
        )}

        {/* Project Selection */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
            <Briefcase size={12} className="text-indigo-600"/> Parent Project Assignment
          </label>
          <select 
            required
            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 bg-slate-50 font-bold text-slate-700 transition-all"
            value={formData.projectId}
            onChange={(e) => setFormData({...formData, projectId: e.target.value})}
          >
            <option value="">Select Project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} (Cap: ${p.allocatedBudget.toLocaleString()})</option>
            ))}
          </select>
        </div>

        {/* Supervisor & Budget Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
              <User size={12} className="text-indigo-600"/> Responsible Supervisor
            </label>
            <input 
              required
              type="text"
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-bold text-slate-700"
              placeholder="e.g., Senior Engineer Mapfumo"
              value={formData.supervisor}
              onChange={(e) => setFormData({...formData, supervisor: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Allocated Activity Budget ($)</label>
            <input 
              required type="number"
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-bold text-slate-700"
              value={formData.allocatedBudget}
              onChange={(e) => setFormData({...formData, allocatedBudget: parseFloat(e.target.value)})}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Scope of Work</label>
          <textarea 
            required
            className="w-full border-2 border-slate-100 rounded-xl p-4 outline-none focus:border-indigo-500 h-24 bg-white font-medium text-slate-700"
            placeholder="Detailed technical specifications..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        {/* Timeline & Variance Section */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Calendar size={12}/> Scheduled Start
              </label>
              <input 
                required type="date"
                className="w-full bg-transparent font-bold text-slate-700 outline-none"
                value={formData.scheduledStart}
                onChange={(e) => setFormData({...formData, scheduledStart: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Calendar size={12}/> Scheduled End
              </label>
              <input 
                required type="date"
                className="w-full bg-transparent font-bold text-slate-700 outline-none"
                value={formData.scheduledEnd}
                onChange={(e) => setFormData({...formData, scheduledEnd: e.target.value})}
              />
            </div>
          </div>

          {initialData && (
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-[10px] font-black text-emerald-600 uppercase mb-1 flex items-center gap-1">
                <Clock size={12}/> Actual Completion Date
              </label>
              <input 
                type="date"
                className="w-full bg-transparent font-bold text-slate-700 outline-none"
                value={formData.actualEnd}
                onChange={(e) => setFormData({...formData, actualEnd: e.target.value})}
              />
            </div>
          )}
        </div>

        {/* Variance Justification (Guideline Requirement) */}
        {(isOverdue || formData.actualEnd > formData.scheduledEnd) && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-[10px] font-black uppercase text-amber-600 mb-1.5 tracking-widest flex items-center gap-1">
              <AlertCircle size={12}/> Variance Reason (Required per Guideline 1)
            </label>
            <input 
              required
              type="text"
              className="w-full border-2 border-amber-100 bg-amber-50/30 rounded-xl p-3 outline-none focus:border-amber-500 font-bold text-slate-700 placeholder:text-amber-300"
              placeholder="e.g., Awaiting Spares, Skill Gap, or Funding Delay"
              value={formData.varianceReason}
              onChange={(e) => setFormData({...formData, varianceReason: e.target.value})}
            />
          </div>
        )}

        {/* Requirements Tagging */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Resource/Spare Requirements</label>
          <div className="flex gap-2">
            <input 
              className="flex-1 border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white"
              placeholder="e.g., Brake Blocks, Hydraulic Oil"
              value={formData.currentReq}
              onChange={(e) => setFormData({...formData, currentReq: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
            />
            <button 
              type="button" 
              onClick={handleAddRequirement}
              className="bg-slate-900 text-white px-5 rounded-xl hover:bg-indigo-600 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.requirements.map((req, i) => (
              <span key={i} className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-2">
                {req}
                <button type="button" onClick={() => setFormData({...formData, requirements: formData.requirements.filter((_, idx) => idx !== i)})}><X size={12}/></button>
              </span>
            ))}
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-slate-400"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {initialData ? 'Commit Updates' : 'Authorize Deployment'}
        </button>
      </form>
    </div>
  );
}
// 'use client';

// import React, { useState, useMemo } from 'react';
// import { Calendar, Users, Package, Save, X, Plus, AlertCircle, Briefcase, Loader2 } from 'lucide-react';

// interface Project {
//   id: string;
//   name: string;
//   allocatedBudget: number;
// }

// interface Props {
//   projects: Project[]; // Array of projects to choose from
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function MM_ActivityForm({ projects, onClose, onSuccess }: Props) {
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     projectId: '', // Parent Project Selection
//     description: '',
//     supervisorName: '', // Changed from ID to Name string
//     allocatedBudget: 0,
//     scheduledStart: '',
//     scheduledEnd: '',
//     requirements: [] as string[],
//     currentReq: ''
//   });

//   const [error, setError] = useState('');

//   // Determine the budget limit based on the selected project
//   const selectedProject = useMemo(() => 
//     projects.find(p => p.id === formData.projectId),
//   [formData.projectId, projects]);

//   const handleAddRequirement = () => {
//     if (formData.currentReq.trim()) {
//       setFormData({
//         ...formData,
//         requirements: [...formData.requirements, formData.currentReq.trim()],
//         currentReq: ''
//       });
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     if (!formData.projectId) {
//       setError("Please select a parent project first.");
//       setLoading(false);
//       return;
//     }

//     // Logic Check: Budget Validation (Guideline 1 of 2025)
//     if (selectedProject && formData.allocatedBudget > selectedProject.allocatedBudget) {
//       setError(`Activity budget exceeds project balance of $${selectedProject.allocatedBudget.toLocaleString()}`);
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await fetch('/mm/api/activities', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });

//       if (res.ok) {
//         onSuccess();
//         onClose();
//       } else {
//         const err = await res.json();
//         setError(err.message || 'Failed to create activity');
//       }
//     } catch (err) {
//       setError('Server communication error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
//         <div className="p-6 border-b flex justify-between items-center bg-slate-50">
//           <div>
//             <h2 className="text-xl font-bold text-slate-800">Deploy Maintenance Activity</h2>
//             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Operational Task Entry</p>
//           </div>
//           <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-5">
//           {error && (
//             <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-xs font-bold border border-red-100 animate-shake">
//               <AlertCircle size={16} /> {error}
//             </div>
//           )}

//           {/* 1. Project Selection */}
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
//               <Briefcase size={14} className="text-blue-600"/> Parent Project
//             </label>
//             <select 
//               required
//               disabled={loading}
//               className="w-full border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50 focus:bg-white"
//               value={formData.projectId}
//               onChange={(e) => setFormData({...formData, projectId: e.target.value})}
//             >
//               <option value="">Select Project...</option>
//               {projects.map(p => (
//                 <option key={p.id} value={p.id}>{p.name} (Cap: ${p.allocatedBudget.toLocaleString()})</option>
//               ))}
//             </select>
//           </div>

//           {/* Task Info */}
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-1">Description of Work</label>
//             <textarea 
//               required
//               disabled={loading}
//               className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none h-20 bg-slate-50 focus:bg-white transition-all"
//               placeholder="e.g., Overhaul of DE11 Traction Motor Bearings..."
//               onChange={(e) => setFormData({...formData, description: e.target.value})}
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-bold text-slate-700 mb-1">Supervisor Name</label>
//               <input 
//                 required
//                 disabled={loading}
//                 type="text"
//                 className="w-full border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50 focus:bg-white"
//                 placeholder="Enter supervisor name"
//                 onChange={(e) => setFormData({...formData, supervisorName: e.target.value})}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-bold text-slate-700 mb-1">Allocated Budget ($)</label>
//               <input 
//                 required type="number"
//                 disabled={loading}
//                 className="w-full border border-slate-200 rounded-lg p-2.5 outline-none bg-slate-50 focus:bg-white"
//                 onChange={(e) => setFormData({...formData, allocatedBudget: parseFloat(e.target.value)})}
//               />
//             </div>
//           </div>

//           {/* Timeline Management (Variance Data) */}
//           <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
//             <div>
//               <label className="block text-[10px] font-black text-blue-800 uppercase mb-1 flex items-center gap-1">
//                 <Calendar size={12}/> Scheduled Start
//               </label>
//               <input 
//                 required type="date"
//                 disabled={loading}
//                 className="w-full border-blue-200 border rounded p-2 text-sm"
//                 onChange={(e) => setFormData({...formData, scheduledStart: e.target.value})}
//               />
//             </div>
//             <div>
//               <label className="block text-[10px] font-black text-blue-800 uppercase mb-1 flex items-center gap-1">
//                 <Calendar size={12}/> Scheduled End
//               </label>
//               <input 
//                 required type="date"
//                 disabled={loading}
//                 className="w-full border-blue-200 border rounded p-2 text-sm"
//                 onChange={(e) => setFormData({...formData, scheduledEnd: e.target.value})}
//               />
//             </div>
//           </div>

//           {/* Material Requirements */}
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
//               <Package size={16} className="text-blue-600" /> Spares & Requirements
//             </label>
//             <div className="flex gap-2">
//               <input 
//                 disabled={loading}
//                 className="flex-1 border border-slate-200 rounded-lg p-2 outline-none bg-slate-50"
//                 placeholder="e.g., Gasket Set, Synthetic Oil"
//                 value={formData.currentReq}
//                 onChange={(e) => setFormData({...formData, currentReq: e.target.value})}
//                 onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
//               />
//               <button 
//                 type="button" 
//                 disabled={loading}
//                 onClick={handleAddRequirement}
//                 className="bg-slate-800 text-white px-4 rounded-lg hover:bg-black transition-colors"
//               >
//                 <Plus size={20} />
//               </button>
//             </div>
//             <div className="flex flex-wrap gap-2 mt-3">
//               {formData.requirements.map((req, i) => (
//                 <span key={i} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-100 shadow-sm flex items-center gap-1">
//                   {req}
//                   <button type="button" onClick={() => setFormData({...formData, requirements: formData.requirements.filter((_, idx) => idx !== i)})}><X size={10}/></button>
//                 </span>
//               ))}
//             </div>
//           </div>

//           <div className="pt-4 flex gap-3">
//             <button 
//               type="button" 
//               onClick={onClose}
//               disabled={loading}
//               className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit"
//               disabled={loading}
//               className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-slate-400"
//             >
//               {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
//               Deploy Activity
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }