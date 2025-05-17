
import EmptyState from "../../app/components/EmptyState";
import ClientOnly from "../../app/components/ClientOnly";
import getCurrentUser from "../../app/actions/getCurrentUser"
import InputInvestmentClient from "./InputJobsClient";


const InvestmentsPortfolioPage = async () => {
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
      <InputInvestmentClient
      />
    </ClientOnly>
  );
}
 
export default InvestmentsPortfolioPage;

