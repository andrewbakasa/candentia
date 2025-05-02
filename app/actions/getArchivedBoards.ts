import prisma from "../libs/prismadb";

import getCurrentUser from "./getCurrentUser";

export default async function getArchivedBoards() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return [];
    }

    const boards = await prisma.board.findMany({
      where: {
        active:false
      },
      include: {
        lists: {
          include: {
            cards: true,
          },
        },
        user:true,
        views:true,
        // views: {
        //   select: {
        //     _count: true, // Simply count the number of BoardView records
        //   },
        // },
      },
    });

    // const boards = await prisma.board.findMany({
    //   where: {
    //     active:false,
    //   },
    //   orderBy: { updatedAt: "desc" },
    //   include: {
    //     lists: {
    //       include: {
    //         cards:{
    //           include: { tags: true ,
                 
    //             taggedUsers: {
    //                     include: {
    //                     user: {
    //                         select: {
    //                         // Include fields you want from the User model
    //                         id: true,
    //                         name: true,
    //                         email: true,
    //                         // ... other fields
    //                         },
    //                     },
    //                     },
    //              },
    //            comments:{
    //                     include: {
    //                       user: {
    //                           select: {
    //                           //  Include fields you want from the User model
    //                           id: true,
    //                           name: true,
    //                           email: true,
    //                           //  ... other fields
    //                           },
    //                       },
    //                     }
    //             }
        
    //           },
    //         }
    //       },
    //     },
    //     user:true,
    //     views:true,
    //   },
    // });
    //24 January 2024
    const safeBoards = boards.map((board) => ({
        ...board,
        //Change lists
        lists:board.lists.map((x)=>({
              ...x,
              //change cards
              cards: x.cards.map((card)=>({
                  ...card,
                  createdAt: card.createdAt.toString(),
                  updatedAt: card.updatedAt.toString(),
                })
              ),
              createdAt: x.createdAt.toString(),
              updatedAt: x.updatedAt.toString(),
          })
        ),
        createdAt: board.createdAt.toString(),
        updatedAt: board.updatedAt.toString(),
        user:"",
        user_image:board?.user && board?.user.image || "",
       // views:board.views
       views:board.views.reduce((acc, _views) => acc  +  (_views.viewCount||0), 0)
 
      })
    );

    return safeBoards;
  } catch (error: any) {
    throw new Error(error);
  }
}

