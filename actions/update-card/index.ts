"use server";
import { revalidatePath } from "next/cache";
import prisma from "@/app/libs/prismadb";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateCard } from "./schema";
import { InputType, ReturnType } from "./types";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, Card, CardToUser, ENTITY_TYPE, User } from "@prisma/client";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { findLabelByValue, getProgressStatus, getTotal } from "@/lib/utils";
import { CardWithList, CardWithList2 } from "@/types";
import getUserNames from "@/app/actions/getUserNames";
// import { updateProgressStatus } from "@/lib/updatesTrigger";
// import { updateCardWithTags } from "@/lib/updateTags";

const handler = async (data: InputType): Promise<ReturnType> => { 
//  console.log('hhhhhh/////ffff',data)
  const { id, taggedUsers, boardId, tagIDs,...values } = data;
  let card;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Unauthorized",
    };
  }
  const owner_id = currentUser.id
  try {

    const child = await prisma.card.findUnique({ 
      where: { id },
        
       include: {
        list: {
          // select: {
            // title: true,
          // },
          include:{board:true}
       },
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
      },
    });

    // console.log("child.....", child)
    //Admin has express write
    //B
    if (child && 
      //boarder creator is allowed updating rights
          ((child.list.board?.userId==owner_id) 
             ||
             //Listowner is allowed updating rights
               (child.list.userId==owner_id)  
               ||
               //card owner is allowed updating rights
               (child?.userId==owner_id)  
                 || 
                 //adminis allowed updating rights
                 currentUser.isAdmin)){

                    /* 
                     Owner of Board , owner of List, owner of Card, and admin have right to deleted or update card
                    
                    */
                             
      // Update child data
    
      const keys = Object.keys(values);
      if (tagIDs!==undefined){
       // console.log('i am here')
        // updata card taggs onlyy anr return
          await updateCardWithTags({card:child, updatedCardData:tagIDs||[]}).then(x=>{                
              revalidatePath(`/board/${boardId}`);
              card ={...x}          
               return { data: x };
  
          })
      }else if (taggedUsers!==undefined){
        //update tagged users and return
        let c: any =child
        
        const userNames =await getUserNames();
        await updateCardWithTaggedUsers({card:c,updatedCardData:taggedUsers,cardId:child.id, userNames:userNames}).then(x=>{
            revalidatePath(`/board/${boardId}`);
            card={title:child.title,id,taggedUsers:taggedUsers}           
          
        })
      }else{
        //update  general content
          card=  await prisma.card.update({
              where: { id: child.id },
              data: {
                listId:child.listId,//temporal to remove latter;for test
                 ...values, },
          });

          await createAuditLog({
            entityTitle: card.title ,
            entityId: card.id ,
            entityType: ENTITY_TYPE.CARD,
            action: ACTION.UPDATE,
          })
          await updateProgressStatus(boardId)

          revalidatePath(`/board/${boardId}`);
          return { data: card };
      }
     
    } else {
      revalidatePath(`/board/${boardId}`);
      return {
        error: `Record can't be updated. See record creator or Admin`
      }
    }
   
  } catch (error) {
    return {
      error: `Failed to update.${error}`
    }
  }

  revalidatePath(`/board/${boardId}`);
  return { data: card };
};

interface Props {
  //   boardId: string;
    card:CardWithList,
    updatedCardData:string []
  };
  
  interface Props2 {
    //   boardId: string;
      card:CardWithList2,
      updatedCardData:string [];
      cardId:string,
      userNames:any[]
    };
  export const updateCardWithTags= async(props: Props)=> {
      const {card, updatedCardData}= props
     
      if (!card) {
        throw new Error('Card not found');
      }
    
      const oldTagIds = card?.tagIDs||[];
      const newTagIds = updatedCardData//.tagIDs;
    
      const tagsToAdd = newTagIds?.filter((id)=> !oldTagIds.includes(id));
      const tagsToRemove = oldTagIds?.filter(id => !newTagIds?.includes(id));

      // tagsToAdd.map(x=>{
      //   // User.taggedInbox.push[x]
      //   favoriteIds.push(listingId);
      // })

      // Update tagIDs on the card
      // card.tagIDs = newTagIds;
    
      // // Handle tag relations
      await prisma.$transaction([
        ...tagsToAdd?.map(tagId => prisma.tag.update({
          where: { id: tagId },
          data: { cardIDs: { push: card.id } }
        })),
      
      ]);
      
      const promises = tagsToRemove?.map(async (tagId) => {
          return removeCardIdFromTag(tagId,card.id);
        });
  
      await Promise.all(promises)
      
      const updatedCard = await prisma.card.update({
        where: { id: card.id },
        data: {tagIDs:updatedCardData}
      });
  
      
       return reorderTagIds(card.id)
      // return updatedCard;
    }
    export const findUser =async (id:string)=>{
      
    const user = await prisma.user.findUnique({ 
      where: { id },
      })
     return user
    }
    export const updateUser =async (userId:string, inboxIds:any)=>{
       const userx = await prisma.user.update({
        where: {
          id: userId
        },
        data: {
          taggedInboxIds:inboxIds
        }
      });
      }
    export const updateTaggedUsersInbox=async(tagsToAdd:any[], cardId:string)=>{
      //iterate all new users added
     // console.log('tagToAdd',tagsToAdd) 
      tagsToAdd?.map(x_userdId=>{
        // find the tagged user
        findUser(x_userdId).then(userX=>{
          //for each user check  and updat user cardlist
         // console.log(userX,x_userdId)
          let inboxIds = [...(userX?.taggedInboxIds || [])];
          inboxIds.push(cardId);
         // console.log('inboxid', inboxIds)
          //check if card is already saved so skipp
          const found =userX?.taggedInboxIds?.find(x=>x==cardId)
         // console.log('found', found)
          if (found==undefined){
            //update...
           updateUser(userX?.id||'',inboxIds);
          }

        })
       // User.taggedInbox.push[x]
      })
    }
    export const updateCardWithTaggedUsers= async(props: Props2)=> {
      const {card, updatedCardData,cardId, userNames}= props
      
      
 
      if (!card) {
        throw new Error('Card not found');
      }
      const arrayWithOnlyUserIds = card.taggedUsers.map(item => item.userId);

      const oldTagIds = arrayWithOnlyUserIds||[];
      const newTagIds = updatedCardData//.tagIDs;
    //  console.log('oldids', oldTagIds, card.taggedUsers)
    //  console.log('newids', newTagIds)
      const tagsToAdd = newTagIds?.filter((id)=> !oldTagIds.includes(id));
      const tagsToRemove = oldTagIds?.filter(id => !newTagIds?.includes(id));
    
      await updateTaggedUsersInbox(tagsToAdd, card.id );

      // Update tagIDs on the card
      // card.tagIDs = newTagIds;
    
      // // Handle tag relations
      await prisma.$transaction([
        ...tagsToRemove?.map(userid => prisma.cardToUser.deleteMany({
          where: { cardId: cardId, userId:userid}
        })),
      
      ]);
      
      const promises = tagsToAdd?.map(async (userId) => {
          const email= findLabelByValue(userNames,userId);
          
          return (AddTaggedUsers(userId,cardId,email)) ;

        });
  
      await Promise.all(promises)
      
      // const card2= getrefreshedCard(id).then(cardx=>{
      //   console.log('rrrr;', cardx)
      //   card={...cardx}
      //  });
     
    }
async function removeCardIdFromTag(tagId:string, cardId:string) {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    include: { cards: true }, // Include cards for potential optimization
  });

  if (!tag) {
    throw new Error('Tag not found');
  }
  // console.log('get data1', tag.cardIDs)
  const updatedCardIds = tag.cardIDs?.filter(id => id !== cardId);
  // console.log('get data2', updatedCardIds)
 
  const updatedTag = await prisma.tag.update({
    where: { id: tagId },
    data: { cardIDs: updatedCardIds.length > 0 ? updatedCardIds : [], },
  });

  return updatedTag;
}
async function getrefreshedCard(id:string){
  const child = await prisma.card.findUnique({ 
    where: { id },
  });
 return child
}
async function AddTaggedUsers(userId:string, cardId:string, email:string|undefined) {
  
  const createdTag = await prisma.cardToUser.create({
    data: { cardId: cardId, userId:userId,  userEmail:email||''},
  });

  return createdTag;
}

async function reorderTagIds(cardId:string) {
try {
  // Fetch the card and its associated tags
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      tags: true,
    },
  });

  if (!card) {
    throw new Error('Card not found');
  }

  // Sort tags by name
  const sortedTags = card.tags?.sort((a, b) => a.name.localeCompare(b.name));

  // Create a new array of tagIDs based on the sorted tags
  const reorderedTagIds = sortedTags?.map((tag) => tag.id);

  // Update the card with the reordered tagIDs
  const updatedCard = await prisma.card.update({
    where: { id: cardId },
    data: { tagIDs: reorderedTagIds },
  });

  return updatedCard;
} catch (error) {
  console.error('Error reordering tagIDs:', error);
  throw error;
}
}


export const updateProgressStatus = async (boardId: string) => {
  try {
      // const { boardId } = props;
      let lists:any
      lists = await prisma.list.findMany({
          where: {
          boardId: boardId,
          },
          // include: {
          //   cards: {
          //       orderBy: {
          //       order: "asc",
          //       },
          //   },
          // },
          include: {
            cards: {
              orderBy: {
                order: "asc",
              },
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
              },      
            },
            
          },

          orderBy: {
          order: "asc",
          },
      });

  const b = getTotal(lists);
  const newProgressStatus=getProgressStatus(b);
 
  const boardUpdated =  await prisma.board.update({
      where: { id: boardId },
      data: {  progressStatus:newProgressStatus },
  });

  //console.log('updated....', newProgressStatus)
  } catch (error) {
      console.log("[UPDATETRIGGER_ERROR]", error);
  }
}

export const updateCard = createSafeAction(UpdateCard, handler);

/* 
List owner should be able to update a card he doesnt own 



*/
