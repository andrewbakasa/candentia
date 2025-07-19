
import EmptyState from "../../app/components/EmptyState";
import ClientOnly from "../../app/components/ClientOnly";

import getCurrentUser from "../../app/actions/getCurrentUser";
import ProjectsClient from "./JobsClient";
import getMyJobApplications from "../actions/getMyJobApplications";


const ProjectsPage = async () => {
  const currentUser = await getCurrentUser();
  let jobsapp:any
   jobsapp = await getMyJobApplications();
   //console.log('From DB',jobs)

  
  return (
    <ClientOnly>
      <ProjectsClient
        jobApplications={jobsapp}
        currentUser={currentUser}
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;


