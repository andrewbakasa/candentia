
import EmptyState from "../../app/components/EmptyState";
import ClientOnly from "../../app/components/ClientOnly";

import getCurrentUser from "../../app/actions/getCurrentUser";
import ProjectsClient from "./ProjectsClient";
import getMyBoards from "../actions/getMyBoards";
import getTagNames from "../actions/getTagNames";
import getUserNames from "../actions/getUserNames";


const ProjectsPage = async () => {
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
  let boards:any
   boards = await getMyBoards();
   //console.log('From DB',boards)

  
  return (
    <ClientOnly>
      <ProjectsClient
        boards={boards}
        currentUser={currentUser}
        origin= 'myprojects'
        tagNames ={tagNames}
        userNames ={userNames}
      
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;


