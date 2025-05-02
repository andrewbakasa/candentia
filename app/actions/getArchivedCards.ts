import prisma from "../libs/prismadb";

import getCurrentUser from "./getCurrentUser";

export default async function getArchivedCards() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return [];
    }

    // const cards = await prisma.card.findMany({
    //   where: {
    //     active:false
    //   }
    // });

    const cards = await prisma.card.findMany({
      where: {
        active:false
      },
      include: { 
          list:{
            include:{
              board:{
                include:{
                  user:true
                }
              } 
            } 
          }
      }
    });

     const safeCards = cards.map((card) => ({
        title:card.title,
        description:card.description,
        id:card.id,
        user_image:card.list.board?.user && card.list.board?.user.image,
        imageThumbUrl:card.list.board.imageThumbUrl,
        board_title: card.list.board.title,
        list_title:card.list.title,
        owner_email:card.list.board?.user && card.list.board?.user.email||"",
        
        createdAt:card.list.createdAt.toString(),
        updatedAt:card.list.updatedAt.toString(),
      })
    );

    // const cards = await prisma.card.findMany({
    //   where: {
    //     active:false
    //   },
    //   select: {
    //     id: true,
    //     title: true,
    //     order: true,
    //     description: true,
    //     visible: true,
    //     createdAt: true,
    //     updatedAt: true,
    //     list: { // Include the nested "board" object
    //       select: {
    //         id: true,
    //         title: true,
    //         order: true,
    //         // createdAt: true,
    //         // updatedAt: true,
    //         board:{
    //           select:{
    //             id: true,
    //             orgId: true,
    //             title: true,
    //             imageId: true,
    //             imageThumbUrl: true,
    //             imageFullUrl: true,
    //             imageUserName: true,
    //             imageLinkHTML: true,
    //             active: true,
    //             public: true,
    //           }

    //         }
    //         // Include other desired Board fields
    //       },
    //     },
       
    //   },
    // });
    //24 January 2024
   
    return safeCards;
  } catch (error: any) {
    throw new Error(error);
  }
}
