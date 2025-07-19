//import { auth } from "@clerk/nextjs"; // Uncomment if using Clerk for authentication and authorization
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";

export async function GET(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
   
    const career = await prisma.jobApplication.findUnique({
      where: {
        id: params.jobId,
      },
      include: {
        career: true,         
        jobAttachment:true
      },
    });

    if (!career) {
      return new NextResponse("job not found", { status: 404 });
    }

    return NextResponse.json(career);
  } catch (error) {
    console.error("[appliccationGET_ERROR]", error); // Log the error for debugging
    return new NextResponse(`Internal Error: ${error}`, { status: 500 });
  }
}
