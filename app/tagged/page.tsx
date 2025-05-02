// /actions/getUserNames";
import getProjectsIamTagged from "../actions/getAllMyTaggs";
import getCurrentUser from "../actions/getCurrentUser";
import getTagNames from "../actions/getTagNames";
import getUserNames from "../actions/getUserNames";
import ClientOnly from "../components/ClientOnly";
import EmptyState from "../components/EmptyState";
import ProjectsClient from "../myprojects/ProjectsClient";


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
  boards=await getProjectsIamTagged();
  
  return (
    <ClientOnly>
      <ProjectsClient
        boards={boards}
        currentUser={currentUser}
        tagNames ={tagNames}
        origin ={'taggedprojects'}
        userNames={userNames}
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;