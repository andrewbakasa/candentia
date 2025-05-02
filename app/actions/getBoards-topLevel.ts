import prisma from "../libs/prismadb";
import getCurrentUser from "./getCurrentUser";

export default async function getBoardsTopLevel() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }
    const owner_id = currentUser.id
    let boards

    if (currentUser.isAdmin ){
      //admin can view all
      boards = await prisma.board.findMany({
        where: {
          active:true,
        },
        orderBy: { updatedAt: "desc" },
       
      });

    }else {
     
      //admin can view all
      boards = await prisma.board.findMany({
        where: {
              active: { equals: true },
              OR: [
                    {public: { equals: true }},
                    {userId: { equals: owner_id }},
                  ],
            },
        orderBy: { updatedAt: "desc" },
       
      });
     
      
    }
  

 
    const safeBoards = boards.map((board) => ({
      ...board,
      //createdAt: board.createdAt? board.createdAt.toString():null,
      //updatedAt: board.updatedAt.toString()
 
    })
  );
    //console.log('This is now ok but an array:',safeBoards?safeBoards[0]:safeBoards)
    return safeBoards;
  } catch (error: any) {
    throw new Error(error);
  }
}

