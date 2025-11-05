
import EmptyState from "../../../app/components/EmptyState";
import ClientOnly from "../../../app/components/ClientOnly";
import getCurrentUser from "../../../app/actions/getCurrentUser";
import ProjectsClient from "./EnquiriesClient";
import getArchivedEnquiries from "../../actions/getArchivedEnquiries";
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
  let enquiries:any
  enquiries = await getArchivedEnquiries();
  return (
    <ClientOnly>
      <ProjectsClient
        records={enquiries}
        currentUser={currentUser}
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;


