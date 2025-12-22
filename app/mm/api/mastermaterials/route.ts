import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

/**
 * 🎯 POST: Register a new Material in the Master Catalog
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            itemCode, 
            description, 
            category, 
            unitOfMeasure, 
            lastKnownCost 
        } = body;

        // Validation: Item Code is the unique identifier for NRZ parts
        if (!itemCode || !description) {
            return NextResponse.json({ message: "Item Code and Description are required" }, { status: 400 });
        }

        const newMaterial = await prisma.mM_MasterMaterial.create({
            data: {
                itemCode: itemCode.trim().toUpperCase(),
                description,
                category: category || null,
                unitOfMeasure: unitOfMeasure || "units",
                lastKnownCost: lastKnownCost ? Number(lastKnownCost) : null,
            }
        });

        return NextResponse.json(newMaterial, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ message: "A material with this Item Code already exists." }, { status: 409 });
        }
        return NextResponse.json({ message: "Error creating master material", error: error.message }, { status: 500 });
    }
}

/**
 * 🎯 GET: Fetch the Master Catalog
 * Supports searching by itemCode or category
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const category = searchParams.get('category');

        const catalog = await prisma.mM_MasterMaterial.findMany({
            where: {
                AND: [
                    category ? { category } : {},
                    search ? {
                        OR: [
                            { itemCode: { contains: search, mode: 'insensitive' } },
                            { description: { contains: search, mode: 'insensitive' } }
                        ]
                    } : {}
                ]
            },
            include: {
                // Count how many project requirements are currently using this material
                _count: {
                    select: { requirements: true }
                }
            },
            orderBy: { itemCode: 'asc' }
        });

        return NextResponse.json(catalog, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Error fetching catalog", error: error.message }, { status: 500 });
    }
}