
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "../../actions/getCurrentUser";
import EmptyState from "@/app/components/EmptyState";
import ClientOnly from "@/app/components/ClientOnly";
import getTagNames from "@/app/actions/getTagNames";
import { ListContainer } from "./_components/list-container";
import getUserNames from "@/app/actions/getUserNames";


interface BoardIdPageProps {
  params: {
    boardId: string;
  };
};

const BoardIdPage = async ({
  params,
}: BoardIdPageProps) => {
 
   const currentUser = await getCurrentUser();
   const tagNames =await getTagNames()
   const userNames =await getUserNames()

   

 
  
  
   if (!currentUser) {

    

  
    return (
      <ClientOnly>
        <EmptyState
          title="Unauthorized"
          subtitle="Please login"
        />
      </ClientOnly>
    );
  }
 
  try {
      const lists = await prisma.list.findMany({
        where: {
          boardId: params.boardId,
        },
          include: {
            cards: {
              orderBy: {
                order: "asc",
              },
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
            },
            
          },

          
          orderBy: {
          order: "asc",
        },
      });

      
      const board = await prisma.board.findUnique({
        where: {
          id: params.boardId,
          // orgId,
        },
      });

      if (!board) {
        //redirect(`/projects`);
    
        return (
          <ClientOnly>
            <EmptyState
              title="Not Ready"
              subtitle="Please wait"
            />
          </ClientOnly>
        );
      }
     

      const isOwner = board?.userId ==currentUser.id 
      const isOwnerOrAdmin =isOwner || currentUser.isAdmin
      // console.log('page', isOwner)
      
        //filter().map() function
        let lists_filter:any
         lists_filter =   lists.filter(list =>{ 
          // if the is is visible show it
          //if its private but its the owner show it
          // if its private but user is Admin show it
          return ((list.visible == true || (list.userId==currentUser.id) || isOwnerOrAdmin) && list.active); 
        }).map((x)=>({
              ...x,
              //change cards
              userId:x.userId || "",
              cards: x.cards.filter(card => {
              const iamtagged= card?.taggedUsers?.find(x=>x.userId==currentUser.id)
              return ((iamtagged || card.visible == true || (card.userId==currentUser.id)|| isOwnerOrAdmin) && card.active)
            
              }).map((card)=>({
                  ...card,
                  userId:card.userId || ""
                })
              ),
          })
        )
      return (
         <div className="p-4 h-full overflow-x-auto">      {/* p4 trestingpy-[84px] px-4 */}
            <ListContainer
              boardId={params.boardId}
              data={lists_filter}
              dragMode={board.dragMode}
              isOwnerOrAdmin={isOwnerOrAdmin}
              currentUserId={currentUser.id}
              cardReadMode={currentUser?.cardReadMode? currentUser.cardReadMode:true}
              // showBGImage={currentUser?.showBGImage? currentUser.showBGImage:true}
              cardYscroll={currentUser?.cardYscroll?currentUser?.cardYscroll:false}
              cardShowTitle={currentUser?.cardShowTitle?currentUser?.cardShowTitle:false}
              recentDays={currentUser?.recentDays?currentUser?.recentDays:7}
              boardProgressStatus ={board.progressStatus}
              tagNames={tagNames}
              
              userNames={userNames}
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

export default BoardIdPage;
