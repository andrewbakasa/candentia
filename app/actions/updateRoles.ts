import prisma from "../libs/prismadb";

import getCurrentUser from "./getCurrentUser";

export default async function updateUserRolesEmpty() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return [];
    }

    if (currentUser.isAdmin){
        const allUsers = await prisma.user.findMany();
        const usersWithoutRoles = allUsers.filter(user => !user.roles || user.roles.length === 0); // Check if "roles" is undefined, null, or empty
        
        const transaction = usersWithoutRoles.map((user) => 
                                                    prisma.user.update({
                                                        where: {
                                                            id: user.id,
                                                        },
                                                        data: {
                                                            roles: ['visitor'],
                                                        },
                                                    })
                                               );
        const usersUpdated = await prisma.$transaction(transaction);
        //console.log('User successfully updated......>>>>>',usersUpdated)
  
    }else {
      console.log('User is not admin. No updated')
    }
 
    return [];
  } catch (error: any) {
    throw new Error(error);
  }
}

// const usersWithRoles = await prisma.user.findMany({
        //     where: { roles: { exists: true } }, // Find users with "roles" field
        //   });
        
        //   const usersWithoutRoles = await prisma.user.updateMany({
        //     where: { NOT: { IN: usersWithRoles.map(user => user.id) } }, // Exclude IDs of users with roles
        //     data: { roles: ['visitor'] }, // Update users without roles
        //   });

        // const usersWithRoles = await prisma.user.findMany({
        //     where: { roles: { NOT: null } }, // Filter users with non-null "roles" field
        //   });
        
        //   const usersWithoutRoles = await prisma.user.updateMany({
        //     where: { NOT: { IN: usersWithRoles.map(user => user.id) } }, // Exclude IDs of users with roles
        //     data: { roles: ['visitor'] }, // Update users without roles
        //   });


