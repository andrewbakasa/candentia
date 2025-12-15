// src/app/api/invoices/[id]/excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../libs/prismadb'; 
import ExcelJS from 'exceljs'; // 💡 Install this package: npm install exceljs

// Define the fully loaded invoice type for the server component
type FullInvoice = Awaited<ReturnType<typeof prisma.invoice.findUnique>> & {
    customer: { name: string; contactEmail: string | null; address: string | null };
    items: {
        skuSnapshot: any; 
        productName: string;
        quantity: number;
        unitPrice: number;
        discountRate: number;
        lineTotal: number;
    }[];
}


/**
 * 🎯 Route Handler for: GET /api/invoices/[id]/excel
 * Exports a detailed invoice to a formatted Excel workbook.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const invoiceId = params.id;

    if (!invoiceId) {
        return NextResponse.json({ message: "Missing invoice ID." }, { status: 400 });
    }
    
    // --- 1. Fetch data from Prisma ---
    let invoice: FullInvoice | null;
    try {
        invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: {
                    select: { name: true,
                         email: true,
                          address: true },
                },
                items: true,
            },
        }) as FullInvoice | null; // Cast for simplified type handling
    } catch (error) {
        console.error("Prisma fetch error:", error);
        return NextResponse.json({ message: "Database error fetching invoice data." }, { status: 500 });
    }

    if (!invoice) {
        return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
    }

    // --- 2. Build the Excel Workbook using exceljs ---
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Your App Name';
    workbook.lastModifiedBy = 'Your App Name';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Add a worksheet
    const worksheet = workbook.addWorksheet(`Invoice ${invoice.invoiceNumber}`);

    // --- A. Define Styles and Formatting ---

    const headerStyle = {
        font: { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E40AF' } }, // Indigo 700
    };
    const subHeaderStyle = {
        font: { name: 'Arial', size: 12, bold: true },
    };
    const currencyStyle = {
        numFmt: '$#,##0.00;[Red]($#,##0.00)', // Basic US dollar format
    };
    const dateStyle = {
        numFmt: 'yyyy-mm-dd',
    };
    const dataRowStyle = {
        font: { name: 'Arial', size: 10 },
        border: { bottom: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } } }
    };

    // --- B. Add Header and Customer Information ---

    // Title Row
    worksheet.addRow(['INVOICE']).eachCell(cell => {
        cell.style = headerStyle;
    });
    worksheet.mergeCells('A1:F1'); // Merge cells for the title
    worksheet.getRow(1).height = 30;
    
    // Invoice details
    // worksheet.addRow(['Invoice Number:', invoice.invoiceNumber]).font = subHeaderStyle;
    // worksheet.addRow(['Status:', invoice.status]).font = subHeaderStyle;
    // worksheet.addRow(['Issue Date:', invoice.invoiceDate]).font = subHeaderStyle;
    // worksheet.addRow(['Due Date:', invoice.dueDate]).font = subHeaderStyle;

    worksheet.addRow([]); // Blank row for spacing
    
    // Customer details
    worksheet.addRow(['CUSTOMER DETAILS']).eachCell(cell => {
        cell.style = subHeaderStyle;
    });
    worksheet.addRow(['Customer Name:', invoice.customer.name]);
    worksheet.addRow(['Email:', invoice.customer.contactEmail || 'N/A']);
    worksheet.addRow(['Address:', invoice.customer.address || 'N/A']);
    
    worksheet.addRow([]); // Blank row for spacing
    worksheet.addRow([]); // Blank row for spacing
    

    // --- C. Add Line Items Table ---
    
    // Table Header Row
    const itemHeader = worksheet.addRow([
        '#', 'Product Name', 'SKU', 'Quantity', 'Unit Price', 'Discount (%)', 'Line Total'
    ]);
    itemHeader.eachCell(cell => {
        cell.style = subHeaderStyle;
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' } // Gray background
        };
        cell.alignment = { horizontal: 'center' };
    });
    
    // Data Rows
    invoice.items.forEach((item, index) => {
        const row = worksheet.addRow([
            index + 1,
            item.productName,
            item.skuSnapshot,
            item.quantity,
            item.unitPrice,
            item.discountRate * 100, // Display discount as percentage
            item.lineTotal
        ]);

        // Apply formatting
        row.eachCell(cell => { cell.style = dataRowStyle; });
        // Apply currency format to price and total columns
        row.getCell(5).style = currencyStyle;
        row.getCell(7).style = currencyStyle;
        row.getCell(4).alignment = { horizontal: 'right' };
        row.getCell(6).alignment = { horizontal: 'right' };
    });

    worksheet.addRow([]); // Blank row for spacing

    // --- D. Add Financial Summary ---
    
    let currentRow = worksheet.lastRow?.number;
    
    const summaryData = [
        ['Subtotal:', invoice.subTotal],
        [`Tax Rate (${(invoice.taxRate * 100).toFixed(0)}%):`, invoice.taxAmount],
        ['Total Amount:', invoice.totalAmount],
        ['Amount Due:', invoice.amountDue]
    ];
    
    summaryData.forEach(([label, value]) => {
        const row = worksheet.addRow(['', '', '', '', '', label, value]);
        row.getCell(6).font = { bold: true };
        row.getCell(7).style = { ...currencyStyle, font: { bold: true, size: 11 } };
        
        // Highlight Total Amount and Amount Due
        if (label === 'Total Amount:' || label === 'Amount Due:') {
            row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // Light Green
            row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        }
    });

    // --- E. Adjust Column Widths ---
    worksheet.columns = [
        { width: 5 },  // #
        { width: 30 }, // Product Name
        { width: 15 }, // SKU
        { width: 12 }, // Quantity
        { width: 15 }, // Unit Price
        { width: 15 }, // Discount
        { width: 15 }, // Line Total
    ];
    
    // --- 3. Serialize the workbook to a buffer/blob ---
    const excelBuffer = await workbook.xlsx.writeBuffer(); 

    // --- 4. Return the response with correct headers to trigger a download ---
    return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
            'Content-Disposition': `attachment; filename="Invoice-${invoice.invoiceNumber}.xlsx"`,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
    });
}