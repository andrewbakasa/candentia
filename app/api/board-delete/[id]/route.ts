import { NextResponse } from "next/server";
import prisma from "../../../libs/prismadb";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = params.id;

    try {
        // Now delete the BOQ record
        const recordDeleted = await prisma.board.delete({
            where: { id: id },
        });
        return NextResponse.json(recordDeleted, { status: 200 });
    } catch (error: any) {
        console.error("Error deleting board", error);
        return NextResponse.json(
            { error: "Failed to delete board", message: error.message },
            { status: 500 }
        );
    }
}