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


export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const invoiceId = params.id;
    
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
          //  taxRate:12,
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
            

            // 💡 FIX: Convert the "YYYY-MM-DD" string to a full ISO-8601 date string.
            // We are assuming the date is intended to be for the start of the day (00:00:00) in UTC.
            const invoiceDateISO = payload.invoiceDate 
                ? new Date(payload.invoiceDate).toISOString() 
                : payload.invoiceDate; // Keep it as is if null/undefined

            const dueDateISO = payload.dueDate
                ? new Date(payload.dueDate).toISOString()
                : payload.dueDate; // Keep it as is if null/undefined

            const taxRate =payload.taxRate;
            // a. Update Invoice Header (USING CALCULATED TOTALS)
            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    // 💡 USING CALCULATED VALUES
                    subTotal: newSubTotal,
                    taxAmount: newTaxAmount,
                    totalAmount: newTotalAmount,
                    amountDue: newAmountDue, 
                    taxRate:taxRate,
                  
                    // Use the converted ISO strings
                    invoiceDate: invoiceDateISO, // 💡 USE ISO STRING
                    dueDate: dueDateISO,         // 💡 USE ISO STRING
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

/**
 * 🎯 Route Handler for: DELETE /api/invoices/[id]
 * Deletes an invoice and all its associated line items.
 */
export async function DELETE(request: NextRequest, context: Context) {
    const { id } = context.params;

    if (!id) {
        return NextResponse.json({ message: "Missing invoice ID." }, { status: 400 });
    }

    try {
        // Use a transaction to ensure both items and the invoice are deleted,
        // or neither is. This maintains database integrity.
        await prisma.$transaction(async (tx) => {
            
            // 1. Delete all associated InvoiceItems first
            await tx.invoiceItem.deleteMany({
                where: { invoiceId: id },
            });
            
            // 2. Delete the Invoice itself
            const deletedInvoice = await tx.invoice.delete({
                where: { id: id },
                select: { invoiceNumber: true }
            });

            // 3. Check if the deletion was successful (optional, but good practice)
            if (!deletedInvoice) {
                 // Throwing an error will automatically rollback the transaction
                 throw new Error("Invoice record not found during deletion.");
            }
        });

        return NextResponse.json({ 
            message: `Invoice ID ${id} deleted successfully.`,
            id: id,
        }, { status: 200 });

    } catch (error) {
        console.error(`API DELETE Error: Failed to delete invoice ${id}`, error);
        
        // Handle specific case where the invoice might not exist (e.g., P2003 error for foreign key violation if not handled above)
        // Note: The transaction handles atomicity, but a final check for a non-existent ID after item deletion is tricky.
        return NextResponse.json(
            { message: "Failed to delete invoice due to a database error or not found." },
            { status: 500 }
        );
    }
}
