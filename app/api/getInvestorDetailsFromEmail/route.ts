import { NextResponse } from "next/server";
import prisma from "../../libs/prismadb";

export async function POST(request: Request) {
    try {


        const body = await request.json();
        console.log(`body: ${body}, treq: ${request}`); // Improved logging
        const { email } = body;

        if (!email) {
            return new NextResponse("Email is required", { status: 400 });
        }

        const investor = await prisma.investor.findFirst({
            where: { email: email },
        });

        console.log(`Email found....`, investor, email); // Improved logging
        return NextResponse.json(investor);
    } catch (error: any) {
        console.error("Error in /api/getInvestorDetailsFromEmail:", error); // Detailed error logging
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 }); //Include the error message
    }
}
