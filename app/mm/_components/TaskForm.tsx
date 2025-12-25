'use client';

import React, { useState, useEffect } from 'react';
import { 
    CheckSquare, X, Save, AlertCircle, 
    Loader2, Clock, MessageSquare, ListTodo, HardHat, FileText, CheckCircle2
} from 'lucide-react';

interface Activity {
    id: string;
    description: string;
    stage: string;
}

interface Props {
    initialData?: any; 
    activities: Activity[]; 
    onClose: () => void;
    onSuccess: () => void;
    preselectedActivity?: Activity; 
}

export default function MM_TaskForm({ initialData, activities, onClose, onSuccess, preselectedActivity }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        activityId: preselectedActivity?.id || initialData?.activityId || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        assignedTo: initialData?.assignedTo || '',
        status: initialData?.status || 'PENDING',
        isCompleted: initialData?.isCompleted || false, // NEW
        estimatedHours: initialData?.estimatedHours || 0,
        actualHours: initialData?.actualHours || 0,
        materialNotes: initialData?.materialNotes || '',
    });

    useEffect(() => {
        if (initialData || preselectedActivity) {
            setFormData({
                activityId: preselectedActivity?.id || initialData?.activityId || '',
                title: initialData?.title || '',
                description: initialData?.description || '',
                assignedTo: initialData?.assignedTo || '',
                status: initialData?.status || 'PENDING',
                isCompleted: initialData?.isCompleted || false,
                estimatedHours: initialData?.estimatedHours || 0,
                actualHours: initialData?.actualHours || 0,
                materialNotes: initialData?.materialNotes || '',
            });
        }
    }, [initialData, preselectedActivity]);

    // Handle the "Completion" logic sync
    const toggleCompletion = () => {
        const nextState = !formData.isCompleted;
        setFormData({
            ...formData,
            isCompleted: nextState,
            status: nextState ? 'COMPLETED' : 'IN_PROGRESS'
        });
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

            if (res.ok) {
                onSuccess();
            } else {
                const err = await res.json();
                setError(err.message || 'Action failed');
            }
        } catch (err) {
            setError('ERP Connectivity Error: Could not sync task data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-white max-h-[90vh] overflow-y-auto rounded-t-3xl pb-28">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <CheckSquare size={24} className="text-emerald-600" />
                        {initialData?.id ? 'Update' : 'Assign'} Task
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        {preselectedActivity ? `Activity: ${preselectedActivity.description}` : 'Select Parent Activity'}
                    </p>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                    <X size={20}/>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                {/* 1. COMPLETION TOGGLE (High Visibility) */}
                <div 
                    onClick={toggleCompletion}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        formData.isCompleted 
                        ? 'bg-emerald-50 border-emerald-500' 
                        : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${formData.isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <p className={`text-xs font-black uppercase tracking-tight ${formData.isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {formData.isCompleted ? 'Task Verified Complete' : 'Mark as Complete'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">Finalize work and timestamp entry</p>
                        </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.isCompleted ? 'right-1' : 'left-1'}`} />
                    </div>
                </div>

                {/* Parent Activity & Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
                            <ListTodo size={12} className="text-emerald-600"/> Parent Activity
                        </label>
                        <select 
                            required
                            disabled={!!preselectedActivity}
                            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50 disabled:opacity-70 focus:border-emerald-500"
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
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Current Status</label>
                        <select 
                            className={`w-full border-2 rounded-xl p-3 outline-none font-bold transition-all ${
                                formData.status === 'COMPLETED' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50'
                            }`}
                            value={formData.status}
                            onChange={(e) => setFormData({
                                ...formData, 
                                status: e.target.value,
                                isCompleted: e.target.value === 'COMPLETED'
                            })}
                        >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="ON_HOLD">On Hold</option>
                        </select>
                    </div>
                </div>

                {/* Task Details */}
                <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Task Title</label>
                    <input 
                        required
                        type="text"
                        placeholder="e.g., Weld primary support brackets"
                        className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                </div>

                {/* Personnel & Hour Tracking */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                            <HardHat size={12}/> Assigned To
                        </label>
                        <input 
                            required
                            type="text"
                            placeholder="Personnel Name"
                            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold"
                            value={formData.assignedTo}
                            onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 mb-1">
                            <Clock size={12}/> Est. Hours
                        </label>
                        <input 
                            type="number" 
                            step="0.5" 
                            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold" 
                            value={formData.estimatedHours} 
                            onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value) || 0})} 
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 mb-1">
                            <Clock size={12}/> Actual Hours
                        </label>
                        <input 
                            type="number" 
                            step="0.5" 
                            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold" 
                            value={formData.actualHours} 
                            onChange={(e) => setFormData({...formData, actualHours: parseFloat(e.target.value) || 0})} 
                        />
                    </div>
                </div>

                {/* Resource Notes */}
                <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
                        <MessageSquare size={12}/> Material Usage Notes
                    </label>
                    <textarea 
                        rows={2}
                        placeholder="Detail materials used or issues encountered..."
                        className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-medium text-sm resize-none"
                        value={formData.materialNotes}
                        onChange={(e) => setFormData({...formData, materialNotes: e.target.value})}
                    />
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-xs font-bold border border-red-100">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl disabled:bg-slate-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {initialData?.id ? 'Commit Task Update' : 'Authorize Task Rollout'}
                </button>
            </form>
        </div>
    );
}
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { 
//     CheckSquare, X, Save, AlertCircle, 
//     Loader2, Clock, MessageSquare, ListTodo, HardHat, FileText
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
//         estimatedHours: initialData?.estimatedHours || 0,
//         actualHours: initialData?.actualHours || 0,
//         materialNotes: initialData?.materialNotes || '',
//     });

//     useEffect(() => {
//         setFormData({
//             activityId: preselectedActivity?.id || initialData?.activityId || '',
//             title: initialData?.title || '',
//             description: initialData?.description || '',
//             assignedTo: initialData?.assignedTo || '',
//             status: initialData?.status || 'PENDING',
//             estimatedHours: initialData?.estimatedHours || 0,
//             actualHours: initialData?.actualHours || 0,
//             materialNotes: initialData?.materialNotes || '',
//         });
//     }, [initialData, preselectedActivity]);

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
//         <div className="w-full bg-white max-h-[90vh] overflow-y-auto">
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
//                 {error && (
//                     <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-xs font-bold border border-red-100 animate-pulse">
//                         <AlertCircle size={18} /> {error}
//                     </div>
//                 )}

//                 {/* Activity Selector */}
//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//                         <ListTodo size={12} className="text-emerald-600"/> Parent Activity
//                     </label>
//                     <select 
//                         required
//                         disabled={!!preselectedActivity}
//                         className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50 disabled:opacity-70 focus:border-emerald-500 transition-all appearance-none"
//                         value={formData.activityId}
//                         onChange={(e) => setFormData({...formData, activityId: e.target.value})}
//                     >
//                         <option value="">Select Activity...</option>
//                         {activities?.map(a => (
//                             <option key={a.id} value={a.id}>{a.description}</option>
//                         ))}
//                     </select>
//                 </div>

//                 {/* Task Title */}
//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Task Title</label>
//                     <input 
//                         required
//                         type="text"
//                         placeholder="e.g., Weld primary support brackets"
//                         className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold placeholder:text-slate-300"
//                         value={formData.title}
//                         onChange={(e) => setFormData({...formData, title: e.target.value})}
//                     />
//                 </div>

//                 {/* NEW: Task Description */}
//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//                         <FileText size={12}/> Scope of Work / Description
//                     </label>
//                     <textarea 
//                         rows={3}
//                         placeholder="Detail specific instructions or technical requirements..."
//                         className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-medium text-sm placeholder:text-slate-300 resize-none"
//                         value={formData.description}
//                         onChange={(e) => setFormData({...formData, description: e.target.value})}
//                     />
//                 </div>

//                 {/* Personnel & Status */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
//                             <HardHat size={12}/> Assigned Personnel
//                         </label>
//                         <input 
//                             required
//                             type="text"
//                             placeholder="Name or Team"
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold"
//                             value={formData.assignedTo}
//                             onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
//                         />
//                     </div>
//                     <div>
//                         <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Current Status</label>
//                         <select 
//                             className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50 focus:border-emerald-500"
//                             value={formData.status}
//                             onChange={(e) => setFormData({...formData, status: e.target.value})}
//                         >
//                             <option value="PENDING">Pending</option>
//                             <option value="IN_PROGRESS">In Progress</option>
//                             <option value="COMPLETED">Completed</option>
//                             <option value="ON_HOLD">On Hold</option>
//                         </select>
//                     </div>
//                 </div>

//                 {/* Hour Tracking */}
//                 <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100">
//                     <div>
//                         <label className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 mb-1">
//                             <Clock size={12}/> Est. Hours
//                         </label>
//                         <input 
//                             type="number" 
//                             step="0.5" 
//                             className="w-full bg-transparent font-black text-lg outline-none text-emerald-900" 
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
//                             className="w-full bg-transparent font-black text-lg outline-none text-emerald-900" 
//                             value={formData.actualHours} 
//                             onChange={(e) => setFormData({...formData, actualHours: parseFloat(e.target.value) || 0})} 
//                         />
//                     </div>
//                 </div>

//                 {/* Material Notes */}
//                 <div>
//                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
//                         <MessageSquare size={12}/> Material & Resource Notes
//                     </label>
//                     <input 
//                         type="text"
//                         placeholder="e.g., 5kg Grade A Steel Rods used"
//                         className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold"
//                         value={formData.materialNotes}
//                         onChange={(e) => setFormData({...formData, materialNotes: e.target.value})}
//                     />
//                 </div>

//                 {/* Submit Button */}
//                 <button 
//                     type="submit"
//                     disabled={loading}
//                     className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl disabled:bg-slate-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
//                 >
//                     {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
//                     {initialData?.id ? 'Confirm Updates' : 'Deploy Task'}
//                 </button>
//             </form>
//         </div>
//     );
// }