import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb'; 
import { Customer } from '@prisma/client'; 

// Define the expected structure for the incoming request body
interface CustomerCreationData {
    name: string;
    email: string;
    phone: string;
    address: string;
    taxId: string;
    paymentTerms: string;
}

/**
 * 🎯 Route Handler for: POST /ar/api/customers
 * Creates a new Customer record in the database.
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Parse the incoming request body.
        const body: CustomerCreationData = await request.json();

        // 2. Simple Validation (Name is mandatory based on Prisma model)
        if (!body.name) {
            return NextResponse.json(
                { message: 'Customer name is required.' },
                { status: 400 } // Bad Request
            );
        }

        // 3. Create the new customer using Prisma.
        // Prisma will handle connecting the data from the body to the Customer model.
        const newCustomer = await prisma.customer.create({
            data: {
                name: body.name,
                email: body.email || null, // Allow null if not provided
                phone: body.phone || null,
                address: body.address || null,
                taxId: body.taxId || null,
                // Ensure paymentTerms has a default if missing, 
                // but rely on client/Prisma schema defaults if possible.
                paymentTerms: body.paymentTerms || 'Net 30', 
            },
            // Optionally select specific fields to return
            select: {
                id: true,
                name: true,
                email: true,
              //  createdAt: true, // Assuming your model has this field
            }
        });

        // 4. Return the newly created customer object
        return NextResponse.json(newCustomer, { status: 201 }); // 201 Created

    } catch (error) {
        // Handle unique constraint violation (e.g., duplicate email/taxId if they were @unique)
        if (error instanceof Error && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { message: "A customer with this unique identifier (e.g., email) already exists." },
                { status: 409 } // Conflict
            );
        }

        console.error("API POST Error: Failed to create customer", error);
        const errorMessage = error instanceof Error ? error.message : "Customer creation failed due to server error.";
        return NextResponse.json(
            { message: errorMessage },
            { status: 500 } // Internal Server Error
        );
    }
}

/**
 * 🎯 Route Handler for: GET /ar/api/customers
 * Fetches a list of all customers.
 * (The original GET handler remains unchanged)
 */
export async function GET(request: NextRequest) {
    try {
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
                name: 'asc',
            }
        });
        return NextResponse.json(customers, { status: 200 });
        
    } catch (error) {
        console.error("API GET Error: Failed to fetch customers", error);
        return NextResponse.json(
            { message: "Failed to retrieve customer data from database." },
            { status: 500 }
        );
    }
}