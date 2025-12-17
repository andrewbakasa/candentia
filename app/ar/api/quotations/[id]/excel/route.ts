import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../libs/prismadb'; 
import ExcelJS from 'exceljs';

// 1. Type Definition for the Quotation with Relations
type FullQuotation = Awaited<ReturnType<typeof prisma.quotation.findUnique>> & {
    customer: { 
        name: string; 
        email: string | null; 
        address: string | null; 
    };
    items: {
        productName: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
    }[];
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const quotationId = params.id;

    if (!quotationId) {
        return NextResponse.json({ message: "Missing quotation ID." }, { status: 400 });
    }
    
    // --- 2. Database Fetch ---
    let quotation: FullQuotation | null;
    try {
        quotation = await prisma.quotation.findUnique({
            where: { id: quotationId },
            include: {
                customer: {
                    select: { name: true, email: true, address: true },
                },
                items: true,
            },
        }) as FullQuotation | null;
    } catch (error) {
        console.error("Prisma fetch error:", error);
        return NextResponse.json({ message: "Database error fetching quotation." }, { status: 500 });
    }

    if (!quotation) {
        return NextResponse.json({ message: "Quotation not found." }, { status: 404 });
    }

    // --- 3. Workbook Setup ---
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Teams Business System';
    const worksheet = workbook.addWorksheet(`Quote ${quotation.quotationNumber}`);

    // --- 4. Define Column Widths (Column A is Double Sized) ---
    worksheet.columns = [
        { width: 35 }, // Column A: Labels (Double Size for clarity)
        { width: 30 }, // Column B: Main Content
        { width: 15 }, // Column C: Qty/Unit
        { width: 15 }, // Column D: Empty/Spacer
        { width: 20 }, // Column E: Totals
    ];

    // --- 5. Styles ---
    const headerStyle: Partial<ExcelJS.Style> = {
        font: { name: 'Arial', size: 18, bold: true, color: { argb: 'FF1E40AF' } },
        alignment: { horizontal: 'center' }
    };
    const subHeaderStyle: Partial<ExcelJS.Style> = {
        font: { name: 'Arial', size: 12, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
    };
    const currencyStyle = { numFmt: '$#,##0.00' };
    const labelFont = { bold: true, size: 11 };

    // --- 6. Header Section ---
    const titleRow = worksheet.addRow(['OFFICIAL QUOTATION']);
    titleRow.getCell(1).style = headerStyle;
    worksheet.mergeCells('A1:E1');
    worksheet.addRow([]); // Spacer

    // Quotation Metadata
    const addMetaRow = (label: string, value: any) => {
        const row = worksheet.addRow([label, value]);
        row.getCell(1).font = labelFont;
    };

    addMetaRow('Quote Number:', quotation.quotationNumber);
    addMetaRow('Status:', quotation.status);
    addMetaRow('Date Issued:', new Date(quotation.createdAt).toLocaleDateString());
    // Critical for Risk & Compliance (Guideline 5)
    addMetaRow('Valid Until:', quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : '30 Days from Issue');

    worksheet.addRow([]); // Spacer

    // --- 7. Customer Section ---
    const custHeader = worksheet.addRow(['CUSTOMER DETAILS']);
    custHeader.getCell(1).style = subHeaderStyle;
    worksheet.mergeCells(`A${custHeader.number}:E${custHeader.number}`);

    addMetaRow('Client Name:', quotation.customer.name);
    addMetaRow('Client Email:', quotation.customer.email || 'N/A');
    addMetaRow('Billing Address:', quotation.customer.address || 'N/A');

    worksheet.addRow([]); // Spacer

    // --- 8. Line Items Table ---
    const itemHeader = worksheet.addRow(['Product/Service Description', '', 'Qty', 'Unit Price', 'Line Total']);
    // Merge the first two columns for description space
    worksheet.mergeCells(`A${itemHeader.number}:B${itemHeader.number}`);
    
    itemHeader.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } }; // Dark Gray
    });

    quotation.items.forEach((item) => {
        const row = worksheet.addRow([
            item.productName,
            '', 
            item.quantity,
            item.unitPrice,
            item.lineTotal
        ]);
        worksheet.mergeCells(`A${row.number}:B${row.number}`);
        row.getCell(4).style = currencyStyle;
        row.getCell(5).style = currencyStyle;
    });

    worksheet.addRow([]); // Spacer

    // --- 9. Financial Summary ---
    const subtotalRow = worksheet.addRow(['', '', '', 'Subtotal:', quotation.subTotal]);
    subtotalRow.getCell(5).style = currencyStyle;

    const taxRow = worksheet.addRow(['', '', '', `Tax (${(quotation.taxRate * 100).toFixed(1)}%):`, quotation.taxAmount]);
    taxRow.getCell(5).style = currencyStyle;

    const totalRow = worksheet.addRow(['', '', '', 'TOTAL AMOUNT:', quotation.totalAmount]);
    totalRow.getCell(4).font = { bold: true, size: 12 };
    totalRow.getCell(5).font = { bold: true, size: 12 };
    totalRow.getCell(5).style = currencyStyle;
    // Highlight Total (Financial Performance Requirement)
    totalRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };

    // --- 10. Generate and Send Buffer ---
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            'Content-Disposition': `attachment; filename="Quotation_${quotation.quotationNumber}.xlsx"`,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
    });
}
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../../../libs/prismadb'; 
// import ExcelJS from 'exceljs';

// // Define the loaded Quotation type
// type FullQuotation = Awaited<ReturnType<typeof prisma.quotation.findUnique>> & {
//     customer: { name: string; email: string | null; address: string | null };
//     items: {
//         productName: string;
//         quantity: number;
//         unitPrice: number;
//         lineTotal: number;
//     }[];
// }

// /**
//  * 🎯 Route Handler for: GET /api/quotations/[id]/excel
//  * Exports a detailed Quotation to Excel.
//  */
// export async function GET(request: Request, { params }: { params: { id: string } }) {
//     const quotationId = params.id;

//     if (!quotationId) {
//         return NextResponse.json({ message: "Missing quotation ID." }, { status: 400 });
//     }
    
//     // --- 1. Fetch data from Prisma ---
//     let quotation: FullQuotation | null;
//     try {
//         quotation = await prisma.quotation.findUnique({
//             where: { id: quotationId },
//             include: {
//                 customer: {
//                     select: { name: true, email: true, address: true },
//                 },
//                 items: true,
//             },
//         }) as FullQuotation | null;
//     } catch (error) {
//         console.error("Prisma fetch error:", error);
//         return NextResponse.json({ message: "Database error fetching quotation." }, { status: 500 });
//     }

//     if (!quotation) {
//         return NextResponse.json({ message: "Quotation not found." }, { status: 404 });
//     }

//     // --- 2. Build the Excel Workbook ---
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet(`Quote ${quotation.quotationNumber}`);

//     // --- A. Define Styles ---
//     const headerStyle = {
//         font: { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E40AF' } }, // Indigo 700
//     };
//     const subHeaderStyle = { font: { name: 'Arial', size: 12, bold: true } };
//     const currencyStyle = { numFmt: '$#,##0.00' };
//     const borderStyle = { bottom: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } } };

//     // --- B. Header & Quotation Info ---
//     const titleRow = worksheet.addRow(['QUOTATION']);
//     titleRow.getCell(1).style = headerStyle;
//     worksheet.mergeCells('A1:E1');
    
//     worksheet.addRow(['Quote Number:', quotation.quotationNumber]);
//     worksheet.addRow(['Status:', quotation.status]);
//     worksheet.addRow(['Created Date:', new Date(quotation.createdAt).toLocaleDateString()]);
//     // Added validUntil per 2025 Guideline requirements
//     worksheet.addRow(['Valid Until:', quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : 'N/A']);
    
//     worksheet.addRow([]); // Spacer

//     // Customer details
//     worksheet.addRow(['CUSTOMER DETAILS']).getCell(1).style = subHeaderStyle;
//     worksheet.addRow(['Name:', quotation.customer.name]);
//     worksheet.addRow(['Email:', quotation.customer.email || 'N/A']);
//     worksheet.addRow(['Address:', quotation.customer.address || 'N/A']);
    
//     worksheet.addRow([]); // Spacer

//     // --- C. Items Table ---
//     const itemHeader = worksheet.addRow(['#', 'Product Name', 'Quantity', 'Unit Price', 'Line Total']);
//     itemHeader.eachCell(cell => {
//         cell.style = subHeaderStyle;
//         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
//     });

//     quotation.items.forEach((item, index) => {
//         const row = worksheet.addRow([
//             index + 1,
//             item.productName,
//             item.quantity,
//             item.unitPrice,
//             item.lineTotal
//         ]);
//         row.getCell(4).style = currencyStyle;
//         row.getCell(5).style = currencyStyle;
//         row.eachCell(cell => { cell.border = borderStyle; });
//     });

//     worksheet.addRow([]); // Spacer

//     // --- D. Financial Summary ---
//     const summaryStart = worksheet.lastRow!.number + 1;
    
//     const summaryData = [
//         ['Subtotal:', quotation.subTotal],
//         [`Tax (${(quotation.taxRate * 100).toFixed(1)}%):`, quotation.taxAmount],
//         ['Total Amount:', quotation.totalAmount],
//     ];

//     summaryData.forEach(([label, value]) => {
//         const row = worksheet.addRow(['', '', '', label, value]);
//         row.getCell(4).font = { bold: true };
//         row.getCell(5).style = { ...currencyStyle, font: { bold: true } };
        
//         if (label === 'Total Amount:') {
//             row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Light Blue
//             row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
//         }
//     });

//     // Adjust Column Widths
//     worksheet.columns = [
//         { width: 5 },  // #
//         { width: 35 }, // Product Name
//         { width: 12 }, // Qty
//         { width: 15 }, // Unit Price
//         { width: 15 }, // Total
//     ];

//     // --- 3. Return Response ---
//     const excelBuffer = await workbook.xlsx.writeBuffer(); 

//     return new NextResponse(excelBuffer, {
//         status: 200,
//         headers: {
//             'Content-Disposition': `attachment; filename="Quotation-${quotation.quotationNumber}.xlsx"`,
//             'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         },
//     });
// }