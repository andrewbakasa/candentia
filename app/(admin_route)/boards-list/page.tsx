import getCurrentUser from "@/app/actions/getCurrentUser";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import BoardsClient from "./BoardsClient";
import getBoardsTopLevel from "@/app/actions/getBoards-topLevel";



const ProjectsPage = async () => {  
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

 
  const boards = await getBoardsTopLevel();
  return (
    <ClientOnly>
      <BoardsClient
        boards={boards}
        currentUser={currentUser}
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;


