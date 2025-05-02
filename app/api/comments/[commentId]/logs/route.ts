//import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { ENTITY_TYPE } from "@prisma/client";

import prisma from "@/app/libs/prismadb";

export async function GET(
  request: Request,
  { params }: { params: { commentId: string } }
) {
  try {
    

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        // orgId,
        entityId: params.commentId,
        entityType: ENTITY_TYPE.CARD,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
};
