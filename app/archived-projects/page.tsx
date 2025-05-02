
import EmptyState from "../components/EmptyState";
import ClientOnly from "../components/ClientOnly";

import getCurrentUser from "../actions/getCurrentUser";
import ProjectsClient from "./ProjectsClient";
import getArchivedBoards from "../actions/getArchivedBoards";
import getTagNames from "../actions/getTagNames";


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


  const boards = await getArchivedBoards();
  const tagNames =await getTagNames()
 

  if (boards.length === 0) {
    return (
      <ClientOnly>
        <EmptyState
          title="No archived projects found"
          subtitle="Looks like you havent any archived projects."
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <ProjectsClient
        boards={boards}
        // tagNames ={tagNames}
      
        currentUser={currentUser}
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;


