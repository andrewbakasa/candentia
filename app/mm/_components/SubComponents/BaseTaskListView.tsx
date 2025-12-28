'use client';

import React, { useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from "sonner";
import { 
    Clock, BookOpen, FileSpreadsheet, Sparkles, AlignLeft
} from 'lucide-react';
import { ItemActions } from '../SubComponents';
import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

const BASE_TASK_SCOPES: SearchScope[] = [
    { key: 'standardTitle', label: 'Standard Title' },
    { key: 'category', label: 'Category' },
    { key: 'standardDesc', label: 'Description' },
];

export const BaseTaskGridView = ({ baseTasks, onEdit, onDelete, permissions }: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['standardTitle', 'category']);

    const filteredTasks = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return baseTasks || [];
        return baseTasks?.filter((task: any) => {
            return activeSearchFields.some(field => {
                const val = (task as any)[field];
                if (Array.isArray(val)) return val.some(s => s.toLowerCase().includes(term));
                return String(val || '').toLowerCase().includes(term);
            });
        });
    }, [baseTasks, searchTerm, activeSearchFields]);

    const handleExport = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Standard Benchmarks');
            worksheet.columns = [
                { header: 'No.', key: 'index', width: 8 },
                { header: 'Standard Title', key: 'title', width: 35 },
                { header: 'Description', key: 'desc', width: 50 },
                { header: 'Category', key: 'category', width: 20 },
                { header: 'Benchmark Hours', key: 'hours', width: 15 },
            ];
            filteredTasks.forEach((task: any, index: number) => {
                worksheet.addRow({
                    index: index + 1,
                    title: task.standardTitle,
                    desc: task.standardDesc,
                    category: task.category,
                    hours: task.benchmarkHours,
                });
            });
            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `NRZ_BaseTasks_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success("Master List Exported");
        } catch (e) { toast.error("Export failed"); }
    };

    return (
        <div className="space-y-6">
            {/* 🔍 SEARCH & EXPORT BAR */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between">
                    <div className="flex-1">
                        <SearchFilterEngine 
                            scopes={BASE_TASK_SCOPES}
                            initialActiveScopes={activeSearchFields}
                            onSearchChange={setSearchTerm}
                            onScopesChange={setActiveSearchFields}
                            placeholder="Search standard benchmarks..."
                        />
                    </div>
                    <button onClick={handleExport} className="h-16 px-8 bg-slate-900 text-white rounded-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200">
                        <FileSpreadsheet size={20} />
                        <span className="text-[11px] font-black uppercase tracking-widest">Export ({filteredTasks.length})</span>
                    </button>
                </div>
            </div>

            {/* 🖥️ DESKTOP TABLE VIEW */}
            <div className="hidden lg:block overflow-hidden bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-16 text-center">No.</th>
                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Procedure & Description</th>
                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</th>
                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Benchmark</th>
                            <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredTasks.map((task: any, index: number) => (
                            <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="p-5 text-center font-black text-slate-300 text-xs vertical-top">{index + 1}</td>
                                <td className="p-5 max-w-md">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                                                <BookOpen size={14} />
                                            </div>
                                            <span className="font-bold text-slate-800 text-sm tracking-tight">{task.standardTitle}</span>
                                        </div>
                                        {/* Desktop: Full Description in Small Print */}
                                        <p className="text-[11px] leading-relaxed text-slate-500 pl-8">
                                            {task.standardDesc || "No procedure description provided."}
                                        </p>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 uppercase">
                                        {task.category || 'General'}
                                    </span>
                                </td>
                                <td className="p-5 text-sm font-black text-amber-600">{task.benchmarkHours} hrs</td>
                                <td className="p-5 text-right">
                                    <ItemActions id={task.id} item={task} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 📱 MOBILE CARD VIEW */}
            <div className="lg:hidden space-y-4 px-2">
                {filteredTasks.map((task: any, index: number) => (
                    <div key={task.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                                    {index + 1}
                                </span>
                                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                    {task.category}
                                </span>
                            </div>
                            <ItemActions id={task.id} item={task} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
                        </div>
                        
                        <h3 className="font-black text-slate-800 text-sm mb-2">{task.standardTitle}</h3>
                        
                        {/* Mobile: Truncated Description */}
                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 italic leading-relaxed">
                            {task.standardDesc || "No procedure description provided."}
                        </p>

                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 text-amber-600">
                                <Clock size={14}/>
                                <span className="text-xs font-black uppercase tracking-wider">{task.benchmarkHours} Hours</span>
                            </div>
                            <Sparkles size={14} className="text-indigo-300" />
                        </div>
                    </div>
                ))}
            </div>

            {filteredTasks.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching benchmarks found</p>
                </div>
            )}
        </div>
    );
};
// 'use client';

// import React, { useMemo, useState } from 'react';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { toast } from "sonner";
// import { 
//     Clock, Tag, BookOpen, Layers, 
//     FileSpreadsheet, Sparkles, Hammer, ListOrdered
// } from 'lucide-react';
// import { ItemActions } from '../SubComponents';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// const BASE_TASK_SCOPES: SearchScope[] = [
//     { key: 'standardTitle', label: 'Standard Title' },
//     { key: 'category', label: 'Category' },
//     { key: 'requiredSkills', label: 'Required Skills' },
// ];

// export const BaseTaskGridView = ({ baseTasks, onEdit, onDelete, permissions }: any) => {
//     const [searchTerm, setSearchTerm] = useState('');
//     const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['standardTitle', 'category']);

//     const filteredTasks = useMemo(() => {
//         const term = searchTerm.toLowerCase().trim();
//         if (!term) return baseTasks || [];
//         return baseTasks?.filter((task: any) => {
//             return activeSearchFields.some(field => {
//                 const val = (task as any)[field];
//                 if (Array.isArray(val)) return val.some(s => s.toLowerCase().includes(term));
//                 return String(val || '').toLowerCase().includes(term);
//             });
//         });
//     }, [baseTasks, searchTerm, activeSearchFields]);

//     const handleExport = async () => {
//         try {
//             const workbook = new ExcelJS.Workbook();
//             const worksheet = workbook.addWorksheet('Standard Benchmarks');
//             worksheet.columns = [
//                 { header: 'No.', key: 'index', width: 8 },
//                 { header: 'Standard Title', key: 'title', width: 35 },
//                 { header: 'Category', key: 'category', width: 20 },
//                 { header: 'Benchmark Hours', key: 'hours', width: 15 },
//                 { header: 'Skills', key: 'skills', width: 30 },
//             ];
//             filteredTasks.forEach((task: any, index: number) => {
//                 worksheet.addRow({
//                     index: index + 1,
//                     title: task.standardTitle,
//                     category: task.category,
//                     hours: task.benchmarkHours,
//                     skills: task.requiredSkills?.join(', '),
//                 });
//             });
//             const buffer = await workbook.xlsx.writeBuffer();
//             saveAs(new Blob([buffer]), `NRZ_BaseTasks_${new Date().toISOString().split('T')[0]}.xlsx`);
//             toast.success("Master List Exported");
//         } catch (e) { toast.error("Export failed"); }
//     };

//     return (
//         <div className="space-y-6">
//             {/* 🔍 SEARCH & EXPORT BAR */}
//             <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
//                 <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between">
//                     <div className="flex-1">
//                         <SearchFilterEngine 
//                             scopes={BASE_TASK_SCOPES}
//                             initialActiveScopes={activeSearchFields}
//                             onSearchChange={setSearchTerm}
//                             onScopesChange={setActiveSearchFields}
//                             placeholder="Search standard benchmarks..."
//                         />
//                     </div>
//                     <button onClick={handleExport} className="h-16 px-8 bg-slate-900 text-white rounded-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200">
//                         <FileSpreadsheet size={20} />
//                         <span className="text-[11px] font-black uppercase tracking-widest">Export ({filteredTasks.length})</span>
//                     </button>
//                 </div>
//             </div>

//             {/* 🖥️ DESKTOP TABLE VIEW */}
//             <div className="hidden lg:block overflow-hidden bg-white border border-slate-200 rounded-[2rem] shadow-sm">
//                 <table className="w-full text-left border-collapse">
//                     <thead>
//                         <tr className="bg-slate-50 border-b border-slate-100">
//                             <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-16 text-center">No.</th>
//                             <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Standard Task</th>
//                             <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</th>
//                             <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Benchmark</th>
//                             <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Skills</th>
//                             <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-50">
//                         {filteredTasks.map((task: any, index: number) => (
//                             <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
//                                 <td className="p-5 text-center font-black text-slate-300 text-xs">{index + 1}</td>
//                                 <td className="p-5">
//                                     <div className="flex items-center gap-3">
//                                         <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
//                                             <BookOpen size={16} />
//                                         </div>
//                                         <span className="font-bold text-slate-800 text-sm">{task.standardTitle}</span>
//                                     </div>
//                                 </td>
//                                 <td className="p-5">
//                                     <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 uppercase">
//                                         {task.category || 'General'}
//                                     </span>
//                                 </td>
//                                 <td className="p-5 text-sm font-black text-amber-600">{task.benchmarkHours} hrs</td>
//                                 <td className="p-5">
//                                     <div className="flex flex-wrap gap-1">
//                                         {task.requiredSkills?.slice(0, 2).map((s: string) => (
//                                             <span key={s} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 italic">{s}</span>
//                                         ))}
//                                         {task.requiredSkills?.length > 2 && <span className="text-[9px] font-bold text-indigo-400">+{task.requiredSkills.length - 2}</span>}
//                                     </div>
//                                 </td>
//                                 <td className="p-5 text-right">
//                                     <ItemActions id={task.id} item={task} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

//             {/* 📱 MOBILE CARD VIEW */}
//             <div className="lg:hidden space-y-4">
//                 {filteredTasks.map((task: any, index: number) => (
//                     <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
//                         <div className="flex justify-between items-center mb-4">
//                             <div className="flex items-center gap-2">
//                                 <span className="w-6 h-6 rounded bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
//                                     {index + 1}
//                                 </span>
//                                 <span className="text-[10px] font-black uppercase text-indigo-600 tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
//                                     Benchmark
//                                 </span>
//                             </div>
//                             <ItemActions id={task.id} item={task} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
//                         </div>
//                         <h3 className="font-black text-slate-800 mb-4">{task.standardTitle}</h3>
//                         <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
//                             <div>
//                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Time</p>
//                                 <p className="text-sm font-black text-amber-600 flex items-center gap-1"><Clock size={12}/> {task.benchmarkHours}h</p>
//                             </div>
//                             <div>
//                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Category</p>
//                                 <p className="text-xs font-bold text-slate-700 truncate">{task.category}</p>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             {filteredTasks.length === 0 && (
//                 <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
//                     <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching benchmarks found</p>
//                 </div>
//             )}
//         </div>
//     );
// };
// 'use client';

// import React, { useMemo, useState } from 'react';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { toast } from "sonner";
// import { 
//     Clock, Tag, BookOpen, Layers, 
//     FileSpreadsheet, Sparkles, Hammer
// } from 'lucide-react';
// import { ItemActions } from '../SubComponents';
// import { SearchFilterEngine, SearchScope } from "../SearchEngineFilter";

// // --- SEARCH CONFIGURATION FOR BENCHMARKS ---
// const BASE_TASK_SCOPES: SearchScope[] = [
//     { key: 'standardTitle', label: 'Standard Title' },
//     { key: 'category', label: 'Category' },
//     { key: 'requiredSkills', label: 'Required Skills' },
// ];

// export const BaseTaskGridView = ({ baseTasks, onEdit, onDelete, permissions }: any) => {
//     const [searchTerm, setSearchTerm] = useState('');
//     const [activeSearchFields, setActiveSearchFields] = useState<string[]>(['standardTitle', 'category']);

//     // --- FILTER LOGIC ---
//     const filteredTasks = useMemo(() => {
//         const term = searchTerm.toLowerCase().trim();
//         if (!term) return baseTasks || [];

//         return baseTasks?.filter((task: any) => {
//             return activeSearchFields.some(field => {
//                 const val = (task as any)[field];
//                 // Handle array search for skills
//                 if (Array.isArray(val)) {
//                     return val.some(s => s.toLowerCase().includes(term));
//                 }
//                 return String(val || '').toLowerCase().includes(term);
//             });
//         });
//     }, [baseTasks, searchTerm, activeSearchFields]);

//     // --- EXCEL EXPORT (Guideline 1 Compliance) ---
//     const handleExport = async () => {
//         try {
//             const workbook = new ExcelJS.Workbook();
//             const worksheet = workbook.addWorksheet('Standard Benchmarks');

//             worksheet.columns = [
//                 { header: 'Standard Title', key: 'title', width: 35 },
//                 { header: 'Category', key: 'category', width: 20 },
//                 { header: 'Benchmark Hours', key: 'hours', width: 20 },
//                 { header: 'Required Skills', key: 'skills', width: 40 },
//                 { header: 'Description', key: 'desc', width: 50 },
//             ];

//             worksheet.getRow(1).font = { bold: true };
//             worksheet.getRow(1).fill = {
//                 type: 'pattern',
//                 pattern: 'solid',
//                 fgColor: { argb: 'F8FAFC' }
//             };

//             filteredTasks.forEach((task: any) => {
//                 worksheet.addRow({
//                     title: task.standardTitle,
//                     category: task.category || 'Uncategorized',
//                     hours: task.benchmarkHours || 0,
//                     skills: task.requiredSkills?.join(', ') || 'None',
//                     desc: task.standardDesc || '',
//                 });
//             });

//             const buffer = await workbook.xlsx.writeBuffer();
//             saveAs(new Blob([buffer]), `NRZ_Benchmarks_${new Date().toISOString().split('T')[0]}.xlsx`);
//             toast.success(`Exported ${filteredTasks.length} standard templates`);
//         } catch (error) {
//             toast.error("Failed to generate Benchmark report");
//         }
//     };

//     return (
//         <div className="space-y-6">
            
//             {/* 🔍 SEARCH & EXPORT BAR */}
//             <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
//                 <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between">
//                     <div className="flex-1">
//                         <SearchFilterEngine 
//                             scopes={BASE_TASK_SCOPES}
//                             initialActiveScopes={activeSearchFields}
//                             onSearchChange={setSearchTerm}
//                             onScopesChange={setActiveSearchFields}
//                             placeholder="Search benchmarks by title, category or skills..."
//                         />
//                     </div>

//                     <button 
//                         onClick={handleExport}
//                         className="h-16 px-8 bg-slate-900 text-white rounded-2xl hover:bg-amber-600 transition-all shadow-md flex items-center justify-center gap-3"
//                     >
//                         <FileSpreadsheet size={20} />
//                         <span className="text-[11px] font-black uppercase tracking-widest">Export Master List ({filteredTasks.length})</span>
//                     </button>
//                 </div>
//             </div>

//             {/* GRID VIEW */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {filteredTasks?.map((task: any) => (
//                     <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col group">
//                         <div className="flex justify-between items-start mb-4">
//                             <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100 flex items-center gap-1">
//                                 <Sparkles size={10} /> Master Template
//                             </span>
//                             <ItemActions id={task.id} item={task} onEdit={onEdit} onDelete={onDelete} permissions={permissions}/>
//                         </div>
                        
//                         <h3 className="text-sm font-black text-slate-800 mb-2 group-hover:text-amber-600 transition-colors flex items-center gap-2">
//                             <BookOpen size={14} className="text-slate-400" /> {task.standardTitle}
//                         </h3>

//                         <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-4">
//                             <Layers size={12} className="text-purple-500" /> {task.category || 'Mechanical'}
//                         </div>

//                         {/* Benchmark Metric Card */}
//                         <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-center justify-between">
//                             <div className="flex items-center gap-2">
//                                 <Clock size={16} className="text-amber-600" />
//                                 <span className="text-[10px] font-black text-amber-800 uppercase">Benchmark Time</span>
//                             </div>
//                             <span className="text-sm font-black text-amber-600">{task.benchmarkHours} hrs</span>
//                         </div>

//                         {/* Skills List */}
//                         <div className="space-y-2 mt-auto">
//                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
//                                 <Hammer size={10} /> Required Skillset
//                             </label>
//                             <div className="flex flex-wrap gap-1.5">
//                                 {task.requiredSkills?.map((skill: string) => (
//                                     <span key={skill} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[9px] font-bold border border-slate-200">
//                                         {skill}
//                                     </span>
//                                 ))}
//                                 {(!task.requiredSkills || task.requiredSkills.length === 0) && (
//                                     <span className="text-[9px] text-slate-400 italic">No specific skills mapped</span>
//                                 )}
//                             </div>
//                         </div>

//                         {/* Description Preview */}
//                         <p className="mt-4 text-[11px] text-slate-500 line-clamp-2 italic border-t border-slate-50 pt-3">
//                             {task.standardDesc || "No procedure description provided."}
//                         </p>
//                     </div>
//                 ))}
//             </div>

//             {filteredTasks?.length === 0 && (
//                 <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
//                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching benchmarks found</p>
//                 </div>
//             )}
//         </div>
//     );
// };