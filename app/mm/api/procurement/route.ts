import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

interface POLineItemData {
    itemCode: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

interface POCreationData {
    poNumber: string;
    activityId: string;
    lineItems: POLineItemData[];
}

/**
 * 🎯 POST: Create PO with nested Line Items
 */
export async function POST(request: NextRequest) {
    try {
        const body: POCreationData = await request.json();

        const totalPOValue = body.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

        const newPO = await prisma.mM_PurchaseOrder.create({
            data: {
                poNumber: body.poNumber,
                activityId: body.activityId,
                status: 'AWAITING_FUNDING',
                value: totalPOValue,
                lineItems: {
                    create: body.lineItems.map(item => ({
                        itemCode: item.itemCode,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.quantity * item.unitPrice
                    }))
                }
            },
            include: { lineItems: true }
        });

        return NextResponse.json(newPO, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Procurement creation failed." }, { status: 500 });
    }
}

/**
 * 🎯 GET: Fetch POs with Funding Status Filter
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // e.g., 'AWAITING_FUNDING'

        const pos = await prisma.mM_PurchaseOrder.findMany({
            where: status ? { status: status as any } : {},
            include: {
                lineItems: true,
                mm_activity: {
                    select: { description: true, project: { select: { name: true } } }
                }
            }
        });

        return NextResponse.json(pos, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching procurement data." }, { status: 500 });
    }
}