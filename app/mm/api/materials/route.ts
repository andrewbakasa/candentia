import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

/**
 * 🎯 PATCH: Bulk Update Status (e.g., Moving from DRAFT to REQUISITIONED)
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, status } = body;

        if (!Array.isArray(ids) || !status) {
            return NextResponse.json({ message: "Invalid update data" }, { status: 400 });
        }

        const updateResult = await prisma.mM_MaterialRequirement.updateMany({
            where: { id: { in: ids } },
            data: { status: status as any }
        });

        return NextResponse.json(updateResult, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Bulk update failed", error: error.message }, { status: 500 });
    }
}