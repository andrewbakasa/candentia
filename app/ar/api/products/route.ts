import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

/**
 * 🎯 Route Handler for: GET /api/products
 * Used to fetch ProductOptions for invoice/quotation line items.
 */
export async function GET(request: NextRequest) {
    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                sku: true,
                name: true,
                unitCost: true,
                stockQuantity: true,
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
 * Adds a new product to the inventory.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const newProduct = await prisma.product.create({
            data: {
                sku: body.sku,
                name: body.name,
                stockQuantity: parseInt(body.stockQuantity),
                unitCost: parseFloat(body.unitCost),
            },
        });

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        console.error("API POST Error: Failed to create product", error);
        return NextResponse.json(
            { message: "Product creation failed." },
            { status: 500 }
        );
    }
}