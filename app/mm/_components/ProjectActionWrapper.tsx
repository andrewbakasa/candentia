'use client';

import React, { useState } from 'react';
import { ArrowLeft, Link2, Printer, Check, FileSpreadsheet, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface EntityActionsHeaderProps {
    itemId: string;
    editPath: string;
    entityLabel: string;
    backLabel?: string;
    data?: any; // The project/activity object to export
}

export default function EntityActionsHeader({ 
    itemId, 
    editPath, 
    entityLabel, 
    backLabel = "Back to List",
    data
}: EntityActionsHeaderProps) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handlePrint = () => window.print();

    const handleExportExcel = async () => {
        if (!data) return;
        setIsExporting(true);
    
        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Project Report');

            // --- 1. DEFINE STYLES ---
            const headerStyle: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate-800
            const sectionFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate-100

            // --- 2. PROJECT SUMMARY SECTION ---
            ws.addRow(['PROJECT SUMMARY']).font = { bold: true, size: 14 };
            ws.addRow(['Attribute', 'Value', 'Context / Progress']);
            ws.getRow(2).font = headerStyle;
            ws.getRow(2).fill = headerFill;

            ws.addRows([
                ['Project Name', data.name, data.status],
                ['Project Manager', data.projectManager, `ID: ${data.id}`],
                ['Workshop', data.responsibleWorkshop?.name, data.responsibleWorkshop?.location],
                ['Allocated Budget', data.allocatedBudget, 'Total Approved'],
                ['Actual Cost to Date', data.totalActualCost, `${((data.totalActualCost / data.allocatedBudget) * 100).toFixed(1)}% Utilization`],
                ['Strategic Plan', data.plan?.description, `FY ${data.plan?.year}`],
            ]);

            ws.addRow([]); // Spacer

            // --- 3. ACTIVITIES SECTION ---
            ws.addRow(['DETAILED ACTIVITIES']).font = { bold: true, size: 12 };
            const actHeader = ws.addRow(['Description', 'Supervisor', 'Stage', 'Budget', 'Actual Material']);
            actHeader.font = headerStyle;
            actHeader.fill = { ...headerFill, fgColor: { argb: 'FF4F46E5' } }; // Indigo-600

            data.activities?.forEach((act: any) => {
                ws.addRow([
                    act.description,
                    act.supervisor,
                    act.stage,
                    act.allocatedBudget,
                    act.actualMaterialCost
                ]);
            });

            ws.addRow([]); // Spacer

            // --- 4. MATERIAL REQUIREMENTS & PROCUREMENT ---
            ws.addRow(['MATERIAL PROCUREMENT REGISTRY']).font = { bold: true, size: 12 };
            const matHeader = ws.addRow(['Material ID', 'Code#', 'Descrip', 'UOM', 'Quantity', 'Est. Unit Cost', 'Total Est.', 'PO Status']);
            matHeader.font = headerStyle;
            matHeader.fill = { ...headerFill, fgColor: { argb: 'FF059669' } }; // Emerald-600
 
            data.materialRequirements?.forEach((req: any) => {
                ws.addRow([
                    req.materialId,
                    req.material.itemCode,
                    req.material.description,
                     req.material.unitOfMeasure,
                    req.quantityRequired,
                    req.estimatedUnitCost,
                    req.quantityRequired * req.estimatedUnitCost,
                    req.status
                ]);
            });

            ws.addRow([]); // Spacer

            // --- 5. PURCHASE ORDERS (CASH FLOW TRIGGER) ---
            ws.addRow(['PURCHASE ORDERS (CASH FLOW TRACKING)']).font = { bold: true, size: 12 };
            const poHeader = ws.addRow(['PO Number', 'Vendor', 'Status', 'Total Value', 'Funded Date']);
            poHeader.font = headerStyle;
            poHeader.fill = { ...headerFill, fgColor: { argb: 'FF0F172A' } };

            data.purchaseOrders?.forEach((po: any) => {
                ws.addRow([
                    po.poNumber,
                    po.vendorname,
                    po.status,
                    po.totalValue,
                    po.fundedAt ? new Date(po.fundedAt).toLocaleDateString() : 'N/A'
                ]);
            });

            // --- 6. FORMATTING ---
            // Auto-fit columns (basic)
            ws.columns.forEach(column => {
                column.width = 25;
                column.alignment = { vertical: 'middle', horizontal: 'left' };
            });

            // Money Formatting
            const moneyRows = [5, 6, 12, 18, 19, 24]; // Approx rows based on current data
            moneyRows.forEach(rowNum => {
                const row = ws.getRow(rowNum);
                row.getCell(2).numFmt = '"$"#,##0.00';
                row.getCell(4).numFmt = '"$"#,##0.00';
            });

            // --- 7. SAVE FILE ---
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Project_Audit_${data.name.replace(/\s+/g, '_')}.xlsx`);

        } catch (error) {
            console.error('Excel Export Failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link: ', err);
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 print:hidden">
            {/* Navigation Back */}
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm group"
            >
                <div className="p-2 bg-white rounded-full border border-slate-200 group-hover:border-slate-400 transition-all shadow-sm">
                    <ArrowLeft size={16} />
                </div>
                {backLabel}
            </button>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                {/* Excel Export Button */}
                <button 
                    onClick={handleExportExcel}
                    disabled={isExporting || !data}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 transition-all shadow-sm disabled:opacity-50"
                >
                    {isExporting ? <Download size={14} className="animate-bounce" /> : <FileSpreadsheet size={14} />}
                    Excel Export
                </button>

                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Printer size={14} /> PDF
                </button>

                <button 
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                        copied 
                        ? 'bg-emerald-500 text-white shadow-emerald-100' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                    }`}
                >
                    {copied ? (
                        <><Check size={14} /> Copied!</>
                    ) : (
                        <><Link2 size={14} /> Copy URL</>
                    )}
                </button>
            </div>
        </div>
    );
}
// 'use client';

// import React, { useState } from 'react';
// import { ArrowLeft, Edit3, Link2, Printer, Check } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// interface EntityActionsHeaderProps {
//     itemId: string;
//     editPath: string; // e.g., `/mm/projects/edit/${id}` or `/mm/activities/edit/${id}`
//     entityLabel: string; // e.g., "Project" or "Activity"
//     backLabel?: string; // e.g., "Back to Inventory"
// }

// export default function EntityActionsHeader({ 
//     itemId, 
//     editPath, 
//     entityLabel, 
//     backLabel = "Back to List" 
// }: EntityActionsHeaderProps) {
//     const router = useRouter();
//     const [copied, setCopied] = useState(false);

//     const handlePrint = () => window.print();

//     const handleCopyLink = async () => {
//         try {
//             await navigator.clipboard.writeText(window.location.href);
//             setCopied(true);
//             setTimeout(() => setCopied(false), 2000);
//         } catch (err) {
//             console.error('Failed to copy link: ', err);
//         }
//     };

//     return (
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 print:hidden">
//             {/* Navigation Back */}
//             <button 
//                 onClick={() => router.back()}
//                 className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm group"
//             >
//                 <div className="p-2 bg-white rounded-full border border-slate-200 group-hover:border-slate-400 transition-all shadow-sm">
//                     <ArrowLeft size={16} />
//                 </div>
//                 {backLabel}
//             </button>

//             {/* Action Buttons */}
//             <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
//                 <button 
//                     onClick={handlePrint}
//                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
//                 >
//                     <Printer size={14} /> Export PDF
//                 </button>
                
               

//                 <button 
//                     onClick={handleCopyLink}
//                     className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
//                         copied 
//                         ? 'bg-emerald-500 text-white shadow-emerald-100' 
//                         : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
//                     }`}
//                 >
//                     {copied ? (
//                         <><Check size={14} /> Copied!</>
//                     ) : (
//                         <><Link2 size={14} /> Copy URL</>
//                     )}
//                 </button>
//             </div>
//         </div>
//     );
// }
// 'use client';

// import React, { useState } from 'react';
// import { ArrowLeft, Edit3, Link2, Printer, Check } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// interface ProjectActionsWrapperProps {
//     project: any;
// }

// export default function ProjectActionsWrapper({ project }: ProjectActionsWrapperProps) {
//     const router = useRouter();
//     const [copied, setCopied] = useState(false);

//     const handlePrint = () => window.print();

//     const handleCopyLink = async () => {
//         try {
//             await navigator.clipboard.writeText(window.location.href);
//             setCopied(true);
//             // Reset feedback after 2 seconds
//             setTimeout(() => setCopied(false), 2000);
//         } catch (err) {
//             console.error('Failed to copy link: ', err);
//         }
//     };

//     return (
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 print:hidden">
//             <button 
//                 onClick={() => router.back()}
//                 className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm group"
//             >
//                 <div className="p-2 bg-white rounded-full border border-slate-200 group-hover:border-slate-400 transition-all">
//                     <ArrowLeft size={16} />
//                 </div>
//                 Back to Inventory
//             </button>

//             <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
//                 <button 
//                     onClick={handlePrint}
//                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
//                 >
//                     <Printer size={14} /> Export PDF
//                 </button>
                
//                 <button 
//                     onClick={() => router.push(`/mm/projects/edit/${project.id}`)}
//                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
//                 >
//                     <Edit3 size={14} /> Edit Project
//                 </button>

//                 {/* Updated Copy Link Button */}
//                 <button 
//                     onClick={handleCopyLink}
//                     className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
//                         copied 
//                         ? 'bg-emerald-500 text-white shadow-emerald-100' 
//                         : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
//                     }`}
//                 >
//                     {copied ? (
//                         <>
//                             <Check size={14} /> Link Copied!
//                         </>
//                     ) : (
//                         <>
//                             <Link2 size={14} /> Copy Current URL
//                         </>
//                     )}
//                 </button>
//             </div>
//         </div>
//     );
// }
// 'use client';

// import React from 'react';
// import { ArrowLeft, Edit3, Share2, Printer, Trash2 } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// interface ProjectActionsWrapperProps {
//     project: any;
// }

// export default function ProjectActionsWrapper({ project }: ProjectActionsWrapperProps) {
//     const router = useRouter();

//     const handlePrint = () => window.print();

//     return (
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 print:hidden">
//             <button 
//                 onClick={() => router.back()}
//                 className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm group"
//             >
//                 <div className="p-2 bg-white rounded-full border border-slate-200 group-hover:border-slate-400 transition-all">
//                     <ArrowLeft size={16} />
//                 </div>
//                 Back to Inventory
//             </button>

//             <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
//                 <button 
//                     onClick={handlePrint}
//                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
//                 >
//                     <Printer size={14} /> Export PDF
//                 </button>
                
//                 <button 
//                     onClick={() => router.push(`/mm/projects/edit/${project.id}`)}
//                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
//                 >
//                     <Edit3 size={14} /> Edit Project
//                 </button>

//                 <button 
//                     className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
//                 >
//                     <Share2 size={14} /> Share Brief
//                 </button>
//             </div>
//         </div>
//     );
// }