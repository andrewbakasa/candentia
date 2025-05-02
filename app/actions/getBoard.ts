
import prisma from "../libs/prismadb";

export default async function getBoard(boardId:string) {
    try {
        const board = await prisma.board.findUnique({
        where: {
            id: boardId,
        },
        include: {
            lists: {
                orderBy: {
                    order: 'asc',
                },
                include: {
                    cards:{
                        orderBy: {
                            order: 'asc',
                        },
                       
                        
                        include: { 
                                tags: true,
                                cardImages:true,
                                taggedUsers: {
                                            include: {
                                            user: {
                                                select: {
                                                // Include fields you want from the User model
                                                id: true,
                                                name: true,
                                                email: true,
                                                // ... other fields
                                                },
                                            },
                                            },
                                },
                                comments:{
                                    include: {
                                      user: {
                                          select: {
                                          //  Include fields you want from the User model
                                          id: true,
                                          name: true,
                                          email: true,
                                          //  ... other fields
                                          },
                                      },
                                    }
                                }
                    
                        },
                       
                    },
                },
                
            },
            user:true,
            views:true,       
         },
        });
   
        
    return board;
  } catch (error: any) {
    throw new Error(error);
  }
}
