// src/app/api/invoices/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';

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