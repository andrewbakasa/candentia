import prisma from "@/app/libs/prismadb";
import EmptyState from "@/app/components/EmptyState";
import ClientOnly from "@/app/components/ClientOnly";
import { notFound } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { BoardData } from "./_components/board-data";

interface BoardIDPageProps {
  params: {
    boardId: string;
  };
};

const BoardIDPage = async ({
  params,
}: BoardIDPageProps) => {
 
   const currentUser = await getCurrentUser();

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
      
      const board = await prisma.board.findUnique({
        where: {
          id: params.boardId,
        },
      });
      if (!board) {
        notFound();
      }
    
        const safeData = {
          ...board,
        
          // createdAt: board.createdAt.toString(),
          // updatedAt: board.updatedAt.toString(),
          // emailVerified: board?.emailVerified?.toString()||null,
        };
      
      return (
        <div className="p-4 h-full overflow-x-auto">
         <BoardData data={safeData} currentUser={currentUser}/>
        </div>
      );

    }catch (err) {
      return {
        error: "Something went wrong!" 
      }
    };
};

export default BoardIDPage;
