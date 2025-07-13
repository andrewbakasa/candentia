
import prisma from "../libs/prismadb";

import getCurrentUser from "./getCurrentUser";
export default async function getUsers() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }


    const owner_id = currentUser.id
    let members

    if (currentUser.isAdmin ){
      //admin can view all
      members = await prisma.membership.findMany({        
        orderBy: { updatedAt: "desc" },        
      });

    }else {
      //if not admin nothing return
      members = await prisma.membership.findMany({        
        where: { userEmail: "NoesticensxeBname" },        
      });
    }

    const safeUsers = members.map((user) => ({
      ...user,
      //check if user has access roles list inside of project
     
      createdAt: user?.createdAt?.toString()||null,
      updatedAt: user?.updatedAt?.toString()||null,
     // emailVerified: user?.emailVerified?.toString()||null,
    
    })
  );
 
    return safeUsers;
  } catch (error: any) {
    throw new Error(error);
  }
}


