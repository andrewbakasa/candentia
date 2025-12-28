'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    CheckSquare, X, Save, Clock, ListTodo, 
    CheckCircle2, Sparkles, Loader2, AlertTriangle, BookOpen, User
} from 'lucide-react';

// Interfaces matching your Prisma Models
interface BaseTask {
    id: string;
    standardTitle: string;
    standardDesc?: string;
    category?: string;
    benchmarkHours?: number;
}

interface Activity {
    id: string;
    description: string;
}

interface Props {
    initialData?: any; 
    activities: Activity[]; 
    baseTasks: BaseTask[]; 
    onClose: () => void;
    onSuccess: () => void;
    preselectedActivity?: Activity; 
}

export default function MM_TaskForm({ initialData, activities, baseTasks, onClose, onSuccess, preselectedActivity }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getTodayString = () => new Date().toISOString().split('T')[0];
    const formatDateForInput = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        activityId: preselectedActivity?.id || initialData?.activityId || '',
        baseTaskId: initialData?.baseTaskId || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        assignedTo: initialData?.assignedTo || '', // ✅ Added field
        status: initialData?.status || 'PENDING',
        isCompleted: initialData?.isCompleted || false,
        dueDate: formatDateForInput(initialData?.dueDate),
        completionDate: formatDateForInput(initialData?.completionDate) || (initialData?.status === 'COMPLETED' ? getTodayString() : ''),
        estimatedHours: initialData?.estimatedHours || 0,
        actualHours: initialData?.actualHours || 0,
        materialNotes: initialData?.materialNotes || '',
        variationReason: initialData?.variationReason || '',
    });

    // --- AUTO-FILL LOGIC FROM BASE TASK ---
    const handleBaseTaskChange = (baseId: string) => {
        const selectedBase = baseTasks.find(bt => bt.id === baseId);
        if (selectedBase) {
            setFormData(prev => ({
                ...prev,
                baseTaskId: selectedBase.id,
                title: selectedBase.standardTitle,
                description: selectedBase.standardDesc || '',
                estimatedHours: selectedBase.benchmarkHours || 0,
                variationReason: '' 
            }));
        } else {
            setFormData(prev => ({ ...prev, baseTaskId: '' }));
        }
    };

    const selectedBase = useMemo(() => 
        baseTasks.find(bt => bt.id === formData.baseTaskId), 
    [formData.baseTaskId, baseTasks]);

    const hasVariation = selectedBase && formData.estimatedHours !== selectedBase.benchmarkHours;

    const toggleCompletion = () => {
        const nextState = !formData.isCompleted;
        setFormData(prev => ({
            ...prev,
            isCompleted: nextState,
            status: nextState ? 'COMPLETED' : 'IN_PROGRESS',
            completionDate: nextState ? getTodayString() : ''
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const method = initialData?.id ? 'PATCH' : 'POST';
            const endpoint = initialData?.id ? `/mm/api/tasks/${initialData.id}` : '/mm/api/tasks';
            
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            
            if (res.ok) onSuccess();
            else setError('Authorization failed. Check ERP permissions.');
        } catch (err) {
            setError('ERP Connectivity Error');
        } finally { setLoading(false); }
    };

    return (
        <div className="w-full bg-white max-h-[90vh] overflow-y-auto rounded-t-3xl pb-10 shadow-2xl border-t-8 border-slate-900">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <CheckSquare size={24} className="text-indigo-600" />
                        {initialData?.id ? 'Update Task' : 'New Work Order'}
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Ref: Guideline 1 of 2025 / Operational Standard
                    </p>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                    <X size={20}/>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                        <AlertTriangle size={16}/> {error}
                    </div>
                )}
                
                {/* 1. COMPLETION TOGGLE */}
                <div onClick={toggleCompletion} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${formData.isCompleted ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${formData.isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            <CheckCircle2 size={20} />
                        </div>
                        <p className={`text-xs font-black uppercase tracking-tight ${formData.isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {formData.isCompleted ? 'Task Verified & Closed' : 'Current Status: Active'}
                        </p>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.isCompleted ? 'right-1' : 'left-1'}`} />
                    </div>
                </div>

                {/* 2. BASE TASK SELECTOR */}
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    <label className="block text-[10px] font-black uppercase text-indigo-600 mb-2 flex items-center gap-1">
                        <BookOpen size={12}/> Standardized Base Protocol
                    </label>
                    <select 
                        className="w-full border-2 border-white rounded-xl p-3 outline-none font-bold bg-white focus:border-indigo-500 shadow-sm"
                        value={formData.baseTaskId}
                        onChange={(e) => handleBaseTaskChange(e.target.value)}
                    >
                        <option value="">-- Select Standard Model (Optional) --</option>
                        {baseTasks?.map(bt => (
                            <option key={bt.id} value={bt.id}>{bt.standardTitle} ({bt.category})</option>
                        ))}
                    </select>
                </div>

                {/* 3. ASSIGNMENT & STATUS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                            <User size={12}/> Assigned To
                        </label>
                        <input 
                            type="text"
                            placeholder="Technician Name"
                            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50 focus:border-indigo-500"
                            value={formData.assignedTo}
                            onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Dispatch Status</label>
                        <select 
                            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value, isCompleted: e.target.value === 'COMPLETED'})}
                        >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                </div>

                {/* 4. ACTIVITY & DATES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                            <ListTodo size={12}/> Parent Activity
                        </label>
                        <select 
                            required
                            disabled={!!preselectedActivity}
                            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50"
                            value={formData.activityId}
                            onChange={(e) => setFormData({...formData, activityId: e.target.value})}
                        >
                            <option value="">Select Activity...</option>
                            {activities?.map(a => (
                                <option key={a.id} value={a.id}>{a.description}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Due Date</label>
                        <input 
                            type="date"
                            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        />
                    </div>
                </div>

                {/* 5. TITLE & DESCRIPTION */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex justify-between">
                            <span>Title</span>
                            {formData.baseTaskId && <span className="text-indigo-600 flex items-center gap-1"><Sparkles size={10}/> Standardized</span>}
                        </label>
                        <input 
                            required
                            type="text"
                            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-bold"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Operational Scope</label>
                        <textarea 
                            rows={3}
                            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-medium text-sm"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                </div>

                {/* 6. PERFORMANCE TRACKING */}
                <div className="grid grid-cols-2 gap-4 bg-slate-900 p-5 rounded-2xl">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-1">
                            <Clock size={12} className="text-indigo-400"/> {selectedBase ? 'Benchmark' : 'Estimated'}
                        </label>
                        <input 
                            type="number" 
                            step="0.5"
                            className="w-full bg-slate-800 border-none rounded-lg p-2 outline-none font-black text-white" 
                            value={formData.estimatedHours} 
                            onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value) || 0})} 
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-1">
                            <Clock size={12} className="text-emerald-400"/> Actual Hours
                        </label>
                        <input 
                            type="number" 
                            step="0.5"
                            className="w-full bg-slate-800 border-none rounded-lg p-2 outline-none font-black text-white" 
                            value={formData.actualHours} 
                            onChange={(e) => setFormData({...formData, actualHours: parseFloat(e.target.value) || 0})} 
                        />
                    </div>
                </div>

                {/* 7. VARIATION COMPLIANCE */}
                {hasVariation && (
                    <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl animate-in fade-in slide-in-from-top-2">
                        <label className="block text-[10px] font-black uppercase text-amber-700 mb-1.5 flex items-center gap-1">
                            <AlertTriangle size={12}/> Variation Reason Required (vs Benchmark: {selectedBase.benchmarkHours}h)
                        </label>
                        <textarea 
                            required
                            placeholder="Explain why this task deviates from the standard model..."
                            className="w-full bg-white border border-amber-200 rounded-xl p-3 text-sm outline-none focus:border-amber-500"
                            value={formData.variationReason}
                            onChange={(e) => setFormData({...formData, variationReason: e.target.value})}
                        />
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 shadow-xl disabled:bg-slate-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {initialData?.id ? 'COMMIT UPDATE' : 'AUTHORIZE DISPATCH'}
                </button>
            </form>
        </div>
    );
}
// 'use client';

// import React, { useState, useEffect, useMemo } from 'react';
// import { 
//     CheckSquare, X, Save, Clock, ListTodo, 
//     CheckCircle2, Sparkles, Loader2, AlertTriangle, BookOpen
// } from 'lucide-react';

// // Interfaces matching your Prisma Models
// interface BaseTask {
//     id: string;
//     standardTitle: string;
//     standardDesc?: string;
//     category?: string;
//     benchmarkHours?: number;
// }

// interface Activity {
//     id: string;
//     description: string;
// }

// interface Props {
//     initialData?: any; 
//     activities: Activity[]; 
//     baseTasks: BaseTask[]; 
//     onClose: () => void;
//     onSuccess: () => void;
//     preselectedActivity?: Activity; 
// }

// export default function MM_TaskForm({ initialData, activities, baseTasks, onClose, onSuccess, preselectedActivity }: Props) {
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');

//     const getTodayString = () => new Date().toISOString().split('T')[0];
//     const formatDateForInput = (dateString?: string) => {
//         if (!dateString) return '';
//         return new Date(dateString).toISOString().split('T')[0];
//     };

//     const [formData, setFormData] = useState({
//         activityId: preselectedActivity?.id || initialData?.activityId || '',
//         baseTaskId: initialData?.baseTaskId || '',
//         title: initialData?.title || '',
//         description: initialData?.description || '',
//         assignedTo: initialData?.assignedTo || '',
//         status: initialData?.status || 'PENDING',
//         isCompleted: initialData?.isCompleted || false,
//         dueDate: formatDateForInput(initialData?.dueDate),
//         completionDate: formatDateForInput(initialData?.completionDate) || (initialData?.status === 'COMPLETED' ? getTodayString() : ''),
//         estimatedHours: initialData?.estimatedHours || 0,
//         actualHours: initialData?.actualHours || 0,
//         materialNotes: initialData?.materialNotes || '',
//         variationReason: initialData?.variationReason || '',
//     });

//     // --- AUTO-FILL LOGIC FROM BASE TASK ---
//     const handleBaseTaskChange = (baseId: string) => {
//         const selectedBase = baseTasks.find(bt => bt.id === baseId);
//         if (selectedBase) {
//             setFormData(prev => ({
//                 ...prev,
//                 baseTaskId: selectedBase.id,
//                 title: selectedBase.standardTitle,
//                 description: selectedBase.standardDesc || '',
//                 estimatedHours: selectedBase.benchmarkHours || 0,
//                 // Clear variation reason if re-syncing to a base task
//                 variationReason: '' 
//             }));
//         } else {
//             setFormData(prev => ({ ...prev, baseTaskId: '' }));
//         }
//     };

//     // --- VARIATION TRACKING (Guideline Sec 6.2) ---
//     const selectedBase = useMemo(() => 
//         baseTasks.find(bt => bt.id === formData.baseTaskId), 
//     [formData.baseTaskId, baseTasks]);

//     const hasVariation = selectedBase && formData.estimatedHours !== selectedBase.benchmarkHours;

//     const toggleCompletion = () => {
//         const nextState = !formData.isCompleted;
//         setFormData(prev => ({
//             ...prev,
//             isCompleted: nextState,
//             status: nextState ? 'COMPLETED' : 'IN_PROGRESS',
//             completionDate: nextState ? getTodayString() : ''
//         }));
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         try {
//             const method = initialData?.id ? 'PATCH' : 'POST';
//             const endpoint = initialData?.id ? `/mm/api/tasks/${initialData.id}` : '/mm/api/tasks';
            
//             const res = await fetch(endpoint, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(formData),
//             });
            
//             if (res.ok) onSuccess();
//             else setError('Authorization failed. Check ERP permissions.');
//         } catch (err) {
//             setError('ERP Connectivity Error');
//         } finally { setLoading(false); }
//     };

//     return (
//         <div className="w-full bg-white max-h-[90vh] overflow-y-auto rounded-t-3xl pb-10 shadow-2xl border-t-8 border-slate-900">
//             {/* Header */}
//             <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
//                 <div>
//                     <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
//                         <CheckSquare size={24} className="text-indigo-600" />
//                         {initialData?.id ? 'Update Task' : 'New Work Order'}
//                     </h2>
//                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
//                         Ref: Guideline 1 of 2025 / Operational Standard
//                     </p>
//                 </div>
//                 <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
//                     <X size={20}/>
//                 </button>
//             </div>

//             <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
//                 {/* 1. COMPLETION TOGGLE */}
//                 <div onClick={toggleCompletion} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${formData.isCompleted ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-100'}`}>
//                     <div className="flex items-center gap-3">
//                         <div className={`p-2 rounded-full ${formData.isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
//                             <CheckCircle2 size={20} />
//                         </div>
//                         <p className={`text-xs font-black uppercase tracking-tight ${formData.isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
//                             {formData.isCompleted ? 'Task Verified & Closed' : 'Current Status: Active'}
//                         </p>
//                     </div>
//                     <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}>
//                         <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.isCompleted ? 'right-1' : 'left-1'}`} />
//                     </div>
//                 </div>

//                 {/* 2. BASE TASK SELECTOR (THE TEMPLATE) */}
//                 <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
//                     <label className="block text-[10px] font-black uppercase text-indigo-600 mb-2 flex items-center gap-1">
//                         <BookOpen size={12}/> Standardized Base Protocol
//                     </label>
//                     <select 
//                         className="w-full border-2 border-white rounded-xl p-3 outline-none font-bold bg-white focus:border-indigo-500 shadow-sm"
//                         value={formData.baseTaskId}
//                         onChange={(e) => handleBaseTaskChange(e.target.value)}
//                     >
//                         <option value="">-- Select Standard Model (Optional) --</option>
//                         {baseTasks?.map(bt => (
//                             <option key={bt.id} value={bt.id}>{bt.standardTitle} ({bt.category})</option>
//                         ))}
//                     </select>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
//                             <ListTodo size={12}/> Parent Activity
//                         </label>
//                         <select 
//                             required
//                             disabled={!!preselectedActivity}
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50"
//                             value={formData.activityId}
//                             onChange={(e) => setFormData({...formData, activityId: e.target.value})}
//                         >
//                             <option value="">Select Activity...</option>
//                             {activities?.map(a => (
//                                 <option key={a.id} value={a.id}>{a.description}</option>
//                             ))}
//                         </select>
//                     </div>
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Dispatch Status</label>
//                         <select 
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50"
//                             value={formData.status}
//                             onChange={(e) => setFormData({...formData, status: e.target.value, isCompleted: e.target.value === 'COMPLETED'})}
//                         >
//                             <option value="PENDING">Pending</option>
//                             <option value="IN_PROGRESS">In Progress</option>
//                             <option value="COMPLETED">Completed</option>
//                         </select>
//                     </div>
//                 </div>

//                 {/* 3. DYNAMIC TITLE & DESCRIPTION */}
//                 <div className="space-y-4">
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex justify-between">
//                             <span>Title</span>
//                             {formData.baseTaskId && <span className="text-indigo-600 flex items-center gap-1"><Sparkles size={10}/> Standardized</span>}
//                         </label>
//                         <input 
//                             required
//                             type="text"
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-bold"
//                             value={formData.title}
//                             onChange={(e) => setFormData({...formData, title: e.target.value})}
//                         />
//                     </div>
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Operational Scope</label>
//                         <textarea 
//                             rows={3}
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 font-medium text-sm"
//                             value={formData.description}
//                             onChange={(e) => setFormData({...formData, description: e.target.value})}
//                         />
//                     </div>
//                 </div>

//                 {/* 4. PERFORMANCE TRACKING */}
//                 <div className="grid grid-cols-2 gap-4 bg-slate-900 p-5 rounded-2xl">
//                     <div>
//                         <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-1">
//                             <Clock size={12} className="text-indigo-400"/> {selectedBase ? 'Benchmark' : 'Estimated'}
//                         </label>
//                         <input 
//                             type="number" 
//                             className="w-full bg-slate-800 border-none rounded-lg p-2 outline-none font-black text-white" 
//                             value={formData.estimatedHours} 
//                             onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value) || 0})} 
//                         />
//                     </div>
//                     <div>
//                         <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-1">
//                             <Clock size={12} className="text-emerald-400"/> Actual Hours
//                         </label>
//                         <input 
//                             type="number" 
//                             className="w-full bg-slate-800 border-none rounded-lg p-2 outline-none font-black text-white" 
//                             value={formData.actualHours} 
//                             onChange={(e) => setFormData({...formData, actualHours: parseFloat(e.target.value) || 0})} 
//                         />
//                     </div>
//                 </div>

//                 {/* 5. VARIATION COMPLIANCE (Guideline 6.2) */}
//                 {hasVariation && (
//                     <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl animate-in fade-in slide-in-from-top-2">
//                         <label className="block text-[10px] font-black uppercase text-amber-700 mb-1.5 flex items-center gap-1">
//                             <AlertTriangle size={12}/> Variation Reason Required (vs Benchmark: {selectedBase.benchmarkHours}h)
//                         </label>
//                         <textarea 
//                             required
//                             placeholder="Explain why this task deviates from the standard model..."
//                             className="w-full bg-white border border-amber-200 rounded-xl p-3 text-sm outline-none focus:border-amber-500"
//                             value={formData.variationReason}
//                             onChange={(e) => setFormData({...formData, variationReason: e.target.value})}
//                         />
//                     </div>
//                 )}

//                 <button 
//                     type="submit"
//                     disabled={loading}
//                     className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 shadow-xl disabled:bg-slate-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
//                 >
//                     {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
//                     {initialData?.id ? 'COMMIT UPDATE' : 'AUTHORIZE DISPATCH'}
//                 </button>
//             </form>
//         </div>
//     );
// }
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { 
//     CheckSquare, X, Save, AlertCircle, 
//     Loader2, Clock, MessageSquare, ListTodo, HardHat, CheckCircle2, Calendar, ClipboardCheck, Sparkles
// } from 'lucide-react';

// interface Activity {
//     id: string;
//     description: string;
//     stage: string;
//     // Added baseTask reference to activity if available
//     baseTaskId?: string;
// }

// interface BaseTask {
//     id: string;
//     standardTitle: string;
//     benchmarkHours: number;
//     standardDesc: string;
// }

// interface Props {
//     initialData?: any; 
//     activities: Activity[]; 
//     baseTasks: BaseTask[]; // New prop for lookup
//     onClose: () => void;
//     onSuccess: () => void;
//     preselectedActivity?: Activity; 
// }

// export default function MM_TaskForm({ initialData, activities, baseTasks, onClose, onSuccess, preselectedActivity }: Props) {
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//    console.log('basetasks', baseTasks)
//     const getTodayString = () => new Date().toISOString().split('T')[0];
//     const formatDateForInput = (dateString?: string) => {
//         if (!dateString) return '';
//         return new Date(dateString).toISOString().split('T')[0];
//     };

//     const [formData, setFormData] = useState({
//         activityId: preselectedActivity?.id || initialData?.activityId || '',
//         title: initialData?.title || '',
//         description: initialData?.description || '',
//         assignedTo: initialData?.assignedTo || '',
//         status: initialData?.status || 'PENDING',
//         isCompleted: initialData?.isCompleted || false,
//         dueDate: formatDateForInput(initialData?.dueDate),
//         completionDate: formatDateForInput(initialData?.completionDate) || (initialData?.status === 'COMPLETED' ? getTodayString() : ''),
//         estimatedHours: initialData?.estimatedHours || 0,
//         actualHours: initialData?.actualHours || 0,
//         materialNotes: initialData?.materialNotes || '',
//     });

//     // --- BASE TASK LINKING LOGIC ---
//     // Triggered when activityId changes to auto-fill standardized data
//     useEffect(() => {
//         if (!initialData?.id && formData.activityId) {
//             const selectedActivity = activities.find(a => a.id === formData.activityId);
//             // Find base task by description match or ID link
//             const match = baseTasks.find(bt => 
//                 bt.standardTitle.toLowerCase() === selectedActivity?.description.toLowerCase() ||
//                 bt.id === selectedActivity?.baseTaskId
//             );

//             if (match) {
//                 setFormData(prev => ({
//                     ...prev,
//                     title: match.standardTitle,
//                     estimatedHours: match.benchmarkHours,
//                     description: match.standardDesc
//                 }));
//             }
//         }
//     }, [formData.activityId, baseTasks, activities, initialData]);

//     const toggleCompletion = () => {
//         const nextState = !formData.isCompleted;
//         setFormData({
//             ...formData,
//             isCompleted: nextState,
//             status: nextState ? 'COMPLETED' : 'IN_PROGRESS',
//             completionDate: nextState ? getTodayString() : ''
//         });
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (formData.status === 'COMPLETED' && !formData.completionDate) {
//             setError('Operational Requirement: Completion date is mandatory.');
//             return;
//         }
//         setLoading(true);
//         try {
//             const method = initialData?.id ? 'PATCH' : 'POST';
//             const endpoint = initialData?.id ? `/mm/api/tasks/${initialData.id}` : '/mm/api/tasks';
//             const res = await fetch(endpoint, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(formData),
//             });
//             if (res.ok) onSuccess();
//             else setError('Action failed');
//         } catch (err) {
//             setError('ERP Connectivity Error');
//         } finally { setLoading(false); }
//     };

//     return (
//         <div className="w-full bg-white max-h-[90vh] overflow-y-auto rounded-t-3xl pb-28 shadow-2xl">
//             {/* Header */}
//             <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
//                 <div>
//                     <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
//                         <CheckSquare size={24} className="text-emerald-600" />
//                         {initialData?.id ? 'Update' : 'Assign'} Task
//                     </h2>
//                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">
//                         Guideline 1 Compliance: Standardized Rollout
//                     </p>
//                 </div>
//                 <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
//                     <X size={20}/>
//                 </button>
//             </div>

//             <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
//                 {/* 1. COMPLETION TOGGLE */}
//                 <div onClick={toggleCompletion} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${formData.isCompleted ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-100'}`}>
//                     <div className="flex items-center gap-3">
//                         <div className={`p-2 rounded-full ${formData.isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
//                             <CheckCircle2 size={20} />
//                         </div>
//                         <div>
//                             <p className={`text-xs font-black uppercase tracking-tight ${formData.isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
//                                 {formData.isCompleted ? 'Task Verified Complete' : 'Mark as Complete'}
//                             </p>
//                         </div>
//                     </div>
//                     <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}>
//                         <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.isCompleted ? 'right-1' : 'left-1'}`} />
//                     </div>
//                 </div>

//                 {/* Status & Activity */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
//                             <ListTodo size={12} className="text-emerald-600"/> Parent Activity
//                         </label>
//                         <select 
//                             required
//                             disabled={!!preselectedActivity}
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50 focus:border-emerald-500"
//                             value={formData.activityId}
//                             onChange={(e) => setFormData({...formData, activityId: e.target.value})}
//                         >
//                             <option value="">Select Activity...</option>
//                             {activities?.map(a => (
//                                 <option key={a.id} value={a.id}>{a.description}</option>
//                             ))}
//                         </select>
//                     </div>
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Current Status</label>
//                         <select 
//                             className={`w-full border-2 rounded-xl p-3 outline-none font-bold ${formData.status === 'COMPLETED' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}
//                             value={formData.status}
//                             onChange={(e) => setFormData({...formData, status: e.target.value, isCompleted: e.target.value === 'COMPLETED'})}
//                         >
//                             <option value="PENDING">Pending</option>
//                             <option value="IN_PROGRESS">In Progress</option>
//                             <option value="COMPLETED">Completed</option>
//                         </select>
//                     </div>
//                 </div>

//                 {/* 🏷️ TASK TITLE (Linked to Base Title) */}
//                 <div className="relative">
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex justify-between">
//                         <span>Task Title</span>
//                         {formData.activityId && <span className="text-emerald-600 flex items-center gap-1 animate-pulse"><Sparkles size={10}/> Linked to Base Title</span>}
//                     </label>
//                     <input 
//                         required
//                         type="text"
//                         placeholder="Task title will auto-fill from base task..."
//                         className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold bg-white"
//                         value={formData.title}
//                         onChange={(e) => setFormData({...formData, title: e.target.value})}
//                     />
//                 </div>

//                 {/* Hour Tracking (Benchmark vs Actual) */}
//                 <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
//                     <div>
//                         <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-1">
//                             <Clock size={12}/> Benchmark (Est)
//                         </label>
//                         <input 
//                             type="number" 
//                             className="w-full border-2 border-white rounded-lg p-2 outline-none font-black text-emerald-600" 
//                             value={formData.estimatedHours} 
//                             onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value) || 0})} 
//                         />
//                     </div>
//                     <div>
//                         <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-1">
//                             <Clock size={12}/> Actual Hours
//                         </label>
//                         <input 
//                             type="number" 
//                             className="w-full border-2 border-white rounded-lg p-2 outline-none font-black text-amber-600" 
//                             value={formData.actualHours} 
//                             onChange={(e) => setFormData({...formData, actualHours: parseFloat(e.target.value) || 0})} 
//                         />
//                     </div>
//                 </div>

//                 <button 
//                     type="submit"
//                     disabled={loading}
//                     className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl disabled:bg-slate-400 flex items-center justify-center gap-2 transition-all"
//                 >
//                     {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
//                     {initialData?.id ? 'Commit Update' : 'Authorize Rollout'}
//                 </button>
//             </form>
//         </div>
//     );
// }
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { 
//     CheckSquare, X, Save, AlertCircle, 
//     Loader2, Clock, MessageSquare, ListTodo, HardHat, CheckCircle2, Calendar, ClipboardCheck
// } from 'lucide-react';

// interface Activity {
//     id: string;
//     description: string;
//     stage: string;
// }

// interface Props {
//     initialData?: any; 
//     activities: Activity[]; 
//     onClose: () => void;
//     onSuccess: () => void;
//     preselectedActivity?: Activity; 
// }

// export default function MM_TaskForm({ initialData, activities, onClose, onSuccess, preselectedActivity }: Props) {
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');

//     // Helper to get today's date in YYYY-MM-DD
//     const getTodayString = () => new Date().toISOString().split('T')[0];

//     // Helper to format date for the <input type="date" />
//     const formatDateForInput = (dateString?: string) => {
//         if (!dateString) return '';
//         return new Date(dateString).toISOString().split('T')[0];
//     };

//     const [formData, setFormData] = useState({
//         activityId: preselectedActivity?.id || initialData?.activityId || '',
//         title: initialData?.title || '',
//         description: initialData?.description || '',
//         assignedTo: initialData?.assignedTo || '',
//         status: initialData?.status || 'PENDING',
//         isCompleted: initialData?.isCompleted || false,
//         dueDate: formatDateForInput(initialData?.dueDate),
//         completionDate: formatDateForInput(initialData?.completionDate) || (initialData?.status === 'COMPLETED' ? getTodayString() : ''),
//         estimatedHours: initialData?.estimatedHours || 0,
//         actualHours: initialData?.actualHours || 0,
//         materialNotes: initialData?.materialNotes || '',
//     });

//     useEffect(() => {
//         if (initialData || preselectedActivity) {
//             setFormData({
//                 activityId: preselectedActivity?.id || initialData?.activityId || '',
//                 title: initialData?.title || '',
//                 description: initialData?.description || '',
//                 assignedTo: initialData?.assignedTo || '',
//                 status: initialData?.status || 'PENDING',
//                 isCompleted: initialData?.isCompleted || false,
//                 dueDate: formatDateForInput(initialData?.dueDate),
//                 completionDate: formatDateForInput(initialData?.completionDate) || (initialData?.status === 'COMPLETED' ? getTodayString() : ''),
//                 estimatedHours: initialData?.estimatedHours || 0,
//                 actualHours: initialData?.actualHours || 0,
//                 materialNotes: initialData?.materialNotes || '',
//             });
//         }
//     }, [initialData, preselectedActivity]);

//     const toggleCompletion = () => {
//         const nextState = !formData.isCompleted;
//         setFormData({
//             ...formData,
//             isCompleted: nextState,
//             status: nextState ? 'COMPLETED' : 'IN_PROGRESS',
//             // Set default to today if marking complete, clear if moving back
//             completionDate: nextState ? getTodayString() : ''
//         });
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
        
//         // Mandatory check for completionDate
//         if (formData.status === 'COMPLETED' && !formData.completionDate) {
//             setError('Operational Requirement: Completion date is mandatory for finalized tasks.');
//             return;
//         }

//         setLoading(true);
//         setError('');

//         try {
//             const method = initialData?.id ? 'PATCH' : 'POST';
//             const endpoint = initialData?.id ? `/mm/api/tasks/${initialData.id}` : '/mm/api/tasks';

//             const res = await fetch(endpoint, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(formData),
//             });

//             if (res.ok) {
//                 onSuccess();
//             } else {
//                 const err = await res.json();
//                 setError(err.message || 'Action failed');
//             }
//         } catch (err) {
//             setError('ERP Connectivity Error: Could not sync task data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="w-full bg-white max-h-[90vh] overflow-y-auto rounded-t-3xl pb-28 shadow-2xl">
//             {/* Header */}
//             <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
//                 <div>
//                     <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
//                         <CheckSquare size={24} className="text-emerald-600" />
//                         {initialData?.id ? 'Update' : 'Assign'} Task
//                     </h2>
//                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
//                         {preselectedActivity ? `Activity: ${preselectedActivity.description}` : 'Select Parent Activity'}
//                     </p>
//                 </div>
//                 <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
//                     <X size={20}/>
//                 </button>
//             </div>

//             <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
//                 {/* 1. COMPLETION TOGGLE */}
//                 <div 
//                     onClick={toggleCompletion}
//                     className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
//                         formData.isCompleted 
//                         ? 'bg-emerald-50 border-emerald-500' 
//                         : 'bg-slate-50 border-slate-100 hover:border-slate-200'
//                     }`}
//                 >
//                     <div className="flex items-center gap-3">
//                         <div className={`p-2 rounded-full ${formData.isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
//                             <CheckCircle2 size={20} />
//                         </div>
//                         <div>
//                             <p className={`text-xs font-black uppercase tracking-tight ${formData.isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
//                                 {formData.isCompleted ? 'Task Verified Complete' : 'Mark as Complete'}
//                             </p>
//                             <p className="text-[10px] font-bold text-slate-400">Finalize work and timestamp entry</p>
//                         </div>
//                     </div>
//                     <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}>
//                         <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.isCompleted ? 'right-1' : 'left-1'}`} />
//                     </div>
//                 </div>

//                 {/* Conditional Completion Date Picker */}
//                 {formData.status === 'COMPLETED' && (
//                     <div className="p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
//                         <label className="block text-[10px] font-black uppercase text-emerald-700 mb-1.5 flex items-center gap-1">
//                             <ClipboardCheck size={12}/> Completion Date (Mandatory)
//                         </label>
//                         <input 
//                             required
//                             type="date"
//                             className="w-full border-2 border-emerald-200 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold bg-white text-emerald-900"
//                             value={formData.completionDate}
//                             onChange={(e) => setFormData({...formData, completionDate: e.target.value})}
//                         />
//                     </div>
//                 )}

//                 {/* Parent Activity & Status */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//                             <ListTodo size={12} className="text-emerald-600"/> Parent Activity
//                         </label>
//                         <select 
//                             required
//                             disabled={!!preselectedActivity}
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50 disabled:opacity-70 focus:border-emerald-500"
//                             value={formData.activityId}
//                             onChange={(e) => setFormData({...formData, activityId: e.target.value})}
//                         >
//                             <option value="">Select Activity...</option>
//                             {activities?.map(a => (
//                                 <option key={a.id} value={a.id}>{a.description}</option>
//                             ))}
//                         </select>
//                     </div>
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Current Status</label>
//                         <select 
//                             className={`w-full border-2 rounded-xl p-3 outline-none font-bold transition-all ${
//                                 formData.status === 'COMPLETED' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50'
//                             }`}
//                             value={formData.status}
//                             onChange={(e) => {
//                                 const newStatus = e.target.value;
//                                 setFormData({
//                                     ...formData, 
//                                     status: newStatus,
//                                     isCompleted: newStatus === 'COMPLETED',
//                                     completionDate: newStatus === 'COMPLETED' ? (formData.completionDate || getTodayString()) : ''
//                                 });
//                             }}
//                         >
//                             <option value="PENDING">Pending</option>
//                             <option value="IN_PROGRESS">In Progress</option>
//                             <option value="COMPLETED">Completed</option>
//                             <option value="ON_HOLD">On Hold</option>
//                         </select>
//                     </div>
//                 </div>

//                 {/* Task Title */}
//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Task Title</label>
//                     <input 
//                         required
//                         type="text"
//                         placeholder="e.g., Weld primary support brackets"
//                         className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold"
//                         value={formData.title}
//                         onChange={(e) => setFormData({...formData, title: e.target.value})}
//                     />
//                 </div>

//                 {/* Assignment & Deadlines */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
//                             <HardHat size={12}/> Assigned To
//                         </label>
//                         <input 
//                             required
//                             type="text"
//                             placeholder="Personnel Name"
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold"
//                             value={formData.assignedTo}
//                             onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
//                         />
//                     </div>
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
//                             <Calendar size={12} className="text-amber-500"/> Due Date (Optional)
//                         </label>
//                         <input 
//                             type="date"
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold bg-white"
//                             value={formData.dueDate}
//                             onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
//                         />
//                     </div>
//                 </div>

//                 {/* Hour Tracking */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 mb-1">
//                             <Clock size={12}/> Est. Hours
//                         </label>
//                         <input 
//                             type="number" 
//                             step="0.5" 
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold" 
//                             value={formData.estimatedHours} 
//                             onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value) || 0})} 
//                         />
//                     </div>
//                     <div>
//                         <label className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 mb-1">
//                             <Clock size={12}/> Actual Hours
//                         </label>
//                         <input 
//                             type="number" 
//                             step="0.5" 
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold" 
//                             value={formData.actualHours} 
//                             onChange={(e) => setFormData({...formData, actualHours: parseFloat(e.target.value) || 0})} 
//                         />
//                     </div>
//                 </div>

//                 {/* Resource Notes */}
//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//                         <MessageSquare size={12}/> Material Usage Notes
//                     </label>
//                     <textarea 
//                         rows={2}
//                         placeholder="Detail materials used or issues encountered..."
//                         className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-medium text-sm resize-none"
//                         value={formData.materialNotes}
//                         onChange={(e) => setFormData({...formData, materialNotes: e.target.value})}
//                     />
//                 </div>

//                 {error && (
//                     <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-xs font-bold border border-red-100">
//                         <AlertCircle size={18} /> {error}
//                     </div>
//                 )}

//                 <button 
//                     type="submit"
//                     disabled={loading}
//                     className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl disabled:bg-slate-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
//                 >
//                     {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
//                     {initialData?.id ? 'Commit Task Update' : 'Authorize Task Rollout'}
//                 </button>
//             </form>
//         </div>
//     );
// }
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { 
//     CheckSquare, X, Save, AlertCircle, 
//     Loader2, Clock, MessageSquare, ListTodo, HardHat, CheckCircle2, Calendar
// } from 'lucide-react';

// interface Activity {
//     id: string;
//     description: string;
//     stage: string;
// }

// interface Props {
//     initialData?: any; 
//     activities: Activity[]; 
//     onClose: () => void;
//     onSuccess: () => void;
//     preselectedActivity?: Activity; 
// }

// export default function MM_TaskForm({ initialData, activities, onClose, onSuccess, preselectedActivity }: Props) {
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');

//     // Helper to format date for the <input type="date" />
//     const formatDateForInput = (dateString?: string) => {
//         if (!dateString) return '';
//         return new Date(dateString).toISOString().split('T')[0];
//     };

//     const [formData, setFormData] = useState({
//         activityId: preselectedActivity?.id || initialData?.activityId || '',
//         title: initialData?.title || '',
//         description: initialData?.description || '',
//         assignedTo: initialData?.assignedTo || '',
//         status: initialData?.status || 'PENDING',
//         isCompleted: initialData?.isCompleted || false,
//         dueDate: formatDateForInput(initialData?.dueDate), // NEW FIELD
//         estimatedHours: initialData?.estimatedHours || 0,
//         actualHours: initialData?.actualHours || 0,
//         materialNotes: initialData?.materialNotes || '',
//     });

//     useEffect(() => {
//         if (initialData || preselectedActivity) {
//             setFormData({
//                 activityId: preselectedActivity?.id || initialData?.activityId || '',
//                 title: initialData?.title || '',
//                 description: initialData?.description || '',
//                 assignedTo: initialData?.assignedTo || '',
//                 status: initialData?.status || 'PENDING',
//                 isCompleted: initialData?.isCompleted || false,
//                 dueDate: formatDateForInput(initialData?.dueDate),
//                 estimatedHours: initialData?.estimatedHours || 0,
//                 actualHours: initialData?.actualHours || 0,
//                 materialNotes: initialData?.materialNotes || '',
//             });
//         }
//     }, [initialData, preselectedActivity]);

//     const toggleCompletion = () => {
//         const nextState = !formData.isCompleted;
//         setFormData({
//             ...formData,
//             isCompleted: nextState,
//             status: nextState ? 'COMPLETED' : 'IN_PROGRESS'
//         });
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setError('');

//         try {
//             const method = initialData?.id ? 'PATCH' : 'POST';
//             // Note: Endpoints adjusted to match common structure
//             const endpoint = initialData?.id ? `/mm/api/tasks/${initialData.id}` : '/mm/api/tasks';

//             const res = await fetch(endpoint, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(formData),
//             });

//             if (res.ok) {
//                 onSuccess();
//             } else {
//                 const err = await res.json();
//                 setError(err.message || 'Action failed');
//             }
//         } catch (err) {
//             setError('ERP Connectivity Error: Could not sync task data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="w-full bg-white max-h-[90vh] overflow-y-auto rounded-t-3xl pb-28">
//             {/* Header */}
//             <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
//                 <div>
//                     <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
//                         <CheckSquare size={24} className="text-emerald-600" />
//                         {initialData?.id ? 'Update' : 'Assign'} Task
//                     </h2>
//                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
//                         {preselectedActivity ? `Activity: ${preselectedActivity.description}` : 'Select Parent Activity'}
//                     </p>
//                 </div>
//                 <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
//                     <X size={20}/>
//                 </button>
//             </div>

//             <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
//                 {/* 1. COMPLETION TOGGLE */}
//                 <div 
//                     onClick={toggleCompletion}
//                     className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
//                         formData.isCompleted 
//                         ? 'bg-emerald-50 border-emerald-500' 
//                         : 'bg-slate-50 border-slate-100 hover:border-slate-200'
//                     }`}
//                 >
//                     <div className="flex items-center gap-3">
//                         <div className={`p-2 rounded-full ${formData.isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
//                             <CheckCircle2 size={20} />
//                         </div>
//                         <div>
//                             <p className={`text-xs font-black uppercase tracking-tight ${formData.isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
//                                 {formData.isCompleted ? 'Task Verified Complete' : 'Mark as Complete'}
//                             </p>
//                             <p className="text-[10px] font-bold text-slate-400">Finalize work and timestamp entry</p>
//                         </div>
//                     </div>
//                     <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}>
//                         <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.isCompleted ? 'right-1' : 'left-1'}`} />
//                     </div>
//                 </div>

//                 {/* Parent Activity & Status */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//                             <ListTodo size={12} className="text-emerald-600"/> Parent Activity
//                         </label>
//                         <select 
//                             required
//                             disabled={!!preselectedActivity}
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50 disabled:opacity-70 focus:border-emerald-500"
//                             value={formData.activityId}
//                             onChange={(e) => setFormData({...formData, activityId: e.target.value})}
//                         >
//                             <option value="">Select Activity...</option>
//                             {activities?.map(a => (
//                                 <option key={a.id} value={a.id}>{a.description}</option>
//                             ))}
//                         </select>
//                     </div>
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Current Status</label>
//                         <select 
//                             className={`w-full border-2 rounded-xl p-3 outline-none font-bold transition-all ${
//                                 formData.status === 'COMPLETED' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50'
//                             }`}
//                             value={formData.status}
//                             onChange={(e) => setFormData({
//                                 ...formData, 
//                                 status: e.target.value,
//                                 isCompleted: e.target.value === 'COMPLETED'
//                             })}
//                         >
//                             <option value="PENDING">Pending</option>
//                             <option value="IN_PROGRESS">In Progress</option>
//                             <option value="COMPLETED">Completed</option>
//                             <option value="ON_HOLD">On Hold</option>
//                         </select>
//                     </div>
//                 </div>

//                 {/* Title */}
//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Task Title</label>
//                     <input 
//                         required
//                         type="text"
//                         placeholder="e.g., Weld primary support brackets"
//                         className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold"
//                         value={formData.title}
//                         onChange={(e) => setFormData({...formData, title: e.target.value})}
//                     />
//                 </div>

//                 {/* Assignment & Deadlines */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
//                             <HardHat size={12}/> Assigned To
//                         </label>
//                         <input 
//                             required
//                             type="text"
//                             placeholder="Personnel Name"
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold"
//                             value={formData.assignedTo}
//                             onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
//                         />
//                     </div>
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
//                             <Calendar size={12} className="text-amber-500"/> Due Date (Optional)
//                         </label>
//                         <input 
//                             type="date"
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold bg-white"
//                             value={formData.dueDate}
//                             onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
//                         />
//                     </div>
//                 </div>

//                 {/* Hour Tracking */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 mb-1">
//                             <Clock size={12}/> Est. Hours
//                         </label>
//                         <input 
//                             type="number" 
//                             step="0.5" 
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold" 
//                             value={formData.estimatedHours} 
//                             onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value) || 0})} 
//                         />
//                     </div>
//                     <div>
//                         <label className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 mb-1">
//                             <Clock size={12}/> Actual Hours
//                         </label>
//                         <input 
//                             type="number" 
//                             step="0.5" 
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold" 
//                             value={formData.actualHours} 
//                             onChange={(e) => setFormData({...formData, actualHours: parseFloat(e.target.value) || 0})} 
//                         />
//                     </div>
//                 </div>

//                 {/* Resource Notes */}
//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//                         <MessageSquare size={12}/> Material Usage Notes
//                     </label>
//                     <textarea 
//                         rows={2}
//                         placeholder="Detail materials used or issues encountered..."
//                         className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-medium text-sm resize-none"
//                         value={formData.materialNotes}
//                         onChange={(e) => setFormData({...formData, materialNotes: e.target.value})}
//                     />
//                 </div>

//                 {error && (
//                     <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-xs font-bold border border-red-100">
//                         <AlertCircle size={18} /> {error}
//                     </div>
//                 )}

//                 <button 
//                     type="submit"
//                     disabled={loading}
//                     className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl disabled:bg-slate-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
//                 >
//                     {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
//                     {initialData?.id ? 'Commit Task Update' : 'Authorize Task Rollout'}
//                 </button>
//             </form>
//         </div>
//     );
// }
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { 
//     CheckSquare, X, Save, AlertCircle, 
//     Loader2, Clock, MessageSquare, ListTodo, HardHat, FileText, CheckCircle2
// } from 'lucide-react';

// interface Activity {
//     id: string;
//     description: string;
//     stage: string;
// }

// interface Props {
//     initialData?: any; 
//     activities: Activity[]; 
//     onClose: () => void;
//     onSuccess: () => void;
//     preselectedActivity?: Activity; 
// }

// export default function MM_TaskForm({ initialData, activities, onClose, onSuccess, preselectedActivity }: Props) {
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');

//     const [formData, setFormData] = useState({
//         activityId: preselectedActivity?.id || initialData?.activityId || '',
//         title: initialData?.title || '',
//         description: initialData?.description || '',
//         assignedTo: initialData?.assignedTo || '',
//         status: initialData?.status || 'PENDING',
//         isCompleted: initialData?.isCompleted || false, // NEW
//         estimatedHours: initialData?.estimatedHours || 0,
//         actualHours: initialData?.actualHours || 0,
//         materialNotes: initialData?.materialNotes || '',
//     });

//     useEffect(() => {
//         if (initialData || preselectedActivity) {
//             setFormData({
//                 activityId: preselectedActivity?.id || initialData?.activityId || '',
//                 title: initialData?.title || '',
//                 description: initialData?.description || '',
//                 assignedTo: initialData?.assignedTo || '',
//                 status: initialData?.status || 'PENDING',
//                 isCompleted: initialData?.isCompleted || false,
//                 estimatedHours: initialData?.estimatedHours || 0,
//                 actualHours: initialData?.actualHours || 0,
//                 materialNotes: initialData?.materialNotes || '',
//             });
//         }
//     }, [initialData, preselectedActivity]);

//     // Handle the "Completion" logic sync
//     const toggleCompletion = () => {
//         const nextState = !formData.isCompleted;
//         setFormData({
//             ...formData,
//             isCompleted: nextState,
//             status: nextState ? 'COMPLETED' : 'IN_PROGRESS'
//         });
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setError('');

//         try {
//             const method = initialData?.id ? 'PATCH' : 'POST';
//             const endpoint = initialData?.id ? `/mm/api/tasks/${initialData.id}` : '/mm/api/tasks';

//             const res = await fetch(endpoint, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(formData),
//             });

//             if (res.ok) {
//                 onSuccess();
//             } else {
//                 const err = await res.json();
//                 setError(err.message || 'Action failed');
//             }
//         } catch (err) {
//             setError('ERP Connectivity Error: Could not sync task data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="w-full bg-white max-h-[90vh] overflow-y-auto rounded-t-3xl pb-28">
//             {/* Header */}
//             <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
//                 <div>
//                     <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
//                         <CheckSquare size={24} className="text-emerald-600" />
//                         {initialData?.id ? 'Update' : 'Assign'} Task
//                     </h2>
//                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
//                         {preselectedActivity ? `Activity: ${preselectedActivity.description}` : 'Select Parent Activity'}
//                     </p>
//                 </div>
//                 <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
//                     <X size={20}/>
//                 </button>
//             </div>

//             <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
//                 {/* 1. COMPLETION TOGGLE (High Visibility) */}
//                 <div 
//                     onClick={toggleCompletion}
//                     className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
//                         formData.isCompleted 
//                         ? 'bg-emerald-50 border-emerald-500' 
//                         : 'bg-slate-50 border-slate-100 hover:border-slate-200'
//                     }`}
//                 >
//                     <div className="flex items-center gap-3">
//                         <div className={`p-2 rounded-full ${formData.isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
//                             <CheckCircle2 size={20} />
//                         </div>
//                         <div>
//                             <p className={`text-xs font-black uppercase tracking-tight ${formData.isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
//                                 {formData.isCompleted ? 'Task Verified Complete' : 'Mark as Complete'}
//                             </p>
//                             <p className="text-[10px] font-bold text-slate-400">Finalize work and timestamp entry</p>
//                         </div>
//                     </div>
//                     <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}>
//                         <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.isCompleted ? 'right-1' : 'left-1'}`} />
//                     </div>
//                 </div>

//                 {/* Parent Activity & Title */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//                             <ListTodo size={12} className="text-emerald-600"/> Parent Activity
//                         </label>
//                         <select 
//                             required
//                             disabled={!!preselectedActivity}
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50 disabled:opacity-70 focus:border-emerald-500"
//                             value={formData.activityId}
//                             onChange={(e) => setFormData({...formData, activityId: e.target.value})}
//                         >
//                             <option value="">Select Activity...</option>
//                             {activities?.map(a => (
//                                 <option key={a.id} value={a.id}>{a.description}</option>
//                             ))}
//                         </select>
//                     </div>
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Current Status</label>
//                         <select 
//                             className={`w-full border-2 rounded-xl p-3 outline-none font-bold transition-all ${
//                                 formData.status === 'COMPLETED' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50'
//                             }`}
//                             value={formData.status}
//                             onChange={(e) => setFormData({
//                                 ...formData, 
//                                 status: e.target.value,
//                                 isCompleted: e.target.value === 'COMPLETED'
//                             })}
//                         >
//                             <option value="PENDING">Pending</option>
//                             <option value="IN_PROGRESS">In Progress</option>
//                             <option value="COMPLETED">Completed</option>
//                             <option value="ON_HOLD">On Hold</option>
//                         </select>
//                     </div>
//                 </div>

//                 {/* Task Details */}
//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Task Title</label>
//                     <input 
//                         required
//                         type="text"
//                         placeholder="e.g., Weld primary support brackets"
//                         className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold"
//                         value={formData.title}
//                         onChange={(e) => setFormData({...formData, title: e.target.value})}
//                     />
//                 </div>

//                 {/* Personnel & Hour Tracking */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div className="md:col-span-1">
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
//                             <HardHat size={12}/> Assigned To
//                         </label>
//                         <input 
//                             required
//                             type="text"
//                             placeholder="Personnel Name"
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold"
//                             value={formData.assignedTo}
//                             onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
//                         />
//                     </div>
//                     <div>
//                         <label className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 mb-1">
//                             <Clock size={12}/> Est. Hours
//                         </label>
//                         <input 
//                             type="number" 
//                             step="0.5" 
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold" 
//                             value={formData.estimatedHours} 
//                             onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value) || 0})} 
//                         />
//                     </div>
//                     <div>
//                         <label className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 mb-1">
//                             <Clock size={12}/> Actual Hours
//                         </label>
//                         <input 
//                             type="number" 
//                             step="0.5" 
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold" 
//                             value={formData.actualHours} 
//                             onChange={(e) => setFormData({...formData, actualHours: parseFloat(e.target.value) || 0})} 
//                         />
//                     </div>
//                 </div>

//                 {/* Resource Notes */}
//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//                         <MessageSquare size={12}/> Material Usage Notes
//                     </label>
//                     <textarea 
//                         rows={2}
//                         placeholder="Detail materials used or issues encountered..."
//                         className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-medium text-sm resize-none"
//                         value={formData.materialNotes}
//                         onChange={(e) => setFormData({...formData, materialNotes: e.target.value})}
//                     />
//                 </div>

//                 {error && (
//                     <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-xs font-bold border border-red-100">
//                         <AlertCircle size={18} /> {error}
//                     </div>
//                 )}

//                 <button 
//                     type="submit"
//                     disabled={loading}
//                     className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl disabled:bg-slate-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
//                 >
//                     {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
//                     {initialData?.id ? 'Commit Task Update' : 'Authorize Task Rollout'}
//                 </button>
//             </form>
//         </div>
//     );
// }