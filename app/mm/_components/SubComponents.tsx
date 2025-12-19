import React from 'react';
import { 
  TrendingUp, Calendar, DollarSign, Briefcase, 
  MapPin, User as UserIcon, Clock, AlertTriangle, 
  CheckCircle2, LayoutDashboard, Target, Activity 
} from 'lucide-react';
import { MM_Activity, MM_Project, MM_StrategicPlan } from '../types/strategies';



// --- SUB-COMPONENTS ---

/**
 * 📊 STRATEGY LIST VIEW
 * Focuses on HQ Budget Utilization
 */
export const StrategyListView = ({ strategies }: { strategies: MM_StrategicPlan[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {strategies.map((plan) => {
      const utilized = plan.mm_projects?.reduce((sum, p) => sum + p.allocatedBudget, 0) || 0;
      const percentUsed = Math.min((utilized / plan.totalBudget) * 100, 100);

      return (
        <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={20} /></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ref: {plan.id.slice(-5)}</span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">FY {plan.year} Strategy</h3>
          <p className="text-slate-500 text-sm mb-6 h-10 line-clamp-2">{plan.description}</p>
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
              <span>Utilization</span>
              <span className="text-slate-800">${utilized.toLocaleString()} / ${plan.totalBudget.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ${percentUsed > 90 ? 'bg-red-500' : 'bg-blue-600'}`} 
                style={{ width: `${percentUsed}%` }} 
              />
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

/**
 * 🏗️ PROJECT GRID VIEW
 * Focuses on Workshop Output & Status
 */
export const ProjectGridView = ({ projects }: { projects: MM_Project[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {projects.map((project) => (
      <div key={project.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-800 leading-tight">{project.name}</h3>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              project.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
            }`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <div className="space-y-2 mb-6 text-sm text-slate-500">
            <div className="flex items-center gap-2"><MapPin size={14} className="text-blue-500" /> {project.responsibleWorkshop?.name || 'Central Workshop'}</div>
            <div className="flex items-center gap-2"><UserIcon size={14} /> PM: {project.projectManager?.name || 'Unassigned'}</div>
          </div>
          <div className="mt-auto pt-4 border-t border-slate-50">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-400 uppercase">Progress</span>
              <span className="text-blue-600">{project.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full transition-all duration-1000 ease-out" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * ⚙️ ACTIVITY TABLE VIEW
 * Focuses on Variance Tracking
 */
export const ActivityTableView = ({ activities }: { activities: MM_Activity[] }) => {
  const checkVariance = (end: Date | string | null, actual: Date | string | null) => 
    end && !actual && new Date(end) < new Date();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-xs font-bold text-slate-500 uppercase">
            <th className="px-6 py-4">Activity</th>
            <th className="px-6 py-4">Stage</th>
            <th className="px-6 py-4">Timeline</th>
            <th className="px-6 py-4 text-right">Actual Cost</th>
            <th className="px-6 py-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {activities.map((act) => {
            const hasVariance = checkVariance(act.scheduledEnd, act.actualEnd);
            return (
              <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{act.description}</div>
                  <div className="text-xs text-slate-400">Sup: {act.supervisor?.name || 'Pending'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-black border border-slate-200 uppercase">{act.stage}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5"><Clock size={14} className={hasVariance ? "text-red-500" : ""} /> {act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : 'TBD'}</div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-sm">${(act.actualLaborCost + act.actualMaterialCost).toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-black text-[11px]">
                  {hasVariance ? (
                    <span className="text-red-600 flex items-center justify-end gap-1 animate-pulse"><AlertTriangle size={14}/> VARIANCE</span>
                  ) : act.actualEnd ? (
                    <span className="text-green-600 flex items-center justify-end gap-1"><CheckCircle2 size={14}/> MET</span>
                  ) : <span className="text-slate-400">ACTIVE</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};