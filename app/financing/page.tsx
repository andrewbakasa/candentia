
import ClientOnly from "../../app/components/ClientOnly";
import getCurrentUser from "../../app/actions/getCurrentUser"
import InvestorClients from "./InvestorClients";
import getInvestors from "../actions/getInvestors";
import getInvestmentPortfolios from "../actions/getInvestmentPortfilios";


const InvestorsPage = async () => {
  const currentUser = await getCurrentUser(); 
  const mockInvestors:any[] = await getInvestors();
  const mockPortfolios:any[] = await getInvestmentPortfolios();
  return (
    <ClientOnly>
      <InvestorClients 
        mockPortfolios= {mockPortfolios}
        mockInvestors= {mockInvestors}
        currentUser={currentUser}
      />
    </ClientOnly>
  );
}
 
export default InvestorsPage;


