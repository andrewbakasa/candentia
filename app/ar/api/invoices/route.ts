
import { InvoiceFormData } from '../../_components/features/invoices/InvoiceForm';



import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb'; 
import { InvoiceStatus } from '@prisma/client'; 
// import { InvoiceFormData } from '../../_components/features/invoices/InvoiceForm'; 
// NOTE: Assuming InvoiceFormData and related types are defined in your project

// --- Helper Function for Robust Numeric Parsing ---
// This function safely converts string inputs (e.g., from a form) into numbers,
// defaulting to 0 if the input is null, undefined, empty string, or results in NaN.
const safeParseFloat = (value: string | number | undefined | null): number => {
    // Convert to string first, handle null/undefined/empty string by treating as '0'
    const strValue = String(value || '0');
    const parsed = parseFloat(strValue);
    
    // Check if the result is a valid number (not NaN)
    return isNaN(parsed) ? 0 : parsed;
};

// Define the expected input structure (based on your previous code)
interface InvoiceCreationBody {
    customerId: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: string;
    taxAmount: string; 
    subTotal: string; 
    amountDue: string;
    items: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: string; // Still a string from the client
        lineTotal: string; // Still a string from the client
        discountRate: string; // Was the source of the latest error
    }[];
}


/**
 * 🎯 Route Handler for: POST /ar/api/invoices
 * Creates a new invoice and its associated line items atomically.
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Parse the incoming request body.
        const body: InvoiceCreationBody = await request.json();
        
        // 2. Fetch Product SKUs for Line Items
        const productIds = body.items.map(item => item.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, sku: true }, 
        });
        const productMap = new Map(products.map(p => [p.id, p.sku]));
        
        // 3. Map line items with robust numeric parsing and SKU snapshots
        const itemsWithSku = body.items.map(item => {
            const skuSnapshot = productMap.get(item.productId);
            if (!skuSnapshot) {
                throw new Error(`Invalid Product ID provided: ${item.productId}`);
            }
            
            return {
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                
                // --- Safe Parsing for Line Item Financial Fields ---
                unitPrice: safeParseFloat(item.unitPrice), 
                lineTotal: safeParseFloat(item.lineTotal),
                discountRate: safeParseFloat(item.discountRate), // <--- Final Fix
                // ---------------------------------------------------
                
                skuSnapshot: skuSnapshot,
            };
        });

        // 4. Create Invoice and Nested Items atomically
        const newInvoice = await prisma.invoice.create({
            data: {
                // Main Invoice Fields
                customer: { connect: { id: body.customerId } },
                invoiceNumber: `INV-${Date.now()}`,
                status: InvoiceStatus.DRAFT,
                invoiceDate: new Date(body.invoiceDate),
                dueDate: new Date(body.dueDate),
                
                // --- Safe Parsing for Main Invoice Financial Totals ---
                totalAmount: safeParseFloat(body.totalAmount),
                subTotal: safeParseFloat(body.subTotal), 
                taxAmount: safeParseFloat(body.taxAmount),
                amountDue: safeParseFloat(body.amountDue), // <--- Fix for missing/invalid amountDue
                // ----------------------------------------------------
                
                // Nested write for Items
                items: {
                    create: itemsWithSku,
                },
            },
            include: {
                customer: true,
                items: true,
            }
        });
        
        // 5. Return the newly created invoice object
        return NextResponse.json(newInvoice, { status: 201 });

    } catch (error) {
        console.error("API POST Error: Failed to create invoice", error);
        
        // Handle common errors like unique constraint violation (P2002) or validation failures
        const isPrismaError = error instanceof Error && 'code' in error;
        let errorMessage = "Invoice creation failed due to server error.";
        
        if (isPrismaError && error.code === 'P2002') {
            errorMessage = "A record with this unique identifier already exists.";
        } else if (error instanceof Error) {
             errorMessage = error.message;
        }

        return NextResponse.json(
            { message: errorMessage },
            { status: 500 }
        );
    }
}

// ... (GET route remains the same) ...

/**
 * 🎯 Route Handler for: POST /api/invoices
 * Creates a new invoice and its associated line items.
 */

// import { InvoiceFormData } from '../../_components/features/invoices/InvoiceForm'; 
// NOTE: Use your actual path for InvoiceFormData

// Define the expected input structure (as seen in your original code)
// interface InvoiceCreationBody {
//     customerId: string; // Assuming this is part of FormData
//     invoiceDate: string;
//     dueDate: string;
//     totalAmount: string; // Assuming totalAmount is also a string from the client
//     taxAmount: string; 
//     subTotal: string; 
//     amountDue: string;
//     items: any[]; // Use a more detailed type if available
// }

// // Helper function to safely parse a string to a float, defaulting to 0 if invalid or empty
// const safeParseFloat = (value: string | number | undefined | null): number => {
//     // Convert to string first, handle null/undefined/empty string by treating as '0'
//     const strValue = String(value || '0');
//     const parsed = parseFloat(strValue);
    
//     // Check if the result is a valid number (not NaN)
//     return isNaN(parsed) ? 0 : parsed;
// };


// export async function POST(request: NextRequest) {
//     try {
//         // 1. Parse the incoming request body.
//         const body: InvoiceCreationBody = await request.json();
//         console.log("Incoming body for invoice:", body);

//         // 2. Map line items with robust numeric parsing
//         const productIds = body.items.map(item => item.productId);
//         const products = await prisma.product.findMany({
//             where: { id: { in: productIds } },
//             select: { id: true, sku: true }, 
//         });
//         const productMap = new Map(products.map(p => [p.id, p.sku]));
        
//         const itemsWithSku = body.items.map(item => {
//             const skuSnapshot = productMap.get(item.productId);
//             if (!skuSnapshot) {
//                 throw new Error(`Invalid Product ID provided: ${item.productId}`);
//             }
            
//             return {
//                 productId: item.productId,
//                 productName: item.productName,
//                 quantity: item.quantity,
                
//                 // --- FIX 3: Safe Parsing for Line Item Totals ---
//                 unitPrice: safeParseFloat(item.unitPrice), 
//                 lineTotal: safeParseFloat(item.lineTotal),
//                 // ---------------------------------------------------
                
//                 discountRate: item.discountRate,
//                 skuSnapshot: skuSnapshot,
//             };
//         });

//         // 3. Create Invoice and Nested Items atomically
//         const newInvoice = await prisma.invoice.create({
//             data: {
//                 // Main Invoice Fields
//                 customer: { connect: { id: body.customerId } },
//                 invoiceNumber: `INV-${Date.now()}`,
//                 status: InvoiceStatus.DRAFT,
//                 invoiceDate: new Date(body.invoiceDate),
//                 dueDate: new Date(body.dueDate),
                
//                 // --- FIX 1 & 2: Safe Parsing for Invoice Totals ---
//                 totalAmount: safeParseFloat(body.totalAmount),
//                 subTotal: safeParseFloat(body.subTotal), 
//                 taxAmount: safeParseFloat(body.taxAmount), 
//                 // FIX: Ensure amountDue is correctly parsed and passed
//                 amountDue: safeParseFloat(body.amountDue), 
//                 // ----------------------------------------------------
                
//                 // Nested write for Items
//                 items: {
//                     create: itemsWithSku,
//                 },
//             },
//             include: {
//                 customer: true,
//                 items: true,
//             }
//         });
        
//         console.log("newInvoice created:", newInvoice);
//         // 4. Return the newly created invoice object
//         return NextResponse.json(newInvoice, { status: 201 });

//     } catch (error) {
//         console.error("API POST Error: Failed to create invoice", error);
//         // Handle common errors like invalid date or validation failures
//         const errorMessage = error instanceof Error 
//             ? error.message.includes('Invalid') ? `Validation Error: ${error.message}` : error.message
//             : "Invoice creation failed due to server error.";
            
//         return NextResponse.json(
//             { message: errorMessage },
//             { status: 500 }
//         );
//     }
// }
// Note: The GET handler remains the same.
// export async function POST(request: NextRequest) {
//     try {
//         // 1. Parse the incoming request body.
//         // NOTE: We now explicitly look for subTotal and taxAmount which are 
//         // expected to be included in the form data submission from the client
//         const body: InvoiceFormData & { 
//             taxAmount: string, 
//             subTotal: string, // <-- NOW INCLUDED
//             amountDue: string 
//         } = await request.json();
//         console.log("body", body)
//         // 2. Basic Validation (omitted for brevity)

//         // 3. Fetch Product SKUs for Line Items (omitted for brevity, assume 'itemsWithSku' is prepared)
//         const productIds = body.items.map(item => item.productId);
//         const products = await prisma.product.findMany({
//             where: { id: { in: productIds } },
//             select: { id: true, sku: true }, 
//         });
//         const productMap = new Map(products.map(p => [p.id, p.sku]));
        
//         const itemsWithSku = body.items.map(item => {
//             const skuSnapshot = productMap.get(item.productId);
//             if (!skuSnapshot) {
//                  throw new Error(`Invalid Product ID provided: ${item.productId}`);
//             }
//             return {
//                 productId: item.productId,
//                 productName: item.productName,
//                 quantity: item.quantity,
//                 unitPrice: parseFloat(item.unitPrice as any), 
//                 lineTotal: parseFloat(item.lineTotal as any),
//                 discountRate: item.discountRate,
//                 skuSnapshot: skuSnapshot,
//             };
//         });

//         // 4. Create Invoice and Nested Items atomically
//         const newInvoice = await prisma.invoice.create({
//             data: {
//                 // Main Invoice Fields
//                 customer: { connect: { id: body.customerId } },
//                 invoiceNumber: `INV-${Date.now()}`,
//                 status: InvoiceStatus.DRAFT,
//                 invoiceDate: new Date(body.invoiceDate),
//                 dueDate: new Date(body.dueDate),
                
//                 // Financial Totals (The FIX is here!)
//                 totalAmount: parseFloat(body.totalAmount.toString()),
//                 amountDue: parseFloat(body.amountDue),
                
//                 // --- ADDED MISSING REQUIRED FIELDS ---
//                 subTotal: parseFloat(body.subTotal), // <--- FIX 1
//                 taxAmount: parseFloat(body.taxAmount), // <--- FIX 2
//                 // -------------------------------------
                
//                 // Nested write for Items
//                 items: {
//                     create: itemsWithSku,
//                 },
//             },
//             include: {
//                 customer: true,
//                 items: true,
//             }
//         });
//         console.log("newInvoice", newInvoice)
//         // 5. Return the newly created invoice object
//         return NextResponse.json(newInvoice, { status: 201 });

//     } catch (error) {
//         console.error("API POST Error: Failed to create invoice", error);
//         const errorMessage = error instanceof Error ? error.message : "Invoice creation failed due to server error.";
//         return NextResponse.json(
//             { message: errorMessage },
//             { status: 500 }
//         );
//     }
// }

export async function GET(request: NextRequest) {
    try {
        // 1. Fetch all invoices with necessary relations (Customer and Items)
        const invoices = await prisma.invoice.findMany({
            include: {
                customer: true, // Include the associated Customer details
                items: true,    // Include the line items
            },
            orderBy: {
                invoiceDate: 'desc', // Show newest invoices first
            }
        });

        // 2. Return the data as JSON
        return NextResponse.json(invoices, { status: 200 });
        
    } catch (error) {
        console.error("API GET Error: Failed to fetch invoices", error);
        return NextResponse.json(
            { message: "Failed to retrieve invoices from database." },
            { status: 500 }
        );
    }
}
