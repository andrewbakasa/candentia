
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
            // --- Safe Parsing for Line Item Financial Fields ---
            const quantity = item.quantity; // Assuming quantity is already a safe number or validated
            const unitPrice = safeParseFloat(item.unitPrice); 
            const discountRate = safeParseFloat(item.discountRate) / 100; // Assuming rate is a percentage (e.g., 10), convert to decimal (0.10)
            const lineTotal = (quantity * unitPrice) * (1 - discountRate);
            return {
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                
                // --- Safe Parsing for Line Item Financial Fields ---
                unitPrice: safeParseFloat(item.unitPrice), 
               // lineTotal: safeParseFloat(item.lineTotal),
                lineTotal: lineTotal, // 💡 Calculated value replaces parsed value
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

/**
 * 🎯 Route Handler for: GET /ar/api/invoices
 * Fetches a list of all invoices, including associated customer details.
 */
export async function GET(request: NextRequest) {
    try {
        // You can use URLSearchParams to implement pagination or filtering later if needed.
        const searchParams = request.nextUrl.searchParams;
        const limit = safeParseFloat(searchParams.get('limit'));
        const skip = safeParseFloat(searchParams.get('skip'));

        // 1. Fetch all invoices from the database
        const invoices = await prisma.invoice.findMany({
            // Order by the most recent invoice date
            orderBy: {
                invoiceDate: 'desc',
            },
            // Optional: Apply pagination if query parameters exist
            skip: skip > 0 ? skip : undefined,
            take: limit > 0 ? limit : undefined, 
            
            // Include necessary relationship data (e.g., customer)
            include: {
                customer: true, // Include customer details for the list view
                // items: true, // Often omitted in list view for performance, but can be added
            },
        });

        // 2. Return the list of invoices
        return NextResponse.json(invoices, { status: 200 });

    } catch (error) {
        console.error("API GET Error: Failed to fetch invoices", error);
        
        return NextResponse.json(
            { message: "Failed to retrieve invoices due to a server error." },
            { status: 500 }
        );
    }
}
