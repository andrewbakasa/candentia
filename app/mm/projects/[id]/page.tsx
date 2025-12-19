'use client';

import { CheckCircle2, Clock, AlertTriangle, Hammer } from 'lucide-react';

interface Activity {
  id: string;
  description: string;
  progress: number;
  scheduledEnd: string;
  actualEnd?: string;
  isRework: boolean;
  reworkCost: number;
}

export default function ProjectActivityView({ activities }: { activities: Activity[] }) {
  
  const isOverdue = (end: string, actual?: string) => {
    return !actual && new Date(end) < new Date();
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Activity</th>
            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Timeline</th>
            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Progress</th>
            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {activities.map((act) => (
            <tr key={act.id} className={act.isRework ? "bg-orange-50/30" : ""}>
              <td className="px-6 py-4">
                <div className="font-medium text-slate-800">{act.description}</div>
                {act.isRework && (
                  <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mt-1">
                    <Hammer size={10} /> REWORK: ${act.reworkCost}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  {new Date(act.scheduledEnd).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="w-full bg-slate-100 rounded-full h-2 max-w-[100px]">
                  <div 
                    className={`h-2 rounded-full ${act.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                    style={{ width: `${act.progress}%` }}
                  />
                </div>
              </td>
              <td className="px-6 py-4">
                {isOverdue(act.scheduledEnd, act.actualEnd) ? (
                  <span className="text-red-600 flex items-center gap-1 text-sm font-semibold animate-pulse">
                    <AlertTriangle size={16} /> OVERDUE
                  </span>
                ) : act.actualEnd ? (
                  <span className="text-green-600 flex items-center gap-1 text-sm font-semibold">
                    <CheckCircle2 size={16} /> COMPLETED
                  </span>
                ) : (
                  <span className="text-slate-500 text-sm">IN PROGRESS</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}