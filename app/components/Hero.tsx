
import React from 'react';
import Image from 'next/image'; // Import the Image component
const heroImg = '/welcome-to-constructions.webp'

const Hero = () => {
  // Utility classes for full-width, full-height image cover:
  // w-full h-full object-cover ensures the image covers the entire div.
  // The outer div should manage the desired height of the banner.
  return (
    <>
      <div className="relative w-full h-[60vh] lg:h-[80vh] overflow-hidden" id="hero">
        <Image
          src={'/welcome-to-constructions.webp'} // Use your imported image path
          alt="Full-width hero banner representing collaboration and synergy"
          layout="fill" // Ensures the image fills the parent container
          objectFit="cover" // Crops the image to cover the container while maintaining aspect ratio
          quality={100} // Optional: Adjust image quality
          priority // Optional: Use priority for important above-the-fold images
        />
        {/* You can add an overlay or text here if needed, 
            e.g., <div className="absolute inset-0 bg-black opacity-30"></div> */}
      </div>
    </>
  );
};

export default Hero;
// import React from 'react';
// import Image from 'next/image'; // Import the Image component
// import heroImg from '/public/images/web-dev.svg';
// import Link from 'next/link';

// const Hero = () => {
//   return (
//     <>
//       <div className="hero" id='hero'>
//         <div className="m-auto overflow-hidden mx-4 mt-4 lg:mt-3 p-2 md:p-12 h-5/6" data-aos="zoom-in">
//           <div id='hero' className="flex flex-col lg:flex-row py-8 justify-between text-center lg:text-left">
//             <div className="lg:w-1/2 flex flex-col justify-center" data-aos="zoom-in" data-aos-delay="200">
//               <h2 className="mb-3 md:text-2xl text-3xl font-bold text-yellow-900">
//             Collaboration, Foresight, Transparency, Accountability
//               </h2>
//   <section className="mt-8">
              
//                 <ul className="list-none p-0">
//                   <li className="mb-4">
//                     <h3 className="text-lg font-semibold text-slate-800 mb-2">Synergy of Ideas</h3>
//                     <p className="text-sm text-slate-600">By bringing together diverse perspectives and specialized knowledge  leveraging our critical skills, technical insights, and practical experienc, we innovate more effectively, solve complex challenges, and identify opportunities that individuals might miss.</p>
//                   </li>
//                   <li className="mb-4">
//                     <h3 className="text-lg font-semibold text-slate-800 mb-2">Efficiency Through Teamwork</h3>
//                     <p className="text-sm text-slate-600">A unified team works more efficiently and achieves greater outcomes. Our collective strength and shared purpose are our ultimate competitive advantage.</p>
//                   </li>
                 
//                   <li className="mb-4">
//                     <h3 className="text-lg font-semibold text-slate-800 mb-2">Accelerated Growth & Impact</h3>
//                     <p className="text-sm text-slate-600">Collective effort and shared resources enable us to raise funds and start operations quickly, delivering tangible results and making a significant economic impact without unnecessary delay.</p>
//                   </li>
//                 </ul>
//               </section>

//                <div className="mb-2 space-x-0 md:space-x-2 md:mb-4">
//                 <Link href="/contact"
//                  className="bg-yellow-300 hover:bg-yellow-600 text-blue-700 inline-flex items-center justify-center w-full px-6 py-3 my-4 font-medium shadow-sm rounded-md sm:w-auto sm:mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
//                 >
//                   Learn more
//                   <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
//                 </Link>
//               </div>
//             </div>
//             <div className="flex lg:justify-end w-full lg:w-1/2" data-aos="fade-up" data-aos-delay="700">
//               <Image
//                 src={heroImg}
//                 alt="hero image"
//                 className="rounded-t float-right duration-1000 w-full"
//                 priority // Optional: Use priority for important above-the-fold images
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Hero;
