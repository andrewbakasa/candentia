
import ClientOnly from "../../app/components/ClientOnly";
import getCurrentUser from "../../app/actions/getCurrentUser";
import getPortifolios from "../actions/getPortFolios";
import PortifolioClient from "./portifolioClient";


const ProjectsPage = async () => {
  const currentUser = await getCurrentUser();
  let portifolios:any
  portifolios = await getPortifolios();
   //console.log('From DB',jobs)

  
  return (
    <ClientOnly>
      <PortifolioClient
        portifolios={portifolios}
        currentUser={currentUser}
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;


