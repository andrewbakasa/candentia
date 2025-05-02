
import prisma from "../libs/prismadb";

import getCurrentUser from "./getCurrentUser";
export default async function getUsers() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }


    const owner_id = currentUser.id
    let users

    if (currentUser.isAdmin ){
      //admin can view all
      users = await prisma.user.findMany({        
        orderBy: { updatedAt: "desc" },        
      });

    }else {
      //if not admin nothing return
      users = await prisma.user.findMany({        
        where: { name: "NoesticensxeBname" },        
      });
    }

    const safeUsers = users.map((user) => ({
      ...user,
      //check if user has access roles list inside of project
     
      createdAt: user.createdAt.toString(),
      updatedAt: user.updatedAt.toString(),
      emailVerified: user?.emailVerified?.toString()||null,
    
    })
  );
 
    return safeUsers;
  } catch (error: any) {
    throw new Error(error);
  }
}


