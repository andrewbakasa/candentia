'use client';

import React, { useState } from 'react';
import { ArrowLeft, Link2, Printer, Check, FileSpreadsheet, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

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
            const ws = workbook.addWorksheet('NRZ Official Report');

            // --- 1. THEME STYLES ---
            const headerStyle: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            const indigoFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
            const emeraldFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
            const slateFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

            // --- 2. STRUCTURE DETECTION ---
            const isMaterialList = Array.isArray(data) && data.length > 0 && 'materialId' in data[0];
            // Optimized check: Is this a single activity detail? 
            // (Checks for typical activity-only fields like 'supervisor' or 'projectId' without 'activities' array)
            const isSingleActivity = !isMaterialList && !!data.supervisor;

            if (isMaterialList) {
                // --- MODE A: MATERIAL PROCUREMENT LIST ---
                ws.addRow(['MATERIAL PROCUREMENT REGISTRY']).font = { bold: true, size: 16 };
                ws.addRow(['Project ID:', String(data[0].projectId || 'N/A')]);
                ws.addRow(['Export Date:', new Date().toLocaleDateString()]);
                ws.addRow([]);

                ws.columns = [
                    { header: 'Item Code', key: 'code', width: 20 },
                    { header: 'Description', key: 'desc', width: 45 },
                    { header: 'Qty', key: 'qty', width: 10 },
                    { header: 'UOM', key: 'uom', width: 10 },
                    { header: 'Unit Cost', key: 'unit', width: 15 },
                    { header: 'Total Est.', key: 'total', width: 18 },
                    { header: 'Status', key: 'status', width: 20 },
                ];

                const hRow = ws.getRow(4);
                hRow.values = ws.columns.map(c => c.header) as ExcelJS.CellValue[];
                hRow.font = headerStyle;
                hRow.eachCell((cell) => cell.fill = emeraldFill);

                data.forEach((req: any) => {
                    const u = req.estimatedUnitCost || 0;
                    const q = req.quantityRequired || 0;
                    ws.addRow({
                        code: req.material?.itemCode,
                        desc: req.material?.description,
                        qty: q,
                        uom: req.material?.unitOfMeasure,
                        unit: u,
                        total: u * q,
                        status: req.status?.replace(/_/g, ' ')
                    });
                });

            } else if (isSingleActivity) {
                // --- MODE B: ACTIVITY DETAIL (Attributes + Tasks) ---
                // Extract nested plan data which might be in data.plan OR data.project.plan
                const planRef = data.plan || data.project?.plan || {};
                const projectName = data.project?.name || "N/A";

                ws.addRow(['ACTIVITY EXECUTION REPORT']).font = { bold: true, size: 16 };
                ws.addRow(['Activity:', String(data.description)]);
                ws.addRow(['Project Context:', projectName]);
                ws.addRow(['Assigned Executive:', String(planRef.assignedExecutive || 'N/A'), 'Year:', planRef.year || 'N/A']);
                ws.addRow(['Activity Budget:', data.allocatedBudget || 0, 'Supervisor:', data.supervisor || 'N/A']);
                ws.addRow([]); // Spacer

                ws.columns = [
                    { header: 'Task Title', key: 'title', width: 40 },
                    { header: 'Detailed Description', key: 'desc', width: 50 },
                    { header: 'Assignee', key: 'who', width: 25 },
                    { header: 'Status', key: 'status', width: 15 },
                    { header: 'Date Logged', key: 'date', width: 20 },
                ];

                const headerRowNumber = 7; // Adjusted for extra info rows
                const hRow = ws.getRow(headerRowNumber);
                hRow.values = ws.columns.map(c => c.header) as ExcelJS.CellValue[];
                hRow.font = headerStyle;
                hRow.eachCell(cell => cell.fill = indigoFill);

                (data.tasks || []).forEach((t: any) => {
                    ws.addRow({
                        title: t.title,
                        desc: t.description,
                        who: t.assignedTo || 'Unassigned',
                        status: t.status,
                        date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'
                    });
                });

            } else {
                // --- MODE C: FULL PROJECT OVERVIEW ---
                ws.addRow(['PROJECT STRATEGIC AUDIT SUMMARY']).font = { bold: true, size: 16 };
                ws.addRow(['Project:', String(data.name), 'Manager:', String(data.projectManager)]);
                ws.addRow(['Budget:', data.allocatedBudget, 'Total Actual:', data.totalActualCost]);
                ws.addRow(['Workshop:', data.responsibleWorkshop?.name || 'N/A']);
                ws.addRow([]);

                // I. Work Breakdown
                ws.addRow(['I. WORKBREAKDOWN STRUCTURE']).font = { bold: true, size: 12 };
                const actH = ws.addRow(['Work Item', 'Supervisor', 'Status', 'Allocated Budget']);
                actH.font = headerStyle;
                actH.eachCell(c => c.fill = indigoFill);

                data.activities?.forEach((act: any) => {
                    ws.addRow([act.description, act.supervisor, act.stage, act.allocatedBudget]).font = { bold: true };
                    act.tasks?.forEach((t: any) => {
                        ws.addRow([`   ↳ ${t.title || t.description}`, t.assignedTo, t.status, '-']).font = { italic: true, size: 10 };
                    });
                });

                // II. Material Requirements
                if (data.materialRequirements?.length > 0) {
                    ws.addRow([]);
                    ws.addRow(['II. MATERIAL PROCUREMENT REGISTRY']).font = { bold: true, size: 12 };
                    const matH = ws.addRow(['Item Code', 'Description', 'Qty', 'Unit Cost', 'Total Value', 'PO Status']);
                    matH.font = headerStyle;
                    matH.eachCell(c => c.fill = emeraldFill);
                    data.materialRequirements.forEach((m: any) => {
                        const cost = m.estimatedUnitCost || 0;
                        ws.addRow([m.material?.itemCode, m.material?.description, m.quantityRequired, cost, (m.quantityRequired * cost), m.status]);
                    });
                }

                // III. Purchase Orders
                if (data.purchaseOrders?.length > 0) {
                    ws.addRow([]);
                    ws.addRow(['III. PURCHASE ORDER LEDGER']).font = { bold: true, size: 12 };
                    const poH = ws.addRow(['PO Number', 'Vendor', 'Status', 'Total Value', 'Funded Date']);
                    poH.font = headerStyle;
                    poH.eachCell(c => c.fill = slateFill);
                    data.purchaseOrders.forEach((po: any) => {
                        ws.addRow([po.poNumber, po.vendorname, po.status, po.totalValue, po.fundedAt ? new Date(po.fundedAt).toLocaleDateString() : 'Pending']);
                    });
                }

                ws.columns = [{ width: 45 }, { width: 30 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }];
            }

            // --- 3. FINAL FORMATTING ---
            ws.eachRow((row, rowNumber) => {
                row.eachCell((cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

                    if (typeof cell.value === 'number' && cell.value !== 0) {
                        const colIdx = cell.col;
                        const headers = [4, 5, 6, 7].map(r => ws.getRow(r).getCell(colIdx).value?.toString().toLowerCase() || '');
                        headers.push(row.getCell(1).value?.toString().toLowerCase() || '');

                        const isMoney = headers.some(h => 
                            h.includes('budget') || h.includes('cost') || h.includes('value') || h.includes('total') || h.includes('unit') || h.includes('actual')
                        );

                        if (isMoney) {
                            cell.numFmt = '"$"#,##0.00';
                        }
                    }
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `NRZ_Export_${new Date().getTime()}.xlsx`);
            toast.success("Excel exported successfully");

        } catch (error) {
            console.error('Excel Export Error:', error);
            toast.error("Export failed");
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