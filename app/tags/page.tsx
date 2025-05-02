
import EmptyState from "../components/EmptyState";
import ClientOnly from "../components/ClientOnly";

import getCurrentUser from "../actions/getCurrentUser";
import UsersClient from "./TagsClient";
import getTags from "../actions/getTags";
import TagsClient from "./TagsClient";


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

 
  const tags = await getTags();
  return (
    <ClientOnly>
      <TagsClient
        tags={tags}
        currentUser={currentUser}
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;


