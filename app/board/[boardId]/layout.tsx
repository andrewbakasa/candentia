import { notFound, redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import { BoardNavbar } from "./_components/board-navbar";
import { BoardView } from "@prisma/client";
import getUserNames from "@/app/actions/getUserNames";
import getUserImages from "@/app/actions/getUserImages";;
import getBoardViewCreatedAt from "@/app/actions/getBoardViewCreatedAt";

const getRecentUsers = (views: BoardView[], limit: number = 3): string[] => {
  const uniqueUsers = new Set<string>();
  for (const view of views) {
    for (const userId of view.userID) {
      uniqueUsers.add(userId);
    }
    if (uniqueUsers.size >= limit) {
      break;
    }
  }
  return Array.from(uniqueUsers);
};

const getMostVisitedUsers = (views: BoardView[]): { [key: string]: number } => {
  const userCounts: { [key: string]: number } = {};
  for (const view of views) {
    for (const userId of view.userID) {
      userCounts[userId] = (userCounts[userId] || 0) + 1; 
    }
  }
  return userCounts;
};

const getTopUsers = (views: BoardView[]): string[] => {
  const recentUsers = getRecentUsers(views);
  const userCounts = getMostVisitedUsers(views);

  const combinedUsers = new Set([...recentUsers]);
  for (const userId in userCounts) {
    combinedUsers.add(userId);
  }

  const sortedUsers = Array.from(combinedUsers).sort((a, b) => {
    const countA = userCounts[a] || 0;
    const countB = userCounts[b] || 0;
    const countDiff = countB - countA; 

    if (countDiff !== 0) {
      return countDiff;
    }
    return recentUsers.indexOf(a) - recentUsers.indexOf(b); 
  });

  return sortedUsers.slice(0, 6);
};

export async function generateMetadata({ 
  params
 }: {
  params: { boardId: string; };
 }) {

  

  const board = await prisma.board.findUnique({
    where: {
      id: params.boardId,
    }
  });

  return {
    title: board?.title || "Board",
  };
}

const BoardIdLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { boardId: string; };
}) => {
  
  const currentUser = await getCurrentUser();
  //not sustantanable for large user sets
  const userNames = await getUserNames();
  //not sustanable for large user sets...
  const userImages = await getUserImages();
  
  // filter those related to boardId
  const boardViewCreatedAt = await getBoardViewCreatedAt(params.boardId);
  // if (!currentUser) {
  //   return [];
  // }
 
  if (!currentUser) {
   //redirect(`/projects`);

   return (
     <ClientOnly>
       <EmptyState
         title="Unauthorized"
         subtitle="Please login"
       />
     </ClientOnly>
   )
  }
  const board = await prisma.board.findUnique({
    where: {
      id: params.boardId,
    },
  });
  // console.log("here.......")
  if (!board) {
    notFound();
  }

  const board2 = await prisma.board.findUnique({
    where: {
      id: params.boardId,
    },
    include: {
        lists: {
            orderBy: {
              order: 'asc',
            },
            include: {
                cards:{
                    orderBy: {
                      order: 'asc',
                    },
                }
            },
        },
        user:true,
        views:true,
       
    },
  });



  if (!board2) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: {
      id: board?.userId!,
      // orgId,
    },
  });

 const safeData = {
  ...board2,
  //check if user has access roles list inside of project
  lists:board2.lists.filter(list =>{ 
    const isOwner =(board?.userId ==currentUser.id)
    const isAdminOrOwner = isOwner || currentUser.isAdmin
    const listCreator =(list.userId ==currentUser.id)
    return (list.visible == true ||isAdminOrOwner || listCreator); 
  }).map((x)=>({
        ...x,
        //change cards
        userId:x.userId || "",//reference added after
        cards: x.cards.filter(card => {
          //check if user has access role card of list
          const isOwner =(board?.userId ==currentUser.id)
          const isAdminOrOwner = isOwner || currentUser.isAdmin
          const cardCreator = (card.userId ==currentUser.id)
          return (card.visible == true || isAdminOrOwner || cardCreator)
        }).map((card)=>({
            ...card,
            userId:card.userId ||"",//reference added after
            createdAt: card.createdAt.toString(),
            updatedAt: card.updatedAt.toString(),
          })
        ),
        createdAt: x.createdAt.toString(),
        updatedAt: x.updatedAt.toString(),
    })
  ),
  createdAt: board2.createdAt.toString(),
  updatedAt: board2.updatedAt.toString(),
  user:"",
  user_image:board2?.user && board2?.user.image || "",
 // views:board2.views
  views:board2.views.reduce((acc, _views) => acc  +  (_views.viewCount||0), 0),
  userslist:getTopUsers(board2.views)

 
};
// const upDataBoadViews = async () => {
//   let request;
//   try {
//     request = () => axios.post(`/api/userCredentials/${userId}`);
//     const data = await request();
//     console.log('data......:', data);
//   } catch (error) {
//     // toast.error('Something went wrong.');
//   } finally {
//   }
// };

// upDataBoadViews();

// console.log('safe data====>',safeData)
  return (
    <div
      className="relative h-full bg-no-repeat bg-cover bg-center "
      style={{ backgroundImage: `url(${board.imageFullUrl})` }}
    >
       {/* why data and data2: data2 is right data */}
      <BoardNavbar data={board} data2={safeData}  useremail ={user?.email || ""} 
                             userNames={userNames}  userImages={userImages} boardViewCreatedAt={boardViewCreatedAt}/>
     <div 
        className="absolute inset-0 bg-black/10"
      
      />
        <main className="relative h-full pt-1">
          {children}
        </main>
      </div>
  );
};

export default BoardIdLayout;
