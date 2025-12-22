'use client';

import React, { useState } from 'react';
import { X, Save, Package, DollarSign, Building, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MM_PurchaseOrderForm({ initialData, projectPlan, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(''); // Added missing error state
    
    const [formData, setFormData] = useState({
        poNumber: initialData?.poNumber || '',
        vendorName: initialData?.vendorName || '',
        totalValue: initialData?.totalValue || 0,
        issueDate: initialData?.issueDate || new Date().toISOString().split('T')[0],
        status: initialData?.status || 'DRAFT',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        // Guideline 1 Compliance: Validation against Strategic Ceiling
        if (!projectPlan) {
            setError("Strategic Plan authorization missing. Cannot commit funds.");
            setLoading(false);
            return;
        }

        // Validate PO value against the Plan's total budget ceiling
        if (formData.totalValue > projectPlan.totalBudget) {
            setError(`Over-allocation: FY ${projectPlan.year} ceiling is $${projectPlan.totalBudget.toLocaleString()}. PO value of $${formData.totalValue.toLocaleString()} exceeds this limit.`);
            setLoading(false);
            return;
        }

        try {
            const method = initialData ? 'PATCH' : 'POST';
            const endpoint = initialData ? `/mm/api/procurement/${initialData.id}` : '/mm/api/procurement';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    planId: projectPlan.id // Ensure plan ID is sent for audit trail
                }),
            });

            if (res.ok) { 
                toast.success('Ledger Entry Authorized');
                onSuccess(); 
                onClose(); 
            } else {
                const data = await res.json();
                setError(data.message || 'Authorization failed at Gateway');
            }
        } catch (err) { 
            setError('Network error: Could not reach NRZ ERP Gateway'); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Purchase Order</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                        Fiscal Year {projectPlan?.year || '2025'} Registry
                    </p>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                </button>
            </div>

            {/* Error Message Display */}
            {error && (
                <div className="mx-6 mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex items-center gap-3">
                    <AlertCircle className="text-amber-600 shrink-0" size={18} />
                    <p className="text-[11px] font-black text-amber-800 uppercase tracking-tight">{error}</p>
                </div>
            )}

            <div className="p-6 space-y-5 overflow-y-auto">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">PO Reference Number</label>
                    <div className="relative">
                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            required
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="PO-2025-001"
                            value={formData.poNumber}
                            onChange={(e) => setFormData({...formData, poNumber: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Total Value ($)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                            <input 
                                type="number"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                                value={formData.totalValue}
                                onChange={(e) => setFormData({...formData, totalValue: Number(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Status</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none appearance-none"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                            <option value="DRAFT">DRAFT</option>
                            <option value="PO_ISSUED">PO ISSUED</option>
                            <option value="FUNDED">FUNDED</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Vendor/Supplier</label>
                    <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                            placeholder="Supplier Name"
                            value={formData.vendorName}
                            onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 mt-auto">
                <button 
                    disabled={loading}
                    type="submit"
                    className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest ${loading ? 'bg-slate-300' : 'bg-slate-900 hover:bg-indigo-600 text-white'}`}
                >
                    {loading ? 'Authorizing...' : <><Save size={18}/> Commit to Ledger</>}
                </button>
            </div>
        </form>
    );
}