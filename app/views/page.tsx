
import EmptyState from "../components/EmptyState";
import ClientOnly from "../components/ClientOnly";

import getCurrentUser from "../actions/getCurrentUser";
import UsersClient from "./ViewsClients";
import getUsers from "../actions/getUsers";
import ViewsClients from "./ViewsClients";


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

 
  const users = await getUsers();
  return (
    <ClientOnly>
      <ViewsClients
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;


