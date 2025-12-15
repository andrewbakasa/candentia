import { NextRequest, NextResponse } from 'next/server';
import prisma  from '../../../../libs/prismadb'; // Assuming you have a reusable prisma client

// GET /api/quotations/:id - Get Quotation Details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const quotation = await prisma.quotation.findUnique({
            where: { id },
            include: {
                customer: { 
                    select: { id: true, name: true, email: true, address: true } 
                },
                items: true,
                invoice: true, // Check for existing invoices
            },
        });

        if (!quotation) {
            return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 });
        }

        // Format for the frontend Detail View
        const formattedQuotation = {
            ...quotation,
            invoiceCreated: quotation.invoice.length > 0,
            subTotal: parseFloat(quotation.subTotal.toString()),
            totalAmount: parseFloat(quotation.totalAmount.toString()),
            // Ensure items lineTotals are floats
            items: quotation.items.map(item => ({
                ...item,
                lineTotal: parseFloat(item.lineTotal.toString()),
                unitPrice: parseFloat(item.unitPrice.toString()),
            }))
        };
        
        return NextResponse.json(formattedQuotation);
    } catch (error) {
        console.error(`API Error (GET /quotations/${id}):`, error);
        return NextResponse.json({ error: 'Failed to fetch quotation.' }, { status: 500 });
    }
}

// PUT /api/quotations/:id - Update Quotation
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const body = await req.json();
        const { customerId, quotationNumber, status, items, subTotal, totalAmount } = body;

        // 1. Delete existing items (or use complex upsert logic, easier to delete/re-create for simplicity)
        await prisma.quotationItem.deleteMany({
            where: { quotationId: id },
        });

        // 2. Update the Quotation and create new QuotationItems
        const updatedQuotation = await prisma.quotation.update({
            where: { id },
            data: {
                customerId,
                quotationNumber,
                status,
                subTotal,
                totalAmount,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId || null,
                        productName: item.productName,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        lineTotal: item.lineTotal,
                    })),
                },
            },
        });

        return NextResponse.json(updatedQuotation);
    } catch (error) {
        console.error(`API Error (PUT /quotations/${id}):`, error);
        return NextResponse.json({ error: 'Failed to update quotation.' }, { status: 500 });
    }
}

// DELETE /api/quotations/:id - Delete Quotation
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        // 1. Delete associated QuotationItems first
        await prisma.quotationItem.deleteMany({
            where: { quotationId: id },
        });

        // 2. Delete the Quotation
        await prisma.quotation.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`API Error (DELETE /quotations/${id}):`, error);
        return NextResponse.json({ error: 'Failed to delete quotation.' }, { status: 500 });
    }
}