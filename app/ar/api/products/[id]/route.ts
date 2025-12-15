import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { Prisma } from '@prisma/client'; 

// Define Props for dynamic route
interface Context {
    params: {
        id: string; // The Product ID
    };
}

// Helper function to process optional number fields, returning number or undefined
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

// Define the expected shape of the incoming request body for updates
interface UpdateProductPayload {
    name?: string;
    sku?: string;
    unitPrice?: number;
    description?: string;
    isActive?: boolean;
    stockQuantity?: number;
    unitCost?: number; 
    
    // --- NEW FIELDS ---
    barcode?: string;
    category?: string;
    supplierId?: string;
    reorderPoint?: number;
    location?: string;
}


/**
 * 🎯 Route Handler for: GET /api/products/[id]
 * Fetches a single product by ID.
 */
export async function GET(request: NextRequest, context: Context) {
    const { id } = context.params;

    try {
        const product = await prisma.product.findUnique({
            where: { id: id },
            include: {
                supplier: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ message: "Product not found." }, { status: 404 });
        }

        return NextResponse.json(product, { status: 200 });

    } catch (error) {
        console.error(`API GET Error: Failed to fetch product ${id}`, error);
        return NextResponse.json(
            { message: "Failed to retrieve product." },
            { status: 500 }
        );
    }
}

/**
 * 🎯 Route Handler for: PATCH /api/products/[id]
 * Updates a single product's details.
 */
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const productId = params.id;
    
    // --- 1. Validate ID and Parse Body ---
    if (!productId) {
        return NextResponse.json({ message: 'Missing product ID' }, { status: 400 });
    }

    let payload: UpdateProductPayload;
    try {
        payload = await request.json();
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    // --- 2. Prepare Data (Using static assignment to ensure type safety with Prisma.ProductUpdateInput) ---
    const updateData: Prisma.ProductUpdateInput = {};

    // String Fields
    if (payload.name !== undefined) updateData.name = parseOptionalString(payload.name);
    if (payload.sku !== undefined) updateData.sku = parseOptionalString(payload.sku);
    if (payload.description !== undefined) updateData.description = parseOptionalString(payload.description);
    if (payload.barcode !== undefined) updateData.barcode = parseOptionalString(payload.barcode);
    if (payload.category !== undefined) updateData.category = parseOptionalString(payload.category);
    if (payload.location !== undefined) updateData.location = parseOptionalString(payload.location);
    // FIX: supplierId is assigned directly, allowing for null/undefined to clear the relationship
    //if (payload.supplierId !== undefined) updateData.supplierId = parseOptionalString(payload.supplierId); 


    // Number Fields (Float/Decimal)
    if (payload.unitPrice !== undefined) updateData.unitPrice = parseOptionalNumber(payload.unitPrice);
    if (payload.unitCost !== undefined) updateData.unitCost = parseOptionalNumber(payload.unitCost);

    // Number Fields (Int)
    if (payload.stockQuantity !== undefined) updateData.stockQuantity = parseOptionalInt(payload.stockQuantity);
    if (payload.reorderPoint !== undefined) updateData.reorderPoint = parseOptionalInt(payload.reorderPoint);

    // Boolean Field
    if (payload.isActive !== undefined) updateData.isActive = Boolean(payload.isActive);
    
    
    // Final check for empty update call
    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 400 });
    }
    
    // --- 3. Execute Update ---
    try {
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: updateData,
            select: { id: true, name: true, sku: true }
        });

        // --- 4. Success Response ---
        return NextResponse.json({
            message: `Product ${updatedProduct.name} (SKU: ${updatedProduct.sku}) updated successfully.`,
            product: updatedProduct,
        }, { status: 200 });

    } catch (dbError) {
        console.error("Database error during product update:", dbError);
        
        if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025: Record not found
            if (dbError.code === 'P2025') {
                 return NextResponse.json({ message: 'Product not found for update.' }, { status: 404 });
            }
            // P2002: Unique constraint violation
            if (dbError.code === 'P2002') {
                 return NextResponse.json({ message: `A product with SKU '${(dbError as any).meta?.target[0]}' already exists.` }, { status: 409 });
            }
        }

        // --- 5. Error Response ---
        return NextResponse.json({ message: 'Database error during product update.' }, { status: 500 });
    }
}


/**
 * 🎯 Route Handler for: DELETE /api/products/[id]
 * Deletes a product.
 */
export async function DELETE(request: NextRequest, context: Context) {
    const { id } = context.params;

    if (!id) {
        return NextResponse.json({ message: "Missing product ID." }, { status: 400 });
    }

    try {
        const deletedProduct = await prisma.product.delete({
            where: { id: id },
            select: { name: true, sku: true }
        });

        return NextResponse.json({ 
            message: `Product "${deletedProduct.name}" (SKU: ${deletedProduct.sku}) deleted successfully.`,
            id: id,
        }, { status: 200 });

    } catch (error) {
        console.error(`API DELETE Error: Failed to delete product ${id}`, error);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2003: Foreign key constraint violation (Product is still linked to an invoice/order)
            if (error.code === 'P2003') {
                return NextResponse.json(
                    { 
                        message: "Cannot delete product because it is currently linked to one or more records (e.g., invoices or line items). Please remove the links or set the product to inactive." 
                    }, 
                    { status: 409 } // Conflict
                );
            }
            // P2025: Record to delete does not exist
            if (error.code === 'P2025') {
                 return NextResponse.json({ message: 'Product not found for deletion.' }, { status: 404 });
            }
        }
        
        return NextResponse.json(
            { message: "Failed to delete product due to a database error." },
            { status: 500 }
        );
    }
}