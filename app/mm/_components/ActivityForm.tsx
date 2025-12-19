'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Package, Save, X, Plus, AlertCircle, Briefcase, Loader2, User, Clock, Lock } from 'lucide-react';

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
    preselectedProject?: Project; 
}

export default function MM_ActivityForm({ initialData, projects, onClose, onSuccess, preselectedProject }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        projectId: preselectedProject?.id || initialData?.projectId || '',
        description: initialData?.description || '',
        supervisor: initialData?.supervisor || '',
        allocatedBudget: initialData?.allocatedBudget || 0,
        scheduledStart: initialData?.scheduledStart ? formatDate(initialData.scheduledStart) : '',
        scheduledEnd: initialData?.scheduledEnd ? formatDate(initialData.scheduledEnd) : '',
        actualEnd: initialData?.actualEnd ? formatDate(initialData.actualEnd) : '',
        varianceReason: initialData?.varianceReason || '',
        requirements: (initialData?.requirements as string[]) || [],
        currentReq: ''
    });

    useEffect(() => {
        if (initialData || preselectedProject) {
            setFormData(prev => ({
                ...prev,
                projectId: preselectedProject?.id || initialData?.projectId || prev.projectId,
                description: initialData?.description ?? prev.description,
                supervisor: initialData?.supervisor ?? prev.supervisor,
                allocatedBudget: initialData?.allocatedBudget ?? prev.allocatedBudget,
                scheduledStart: initialData?.scheduledStart ? formatDate(initialData.scheduledStart) : prev.scheduledStart,
                scheduledEnd: initialData?.scheduledEnd ? formatDate(initialData.scheduledEnd) : prev.scheduledEnd,
                actualEnd: initialData?.actualEnd ? formatDate(initialData.actualEnd) : prev.actualEnd,
                varianceReason: initialData?.varianceReason ?? prev.varianceReason,
                requirements: initialData?.requirements ?? prev.requirements
            }));
        }
    }, [initialData, preselectedProject]);

    const selectedProject = useMemo(() => 
        projects.find(p => p.id === formData.projectId),
    [formData.projectId, projects]);

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
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        {preselectedProject ? `Context: ${preselectedProject.name}` : 'NRZ Maintenance Module v2025'}
                    </p>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-xs font-bold border border-red-100">
                        <AlertCircle size={18} className="shrink-0" /> {error}
                    </div>
                )}

                {/* Project Selection */}
                <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-1"><Briefcase size={12} className="text-indigo-600"/> Parent Project Assignment</span>
                        {preselectedProject && <span className="flex items-center gap-1 text-indigo-500"><Lock size={10}/> Locked context</span>}
                    </label>
                    <select 
                        required
                        disabled={!!preselectedProject}
                        className={`w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold transition-all ${
                            preselectedProject ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-transparent' : 'bg-slate-50 text-slate-700 focus:border-indigo-500'
                        }`}
                        value={formData.projectId}
                        onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                    >
                        <option value="">Select Project...</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Cap: ${p.allocatedBudget.toLocaleString()})</option>
                        ))}
                    </select>
                </div>

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

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1">
                                <Calendar size={12}/> Scheduled Start
                            </label>
                            <input 
                                type="date"
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
                                 type="date"
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

                {(isOverdue || (formData.actualEnd && formData.actualEnd > formData.scheduledEnd)) && (
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

// import React, { useState, useMemo, useEffect } from 'react';
// import { Calendar, Package, Save, X, Plus, AlertCircle, Briefcase, Loader2, User, Clock } from 'lucide-react';

// interface Project {
//   id: string;
//   name: string;
//   allocatedBudget: number;
// }

// interface Props {
//   initialData?: any; 
//   projects: Project[];
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function MM_ActivityForm({ initialData, projects, onClose, onSuccess }: Props) {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const formatDate = (dateStr: string) => {
//     if (!dateStr) return '';
//     return new Date(dateStr).toISOString().split('T')[0];
//   };

//   const [formData, setFormData] = useState({
//     projectId: initialData?.projectId || '',
//     description: initialData?.description || '',
//     supervisor: initialData?.supervisor || '', // Aligned with Model
//     allocatedBudget: initialData?.allocatedBudget || 0,
//     scheduledStart: initialData?.scheduledStart ? formatDate(initialData.scheduledStart) : '',
//     scheduledEnd: initialData?.scheduledEnd ? formatDate(initialData.scheduledEnd) : '',
//     actualEnd: initialData?.actualEnd ? formatDate(initialData.actualEnd) : '', // New: Variance Engine
//     varianceReason: initialData?.varianceReason || '', // New: Guideline 1 Compliance
//     requirements: (initialData?.requirements as string[]) || [],
//     currentReq: ''
//   });

//   useEffect(() => {
//     if (initialData) {
//       setFormData({
//         projectId: initialData.projectId,
//         description: initialData.description,
//         supervisor: initialData.supervisor || '',
//         allocatedBudget: initialData.allocatedBudget,
//         scheduledStart: formatDate(initialData.scheduledStart),
//         scheduledEnd: formatDate(initialData.scheduledEnd),
//         actualEnd: formatDate(initialData.actualEnd),
//         varianceReason: initialData.varianceReason || '',
//         requirements: initialData.requirements || [],
//         currentReq: ''
//       });
//     }
//   }, [initialData]);

//   const selectedProject = useMemo(() => 
//     projects.find(p => p.id === formData.projectId),
//   [formData.projectId, projects]);

//   // Check if activity is overdue for Variance reporting
//   const isOverdue = useMemo(() => {
//     if (!formData.scheduledEnd) return false;
//     return new Date() > new Date(formData.scheduledEnd) && !formData.actualEnd;
//   }, [formData.scheduledEnd, formData.actualEnd]);

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

//     if (selectedProject && formData.allocatedBudget > selectedProject.allocatedBudget) {
//       setError(`Variance Alert: Activity budget ($${formData.allocatedBudget}) exceeds Project balance ($${selectedProject.allocatedBudget})`);
//       setLoading(false);
//       return;
//     }

//     try {
//       const method = initialData ? 'PATCH' : 'POST';
//       const endpoint = initialData ? `/mm/api/activities/${initialData.id}` : '/mm/api/activities';

//       const res = await fetch(endpoint, {
//         method,
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });

//       if (res.ok) {
//         onSuccess();
//         onClose();
//       } else {
//         const err = await res.json();
//         setError(err.message || 'Deployment failed');
//       }
//     } catch (err) {
//       setError('Communication link failure with NRZ ERP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="w-full bg-white max-h-[90vh] overflow-y-auto">
//       <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
//         <div>
//           <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
//             <Package size={24} className="text-indigo-600" />
//             {initialData ? 'Update' : 'Deploy'} Maintenance Activity
//           </h2>
//           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">NRZ Maintenance Module v2025</p>
//         </div>
//         <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
//       </div>

//       <form onSubmit={handleSubmit} className="p-6 space-y-5">
//         {error && (
//           <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-xs font-bold border border-red-100">
//             <AlertCircle size={18} className="shrink-0" /> {error}
//           </div>
//         )}

//         {/* Project Selection */}
//         <div>
//           <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//             <Briefcase size={12} className="text-indigo-600"/> Parent Project Assignment
//           </label>
//           <select 
//             required
//             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 bg-slate-50 font-bold text-slate-700 transition-all"
//             value={formData.projectId}
//             onChange={(e) => setFormData({...formData, projectId: e.target.value})}
//           >
//             <option value="">Select Project...</option>
//             {projects.map(p => (
//               <option key={p.id} value={p.id}>{p.name} (Cap: ${p.allocatedBudget.toLocaleString()})</option>
//             ))}
//           </select>
//         </div>

//         {/* Supervisor & Budget Row */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//               <User size={12} className="text-indigo-600"/> Responsible Supervisor
//             </label>
//             <input 
//               required
//               type="text"
//               className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-bold text-slate-700"
//               placeholder="e.g., Senior Engineer Mapfumo"
//               value={formData.supervisor}
//               onChange={(e) => setFormData({...formData, supervisor: e.target.value})}
//             />
//           </div>
//           <div>
//             <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Allocated Activity Budget ($)</label>
//             <input 
//               required type="number"
//               className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-bold text-slate-700"
//               value={formData.allocatedBudget}
//               onChange={(e) => setFormData({...formData, allocatedBudget: parseFloat(e.target.value)})}
//             />
//           </div>
//         </div>

//         {/* Description */}
//         <div>
//           <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Scope of Work</label>
//           <textarea 
//             required
//             className="w-full border-2 border-slate-100 rounded-xl p-4 outline-none focus:border-indigo-500 h-24 bg-white font-medium text-slate-700"
//             placeholder="Detailed technical specifications..."
//             value={formData.description}
//             onChange={(e) => setFormData({...formData, description: e.target.value})}
//           />
//         </div>

//         {/* Timeline & Variance Section */}
//         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1">
//                 <Calendar size={12}/> Scheduled Start
//               </label>
//               <input 
//                 required type="date"
//                 className="w-full bg-transparent font-bold text-slate-700 outline-none"
//                 value={formData.scheduledStart}
//                 onChange={(e) => setFormData({...formData, scheduledStart: e.target.value})}
//               />
//             </div>
//             <div>
//               <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1">
//                 <Calendar size={12}/> Scheduled End
//               </label>
//               <input 
//                 required type="date"
//                 className="w-full bg-transparent font-bold text-slate-700 outline-none"
//                 value={formData.scheduledEnd}
//                 onChange={(e) => setFormData({...formData, scheduledEnd: e.target.value})}
//               />
//             </div>
//           </div>

//           {initialData && (
//             <div className="pt-4 border-t border-slate-200">
//               <label className="block text-[10px] font-black text-emerald-600 uppercase mb-1 flex items-center gap-1">
//                 <Clock size={12}/> Actual Completion Date
//               </label>
//               <input 
//                 type="date"
//                 className="w-full bg-transparent font-bold text-slate-700 outline-none"
//                 value={formData.actualEnd}
//                 onChange={(e) => setFormData({...formData, actualEnd: e.target.value})}
//               />
//             </div>
//           )}
//         </div>

//         {/* Variance Justification (Guideline Requirement) */}
//         {(isOverdue || formData.actualEnd > formData.scheduledEnd) && (
//           <div className="animate-in fade-in slide-in-from-top-2 duration-300">
//             <label className="block text-[10px] font-black uppercase text-amber-600 mb-1.5 tracking-widest flex items-center gap-1">
//               <AlertCircle size={12}/> Variance Reason (Required per Guideline 1)
//             </label>
//             <input 
//               required
//               type="text"
//               className="w-full border-2 border-amber-100 bg-amber-50/30 rounded-xl p-3 outline-none focus:border-amber-500 font-bold text-slate-700 placeholder:text-amber-300"
//               placeholder="e.g., Awaiting Spares, Skill Gap, or Funding Delay"
//               value={formData.varianceReason}
//               onChange={(e) => setFormData({...formData, varianceReason: e.target.value})}
//             />
//           </div>
//         )}

//         {/* Requirements Tagging */}
//         <div>
//           <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Resource/Spare Requirements</label>
//           <div className="flex gap-2">
//             <input 
//               className="flex-1 border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white"
//               placeholder="e.g., Brake Blocks, Hydraulic Oil"
//               value={formData.currentReq}
//               onChange={(e) => setFormData({...formData, currentReq: e.target.value})}
//               onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
//             />
//             <button 
//               type="button" 
//               onClick={handleAddRequirement}
//               className="bg-slate-900 text-white px-5 rounded-xl hover:bg-indigo-600 transition-all"
//             >
//               <Plus size={20} />
//             </button>
//           </div>
//           <div className="flex flex-wrap gap-2 mt-3">
//             {formData.requirements.map((req, i) => (
//               <span key={i} className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-2">
//                 {req}
//                 <button type="button" onClick={() => setFormData({...formData, requirements: formData.requirements.filter((_, idx) => idx !== i)})}><X size={12}/></button>
//               </span>
//             ))}
//           </div>
//         </div>

//         <button 
//           type="submit"
//           disabled={loading}
//           className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-slate-400"
//         >
//           {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
//           {initialData ? 'Commit Updates' : 'Authorize Deployment'}
//         </button>
//       </form>
//     </div>
//   );
// }