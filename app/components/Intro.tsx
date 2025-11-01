import React from 'react';
import Services from './Services'; 
import TeamSection from './TeamSection';
import FutureOutlookSection from './FutureOutlookSection';
import VisionSection from './VisionSection';
import ScrollProgressIndicator from './ScrollProgressIndicator';
import WhyPartnerWithUs from './WhyPartnerWithUs';

interface IntroProps {}

const Intro: React.FC<IntroProps> = () => {
  // Define Key Values, Mission, Vision, and About for Horizon21
  const keyValues = 'Trust, Collaboration, Ethical Conduct, Value Creation, Sustainable Development';
  const mission = 'Our core mission is to integrate expert engineering, business, and technology to drive operational excellence, fostering sustainable growth and positive societal impact.';
  const vision = 'To be the premier diversified investment and operational vehicle in the SADC, recognized for driving sustainable regional development through technical excellence, rigorous governance, and rapid collective value creation that generates positive lasting impact for all stockholders.';
  const about = 'Horizon21 is a premier firm providing seamless, end to end industrial and technological solutions across the country, the SADC region, and the world. We engineer solutions to improve quality of life while simultaneously enhancing the performance and longevity of critical assets across key sectors: mining, manufacturing, logistics, engineering, construction, power generation, and agro industry. We empower clients to create value, reduce costs, minimize downtime, and achieve sustainable, standards compliant growth.';

  return (
    <>
      {/* 1. SCROLL PROGRESS BAR: Place this at the very top */}
      <ScrollProgressIndicator /> 

      {/* Outer Container: Max width centered, padded, and responsive spacing */}
      <div className="mx-auto max-w-7xl p-1 md:p-4" id="intro-content">        
        {/* Vision section */}      
        <VisionSection /> 
        {/* 2. SERVICES COMPONENT (Imported) */}
        <Services />
        {/* 3. TEAM SECTION COMPONENT (Imported) */}
        <TeamSection />
        <FutureOutlookSection />        
        <WhyPartnerWithUs/>
      </div>
    </>
  );
};

export default Intro;