import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

interface StrategyCreationData {
    year: number;
    description: string;
    totalBudget: number;
    executiveId: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: StrategyCreationData = await request.json();

        if (!body.year || !body.totalBudget) {
            return NextResponse.json({ message: 'Year and Total Budget are required.' }, { status: 400 });
        }

        const newPlan = await prisma.mM_StrategicPlan.create({
            data: {
                year: body.year,
                description: body.description,
                totalBudget: body.totalBudget,
                executiveId: body.executiveId || null,
            }
        });

        return NextResponse.json(newPlan, { status: 201 });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'P2002') {
            return NextResponse.json({ message: "A strategic plan for this year already exists." }, { status: 409 });
        }
        return NextResponse.json({ message: "Failed to create Strategic Plan." }, { status: 500 });
    }
}

export async function GET() {
    try {
        const plans = await prisma.mM_StrategicPlan.findMany({
            include: {
                assignedExecutive: { select: { name: true } },
                _count: { select: { mm_projects: true } }
            },
            orderBy: { year: 'desc' }
        });
        return NextResponse.json(plans, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching strategic plans." }, { status: 500 });
    }
}