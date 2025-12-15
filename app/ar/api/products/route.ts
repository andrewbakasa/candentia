import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

// Helper function to process optional numeric fields, returning number or undefined
const parseOptionalNumber = (value: any): number | undefined => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
};

// Helper function to process optional integer fields, returning integer or undefined
const parseOptionalInt = (value: any): number | undefined => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? undefined : parsed;
};

// Helper function to process optional string fields, returning string or undefined
const parseOptionalString = (value: any): string | undefined => {
    const trimmed = String(value || '').trim();
    return trimmed === '' ? undefined : trimmed;
};

/**
 * 🎯 Route Handler for: GET /api/products
 * Used to fetch ProductOptions for invoice/quotation line items, including new pricing fields.
 */
export async function GET(request: NextRequest) {
    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                sku: true,
                name: true,
                unitCost: true,
                // Include necessary new fields for quick lookups/selection
                unitPrice: true, // Selling price
                stockQuantity: true,
                isActive: true,
            },
            where: {
                // Typically, you only want active products for line item selection
                isActive: true, 
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(products, { status: 200 });
    } catch (error) {
        console.error("API GET Error: Failed to fetch products", error);
        return NextResponse.json(
            { message: "Failed to retrieve products." },
            { status: 500 }
        );
    }
}

/**
 * 🎯 Route Handler for: POST /api/products
 * Adds a new product to the inventory, handling all new optional attributes.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 1. Mandatory Field Validation (Ensure required fields are present and valid)
        if (!body.sku || !body.name || parseOptionalInt(body.stockQuantity) === undefined || parseOptionalNumber(body.unitCost) === undefined) {
             return NextResponse.json(
                { message: "Missing required fields: SKU, Name, Stock Quantity, or Unit Cost." },
                { status: 400 }
            );
        }

        // 2. Prepare Data Payload (Safely parse all fields, including new optional ones)
        const data = {
            sku: body.sku,
            name: body.name,
            stockQuantity: parseOptionalInt(body.stockQuantity) as number, // Required, so cast as number
            unitCost: parseOptionalNumber(body.unitCost) as number, // Required, so cast as number

            // --- New Optional Fields ---
            unitPrice: parseOptionalNumber(body.unitPrice),
            description: parseOptionalString(body.description), // Assuming description is also a field based on form
            isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined, // Handle boolean
            barcode: parseOptionalString(body.barcode),
            category: parseOptionalString(body.category),
            supplierId: parseOptionalString(body.supplierId),
            reorderPoint: parseOptionalInt(body.reorderPoint),
            location: parseOptionalString(body.location),
        };

        const newProduct = await prisma.product.create({
            data: data,
        });

        console.log("created!!!", newProduct)

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        console.error("API POST Error: Failed to create product", error);
        // Handle unique constraint violation (e.g., duplicate SKU)
        if (error instanceof Error && (error as any).code === 'P2002') {
             return NextResponse.json(
                { message: `A product with SKU '${(error as any).meta?.target[0]}' already exists.` },
                { status: 409 } // Conflict
            );
        }
        return NextResponse.json(
            { message: "Product creation failed due to a server or database error." },
            { status: 500 }
        );
    }
}
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../libs/prismadb';

// /**
//  * 🎯 Route Handler for: GET /api/products
//  * Used to fetch ProductOptions for invoice/quotation line items.
//  */
// export async function GET(request: NextRequest) {
//     try {
//         const products = await prisma.product.findMany({
//             select: {
//                 id: true,
//                 sku: true,
//                 name: true,
//                 unitCost: true,
//                 stockQuantity: true,
//             },
//             orderBy: {
//                 name: 'asc',
//             },
//         });

//         return NextResponse.json(products, { status: 200 });
//     } catch (error) {
//         console.error("API GET Error: Failed to fetch products", error);
//         return NextResponse.json(
//             { message: "Failed to retrieve products." },
//             { status: 500 }
//         );
//     }
// }

// /**
//  * 🎯 Route Handler for: POST /api/products
//  * Adds a new product to the inventory.
//  */
// export async function POST(request: NextRequest) {
//     try {
//         const body = await request.json();
//          console.log('TEST', body)
//         const newProduct = await prisma.product.create({
//             data: {
//                 sku: body.sku,
//                 name: body.name,
//                 stockQuantity: parseInt(body.stockQuantity),
//                 unitCost: parseFloat(body.unitCost),
//             },
//         });
//         console.log("created!!!", newProduct)

//         return NextResponse.json(newProduct, { status: 201 });
//     } catch (error) {
//         console.error("API POST Error: Failed to create product", error);
//         return NextResponse.json(
//             { message: "Product creation failed." },
//             { status: 500 }
//         );
//     }
// }