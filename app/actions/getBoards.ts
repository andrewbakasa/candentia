import { Board } from "@prisma/client";
import prisma from "../libs/prismadb";
import getCurrentUser from "./getCurrentUser";

export default async function getBoards() {
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
          // views: {
          //   select: {
          //     _count: true, // Simply count the number of BoardView records
          //   },
          // },
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
                include: { tags: true ,
                   
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
          // views: {
          //   select: {
          //     _count: true, // Simply count the number of BoardView records
          //   },
          // },
        },
      });
     
      
    }
  

 
    const safeBoards = boards.map((board) => ({
      ...board,
      //check if user has access roles list inside of project
      lists:board.lists.filter(list =>{ 
        const isOwner = (board?.userId ==currentUser.id)
        const isAdminOrOwner = isOwner || currentUser.isAdmin
        const listCreator =(list.userId ==currentUser.id)
        return ((list.visible || isAdminOrOwner || listCreator) && list.active); 
      }).map((x)=>({
            ...x,
            userId:x.userId ==null?"":x.userId ,//reference added after
            cards: x.cards.filter(card => {
              //check if user has access role card of list
              const isOwner =(board?.userId ==currentUser.id)
              const isAdminOrOwner = isOwner || currentUser.isAdmin
              const cardCreator =(card.userId==currentUser.id)
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
      createdAt: board.createdAt? board.createdAt.toString():null,
      updatedAt: board.updatedAt.toString(),
      user:"",
      user_image:board?.user && board?.user.image || "",
      views:board.views.reduce((acc, _views) => acc  +  (_views.viewCount||0), 0)
 
    })
  );
    //console.log('This is now ok but an array:',safeBoards?safeBoards[0]:safeBoards)
    return safeBoards;
  } catch (error: any) {
    throw new Error(error);
  }
}


/* 
The updated code you provided retrieves active boards with additional sorting and
 includes related data. Here's a breakdown:

Sorting:

orderBy: { updatedAt: "desc" } sorts the retrieved boards in descending order based
 on their updatedAt timestamp. This means you'll get the most recently updated boards first.
Includes:

include: { lists: { include: { cards: true } } } fetches related lists associated 
with each board and includes card data within each list. This nested inclusion 
retrieves all cards within each retrieved board's lists.
include: { user: true } includes information about the user who owns each board.
Overall Logic:

Find all active boards (active: true).
Apply OR condition: include boards that are either public (public: true) or owned 
by the user identified by owner_id.
Sort the retrieved boards by their last updated timestamp (descending).
Include related lists for each board, and within each list, include all cards.
Include information about the user who owns each board.
Additional Notes:

Make sure owner_id is defined correctly to avoid unexpected results.
Consider potential performance implications of eager loading all cards and user data. 
If you don't need all this information immediately, you could implement lazy loading mechanisms.
Remember data sensitivity: Publicly exposing user information might require additional 
security measures depending on your application's context

 */