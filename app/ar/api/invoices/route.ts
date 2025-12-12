// src/app/api/invoices/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb'; 
import { InvoiceStatus } from '@prisma/client'; 
import { InvoiceFormData } from '../../_components/features/invoices/InvoiceForm';

// ... (GET route remains the same) ...

/**
 * 🎯 Route Handler for: POST /api/invoices
 * Creates a new invoice and its associated line items.
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Parse the incoming request body.
        // NOTE: We now explicitly look for subTotal and taxAmount which are 
        // expected to be included in the form data submission from the client
        const body: InvoiceFormData & { 
            taxAmount: string, 
            subTotal: string, // <-- NOW INCLUDED
            amountDue: string 
        } = await request.json();
        console.log("body", body)
        // 2. Basic Validation (omitted for brevity)

        // 3. Fetch Product SKUs for Line Items (omitted for brevity, assume 'itemsWithSku' is prepared)
        const productIds = body.items.map(item => item.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, sku: true }, 
        });
        const productMap = new Map(products.map(p => [p.id, p.sku]));
        
        const itemsWithSku = body.items.map(item => {
            const skuSnapshot = productMap.get(item.productId);
            if (!skuSnapshot) {
                 throw new Error(`Invalid Product ID provided: ${item.productId}`);
            }
            return {
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: parseFloat(item.unitPrice as any), 
                lineTotal: parseFloat(item.lineTotal as any),
                discountRate: item.discountRate,
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
                
                // Financial Totals (The FIX is here!)
                totalAmount: parseFloat(body.totalAmount.toString()),
                amountDue: parseFloat(body.amountDue),
                
                // --- ADDED MISSING REQUIRED FIELDS ---
                subTotal: parseFloat(body.subTotal), // <--- FIX 1
                taxAmount: parseFloat(body.taxAmount), // <--- FIX 2
                // -------------------------------------
                
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
        console.log("newInvoice", newInvoice)
        // 5. Return the newly created invoice object
        return NextResponse.json(newInvoice, { status: 201 });

    } catch (error) {
        console.error("API POST Error: Failed to create invoice", error);
        const errorMessage = error instanceof Error ? error.message : "Invoice creation failed due to server error.";
        return NextResponse.json(
            { message: errorMessage },
            { status: 500 }
        );
    }
}

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
