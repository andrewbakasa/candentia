'use client';

import React, { useMemo, useState } from 'react';
import {  User as UserIcon,  Edit3, Trash2, Plus, } from 'lucide-react';
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


/**
 * 🎯 STRATEGY GRID VIEW
 * Visualizes fiscal year budget utilization (Guideline 2.1).
 */



/**
 * 🏗️ PROJECT GRID VIEW
 * Card-based operational tracking.
 */





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
