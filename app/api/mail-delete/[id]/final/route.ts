import { NextResponse } from "next/server";
import prisma from "../../../../libs/prismadb";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const boqId = params.id;

    try {
        // Delete all related BOQItemToBOQ records first
        await prisma.bOQItemToBOQ.deleteMany({
            where: {
                boqId: boqId,
            },
        });

        // Now delete the BOQ record
        const recordDeleted = await prisma.bOQ.delete({
            where: { id: boqId },
        });
        return NextResponse.json(recordDeleted, { status: 200 });
    } catch (error: any) {
        console.error("Error deleting BOQ", error);
        return NextResponse.json(
            { error: "Failed to delete BOQ", message: error.message },
            { status: 500 }
        );
    }
}