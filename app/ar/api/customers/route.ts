import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb'; 
import { Customer } from '@prisma/client'; 

// NOTE: Add your specific path prefix (e.g., 'ar') in your folder structure,
// e.g., src/app/api/ar/customers/route.ts, for the final URL to be /ar/api/customers

/**
 * 🎯 Route Handler for: GET /api/customers
 * Fetches a list of all customers.
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Fetch all customers, selecting only necessary fields for a list/select dropdown
        const customers: Customer[] = await prisma.customer.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                taxId: true,
                paymentTerms: true,
            },
            orderBy: {
                name: 'asc', // Sort alphabetically for user convenience
            }
        });

        // 2. Return the data as JSON
        return NextResponse.json(customers, { status: 200 });
        
    } catch (error) {
        console.error("API GET Error: Failed to fetch customers", error);
        return NextResponse.json(
            { message: "Failed to retrieve customer data from database." },
            { status: 500 }
        );
    }
}

// Optional: Prevent other methods like POST/PUT/DELETE if only GET is intended.
export async function POST(request: NextRequest) {
    return NextResponse.json({ message: 'POST method not allowed for this route.' }, { status: 405 });
}