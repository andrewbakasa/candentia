import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb'; // Assuming you have a reusable prisma client
import { generateQuotationNumber } from '@/app/utils/numberGenerator';

//import { generateQuotationNumber } from '../../../utils/numberGenerator'; // <-- NEW: Import the generation function

// POST /api/quotations - Create a new Quotation
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('just in:',body)
        
        // **IMPORTANT:** Remove quotationNumber from destructuring, as it's not in the body.
        const { 
            customerId, 
            status, 
            items, 
            subTotal, 
            taxAmount, 
            taxRate, 
            totalAmount, 
            quotationDate, 
            expiryDate, 
        } = body;
        
        // --- FIX 1: Generate the Quotation Number ---
        // NOTE: You'll need to implement this utility function.
        const newQuotationNumber = await generateQuotationNumber('QTE'); 
        
        console.log('creating---->:', { ...body, quotationNumber: newQuotationNumber });
        
        // 1. Create the Quotation and connect/create the QuotationItems in one transaction
        const newQuotation = await prisma.quotation.create({
            data: {
                customerId,
                // --- FIX 2: Supply the generated number to Prisma ---
                quotationNumber: newQuotationNumber,
                status,
                
                // Add the dates (uncommented if you confirm they are in the body)
                // quotationDate, 
                // expiryDate,

                // Financial fields
                subTotal,
                taxAmount,
                taxRate, 
                totalAmount,

                items: {
                    create: items.map((item: any) => ({
                        // NOTE: Ensure lineTotal, unitPrice, etc., are compatible with Prisma's Decimal type
                        productId: item.productId || null,
                        productName: item.productName,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        lineTotal: item.lineTotal,
                    })),
                },
            },
        });

        // 2. Return the created quotation
        return NextResponse.json(newQuotation, { status: 201 });
    } catch (error) {
        console.error('API Error (POST /quotations):', error);
        // The detailed Prisma error is now logged server-side, 
        // so we return a helpful, but generic, message to the client.
        return NextResponse.json({ error: 'Failed to create quotation due to a server error.' }, { status: 500 });
    }
}
// GET /api/quotations - Get all Quotations (No change needed here)
export async function GET() {
    try {
        const quotations = await prisma.quotation.findMany({
            select: {
                id: true,
                quotationNumber: true,
                status: true,
                totalAmount: true,
                createdAt: true,
                customer: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log("get qouatations", quotations)

        // The list view expects customer data to be easily accessible
        const formattedQuotations = quotations.map(q => ({
            ...q,
            customer: { id: q.customer.id, name: q.customer.name || 'N/A' },
            // Ensures totalAmount is a float
            totalAmount: parseFloat(q.totalAmount.toString()), 
        }));

        return NextResponse.json(formattedQuotations);
    } catch (error) {
        console.error('API Error (GET /quotations):', error);
        return NextResponse.json({ error: 'Failed to fetch quotations.' }, { status: 500 });
    }
}