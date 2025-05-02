import prisma from "@/app/libs/prismadb";
// import {getProgressStatus, getTotal } from "./utils";
import { Card, Tag } from "@prisma/client";

interface Props {
//   boardId: string;
  cardId:string,
  updatedCardData:string []
};


export const updateCardWithTags= async(props: Props)=> {
    const {cardId, updatedCardData}= props
    const card = await prisma.card.findUnique({ where: { id: cardId } });
  
    if (!card) {
      throw new Error('Card not found');
    }
  
    const oldTagIds = card?.tagIDs||[];
    const newTagIds = updatedCardData//.tagIDs;
  
    const tagsToAdd = newTagIds?.filter((id)=> !oldTagIds.includes(id));
    const tagsToRemove = oldTagIds?.filter(id => !newTagIds?.includes(id));
  
    // Update tagIDs on the card
    card.tagIDs = newTagIds;
  
    // // Handle tag relations
    await prisma.$transaction([
      ...tagsToAdd?.map(tagId => prisma.tag.update({
        where: { id: tagId },
        data: { cardIDs: { push: cardId } }
      })),
    
    ]);
    
    const promises = tagsToRemove?.map(async (tagId) => {
        return removeCardIdFromTag(tagId,cardId);
      });

    await Promise.all(promises)
    
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {tagIDs:updatedCardData}
    });

    
    return reorderTagIds(cardId)
    // return updatedCard;
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