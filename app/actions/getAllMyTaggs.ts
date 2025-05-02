import prisma from "../libs/prismadb";

import getCurrentUser from "../actions/getCurrentUser";

export default async function getProjectsIamTagged() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return [];
    }
    let currentUserId= currentUser.id
    // console.log('fav', currentUser.favoriteIds)
    const boards = await prisma.board.findMany({
       
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
                              //  Include fields you want from the User model
                              id: true,
                              name: true,
                              email: true,
                              //  ... other fields
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
    //   console.log('1...', boards)

    let safeBoards = boards.map((board) => ({
        ...board,
        // check if user has access roles list inside of project
        lists:board.lists.map((x)=>({
              ...x,
              userId:x.userId ==null?"":x.userId ,//reference added after
              cards: x.cards.filter(card => {
                // check if user has access role card of list
                // const found=currentUser.favoriteIds.find(k=>(k==card.id))
                const found= card.taggedUsers?.find(x=>x.userId==currentUserId)

                return (found)
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
        //views:board.views
        views:board.views.reduce((acc, _views) => acc  +  (_views.viewCount||0), 0)
 
      })
    );
    // console.log('2....',safeBoards)
     safeBoards= safeBoards.map((board) => ({
         ...board,
        //  remov empty list
         lists:board.lists.filter((list)=>( list.cards.length>0)),
        }));


    return safeBoards;
  } catch (error: any) {
    throw new Error(error);
  }
}