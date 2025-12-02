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
import getPortifolios from "./actions/getPortFolios";
import About from "./components/About";
import { migrateDefectTimestamps } from "./actions/updateCreatedAtUpdatedAt";

//import { saveInitialJobs } from "./job/[jobId]/_components/initialDB";
//import { saveseedPortfolios } from "./financing/data/saveInvestmentPortfolios";

const Home = async () => {
  
  // const jobs = await getJobOpenings();
  // const  portfolioItems = await getPortifolios();
const  defectTimestamps = await  migrateDefectTimestamps()
  console.log("defectTimestamps",defectTimestamps)
// Data for .Horizon21
const aboutData = {
  headingH1: "Horizon21: Excellence in ",
  span: "Innovation",
  subHeading: "Building the Future Today",
  para: "Horizon21 is a premier firm providing seamless, end-to-end industrial and technological solutions across the country, the SADC region, and the world. We engineer solutions to improve quality of life while simultaneously enhancing the performance and longevity of critical assets across key sectors: mining, manufacturing, logistics, engineering, construction, power generation, and agro industry.",
  para2: "Our core mission is to integrate expert engineering, business, and technology to drive operational excellence, fostering sustainable growth and positive societal impact.",
  para3: "Key Values: Trust, Collaboration, Ethical Conduct, Value Creation, Sustainable Development.",
  imgPosition: 'right',
  src: '/images/Web-developer.svg', // Placeholder from previous examples
  btnTitle: 'View Our Solutions',
  btnUrl: '/solutions',
};

  
  //saveInitialJobs()
  //saveseedPortfolios()
  return (
    <>
      {/* <Hero /> */}
      {/* <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-6">
        <section id="about-us" className="pt-16 pb-20">
        <About
              headingH1={"Horizon21: Excellence in "}
              span="Innovation"
              subHeading="Building the Future Today"
              para="Horizon21 is a premier firm providing seamless, end-to-end industrial and technological solutions across the country, the SADC region, and the world. We engineer solutions to improve quality of life while simultaneously enhancing the performance and longevity of critical assets across key sectors: mining, manufacturing, logistics, engineering, construction, power generation, and agro industry."
              para2="Our core mission is to integrate expert engineering, business, and technology to drive operational excellence, fostering sustainable growth and positive societal impact."
              para3="Key Values: Trust, Collaboration, Ethical Conduct, Value Creation, Sustainable Development."
              imgPosition='right'
        
              src={'/welcome-to-constructions.webp'} 
              btnTitle='View Our Solutions'
              btnUrl='/solutions'
            />
        </section>     
     </div> */}
      <Intro />
      {/* <Services /> */}
      {/* <Portfolio portfolioItems={portfolioItems}/>
      <Career jobOpenings={jobs}/>
      <Investments /> */}
      {/* <Clients /> */}
      <Cta />
      <Footer />
    </>
  );
};

export default Home;


