'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, MapPin, User as UserIcon, Clock, AlertTriangle, 
  CheckCircle2, Activity, Edit3, Trash2, Box, HardHat, Construction,
  AlertCircle, UserCheck, ShieldAlert, Target, Briefcase, ExternalLink,
  ChevronDown, ChevronUp, ListChecks, Plus, User,
  Search,
  X,
  TrendingDown,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import ConfirmAction from './ConfirmAction';


interface ActionProps {
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  onAddTask?: (item: any) => void;
  id: string;
  item: any;
  // Permissions broken down by action
  permissions: {
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
  };
}


export const ItemActions = ({ onEdit, onDelete, onAddTask, id, item, permissions }: ActionProps) => (
  <div className="flex items-center gap-1"> 
    {/* ADD TASK RESTRICTION */}
    {onAddTask && permissions.canAdd && (
      <button 
        onClick={(e) => { e.stopPropagation(); onAddTask(item); }}
        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase"
        title="Add Task"
      >
        <Plus size={16} /> <span className="hidden sm:inline">Task</span>
      </button>
    )}

    {/* EDIT RESTRICTION */}
    {onEdit && permissions.canEdit && (
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        title="Edit"
      >
        <Edit3 size={18} />
      </button>
    )}

    {/* DELETE RESTRICTION */}
    {onDelete && permissions.canDelete && (
      <ConfirmAction 
        onConfirm={onDelete} 
        itemId={id}
        action="Delete" 
        heading="Confirm Deletion"
        description="This action will permanently remove this item. This cannot be undone."
        showHint={false} 
        triggerButton={
          <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={18} />
          </button>
        }
      />
    )}
  </div>
);
/**
 * 🏭 WORKSHOP GRID VIEW
 * High-level capacity monitoring for regional hubs.
 */

export const WorkshopListView = ({ workshops, onEdit, onDelete,permissions}: any) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 🛠️ Filter Logic: Matches Name, Location, or Specialization
  const filteredWorkshops = workshops?.filter((workshop: any) =>
    workshop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 🔍 SEARCH INPUT - Consistent with Activity/Project/Strategy views */}
      <div className="relative group max-w-md px-2 md:px-0">
        <div className="absolute inset-y-0 left-0 pl-4 md:left-4 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search workshops, locations, or types..."
          className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* WORKSHOP GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2 md:p-0">
        {filteredWorkshops?.map((workshop: any) => {
          const projectCount = workshop.projectCount//_count?.mm_projects || 0;
          const loadFactor = Math.round((projectCount / (workshop.capacity || 1)) * 100);
          
          return (
            <div key={workshop.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-300 transition-all group relative">
              <div className="absolute top-4 right-4 z-10">
                 <ItemActions id={workshop.id} item={workshop} onEdit={onEdit} onDelete={onDelete} permissions={permissions} />
              </div>

              <div className="p-5 border-b border-slate-50 bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
                <div className="p-2.5 w-fit bg-white shadow-sm border border-slate-100 text-indigo-600 rounded-xl mb-3">
                  <Activity size={20} />
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest border uppercase ${
                  workshop.specialization === 'MECHANICAL' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'
                }`}>
                  {workshop.specialization}
                </span>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-black text-slate-800 mb-1 tracking-tight truncate pr-12">{workshop.name}</h3>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-6">
                  <MapPin size={12} className="text-slate-400" /> {workshop.location}
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

                <div className="mt-auto space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Load Factor</span>
                    <span className={`text-[10px] font-black ${loadFactor > 90 ? 'text-red-600' : 'text-slate-700'}`}>{loadFactor}%</span>
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

      {/* EMPTY STATE */}
      {filteredWorkshops?.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching workshops found</p>
        </div>
      )}
    </div>
  );
};

/**
 * 🎯 STRATEGY GRID VIEW
 * Visualizes fiscal year budget utilization (Guideline 2.1).
 */

export const StrategyListView = ({ strategies, onEdit, onDelete,permissions }: any) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 🛠️ Filter Logic: Matches Year, Executive, or Description
  const filteredStrategies = strategies?.filter((plan: any) =>
    plan.year?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.assignedExecutive?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 🔍 SEARCH INPUT - Consistent with Activity/Project views */}
      <div className="relative group max-w-md px-2 md:px-0">
        <div className="absolute inset-y-0 left-0 pl-4 md:left-4 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Filter strategies, years, or executives..."
          className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* STRATEGY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2 md:p-0">
        {filteredStrategies?.map((plan: any) => {
          const utilized = plan.mm_projects?.reduce((sum: number, p: any) => sum + (p.allocatedBudget || 0), 0) || 0;
          const remaining = plan.totalBudget - utilized;
          const percentUsed = Math.min((utilized / plan.totalBudget) * 100, 100);

          return (
            <div key={plan.id} className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all relative overflow-hidden flex flex-col">
              <div className="flex justify-between items-start mb-5">
                <div className={`p-3 rounded-2xl ${percentUsed > 95 ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {percentUsed > 95 ? <ShieldAlert size={22} /> : <Target size={22} />}
                </div>
                {/* Assuming ItemActions is available globally or imported */}
                <ItemActions id={plan.id} item={plan} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">FY {plan.year} Strategy</h3>
                <div className="flex items-center gap-1.5 mt-1 text-indigo-600">
                  <UserCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{plan.assignedExecutive || 'Unassigned'}</span>
                </div>
              </div>

              <p className="text-slate-500 text-xs mb-6 line-clamp-3 leading-relaxed min-h-[48px]">
                {plan.description}
              </p>
              
              <div className="mt-auto space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
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
                    className={`h-full transition-all duration-1000 rounded-full ${
                      percentUsed > 90 ? 'bg-red-500' : percentUsed > 70 ? 'bg-amber-500' : 'bg-indigo-500'
                    }`} 
                    style={{ width: `${percentUsed}%` }} 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {filteredStrategies?.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching strategies found</p>
        </div>
      )}
    </div>
  );
};

/**
 * 🏗️ PROJECT GRID VIEW
 * Card-based operational tracking.
 */

export const ProjectGridView = ({ projects, onEdit, onDelete,permissions }: any) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 🛠️ Filter Logic: Name, Manager, or Workshop
  const filteredProjects = projects?.filter((project: any) =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.projectManager?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.responsibleWorkshop?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 🔍 SEARCH INPUT - Matches Activity View Style */}
      <div className="relative group max-w-md px-2 md:px-0">
        <div className="absolute inset-y-0 left-0 pl-4 md:left-4 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search projects, managers, or workshops..."
          className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* GRID VIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 md:p-0">
        {filteredProjects?.map((project: any) => {
          const costWarning = project.totalActualCost > project.allocatedBudget;
          
          return (
            <div key={project.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                  project.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                  project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  {project.status?.replace('_', ' ') || 'PLANNED'}
                </span>
                <ItemActions id={project.id} item={project} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
              </div>
              
              <Link href={`/mm/projects/${project.id}`}>
                <h3 className="text-sm font-black text-slate-800 mb-4 hover:text-indigo-600 cursor-pointer flex items-center gap-2">
                  <Briefcase size={14} className="text-slate-400" /> {project.name}
                </h3>
              </Link>
              
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase truncate">
                  <MapPin size={12} className="text-emerald-500" /> {project.responsibleWorkshop?.name || 'Central'}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase truncate">
                  <UserIcon size={12} className="text-blue-500" /> {project.projectManager || 'Unassigned'}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 space-y-3 mt-auto">
                <div>
                  <div className="flex justify-between text-[9px] font-black mb-1.5 text-slate-400 uppercase tracking-widest">
                    <span>Progress</span>
                    <span className="text-blue-600">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Cost</span>
                      <span className={`text-xs font-bold ${costWarning ? 'text-red-600' : 'text-slate-700'}`}>
                        ${project.totalActualCost?.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Budget</span>
                      <span className="text-xs font-bold text-slate-400">
                        ${project.allocatedBudget?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Link 
                    href={`/mm/projects/${project.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Full Project Report <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {filteredProjects?.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching projects found</p>
        </div>
      )}
    </div>
  );
};



// --- SUB-COMPONENT FOR METRICS ---
const MetricBadge = ({ icon, label, value, color }: any) => (
  <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border border-transparent shadow-sm ${color.split(' ')[1]}`}>
    <div className={`${color.split(' ')[0]}`}>{icon}</div>
    <div>
      <p className="text-[8px] font-black uppercase tracking-widest opacity-60">{label}</p>
      <p className={`text-sm font-black leading-none ${color.split(' ')[0]}`}>{value}</p>
    </div>
  </div>
);
