import prisma from "@/app/libs/prismadb";

import getCurrentUser from "@/app/actions/getCurrentUser";
import getTagNames from "@/app/actions/getTagNames";
import getUserNames from "@/app/actions/getUserNames";
import MediaClient from "./MediaClient";

interface MediaPageProps {
  params: {
    id: string;
  };
};

const MediaPage = async ({
  params,
}: MediaPageProps) => {


  const currentUser = await getCurrentUser();
  const userNames = await getUserNames();
  
  
  const tagNames =await getTagNames()
  try {
  
    let mediaList
    mediaList = await prisma.cardImage.findMany({
      where: {
            cardId: params.id,
       },
      orderBy: { createdAt: "desc" },
     
      include: {
        card: {
       
          include: {
            list: {
          
            include :{
              board: { // Now 'board' should be recognized
              select: {
                id: true, // Include the board's ID
                title: true,
                createdAt:true,
                updatedAt:true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },},
          }
          },
        },
      },
    });
    let safeMedia;
    // media available
    let hasMedia = mediaList.length > 0; // Property to indicate if media exists

    if (hasMedia) {
      safeMedia = mediaList.map((mediaX) => ({
        ...mediaX,
        createdAt: mediaX.createdAt ? mediaX.createdAt.toString() : null, // Handle null for mediaX.createdAt
        listTitle: mediaX.card.list.title,
        boardTitle: mediaX.card.list?.board.title,
        boardId: mediaX.card.list.board.id, // Add boardId here
        title: mediaX.card?.title,
        boardCreatedAt: mediaX.card.list.board.createdAt ? mediaX.card.list.board.createdAt.toString() : null, // Handle null
        boardUpdatedAt: mediaX.card.list.board.updatedAt ? mediaX.card.list.board.updatedAt.toString() : null, // Handle null
       
      
        card: {
          ...mediaX.card,
          createdAt: mediaX.card.createdAt ? mediaX.card.createdAt.toString() : null, // Handle null for card.createdAt
          updatedAt: mediaX.card.updatedAt ? mediaX.card.updatedAt.toString() : null, // Handle null for card.updatedAt
          list: mediaX.card.list ? { // Handle null for card.list
            ...mediaX.card.list,
            // createdAt is likely on card, not list. If it is on list, use the same null check as above.
            board: mediaX.card.list?.board ? { // Handle null for card.list.board using optional chaining
              ...mediaX.card.list.board,
              createdAt: mediaX.card.list.board.createdAt ? mediaX.card.list.board.createdAt.toString() : null, // Handle null
              updatedAt: mediaX.card.list.board.updatedAt ? mediaX.card.list.board.updatedAt.toString() : null, // Handle null
            } : null,
          } : null,
        },
      }));

    }else{
      // no media
      const card = await prisma.card.findUnique({// removedunique
        where: {
          id: params.id,
        },
        include: {
          list: {
        
          include :{
            board: { // Now 'board' should be recognized
            select: {
              id: true, // Include the board's ID
              title: true,
              createdAt:true,
              updatedAt:true,
              user: {
                select: {
                  email: true,
                },
              },
            },
          },},
        }
        },
      });

      if (card){
          safeMedia = [{
         
          id: null,
            cardId: card.id,
            url: null,
            type: 'emptyMedia',
            userId: null,
            fileName: null,
            createdAt: null,
            title: card?.title,
            listTitle: card?.list.title,
            boardTitle: card?.list?.board.title,
            boardId: card.list.board.id, // Add boardId here
            boardCreatedAt: card.list.board.createdAt ? card.list.board.createdAt.toString() : null, // Handle null
            boardUpdatedAt: card.list.board.updatedAt ? card.list.board.updatedAt.toString() : null, // Handle null
        
          
            card: {
              ...card,
              createdAt: card.createdAt ? card.createdAt.toString() : null, // Handle null for card.createdAt
              updatedAt: card.updatedAt ? card.updatedAt.toString() : null, // Handle null for card.updatedAt
              list: card.list ? { // Handle null for card.list
                ...card.list,
                // createdAt is likely on card, not list. If it is on list, use the same null check as above.
                board: card.list?.board ? { // Handle null for card.list.board using optional chaining
                  ...card.list.board,
                  createdAt: card.list.board.createdAt ? card.list.board.createdAt.toString() : null, // Handle null
                  updatedAt: card.list.board.updatedAt ? card.list.board.updatedAt.toString() : null, // Handle null
                } : null,
              } : null,
            },
          }]
        
        }

    }
  
    return (
      <div className="p-0  h-full overflow-x-auto">
         <MediaClient
           currentUser={currentUser}
           media={safeMedia}
           tagNames={tagNames}           
           userNames={userNames}
           hasMedia={hasMedia}
         />
       </div>
   );
  
  }catch (err) {
    //console.log(err)
    return {
      error: "Something went wrong!" 
    }
  };
};


export default MediaPage;

