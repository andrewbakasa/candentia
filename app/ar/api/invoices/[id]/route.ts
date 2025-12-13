// src/app/api/invoices/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
// Removed: import { Decimal } from '@prisma/client'; // No longer needed

// Define Props for dynamic route
interface Context {
    params: {
        id: string;
    };
}

/**
 * 🎯 Route Handler for: GET /api/invoices/[id]
 * Fetches a single invoice by ID.
 */
export async function GET(request: NextRequest, context: Context) {
    const { id } = context.params;

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: id },
            include: {
                customer: true,
                items: true,
            },
        });

        if (!invoice) {
            return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
        }

        return NextResponse.json(invoice, { status: 200 });

    } catch (error) {
        console.error(`API GET Error: Failed to fetch invoice ${id}`, error);
        return NextResponse.json(
            { message: "Failed to retrieve invoice." },
            { status: 500 }
        );
    }
}

// Define the expected shape of the incoming request body
interface UpdateInvoicePayload {
    id: string; // The ID of the invoice being updated
    customerId: string; // Should be the same, but good to include
    invoiceDate: string;
    dueDate: string;
    taxRate: number;
    subTotal: number;
    taxAmount: number;
    totalAmount: number;
    amountDue: number; // The amount still due (usually starts at totalAmount)
    // The items include the optional 'id' for existing items, and 'tempId' for React keys
    items: Array<{
        id?: string; // Prisma ID for existing items
        tempId: number; // Temporary React key
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        discountRate: number;
    }>;
}

/**
 * PATCH /ar/api/invoices/[invoiceId]
 * Updates an existing Invoice and its line items.
 */
export async function PATCH2(
    request: Request,
    { params }: { params: { invoiceId: string } }
) {
    const invoiceId = params.invoiceId;
    
    // --- 1. Validate ID and Parse Body ---
    if (!invoiceId) {
        return NextResponse.json({ message: 'Missing invoice ID' }, { status: 400 });
    }

    let payload: UpdateInvoicePayload;
    try {
        payload = await request.json();
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    // Basic validation
    if (payload.id !== invoiceId) {
        return NextResponse.json({ message: 'URL ID and Payload ID mismatch' }, { status: 400 });
    }

    // --- 2. Separate Line Items ---
    const existingItemIds = payload.items
        .map(item => item.id)
        .filter((id): id is string => !!id);

    // Get the IDs of items currently in the database to find deletions
    const currentDbItems = await prisma.invoiceItem.findMany({
        where: { invoiceId },
        select: { id: true },
    });
    const dbItemIds = currentDbItems.map(item => item.id);
    
    // Calculate items to delete (in DB but not in payload)
    const itemsToDelete = dbItemIds.filter(dbId => !existingItemIds.includes(dbId));


    // --- 3. Start Transaction ---
    try {
        const result = await prisma.$transaction(async (tx) => {
            
            // a. Update Invoice Header
            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    // Removed: new Decimal(...)
                    subTotal: payload.subTotal,
                    taxAmount: payload.taxAmount,
                    totalAmount: payload.totalAmount,
                    amountDue: payload.amountDue, 
                    //taxRate: payload.taxRate, 
                    invoiceDate: payload.invoiceDate,
                    dueDate: payload.dueDate,
                    // customerId is locked/unchanged, but if it were editable, update here
                    // status: 'DRAFT' // Optionally update status if needed
                },
                select: { id: true, invoiceNumber: true }
            });

            // b. Handle Item Deletions
            if (itemsToDelete.length > 0) {
                await tx.invoiceItem.deleteMany({
                    where: {
                        id: {
                            in: itemsToDelete,
                        },
                    },
                });
            }

            // c. Handle Item Updates and Creations
            const itemOperations = payload.items.map(item => {
                const itemData = {
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    // Removed: new Decimal(...)
                    unitPrice: item.unitPrice,
                    lineTotal: item.lineTotal,
                    discountRate: item.discountRate,
                    // Snapshot: A simple static snapshot of the SKU could be added here
                    skuSnapshot: 'N/A', 
                };
                
                if (item.id) {
                    // Item exists (Update)
                    return tx.invoiceItem.update({
                        where: { id: item.id },
                        data: itemData,
                    });
                } else {
                    // New item (Create)
                    return tx.invoiceItem.create({
                        data: {
                            ...itemData,
                            invoiceId: updatedInvoice.id,
                        },
                    });
                }
            });

            await Promise.all(itemOperations);

            return updatedInvoice;
        });

        // --- 4. Success Response ---
        return NextResponse.json({
            message: `Invoice ${result.invoiceNumber} updated successfully.`,
            invoice: result,
        }, { status: 200 });

    } catch (dbError) {
        // --- 5. Error Response ---
        console.error("Database transaction failed during update:", dbError);
        return NextResponse.json({ message: 'Database error during invoice update.' }, { status: 500 });
    }
}

// Define constants and interfaces used in the logic (place at the top of your file)
// const TAX_RATE = 0.10; // Example 10% tax rate. You must define this globally or fetch it.

export async function PATCH(
    request: Request,
    { params }: { params: { invoiceId: string } }
) {
    const invoiceId = params.invoiceId;
    
    // --- 1. Validate ID and Parse Body ---
    if (!invoiceId) {
        return NextResponse.json({ message: 'Missing invoice ID' }, { status: 400 });
    }

    let payload: UpdateInvoicePayload;
    try {
        payload = await request.json();
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    // Basic validation
    if (payload.id !== invoiceId) {
        return NextResponse.json({ message: 'URL ID and Payload ID mismatch' }, { status: 400 });
    }

    // --- 2. Separate Line Items ---
    const existingItemIds = payload.items
        .map(item => item.id)
        .filter((id): id is string => !!id);

    // Get the IDs of items currently in the database to find deletions
    const currentDbItems = await prisma.invoiceItem.findMany({
        where: { invoiceId },
        select: { id: true },
    });
    const dbItemIds = currentDbItems.map(item => item.id);
    
    // Calculate items to delete (in DB but not in payload)
    const itemsToDelete = dbItemIds.filter(dbId => !existingItemIds.includes(dbId));


    // --- 2.5. CALCULATE LINE TOTALS AND SAFE PARSE FINANCIALS ---
    const updatedItems = payload.items.map(item => {
        // Safe Parse (assuming safeParseFloat exists and handles Decimal/Number conversion)
        const quantity = item.quantity;
        const unitPrice = item.unitPrice;
        
        // Assuming discountRate is a percentage (e.g., 5 for 5%), convert to decimal. Adjust if needed.
        const discountRateDecimal = item.discountRate / 100;

        // Formula: LineTotal = (Quantity * UnitPrice) * (1 - DiscountRate)
        const lineTotal = (quantity * unitPrice) * (1 - discountRateDecimal);
        
        // This object is what will be passed to Prisma for update/create
        return {
            ...item, // Keep existing fields like id
            quantity,
            unitPrice,
            discountRate: discountRateDecimal, // Store as decimal
            lineTotal: lineTotal, // 💡 Calculated Line Total
        };
    });

    // --- 2.6. CALCULATE INVOICE TOTALS ---
    const newSubTotal = updatedItems.reduce((sum, item) => sum + item.lineTotal, 0);

    // Assuming a tax rate is available (e.g., from an environment variable or payload)
    const taxRate = payload.taxRate ;//|| TAX_RATE; // Fallback to a defined constant or use payload if provided
    
    const newTaxAmount = newSubTotal * taxRate;
    const newTotalAmount = newSubTotal + newTaxAmount;
    
    // Assuming amountDue is the full total when updating, unless specific payments/credits are handled.
    // For simplicity, we set amountDue = newTotalAmount here.
    const newAmountDue = newTotalAmount; 


    // --- 3. Start Transaction ---
    try {
        const result = await prisma.$transaction(async (tx) => {
            
            // a. Update Invoice Header (USING CALCULATED TOTALS)
            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    // 💡 USING CALCULATED VALUES
                    subTotal: newSubTotal,
                    taxAmount: newTaxAmount,
                    totalAmount: newTotalAmount,
                    amountDue: newAmountDue, 
                    // Other fields remain the same
                    invoiceDate: payload.invoiceDate,
                    dueDate: payload.dueDate,
                },
                select: { id: true, invoiceNumber: true }
            });

            // b. Handle Item Deletions (Unchanged)
            if (itemsToDelete.length > 0) {
                await tx.invoiceItem.deleteMany({
                    where: { id: { in: itemsToDelete } },
                });
            }

            // c. Handle Item Updates and Creations (USING CALCULATED ITEM DATA)
            const itemOperations = updatedItems.map(item => {
                const itemData = {
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    // 💡 USING CALCULATED VALUES FROM 2.5
                    unitPrice: item.unitPrice,
                    lineTotal: item.lineTotal,
                    discountRate: item.discountRate, 
                    skuSnapshot: 'N/A', 
                };
                
                if (item.id) {
                    // Item exists (Update)
                    return tx.invoiceItem.update({
                        where: { id: item.id },
                        data: itemData,
                    });
                } else {
                    // New item (Create)
                    return tx.invoiceItem.create({
                        data: {
                            ...itemData,
                            invoiceId: updatedInvoice.id,
                        },
                    });
                }
            });

            await Promise.all(itemOperations);

            return updatedInvoice;
        });

        // --- 4. Success Response ---
        // ... (Response remains the same)
        return NextResponse.json({
            message: `Invoice ${result.invoiceNumber} updated successfully.`,
            invoice: result,
        }, { status: 200 });


    } catch (dbError) {
        // --- 5. Error Response ---
        // ... (Error handling remains the same)
        console.error("Database transaction failed during update:", dbError);
        return NextResponse.json({ message: 'Database error during invoice update.' }, { status: 500 });
    }
}
// // src/app/api/invoices/[id]/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../../libs/prismadb';

// // Define Props for dynamic route
// interface Context {
//     params: {
//         id: string;
//     };
// }

// /**
//  * 🎯 Route Handler for: GET /api/invoices/[id]
//  * Fetches a single invoice by ID.
//  */
// export async function GET(request: NextRequest, context: Context) {
//     const { id } = context.params;

//     try {
//         const invoice = await prisma.invoice.findUnique({
//             where: { id: id },
//             include: {
//                 customer: true,
//                 items: true,
//             },
//         });

//         if (!invoice) {
//             return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
//         }

//         return NextResponse.json(invoice, { status: 200 });

//     } catch (error) {
//         console.error(`API GET Error: Failed to fetch invoice ${id}`, error);
//         return NextResponse.json(
//             { message: "Failed to retrieve invoice." },
//             { status: 500 }
//         );
//     }
// }

// // Define the expected shape of the incoming request body
// interface UpdateInvoicePayload {
//     id: string; // The ID of the invoice being updated
//     customerId: string; // Should be the same, but good to include
//     invoiceDate: string;
//     dueDate: string;
//     taxRate: number;
//     subTotal: number;
//     taxAmount: number;
//     totalAmount: number;
//     amountDue: number; // The amount still due (usually starts at totalAmount)
//     // The items include the optional 'id' for existing items, and 'tempId' for React keys
//     items: Array<{
//         id?: string; // Prisma ID for existing items
//         tempId: number; // Temporary React key
//         productId: string;
//         productName: string;
//         quantity: number;
//         unitPrice: number;
//         lineTotal: number;
//         discountRate: number;
//     }>;
// }

// /**
//  * PATCH /ar/api/invoices/[invoiceId]
//  * Updates an existing Invoice and its line items.
//  */
// export async function PATCH(
//     request: Request,
//     { params }: { params: { invoiceId: string } }
// ) {
//     const invoiceId = params.invoiceId;
    
//     // --- 1. Validate ID and Parse Body ---
//     if (!invoiceId) {
//         return NextResponse.json({ message: 'Missing invoice ID' }, { status: 400 });
//     }

//     let payload: UpdateInvoicePayload;
//     try {
//         payload = await request.json();
//     } catch (e) {
//         return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
//     }

//     // Basic validation
//     if (payload.id !== invoiceId) {
//         return NextResponse.json({ message: 'URL ID and Payload ID mismatch' }, { status: 400 });
//     }

//     // --- 2. Separate Line Items ---
//     const existingItemIds = payload.items
//         .map(item => item.id)
//         .filter((id): id is string => !!id);

//     // Get the IDs of items currently in the database to find deletions
//     const currentDbItems = await prisma.invoiceItem.findMany({
//         where: { invoiceId },
//         select: { id: true },
//     });
//     const dbItemIds = currentDbItems.map(item => item.id);
    
//     // Calculate items to delete (in DB but not in payload)
//     const itemsToDelete = dbItemIds.filter(dbId => !existingItemIds.includes(dbId));


//     // --- 3. Start Transaction ---
//     try {
//         const result = await prisma.$transaction(async (tx) => {
            
//             // a. Update Invoice Header
//             const updatedInvoice = await tx.invoice.update({
//                 where: { id: invoiceId },
//                 data: {
//                     // Convert float numbers back to Decimal or appropriate type for DB
//                     subTotal: new Decimal(payload.subTotal),
//                     taxAmount: new Decimal(payload.taxAmount),
//                     totalAmount: new Decimal(payload.totalAmount),
//                     amountDue: new Decimal(payload.amountDue), 
//                     taxRate: payload.taxRate, // Assuming taxRate is float/Decimal
//                     invoiceDate: payload.invoiceDate,
//                     dueDate: payload.dueDate,
//                     // customerId is locked/unchanged, but if it were editable, update here
//                     // status: 'DRAFT' // Optionally update status if needed
//                 },
//                 select: { id: true, invoiceNumber: true }
//             });

//             // b. Handle Item Deletions
//             if (itemsToDelete.length > 0) {
//                 await tx.invoiceItem.deleteMany({
//                     where: {
//                         id: {
//                             in: itemsToDelete,
//                         },
//                     },
//                 });
//             }

//             // c. Handle Item Updates and Creations
//             const itemOperations = payload.items.map(item => {
//                 const itemData = {
//                     productId: item.productId,
//                     productName: item.productName,
//                     quantity: item.quantity,
//                     // Ensure numerical types are correct for the database
//                     unitPrice: new Decimal(item.unitPrice),
//                     lineTotal: new Decimal(item.lineTotal),
//                     discountRate: item.discountRate,
//                     // Snapshot: A simple static snapshot of the SKU could be added here
//                     skuSnapshot: 'N/A', 
//                 };
                
//                 if (item.id) {
//                     // Item exists (Update)
//                     return tx.invoiceItem.update({
//                         where: { id: item.id },
//                         data: itemData,
//                     });
//                 } else {
//                     // New item (Create)
//                     return tx.invoiceItem.create({
//                         data: {
//                             ...itemData,
//                             invoiceId: updatedInvoice.id,
//                         },
//                     });
//                 }
//             });

//             await Promise.all(itemOperations);

//             return updatedInvoice;
//         });

//         // --- 4. Success Response ---
//         return NextResponse.json({
//             message: `Invoice ${result.invoiceNumber} updated successfully.`,
//             invoice: result,
//         }, { status: 200 });

//     } catch (dbError) {
//         // --- 5. Error Response ---
//         console.error("Database transaction failed during update:", dbError);
//         return NextResponse.json({ message: 'Database error during invoice update.' }, { status: 500 });
//     }
// }