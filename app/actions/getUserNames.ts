

import prisma from "../libs/prismadb";
import getCurrentUser from "./getCurrentUser";

export default async function getUserNames() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }
    const owner_id = currentUser.id
    let userNames

    
      //admin can view all
      userNames = await prisma.user.findMany({
        // where: {
        //   active:true,
        // },
        orderBy: { email: "asc" },
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
     if (userNames) {
        const result = userNames?.map(x=>({label:x.email,value:x.id}))
        return result;
     }else{
        return []
     }
  } catch (error: any) {
    throw new Error(error);
  }
}
