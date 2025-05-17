
import EmptyState from "../../app/components/EmptyState";
import ClientOnly from "../../app/components/ClientOnly";
import getCurrentUser from "../../app/actions/getCurrentUser"
import CareerClient from "./InputJobsClient";
import getJobs from "../actions/getJobs";


const EditJobsPortfolioPage = async () => {
  const currentUser = await getCurrentUser();
  const jobs:any[] = await getJobs()
  

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
      <CareerClient mockCareers={jobs}
      />
    </ClientOnly>
  );
}
 
export default EditJobsPortfolioPage;

