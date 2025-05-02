import prisma from "@/app/libs/prismadb";
import getCurrentUser from "../../actions/getCurrentUser";
import EmptyState from "@/app/components/EmptyState";
import ClientOnly from "@/app/components/ClientOnly";
import { TagData } from "./_components/tagData";
import { notFound } from "next/navigation";

interface TagIdPageProps {
  params: {
    tagId: string;
  };
};

const TagIdPage = async ({
  params,
}: TagIdPageProps) => {
 
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
      
      const tag = await prisma.tag.findUnique({
        where: {
          id: params.tagId,
        },
      });
      if (!tag) {
        notFound();
      }
    
        const safeData = {
          ...tag,
          createdAt: tag.createdAt.toString(),
          updatedAt: tag.updatedAt.toString(),
        };
      
      return (
        <div className="p-4 h-full overflow-x-auto">
         <TagData data={safeData} currentUser={currentUser}/>
        </div>
      );

    }catch (err) {
      return {
        error: "Something went wrong!" 
      }
    };
};

export default TagIdPage;
