import { checkStringFromStringArray } from "@/lib/utils";
import prisma from "../libs/prismadb";

import getCurrentUser from "./getCurrentUser";

export default async function updateCardsProgressField() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return [];
    }
   
    if (currentUser.isAdmin){
        const allCards = await prisma.card.findMany();
        const cardsWithActivityCompleted = allCards.filter(card =>  !card?.progress ); // Check if "roles" is undefined, null, or empty
        
        const transaction = cardsWithActivityCompleted.map((card) => 
                                                    prisma.card.update({
                                                        where: {
                                                            id: card.id,
                                                        },
                                                        data: {
                                                            progress: "wip",
                                                        },
                                                    })
                                               );
        const usersUpdated = await prisma.$transaction(transaction);
        // console.log('Cards successfully updated......>>>>>',usersUpdated)
  
    }else {
      console.log('User is not admin. No updated')
    }
 
    return [];
  } catch (error: any) {
    throw new Error(error);
  }
}


