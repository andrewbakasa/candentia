
import EmptyState from "../components/EmptyState";
import ClientOnly from "../components/ClientOnly";

import getCurrentUser from "../actions/getCurrentUser";
import getArchivedLists from "../actions/getArchivedLists";
import ListsClient from "./ListsClient";


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


  const lists = await getArchivedLists();
 

  if (lists.length === 0) {
    return (
      <ClientOnly>
        <EmptyState
          title="No archived lists found"
          subtitle="Looks like you havent any archived lists."
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <ListsClient
        lists={lists}
        currentUser={currentUser}
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;


