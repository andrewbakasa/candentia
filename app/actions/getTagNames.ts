
import prisma from "../libs/prismadb";
import getCurrentUser from "./getCurrentUser";

export default async function getTagNames() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }
    const owner_id = currentUser.id
    let tagNames

    
      //admin can view all
      tagNames = await prisma.tag.findMany({
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
        return result;
     }else{
        return []
     }
  } catch (error: any) {
    throw new Error(error);
  }
}