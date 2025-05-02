//import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";

export async function GET(
  req: Request,
  // { params }: { params: { cardId: string } }
) {
  try {
    //const { userId, orgId } = auth();

    // if (!userId || !orgId) {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }
    let tagNames = await prisma.tag.findMany({
      // where: {
      //   active:true,
      // },
      orderBy: { name: "asc" },
      // include: {
      //   lists: {
      //     include: {
      //       cards: true,
      //     },
      //   },
      //   user:true,
      // },
    });
//  console.log('hhhh',tagNames)
   if (tagNames) {
       const result = tagNames?.map(x=>({label:x.name,value:x.id}))
       return NextResponse.json(result);
   }


    return NextResponse.json(tagNames);
  } catch (error) {
    return new NextResponse(`Internal Error: ${error}`, { status: 500 });
  }
}