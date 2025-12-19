'use client';

import React from 'react';
import { 
  Calendar, DollarSign, MapPin, User as UserIcon, Clock, AlertTriangle, 
  CheckCircle2, Activity, Edit3, Trash2, MoreVertical, 
  Box,
  HardHat,
  Construction,
  AlertCircle,
  UserCheck,
  ShieldAlert,
  Target,
  Briefcase
} from 'lucide-react';
import { MM_Activity, MM_Project, MM_StrategicPlan } from '../types/strategies';
import ConfirmAction from './ConfirmAction';

interface ActionProps {
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  id: string;
  item: any;
}

// Reusable Mobile-Friendly Action Menu
const ItemActions2 = ({ onEdit, onDelete, id, item }: ActionProps) => (
  <div className="flex gap-2">
    <button 
      onClick={() => onEdit?.(item)}
      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
    >
      <Edit3 size={18} />
    </button>
    {/* <button 
      onClick={() => onDelete?.(id)}
      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      <Trash2 size={18} />
    </button> */}
   {/* Only render ConfirmAction if onDelete is provided */}
    {onDelete && (
      <ConfirmAction 
        onConfirm={onDelete} // Now TS knows this isn't undefined
        itemId={id}
        action="Delete" 
        heading="Confirm Deletion"
        description={`This action will permanently remove this item from the NRZ system. This cannot be undone.`}
        showHint={false} 
      />
    )}
</div>
);

// Reusable Mobile-Friendly Action Menu
const ItemActions = ({ onEdit, onDelete, id, item }: ActionProps) => (
  <div className="flex items-center gap-1"> 
    {/* Edit Button */}
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onEdit?.(item);
      }}
      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      title="Edit"
    >
      <Edit3 size={18} />
    </button>

    {/* Delete Action (Confirm Dialog) */}
    {onDelete && (
      <ConfirmAction 
        onConfirm={onDelete} 
        itemId={id}
        action="Delete" 
        heading="Confirm Deletion"
        description="This action will permanently remove this item from the NRZ system. This cannot be undone."
        showHint={false} 
        // We pass a custom trigger to match the Edit button's style perfectly
        triggerButton={
          <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={18} />
          </button>
        }
      />
    )}
  </div>
);


interface Workshop {
  id: string;
  name: string;
  location: string;
  specialization: string;
  capacity: number;
  _count?: {
    mm_projects: number;
  };
}

interface Props {
  workshops: Workshop[];
  onEdit?: (workshop: Workshop) => void;
  onDelete?: (id: string) => void;
}

export const WorkshopListView = ({ workshops, onEdit, onDelete }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2 md:p-0">
    {workshops.map((workshop) => {
      const projectCount = workshop._count?.mm_projects || 0;
      const loadFactor = Math.round((projectCount / (workshop.capacity || 1)) * 100);
      
      return (
        <div key={workshop.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-300 transition-all group relative">
          
          {/* Action Overlay for Mobile/Desktop */}
          <div className="absolute top-4 right-4 flex gap-1">
            <button 
              onClick={() => onEdit?.(workshop)}
              className="p-2 bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <Edit3 size={16} />
            </button>
            <button 
              onClick={() => onDelete?.(workshop.id)}
              className="p-2 bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="p-5 border-b border-slate-50 bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
            <div className="p-2.5 w-fit bg-white shadow-sm border border-slate-100 text-indigo-600 rounded-xl mb-3">
              <Activity size={20} />
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest border uppercase ${
              workshop.specialization === 'MECHANICAL' 
                ? 'bg-blue-50 text-blue-700 border-blue-100' 
                : 'bg-purple-50 text-purple-700 border-purple-100'
            }`}>
              {workshop.specialization}
            </span>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-black text-slate-800 mb-1 tracking-tight truncate pr-16">
              {workshop.name}
            </h3>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-6">
              <MapPin size={12} className="text-slate-400" />
              {workshop.location}
            </div>
            
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Box size={10}/> Capacity
                </div>
                <span className="text-sm font-black text-slate-700">{workshop.capacity} Units</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <HardHat size={10}/> Projects
                </div>
                <span className="text-sm font-black text-indigo-600">{projectCount} Active</span>
              </div>
            </div>

            {/* Load Factor Visualization */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Load Factor</span>
                <span className={`text-[10px] font-black ${loadFactor > 90 ? 'text-red-600' : 'text-slate-700'}`}>
                  {loadFactor}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    loadFactor > 90 ? 'bg-red-500' : loadFactor > 70 ? 'bg-amber-500' : 'bg-indigo-500'
                  }`} 
                  style={{ width: `${Math.min(loadFactor, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);
export const StrategyListView = ({ strategies, onEdit, onDelete }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2 md:p-0">
    {strategies.map((plan: any) => {
      // Financial Calculation Logic
      const utilized = plan.mm_projects?.reduce((sum: number, p: any) => sum + (p.allocatedBudget || 0), 0) || 0;
      const remaining = plan.totalBudget - utilized;
      const percentUsed = Math.min((utilized / plan.totalBudget) * 100, 100);

      return (
        <div key={plan.id} className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden">
          {/* Top Row: Icon & Actions */}
          <div className="flex justify-between items-start mb-5">
            <div className={`p-3 rounded-2xl ${percentUsed > 95 ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
              {percentUsed > 95 ? <ShieldAlert size={22} /> : <Target size={22} />}
            </div>
            <ItemActions id={plan.id} item={plan} onEdit={onEdit} onDelete={onDelete} />
          </div>

          {/* Plan Identity */}
          <div className="mb-4">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">FY {plan.year} Strategy</h3>
            <div className="flex items-center gap-1.5 mt-1 text-indigo-600">
              <UserCheck size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {plan.assignedExecutive || 'No Executive Assigned'}
              </span>
            </div>
          </div>

          <p className="text-slate-500 text-xs mb-6 line-clamp-3 leading-relaxed min-h-[48px]">
            {plan.description}
          </p>
          
          {/* Progress & Utilization Metrics */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400">Utilization</span>
                <span className="text-sm font-black text-slate-800">${utilized.toLocaleString()}</span>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400">Ceiling</span>
                <span className="text-sm font-black text-slate-400">${plan.totalBudget.toLocaleString()}</span>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full ${
                  percentUsed > 90 ? 'bg-red-500' : percentUsed > 70 ? 'bg-amber-500' : 'bg-indigo-500'
                }`} 
                style={{ width: `${percentUsed}%` }} 
              />
            </div>

            <div className="flex justify-between text-[9px] font-bold">
              <span className={percentUsed > 90 ? 'text-red-600' : 'text-slate-500'}>
                {percentUsed.toFixed(1)}% Allocated
              </span>
              <span className="text-slate-500">
                ${remaining.toLocaleString()} Available
              </span>
            </div>
          </div>

          {/* Decorative Year Label */}
          <div className="absolute -bottom-2 -right-2 text-slate-50 opacity-[0.03] font-black text-7xl pointer-events-none group-hover:opacity-[0.05] transition-opacity">
            {plan.year}
          </div>
        </div>
      );
    })}
  </div>
);


/**
 * 🏗️ PROJECT GRID VIEW (Mobile Compliant)
 */

export const ProjectGridView = ({ projects, onEdit, onDelete }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 md:p-0">
    {projects.map((project: any) => {
      // Calculate variance for Financial Viability (Guideline 5.1)
      const costWarning = project.totalActualCost > project.allocatedBudget;
      
      return (
        <div key={project.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
              project.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
              project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
              {project.status?.replace('_', ' ') || 'PLANNED'}
            </span>
            <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} />
          </div>
          
          <h3 className="text-sm font-black text-slate-800 mb-4 line-clamp-1 flex items-center gap-2">
            <Briefcase size={14} className="text-slate-400" /> {project.name}
          </h3>
          
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-tight">
              <MapPin size={12} className="text-emerald-500" /> 
              <span className="truncate">{project.responsibleWorkshop?.name || 'Central'}</span>
            </div>
            {/* Updated projectManager mapping: directly accessing the string */}
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-tight">
              <UserIcon size={12} className="text-blue-500" /> 
              <span className="truncate">{project.projectManager || 'Unassigned'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 space-y-3">
            {/* Progress Section */}
            <div>
              <div className="flex justify-between text-[9px] font-black mb-1.5 text-slate-400 uppercase tracking-widest">
                <span>Operational Progress</span>
                <span className="text-blue-600">{project.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-50">
                <div 
                  className="bg-blue-600 h-full transition-all duration-1000" 
                  style={{ width: `${project.progress}%` }} 
                />
              </div>
            </div>

            {/* Financial Health Snapshot */}
            <div className="flex justify-between items-center">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase">Utilized</span>
                  <span className={`text-xs font-mono font-bold ${costWarning ? 'text-red-600' : 'text-slate-700'}`}>
                    ${project.totalActualCost?.toLocaleString()}
                  </span>
               </div>
               <div className="text-right flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase">Allocation</span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    ${project.allocatedBudget?.toLocaleString()}
                  </span>
               </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);


export const ActivityTableView = ({ activities, onEdit, onDelete }: any) => {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 hidden md:table-header-group">
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <th className="px-6 py-4">Activity & Supervisor</th>
            <th className="px-6 py-4">Timeline Status</th>
            <th className="px-6 py-4">Stage</th>
            <th className="px-6 py-4 text-right">Actual Cost</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {activities.map((act: any) => {
            // Logic for Variance Engine (Guideline 5.5)
            const isOverdue = !act.actualEnd && act.scheduledEnd && new Date() > new Date(act.scheduledEnd);
            const totalCost = (act.actualLaborCost || 0) + (act.actualMaterialCost || 0);
            
            return (
              <tr key={act.id} className="flex flex-col md:table-row p-4 md:p-0 hover:bg-slate-50/50 transition-colors">
                {/* 1. Description & Supervisor */}
                <td className="md:px-6 md:py-4">
                  <div className="font-bold text-slate-800 text-sm md:text-base leading-tight">
                    {act.description}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-medium uppercase tracking-tight">
                    <Construction size={10} /> {act.supervisor || 'Unassigned'}
                  </div>
                </td>

                {/* 2. Timeline Status (Variance Engine) */}
                <td className="md:px-6 md:py-4 mt-2 md:mt-0">
                  <div className="flex flex-col gap-1">
                    {isOverdue ? (
                      <span className="flex items-center gap-1 text-red-600 font-black text-[10px] uppercase">
                        <AlertCircle size={12} /> Overdue Variance
                      </span>
                    ) : act.actualEnd ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 font-black text-[10px] uppercase">
                        <Clock size={12} /> In Progress
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">
                      Target: {act.scheduledEnd ? new Date(act.scheduledEnd).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </td>

                {/* 3. Stage Badge */}
                <td className="md:px-6 md:py-4 mt-2 md:mt-0">
                  <span className={`text-[9px] px-2 py-1 rounded font-black border uppercase ${
                    act.stage === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    act.stage === 'PLANNING' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {act.stage}
                  </span>
                </td>

                {/* 4. Cost Analysis */}
                <td className="md:px-6 md:py-4 md:text-right font-mono font-bold mt-2 md:mt-0">
                  <div className="flex flex-col md:items-end">
                    <span className="md:hidden text-slate-400 text-[10px] uppercase mb-1">Total Cost:</span>
                    <span className={totalCost > act.allocatedBudget ? 'text-red-600' : 'text-emerald-600'}>
                      ${totalCost.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal">
                      Budget: ${act.allocatedBudget?.toLocaleString()}
                    </span>
                  </div>
                </td>

                {/* 5. Actions */}
                <td className="md:px-6 md:py-4 flex justify-end md:table-cell mt-4 md:mt-0 border-t md:border-0 pt-3 md:pt-4">
                  <div className="flex justify-center">
                    <ItemActions id={act.id} item={act} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};