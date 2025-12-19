import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';
import { MM_WorkshopType } from '@prisma/client';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const newWorkshop = await prisma.mM_Workshop.create({
            data: {
                name: body.name,
                type: body.type as MM_WorkshopType,
            }
        });

        return NextResponse.json(newWorkshop, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Failed to create Workshop." }, { status: 500 });
    }
}

export async function GET() {
    try {
        const workshops = await prisma.mM_Workshop.findMany({
            include: { _count: { select: { mm_projects: true } } }
        });
        return NextResponse.json(workshops, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching workshops." }, { status: 500 });
    }
}