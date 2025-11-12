
import EmptyState from "../../app/components/EmptyState";
import ClientOnly from "../../app/components/ClientOnly";
import getCurrentUser from "../../app/actions/getCurrentUser"
import CareerClient from "./InputJobsClient";
import getJobsAdmin from "../actions/getJobsAdmin";


const EditJobsPortfolioPage = async () => {
  const currentUser = await getCurrentUser();
  const jobs:any[] = await getJobsAdmin()
  

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
      <CareerClient dbCareers={jobs} currentUser={currentUser}      />
    </ClientOnly>
  );
}
 
export default EditJobsPortfolioPage;

