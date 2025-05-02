
import EmptyState from "../../app/components/EmptyState";
import ClientOnly from "../../app/components/ClientOnly";

import getCurrentUser from "../../app/actions/getCurrentUser";
import ProjectsClient from "./EnquiriesClient";
import getTagNames from "../actions/getTagNames";
import getUserNames from "../actions/getUserNames";
import getEnquiries from "../actions/getEnquiries";
import getProductEnquiries from "../actions/getProductEnquiries";


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
  let enquiries:any
  enquiries = await getProductEnquiries();
   //console.log('From DB',jobs)

  
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


