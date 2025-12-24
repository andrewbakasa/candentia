'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Package, Save, X, Plus, AlertCircle, Briefcase, Loader2, User, Clock, Lock, ChevronRight, DollarSign, PenTool } from 'lucide-react';

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
            setError(`Financial Variance: Activity budget exceeds Project cap of $${selectedProject.allocatedBudget.toLocaleString()}`);
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
                setError(err.message || 'System rejection: Check data integrity');
            }
        } catch (err) {
            setError('ERP Uplink Failed: Check network connection');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-white flex flex-col h-full md:max-h-[90vh]">
            {/* Header: Improved for mobile with safe-area considerations */}
            <div className="px-4 py-5 md:px-6 border-b flex justify-between items-start bg-white sticky top-0 z-20">
                <div className="space-y-1">
                    <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Package size={20} />
                        </div>
                        {initialData ? 'Update Activity' : 'Deploy Maintenance'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {preselectedProject ? `Project: ${preselectedProject.name}` : 'NRZ Maintenance Terminal'}
                        </p>
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all active:scale-90"
                >
                    <X size={20}/>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6 overflow-y-auto pb-24 md:pb-6">
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3 text-sm font-semibold border-l-4 border-red-500 animate-in fade-in zoom-in duration-200">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Section: Context */}
                <div className="space-y-4">
                    <div className="group">
                        <label className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">
                            <Briefcase size={14} className="text-indigo-500"/> Parent Project
                        </label>
                        <div className="relative">
                            <select 
                                required
                                disabled={!!preselectedProject}
                                className={`w-full appearance-none border-2 rounded-2xl p-4 pr-10 outline-none font-bold transition-all text-sm md:text-base ${
                                    preselectedProject 
                                    ? 'bg-slate-50 border-transparent text-slate-500 cursor-not-allowed' 
                                    : 'bg-white border-slate-100 text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50'
                                }`}
                                value={formData.projectId}
                                onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                            >
                                <option value="">Select Target Project...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (${p.allocatedBudget.toLocaleString()})</option>
                                ))}
                            </select>
                            {!preselectedProject && <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={18}/>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">
                                <User size={14} className="text-indigo-500"/> Supervisor
                            </label>
                            <input 
                                required
                                type="text"
                                className="w-full border-2 border-slate-100 bg-white rounded-2xl p-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 font-bold text-slate-700 placeholder:text-slate-300 transition-all"
                                placeholder="Assign Lead Personnel"
                                value={formData.supervisor}
                                onChange={(e) => setFormData({...formData, supervisor: e.target.value})}
                            />
                        </div>
                        <div className="relative">
                            <label className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">
                                <DollarSign size={14} className="text-indigo-500"/> Activity Budget
                            </label>
                            <input 
                                required type="number"
                                className="w-full border-2 border-slate-100 bg-white rounded-2xl p-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 font-bold text-slate-700 transition-all"
                                value={formData.allocatedBudget}
                                onChange={(e) => setFormData({...formData, allocatedBudget: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Technical Scope */}
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 mb-1 ml-1 tracking-widest">
                        <PenTool size={14} className="text-indigo-500"/> Scope of Work
                    </label>
                    <textarea 
                        required
                        className="w-full border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 h-32 bg-white font-medium text-slate-700 transition-all"
                        placeholder="Define technical specifications, tolerances, and expected outcomes..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                {/* Section: Timeline Card */}
                <div className="bg-slate-50 p-5 rounded-[2rem] border-2 border-slate-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 px-1">
                                <Calendar size={14} className="text-slate-400"/> Scheduled Start
                            </label>
                            <input 
                                type="date"
                                className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-indigo-400"
                                value={formData.scheduledStart}
                                onChange={(e) => setFormData({...formData, scheduledStart: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 px-1">
                                <Calendar size={14} className="text-slate-400"/> Scheduled End
                            </label>
                            <input 
                                 type="date"
                                className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-indigo-400"
                                value={formData.scheduledEnd}
                                onChange={(e) => setFormData({...formData, scheduledEnd: e.target.value})}
                            />
                        </div>
                    </div>

                    {initialData && (
                        <div className="pt-4 border-t border-slate-200">
                            <label className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-2 mb-2 px-1">
                                <Clock size={14}/> Terminal Completion Date
                            </label>
                            <input 
                                type="date"
                                className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-xl p-3 font-bold text-emerald-900 outline-none"
                                value={formData.actualEnd}
                                onChange={(e) => setFormData({...formData, actualEnd: e.target.value})}
                            />
                        </div>
                    )}
                </div>

                {/* Conditional Variance Block */}
                {(isOverdue || (formData.actualEnd && formData.actualEnd > formData.scheduledEnd)) && (
                    <div className="animate-in slide-in-from-top-4 duration-300">
                        <div className="bg-amber-50 border-2 border-amber-100 p-5 rounded-[2rem] space-y-3">
                            <label className="text-[10px] font-black uppercase text-amber-700 flex items-center gap-2 px-1">
                                <AlertCircle size={16}/> Variance Justification (Guideline 1 Compliance)
                            </label>
                            <input 
                                required
                                type="text"
                                className="w-full bg-white border-2 border-amber-200 rounded-2xl p-4 outline-none focus:border-amber-500 font-bold text-slate-700"
                                placeholder="Reason for deviation from schedule..."
                                value={formData.varianceReason}
                                onChange={(e) => setFormData({...formData, varianceReason: e.target.value})}
                            />
                        </div>
                    </div>
                )}

                {/* Section: Resource Logistics */}
                <div className="space-y-4 pb-4">
                    <label className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 ml-1 tracking-widest">
                        Resource & Spares Logistics
                    </label>
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-indigo-500 bg-white font-bold transition-all"
                            placeholder="Add Required Components..."
                            value={formData.currentReq}
                            onChange={(e) => setFormData({...formData, currentReq: e.target.value})}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                        />
                        <button 
                            type="button" 
                            onClick={handleAddRequirement}
                            className="bg-slate-900 text-white w-14 rounded-2xl hover:bg-indigo-600 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-slate-200"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {formData.requirements.map((req, i) => (
                            <div key={i} className="bg-white text-slate-700 text-xs font-bold pl-4 pr-2 py-2 rounded-xl border-2 border-slate-100 flex items-center gap-3 animate-in fade-in zoom-in duration-200">
                                {req}
                                <button 
                                    type="button" 
                                    onClick={() => setFormData({...formData, requirements: formData.requirements.filter((_, idx) => idx !== i)})}
                                    className="p-1 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors"
                                >
                                    <X size={14}/>
                                </button>
                            </div>
                        ))}
                        {formData.requirements.length === 0 && (
                            <p className="text-[11px] font-bold text-slate-300 italic px-2">No resource tags attached yet.</p>
                        )}
                    </div>
                </div>

                {/* Submit Action: Stick to bottom on mobile */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent md:relative md:bg-none md:p-0 md:pt-4 z-30">
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:bg-slate-300 disabled:shadow-none"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        <span className="uppercase tracking-widest text-xs">
                            {initialData ? 'Update Activity Record' : 'Authorize Deployment'}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
}
// 'use client';

// import React, { useState, useMemo, useEffect } from 'react';
// import { Calendar, Package, Save, X, Plus, AlertCircle, Briefcase, Loader2, User, Clock, Lock } from 'lucide-react';

// interface Project {
//     id: string;
//     name: string;
//     allocatedBudget: number;
// }

// interface Props {
//     initialData?: any; 
//     projects: Project[];
//     onClose: () => void;
//     onSuccess: () => void;
//     preselectedProject?: Project; 
// }

// export default function MM_ActivityForm({ initialData, projects, onClose, onSuccess, preselectedProject }: Props) {
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     //console.log("projects....", projects)
//      //.log("preselectedProject....", preselectedProject)
//     const formatDate = (dateStr: string) => {
//         if (!dateStr) return '';
//         return new Date(dateStr).toISOString().split('T')[0];
//     };

//     const [formData, setFormData] = useState({
//         projectId: preselectedProject?.id || initialData?.projectId || '',
//         description: initialData?.description || '',
//         supervisor: initialData?.supervisor || '',
//         allocatedBudget: initialData?.allocatedBudget || 0,
//         scheduledStart: initialData?.scheduledStart ? formatDate(initialData.scheduledStart) : '',
//         scheduledEnd: initialData?.scheduledEnd ? formatDate(initialData.scheduledEnd) : '',
//         actualEnd: initialData?.actualEnd ? formatDate(initialData.actualEnd) : '',
//         varianceReason: initialData?.varianceReason || '',
//         requirements: (initialData?.requirements as string[]) || [],
//         currentReq: ''
//     });

//     useEffect(() => {
//         if (initialData || preselectedProject) {
//             setFormData(prev => ({
//                 ...prev,
//                 projectId: preselectedProject?.id || initialData?.projectId || prev.projectId,
//                 description: initialData?.description ?? prev.description,
//                 supervisor: initialData?.supervisor ?? prev.supervisor,
//                 allocatedBudget: initialData?.allocatedBudget ?? prev.allocatedBudget,
//                 scheduledStart: initialData?.scheduledStart ? formatDate(initialData.scheduledStart) : prev.scheduledStart,
//                 scheduledEnd: initialData?.scheduledEnd ? formatDate(initialData.scheduledEnd) : prev.scheduledEnd,
//                 actualEnd: initialData?.actualEnd ? formatDate(initialData.actualEnd) : prev.actualEnd,
//                 varianceReason: initialData?.varianceReason ?? prev.varianceReason,
//                 requirements: initialData?.requirements ?? prev.requirements
//             }));
//         }
//     }, [initialData, preselectedProject]);

//     const selectedProject = useMemo(() => 
//         projects.find(p => p.id === formData.projectId),
//     [formData.projectId, projects]);

//     const isOverdue = useMemo(() => {
//         if (!formData.scheduledEnd) return false;
//         return new Date() > new Date(formData.scheduledEnd) && !formData.actualEnd;
//     }, [formData.scheduledEnd, formData.actualEnd]);

//     const handleAddRequirement = () => {
//         if (formData.currentReq.trim()) {
//             setFormData({
//                 ...formData,
//                 requirements: [...formData.requirements, formData.currentReq.trim()],
//                 currentReq: ''
//             });
//         }
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setError('');

//         if (selectedProject && formData.allocatedBudget > selectedProject.allocatedBudget) {
//             setError(`Variance Alert: Activity budget ($${formData.allocatedBudget}) exceeds Project balance ($${selectedProject.allocatedBudget})`);
//             setLoading(false);
//             return;
//         }

//         try {
//             const method = initialData ? 'PATCH' : 'POST';
//             const endpoint = initialData ? `/mm/api/activities/${initialData.id}` : '/mm/api/activities';

//             const res = await fetch(endpoint, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(formData),
//             });

//             if (res.ok) {
//                 onSuccess();
//                 onClose();
//             } else {
//                 const err = await res.json();
//                 setError(err.message || 'Deployment failed');
//             }
//         } catch (err) {
//             setError('Communication link failure with NRZ ERP');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="w-full bg-white max-h-[90vh] overflow-y-auto">
//             <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
//                 <div>
//                     <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
//                         <Package size={24} className="text-indigo-600" />
//                         {initialData ? 'Update' : 'Deploy'} Maintenance Activity
//                     </h2>
//                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
//                         {preselectedProject ? `Context: ${preselectedProject.name}` : 'NRZ Maintenance Module v2025'}
//                     </p>
//                 </div>
//                 <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
//             </div>

//             <form onSubmit={handleSubmit} className="p-6 space-y-5">
//                 {error && (
//                     <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-xs font-bold border border-red-100">
//                         <AlertCircle size={18} className="shrink-0" /> {error}
//                     </div>
//                 )}

//                 {/* Project Selection */}
//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center justify-between">
//                         <span className="flex items-center gap-1"><Briefcase size={12} className="text-indigo-600"/> Parent Project Assignment</span>
//                         {preselectedProject && <span className="flex items-center gap-1 text-indigo-500"><Lock size={10}/> Locked context</span>}
//                     </label>
//                     <select 
//                         required
//                         disabled={!!preselectedProject}
//                         className={`w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold transition-all ${
//                             preselectedProject ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-transparent' : 'bg-slate-50 text-slate-700 focus:border-indigo-500'
//                         }`}
//                         value={formData.projectId}
//                         onChange={(e) => setFormData({...formData, projectId: e.target.value})}
//                     >
//                         <option value="">Select Project...</option>
//                         {projects.map(p => (
//                             <option key={p.id} value={p.id}>{p.name} (Cap: ${p.allocatedBudget.toLocaleString()})</option>
//                         ))}
//                     </select>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//                             <User size={12} className="text-indigo-600"/> Responsible Supervisor
//                         </label>
//                         <input 
//                             required
//                             type="text"
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-bold text-slate-700"
//                             placeholder="e.g., Senior Engineer Mapfumo"
//                             value={formData.supervisor}
//                             onChange={(e) => setFormData({...formData, supervisor: e.target.value})}
//                         />
//                     </div>
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Allocated Activity Budget ($)</label>
//                         <input 
//                             required type="number"
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-bold text-slate-700"
//                             value={formData.allocatedBudget}
//                             onChange={(e) => setFormData({...formData, allocatedBudget: parseFloat(e.target.value)})}
//                         />
//                     </div>
//                 </div>

//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Scope of Work</label>
//                     <textarea 
//                         required
//                         className="w-full border-2 border-slate-100 rounded-xl p-4 outline-none focus:border-indigo-500 h-24 bg-white font-medium text-slate-700"
//                         placeholder="Detailed technical specifications..."
//                         value={formData.description}
//                         onChange={(e) => setFormData({...formData, description: e.target.value})}
//                     />
//                 </div>

//                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
//                     <div className="grid grid-cols-2 gap-4">
//                         <div>
//                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1">
//                                 <Calendar size={12}/> Scheduled Start
//                             </label>
//                             <input 
//                                 type="date"
//                                 className="w-full bg-transparent font-bold text-slate-700 outline-none"
//                                 value={formData.scheduledStart}
//                                 onChange={(e) => setFormData({...formData, scheduledStart: e.target.value})}
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1">
//                                 <Calendar size={12}/> Scheduled End
//                             </label>
//                             <input 
//                                  type="date"
//                                 className="w-full bg-transparent font-bold text-slate-700 outline-none"
//                                 value={formData.scheduledEnd}
//                                 onChange={(e) => setFormData({...formData, scheduledEnd: e.target.value})}
//                             />
//                         </div>
//                     </div>

//                     {initialData && (
//                         <div className="pt-4 border-t border-slate-200">
//                             <label className="block text-[10px] font-black text-emerald-600 uppercase mb-1 flex items-center gap-1">
//                                 <Clock size={12}/> Actual Completion Date
//                             </label>
//                             <input 
//                                 type="date"
//                                 className="w-full bg-transparent font-bold text-slate-700 outline-none"
//                                 value={formData.actualEnd}
//                                 onChange={(e) => setFormData({...formData, actualEnd: e.target.value})}
//                             />
//                         </div>
//                     )}
//                 </div>

//                 {(isOverdue || (formData.actualEnd && formData.actualEnd > formData.scheduledEnd)) && (
//                     <div className="animate-in fade-in slide-in-from-top-2 duration-300">
//                         <label className="block text-[10px] font-black uppercase text-amber-600 mb-1.5 tracking-widest flex items-center gap-1">
//                             <AlertCircle size={12}/> Variance Reason (Required per Guideline 1)
//                         </label>
//                         <input 
//                             required
//                             type="text"
//                             className="w-full border-2 border-amber-100 bg-amber-50/30 rounded-xl p-3 outline-none focus:border-amber-500 font-bold text-slate-700 placeholder:text-amber-300"
//                             placeholder="e.g., Awaiting Spares, Skill Gap, or Funding Delay"
//                             value={formData.varianceReason}
//                             onChange={(e) => setFormData({...formData, varianceReason: e.target.value})}
//                         />
//                     </div>
//                 )}

//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Resource/Spare Requirements</label>
//                     <div className="flex gap-2">
//                         <input 
//                             className="flex-1 border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white"
//                             placeholder="e.g., Brake Blocks, Hydraulic Oil"
//                             value={formData.currentReq}
//                             onChange={(e) => setFormData({...formData, currentReq: e.target.value})}
//                             onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
//                         />
//                         <button 
//                             type="button" 
//                             onClick={handleAddRequirement}
//                             className="bg-slate-900 text-white px-5 rounded-xl hover:bg-indigo-600 transition-all"
//                         >
//                             <Plus size={20} />
//                         </button>
//                     </div>
//                     <div className="flex flex-wrap gap-2 mt-3">
//                         {formData.requirements.map((req, i) => (
//                             <span key={i} className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-2">
//                                 {req}
//                                 <button type="button" onClick={() => setFormData({...formData, requirements: formData.requirements.filter((_, idx) => idx !== i)})}><X size={12}/></button>
//                             </span>
//                         ))}
//                     </div>
//                 </div>

//                 <button 
//                     type="submit"
//                     disabled={loading}
//                     className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-slate-400"
//                 >
//                     {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
//                     {initialData ? 'Commit Updates' : 'Authorize Deployment'}
//                 </button>
//             </form>
//         </div>
//     );
// }