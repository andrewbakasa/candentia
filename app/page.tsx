import Clients from "@/app/components/Clients";
import Cta from "@/app/components/Cta";
import Footer from "@/app/components/Footer";
import Hero from "@/app/components/Hero";
import Intro from "@/app/components/Intro";
import Portfolio from "@/app/components/Portfolio";
import Services from "@/app/components/Services";
import Career from "./components/Career";
import getJobOpenings from "./actions/getJobOpenings"; // Keep the import
import Investments from "./components/Investments";
import { saveseedPortfolios } from "./financing/data/saveInvestmentPortfolios";
//import { saveInitialJobs } from "./job/[jobId]/_components/initialDB";

const Home = async () => {

  const jobs = await getJobOpenings();
  //saveInitialJobs()
 //saveseedPortfolios()
  return (
    <>
      <Hero />
      <Intro />
      <Services />
      <Portfolio />
      <Career jobOpenings={jobs}/>
      <Investments />
      <Clients />
      <Cta />
      <Footer />
    </>
  );
};

export default Home;
