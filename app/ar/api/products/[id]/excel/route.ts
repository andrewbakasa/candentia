import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../libs/prismadb'; 
import ExcelJS from 'exceljs'; // 💡 Requires: npm install exceljs

// Define the type for the data we fetch from Prisma
interface ProductExport {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    unitPrice: number;
    unitCost: number | null;
    stockQuantity: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}


/**
 * 🎯 Route Handler for: GET /api/products/excel
 * Exports the entire product inventory to a formatted Excel workbook.
 */
export async function GET(request: Request) {
    
    // --- 1. Fetch data from Prisma ---
    let products: ProductExport[];
    try {
        products = await prisma.product.findMany({
            select: {
                id: true,
                sku: true,
                name: true,
                //description: true,
               // unitPrice: true,
                unitCost: true,
                stockQuantity: true,
                //isActive: true,
                //createdAt: true,
                //updatedAt: true,
            },
            orderBy: {
                sku: 'asc',
            }
        }) as ProductExport[]; 
    } catch (error) {
        console.error("Prisma fetch error:", error);
        return NextResponse.json({ message: "Database error fetching product data." }, { status: 500 });
    }

    if (products.length === 0) {
        return NextResponse.json({ message: "No products found to export." }, { status: 404 });
    }

    // --- 2. Build the Excel Workbook using exceljs ---
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Your App Name';
    workbook.lastModifiedBy = 'Your App Name';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Add a worksheet
    const worksheet = workbook.addWorksheet('Product Inventory');

    // --- A. Define Styles and Formatting ---

    const headerStyle = {
        font: { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E40AF' } }, // Indigo 700
    };
    const subHeaderStyle = {
        font: { name: 'Arial', size: 12, bold: true },
        alignment: { horizontal: 'center' as const },
    };
    const currencyStyle = {
        numFmt: '$#,##0.00;[Red]($#,##0.00)', 
    };
    const dateStyle = {
        numFmt: 'yyyy-mm-dd',
    };
    const statusStyle = (isActive: boolean) => ({
        font: { 
            bold: true,
            color: { argb: isActive ? 'FF10B981' : 'FFE5B600' } // Green or Yellow
        }
    });

    // --- B. Add Header Information ---

    // Title Row
    worksheet.addRow(['PRODUCT INVENTORY EXPORT']).eachCell(cell => {
        cell.style = headerStyle;
    });
    worksheet.mergeCells('A1:H1'); 
    worksheet.getRow(1).height = 30;
    
    // Export Date
    worksheet.addRow(['Export Date:', new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })]);
    worksheet.addRow([]); // Blank row for spacing
    
    // --- C. Add Product Table ---
    
    // Table Header Row
    const itemHeader = worksheet.addRow([
        'SKU', 'Product Name', 'Unit Price', 'Unit Cost', 'Stock', 'Status', 'Created At', 'Description'
    ]);
    itemHeader.eachCell(cell => {
        cell.style = subHeaderStyle;
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' } // Gray background
        };
    });
    
    // Data Rows
    products.forEach((product) => {
        const row = worksheet.addRow([
            product.sku,
            product.name,
            product.unitPrice,
            product.unitCost,
            product.stockQuantity,
            product.isActive ? 'Active' : 'Inactive',
            product.createdAt,
            product.description,
        ]);

        // Apply formatting
        // Price/Cost
        row.getCell(3).style = currencyStyle;
        row.getCell(4).style = currencyStyle;
        // Status
        row.getCell(6).style = statusStyle(product.isActive);
        // Date
        row.getCell(7).style = dateStyle;
    });

    // --- D. Adjust Column Widths ---
    worksheet.columns = [
        { key: 'sku', width: 15 }, 
        { key: 'name', width: 35 }, 
        { key: 'unitPrice', width: 15 }, 
        { key: 'unitCost', width: 15 }, 
        { key: 'stockQuantity', width: 10 }, 
        { key: 'status', width: 10 }, 
        { key: 'createdAt', width: 15 }, 
        { key: 'description', width: 40 }, 
    ];
    
    // --- 3. Serialize the workbook to a buffer/blob ---
    const excelBuffer = await workbook.xlsx.writeBuffer(); 

    // --- 4. Return the response with correct headers to trigger a download ---
    const filename = `ProductInventoryExport-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
    });
}