
import EmptyState from "../components/EmptyState";
import ClientOnly from "../components/ClientOnly";

import getCurrentUser from "../actions/getCurrentUser";
import VisitMetricsDisplay from "./MetricsClient";


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

  return (
    <ClientOnly>
      <VisitMetricsDisplay
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;
