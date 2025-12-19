'use client';

import React from 'react';
import { 
    Calendar, User, Wrench, Activity, 
    AlertCircle, CheckCircle2, DollarSign, TrendingUp 
} from 'lucide-react';

export default function ProjectDetailView({ project }: { project: any }) {
    const budgetUsed = project.totalActualCost || 0;
    const budgetTotal = project.allocatedBudget || 1;
    const utilizationPercentage = (budgetUsed / budgetTotal) * 100;
    const isOverBudget = utilizationPercentage > 100;

    return (
        <div className="divide-y divide-slate-100">
            {/* Top Branding Section */}
            <div className="p-6 md:p-10 bg-gradient-to-br from-white to-slate-50">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-md uppercase border border-indigo-100">
                                {project.plan?.year} Strategic Plan
                            </span>
                            {isOverBudget && (
                                <span className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-md uppercase border border-red-100 animate-pulse">
                                    <AlertCircle size={10} /> Budget Warning
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                            {project.name}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                            <div className="flex items-center gap-1.5"><User size={14} className="text-blue-500"/> {project.projectManager}</div>
                            <div className="flex items-center gap-1.5"><Wrench size={14} className="text-emerald-500"/> {project.responsibleWorkshop?.name}</div>
                            <div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400"/> Created {new Date(project.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* Progress Donut/Status */}
                    <div className="flex flex-col items-center md:items-end justify-center">
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Operational Status</p>
                            <p className={`text-xl font-black ${project.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-500'}`}>
                                {project.status.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Dashboard (Guideline 2.1) */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="p-8 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Budget Authorization</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900">${budgetTotal.toLocaleString()}</span>
                        <span className="text-sm font-bold text-slate-400">USD Allocation</span>
                    </div>
                    <div className="pt-4">
                        <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                            <span className="text-slate-500">Resource Utilization</span>
                            <span className={isOverBudget ? 'text-red-600' : 'text-indigo-600'}>
                                {utilizationPercentage.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                            <div 
                                className={`h-full transition-all duration-1000 ${isOverBudget ? 'bg-red-500' : 'bg-indigo-600'}`} 
                                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }} 
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-4 bg-slate-50/50">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Physical Completion</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900">{project.progress}%</span>
                        <span className="text-sm font-bold text-slate-400">Task Completion</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                        {project.progress === 100 ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase">
                                <CheckCircle2 size={14} /> Project Finalized
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase">
                                <Activity size={14} className="animate-pulse" /> Active Field Work
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Activity Table (Guideline 3.2) */}
            <div className="p-6 md:p-10">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black text-slate-900">Activity Registry</h2>
                    <span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-full">
                        {project.activities?.length || 0} TOTAL TASKS
                    </span>
                </div>

                <div className="overflow-x-auto -mx-6 md:mx-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Supervisor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Actual Cost</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {project.activities?.map((activity: any) => (
                                <tr key={activity.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                                            {activity.description}
                                        </p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                            PO Ref: {activity.id.slice(-5)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-500 italic">
                                        {activity.supervisor || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-black text-slate-800">${activity.actualMaterialCost + activity.actualLaborCost}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase">
                                            {activity.stage}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}