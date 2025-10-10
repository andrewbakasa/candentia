
import prisma from "../libs/prismadb";
import getCurrentUser from "./getCurrentUser";
import { getCardsFromSafeBoardT } from "@/lib/utils";

export default async function getPortifolios() {
  try {
    const currentUser = await getCurrentUser();
    // if (!currentUser) {
    //   return [];
    // }
    const owner_id = currentUser?.id
    let boards

    if (currentUser?.isAdmin ){
      //admin can view all
      boards = await prisma.board.findMany({
        where: {
          // Corrected to use 'contains' for partial string matching, as requested.
          // The 'mode: insensitive' makes the search case-insensitive.
          // If you are encountering a TypeScript error like "Type '{ contains: string; }' is not assignable to type 'never'",
          // please ensure that the 'title' field in your Prisma schema for the 'Board' model is of type 'String'.
          // Also, make sure you have run 'npx prisma generate' after any schema changes.
          title: {
            contains: "port",
            mode: 'insensitive',
          },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          lists: {
            include: {
              cards:{
                include: { 
                  tags: true ,
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
        include: {
          lists: {
            include: {
               cards:{
                include: { 
                  tags: true ,                  
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
     
      
    }
  
 //console.log('1/.....',boards )
 
    const safeBoards = boards.map((board) => ({
      ...board,
      //check if user has access roles list inside of project
      lists:board?.lists.filter(list =>{ 
        const isOwner = (board?.userId ==currentUser?.id)
        const isAdminOrOwner = isOwner || currentUser?.isAdmin
        const listCreator =(list.userId ==currentUser?.id)
        return ((list.visible || isAdminOrOwner || listCreator) && list.active); 
      }).map((x)=>({
            ...x,
            userId:x.userId ==null?"":x.userId ,//reference added after
            cards: x.cards.filter(card => {
              //check if user has access role card of list
              const isOwner =(board?.userId ==currentUser?.id)
              const isAdminOrOwner = isOwner || currentUser?.isAdmin
              const cardCreator =(card.userId==currentUser?.id)
              return ((card.visible || isAdminOrOwner || cardCreator) && card.active)
            }).map((card)=>({
                ...card,
                userId:card.userId ==null? "":card.userId,//reference added after
                createdAt: card.createdAt? card.createdAt.toString():null,
                updatedAt: card.updatedAt.toString(),
              })
            ),
            createdAt: x.createdAt?x.createdAt.toString():null,
            updatedAt: x.updatedAt.toString(),
        })
      ),
      createdAt: board.createdAt.toString(),
      updatedAt: board.updatedAt.toString(),
      user:"",
      user_image:board?.user && board?.user.image || "",
      views:board.views.reduce((acc, _views) => acc  +  (_views.viewCount||0), 0),
      userslist:[]


 
    })
  );
   
   // console.log("safeBoards", safeBoards)
   //get the first board off
    let cardListLocal = getCardsFromSafeBoardT(safeBoards[0])
    return cardListLocal
  } catch (error: any) {
    throw new Error(error);
  }
}
