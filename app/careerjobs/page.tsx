
import EmptyState from "../../app/components/EmptyState";
import ClientOnly from "../../app/components/ClientOnly";

import getCurrentUser from "../../app/actions/getCurrentUser";
import ProjectsClient from "./JobsClient";
import getMyBoards from "../actions/getMyBoards";
import getTagNames from "../actions/getTagNames";
import getUserNames from "../actions/getUserNames";
import getJobOpenings from "../actions/getJobOpenings";


const ProjectsPage = async () => {
  const currentUser = await getCurrentUser();
  let jobs:any
   jobs = await getJobOpenings();
   //console.log('From DB',jobs)

  
  return (
    <ClientOnly>
      <ProjectsClient
        jobs={jobs}
        currentUser={currentUser}
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;


