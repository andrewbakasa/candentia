import { boolean } from "zod";
import prisma from "../libs/prismadb";
import getCurrentUser from "./getCurrentUser";

export default async function getArchivedLists() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return [];
    }

    const lists = await prisma.list.findMany({
      where: {
        active:false
      },
      include: {
          cards: true, 
          board:{
            include:{
              user:true
            }
          }  
      }
    });

     const safeLists = lists.map((list) => ({
        id:list.id,
        user_image:list.board?.user && list.board?.user.image,
        imageThumbUrl:list.board.imageThumbUrl,
        board_title: list.board.title,
        list_title:list.title,
        owner_email:list.board?.user && list.board?.user.email||"",
        cards: list.cards.map((card)=>({
            ...card,
            createdAt: card.createdAt.toString(),
            updatedAt: card.updatedAt.toString(),
          })
        ),
        createdAt:list.createdAt.toString(),
        updatedAt:list.updatedAt.toString(),
      })
    );
    
    // console.log("----------------------------------------------------------------------------------------")
    // console.log(lists)
    // console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    // console.log(safeLists)
    //safeLists.
    return safeLists;
  } catch (error: any) {
    throw new Error(error);
  }
}

