
import EmptyState from "../../app/components/EmptyState";
import ClientOnly from "../../app/components/ClientOnly";
import getCurrentUser from "../../app/actions/getCurrentUser"
import InputInvestmentClient from "./InputInvestmentsClient";
import getInvestmentPortfolios2 from "../actions/getInvestmentPortfilios2";
import PortfolioInvestmentClient from "./InputInvestmentsClient";


const EditInvestmentsPortfolioPage = async () => {
  const currentUser = await getCurrentUser();
  const mockPortfolios:any[] = await getInvestmentPortfolios2()
  

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
      <PortfolioInvestmentClient mockPortfolios={mockPortfolios}
      />
    </ClientOnly>
  );
}
 
export default EditInvestmentsPortfolioPage;

