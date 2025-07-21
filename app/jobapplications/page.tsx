
import EmptyState from "../../app/components/EmptyState";
import ClientOnly from "../../app/components/ClientOnly";

import getCurrentUser from "../../app/actions/getCurrentUser";
import ProjectsClient from "./JobsClient";
import getJobApplications from "../actions/getJobApplications";


const ProjectsPage = async () => {
  const currentUser = await getCurrentUser();
  let jobsapp:any
   jobsapp = await getJobApplications();
   //console.log('From DB',jobs)

  
  return (
    <ClientOnly>
      <ProjectsClient
        initialJobApplications={jobsapp}
        currentUser={currentUser}
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;


