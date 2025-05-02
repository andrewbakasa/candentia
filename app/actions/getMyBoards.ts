import prisma from "../libs/prismadb";

import getCurrentUser from "./getCurrentUser";
// import updateCardUserId from "./updateCardsUserId";
// import updateListUserId from "./updateListUserId";

export default async function getMyBoards() {
  try {
    const currentUser = await getCurrentUser();
    // updateCardUserId()
    // updateListUserId()
    if (!currentUser) {
      return [];
    }
    //console.log("it seems code is ending up here")

    const owner_id = currentUser.id

    const boards = await prisma.board.findMany({
      where: {
        AND: [ 
              { active:true },
              { userId :owner_id },
            ],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        lists: {
          include: {
            //cards: true,
            cards:{
               //   include: { tags: true },
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

            }

          },
         
        },
        user:true,
        views:true,
      },
    });
    //console.log("***************************************************************")
    // console.log(boards)
    //24 January 2024
    // const safeBoards = boards.map((board) => ({
    //     ...board,
    //     //Change lists
    //     lists:board.lists.map((x)=>({
    //           ...x,
    //           //change cards
    //           cards: x.cards.map((card)=>({
    //               ...card,
    //               createdAt: card.createdAt.toString(),
    //               updatedAt: card.updatedAt.toString(),
    //             })
    //           ),
    //           createdAt: x.createdAt.toString(),
    //           updatedAt: x.updatedAt.toString(),
    //       })
    //     ),
    //     createdAt: board.createdAt.toString(),
    //     updatedAt: board.updatedAt.toString(),
    //     user:"",
    //     user_image:board?.user.image || ""
    //   })
    // );

    const safeBoards = boards.map((board) => ({
      ...board,
      //check if user has access roles list inside of project
      lists:board.lists.filter(list =>{ 
        const isOwner =(board?.userId ==currentUser.id)
        const isAdminOrOwner = isOwner || currentUser.isAdmin
        const listCreator =(list.userId ==currentUser.id)
        return ((list.visible ||isAdminOrOwner || listCreator) && list.active); 
      }).map((x)=>({
            ...x,
            //change cards
            userId:x.userId ==null? "":x.userId,//reference added after
            cards: x.cards.filter(card => {
              //check if user has access role card of list
              const isOwner =(board?.userId ==currentUser.id)
              const isAdminOrOwner = isOwner || currentUser.isAdmin
              const cardCreator =(card.userId ==currentUser.id)
              return ((card.visible || isAdminOrOwner || cardCreator) && card.active)
            }).map((card)=>({
                ...card,
                userId:card.userId ==null? "":card.userId,//reference added after
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
      views:board.views.reduce((acc, _views) => acc  +  (_views.viewCount||0), 0)
 
    })
  );
    //console.log(("---------------------------------safe boards"))
    //console.log(safeBoards)
    return safeBoards;
  } catch (error: any) {
    throw new Error(error);
  }
}



