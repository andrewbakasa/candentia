'use client';

import React, { useState, useEffect } from 'react';
import { 
    X, Save, AlertCircle, Loader2, Clock, 
    BookOpen, Layers, Tag, Hammer, Sparkles
} from 'lucide-react';

interface Props {
    initialData?: any; 
    onClose: () => void;
    onSuccess: () => void;
}

export default function BaseTaskForm({ initialData, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [skillInput, setSkillInput] = useState('');

    const [formData, setFormData] = useState({
        standardTitle: initialData?.standardTitle || '',
        standardDesc: initialData?.standardDesc || '',
        category: initialData?.category || '',
        benchmarkHours: initialData?.benchmarkHours || 0,
        requiredSkills: (initialData?.requiredSkills as string[]) || [],
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                standardTitle: initialData.standardTitle || '',
                standardDesc: initialData.standardDesc || '',
                category: initialData.category || '',
                benchmarkHours: initialData.benchmarkHours || 0,
                requiredSkills: initialData.requiredSkills || [],
            });
        }
    }, [initialData]);

    const addSkill = () => {
        if (skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
            setFormData({
                ...formData,
                requiredSkills: [...formData.requiredSkills, skillInput.trim()]
            });
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setFormData({
            ...formData,
            requiredSkills: formData.requiredSkills.filter(s => s !== skillToRemove)
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const method = initialData?.id ? 'PATCH' : 'POST';
            // Adjusted endpoint to match your standard naming convention
            const endpoint = initialData?.id ? `/mm/api/basetasks/${initialData.id}` : '/mm/api/basetasks';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                onSuccess();
            } else {
                const err = await res.json();
                setError(err.message || 'Standardization failed');
            }
        } catch (err) {
            setError('System Sync Error: Could not publish benchmark');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-white max-h-[90vh] overflow-y-auto rounded-t-3xl pb-10 shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Sparkles size={24} className="text-amber-500" />
                        {initialData?.id ? 'Edit Benchmark' : 'New Standard Template'}
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Guideline 1 of 2025: Standardized Documentation
                    </p>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                    <X size={20}/>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                {/* 1. Title & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
                            <BookOpen size={12} className="text-blue-600"/> Standard Title
                        </label>
                        <input 
                            required
                            type="text"
                            placeholder="e.g., Bogie Ultrasonic Test"
                            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-amber-500 font-bold"
                            value={formData.standardTitle}
                            onChange={(e) => setFormData({...formData, standardTitle: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
                            <Layers size={12} className="text-purple-600"/> Category
                        </label>
                        <select 
                            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold bg-slate-50 focus:border-amber-500"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                            <option value="">Select Category...</option>
                            <option value="Mechanical">Mechanical</option>
                            <option value="Electrical">Electrical</option>
                            <option value="Pneumatics">Pneumatics</option>
                            <option value="NDT/Quality">NDT / Quality</option>
                        </select>
                    </div>
                </div>

                {/* 2. Benchmark Hours */}
                <div className="p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl">
                    <label className="text-[10px] font-black text-amber-700 uppercase flex items-center gap-1 mb-1.5">
                        <Clock size={14}/> Expected Benchmark Hours (Sec 6.2)
                    </label>
                    <input 
                        required
                        type="number" 
                        step="0.5" 
                        className="w-full border-2 border-amber-200 rounded-xl p-3 outline-none focus:border-amber-500 font-black text-lg bg-white" 
                        value={formData.benchmarkHours} 
                        onChange={(e) => setFormData({...formData, benchmarkHours: parseFloat(e.target.value) || 0})} 
                    />
                    <p className="text-[10px] font-bold text-amber-600 mt-2 italic">
                        This is the Expected Time used for financial performance tracking.
                    </p>
                </div>

                {/* 3. Description */}
                <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Standard Procedure Description</label>
                    <textarea 
                        rows={3}
                        placeholder="Detailed steps for this standard task..."
                        className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-amber-500 font-medium text-sm"
                        value={formData.standardDesc}
                        onChange={(e) => setFormData({...formData, standardDesc: e.target.value})}
                    />
                </div>

                {/* 4. Required Skills Tags */}
                <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest flex items-center gap-1">
                        <Hammer size={12}/> Skill Requirements (Skill Matrix Mapping)
                    </label>
                    <div className="flex gap-2 mb-3">
                        <input 
                            type="text"
                            placeholder="e.g., NDT_L2"
                            className="flex-1 border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-amber-500 font-bold"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        />
                        <button 
                            type="button" 
                            onClick={addSkill}
                            className="px-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* CORRECTED MAP FUNCTION HERE */}
                        {formData.requiredSkills.map((skill: string) => (
                            <span key={skill} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-[11px] font-black border border-slate-200">
                                <Tag size={10} /> {skill}
                                <button type="button" onClick={() => removeSkill(skill)} className="ml-1 hover:text-red-500 transition-colors">
                                    <X size={12}/>
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-xs font-bold border border-red-100">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-amber-600 shadow-xl disabled:bg-slate-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {initialData?.id ? 'Update Master Template' : 'Publish Benchmark'}
                </button>
            </form>
        </div>
    );
}