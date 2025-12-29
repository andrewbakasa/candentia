'use client';

import React, { useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from "sonner";
import { 
  Search, 
  FileSpreadsheet, 
  Target, 
  UserCheck, 
  ShieldAlert 
} from 'lucide-react';
import { ItemActions } from '../SubComponents';
import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// --- SEARCH CONFIGURATION ---
const STRATEGY_SCOPES: SearchScope[] = [
  { key: 'year', label: 'Fiscal Year' },
  { key: 'assignedExecutive', label: 'Executive' },
  { key: 'description', label: 'Description' },
];

interface StrategyListViewProps {
  strategies: any[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  permissions: any;
}

export const StrategyListView = ({ strategies, onEdit, onDelete, permissions }: StrategyListViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['year', 'assignedExecutive']);

  // --- FILTER LOGIC ---
  const filteredStrategies = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return strategies || [];

    return strategies?.filter((plan: any) => {
      return activeSearchFields.some(field => {
        const val = plan[field];
        return String(val || '').toLowerCase().includes(term);
      });
    });
  }, [strategies, searchTerm, activeSearchFields]);

  // --- EXCEL EXPORT ---
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Strategy Reports');

      worksheet.columns = [
        { header: 'Fiscal Year', key: 'year', width: 15 },
        { header: 'Assigned Executive', key: 'executive', width: 25 },
        { header: 'Total Budget', key: 'total', width: 18 },
        { header: 'Utilized Budget', key: 'used', width: 18 },
        { header: 'Remaining', key: 'remaining', width: 18 },
        { header: '% Utilization', key: 'percent', width: 15 },
        { header: 'Description', key: 'desc', width: 60 },
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4F46E5' } // Indigo-600
      };

      filteredStrategies.forEach((plan: any) => {
        const utilized = plan.mm_projects?.reduce((sum: number, p: any) => sum + (p.allocatedBudget || 0), 0) || 0;
        const remaining = plan.totalBudget - utilized;
        const percentUsed = (utilized / plan.totalBudget);

        worksheet.addRow({
          year: `FY ${plan.year}`,
          executive: plan.assignedExecutive || 'Unassigned',
          total: plan.totalBudget,
          used: utilized,
          remaining: remaining,
          percent: percentUsed,
          desc: plan.description,
        });
      });

      worksheet.getColumn('C').numFmt = '"$"#,##0';
      worksheet.getColumn('D').numFmt = '"$"#,##0';
      worksheet.getColumn('E').numFmt = '"$"#,##0';
      worksheet.getColumn('F').numFmt = '0%';

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Strategy_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Spreadsheet generated for ${filteredStrategies.length} records`);
    } catch (error) {
      toast.error("Failed to export Excel file");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 🛠️ CONTROL BAR */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between">
          
          <div className="flex-1">
            <SearchFilterEngine 
                scopes={STRATEGY_SCOPES}
                initialActiveScopes={activeSearchFields}
                onSearchChange={setSearchTerm}
                onScopesChange={setActiveSearchFields}
                placeholder="Search strategies by year, executive or details..."
            />
          </div>

          <button 
            onClick={handleExport}
            disabled={filteredStrategies.length === 0}
            className="h-16 px-8 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-3"
          >
            <FileSpreadsheet size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">Export ({filteredStrategies.length})</span>
          </button>
        </div>
      </div>

      {/* 🗂️ GRID VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2 md:p-0">
        {filteredStrategies?.map((plan: any) => {
          const utilized = plan.mm_projects?.reduce((sum: number, p: any) => sum + (p.allocatedBudget || 0), 0) || 0;
          const percentUsed = Math.min((utilized / plan.totalBudget) * 100, 100);

          return (
            <div key={plan.id} className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all relative overflow-hidden flex flex-col">
              <div className="flex justify-between items-start mb-5">
                <div className={`p-3 rounded-2xl ${percentUsed > 90 ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {percentUsed > 90 ? <ShieldAlert size={22} /> : <Target size={22} />}
                </div>
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
              
              <div className="mt-auto space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Budget Utilization</span>
                    <span className="text-sm font-black text-slate-800">${utilized.toLocaleString()}</span>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Ceiling</span>
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

      {/* ⚠️ EMPTY STATE */}
      {filteredStrategies?.length === 0 && (
        <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
             <Search size={24} className="text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching strategies found</p>
          <button onClick={() => setSearchTerm('')} className="mt-4 text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};