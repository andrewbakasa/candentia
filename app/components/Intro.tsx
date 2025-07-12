import React from 'react';
import Image from 'next/image';
import img from '/public/images/Web-developer.svg';
import Link from 'next/link';

interface IntroProps {}

const Intro: React.FC<IntroProps> = () => {
  return (
    <>
      <div className="m-auto max-w-6xl p-4 md:p-12 h-5/6" id="about">
        <div className="flex flex-col lg:flex-row py-4 justify-between lg:text-left" data-aos="fade-up">
          <div
            className="flex-col text-center lg:text-left lg:justify-center w-full lg:w-1/2 lg:px-8"
            data-aos="zoom-in"
            data-aos-delay="500"
          >
            <h2 className="mb-6 text-4xl font-bold text-slate-900">
              Joining Our Collective Offers Unique Advantages
            </h2>
            <ul className="space-y-6 list-none p-0">
              <li>
                <h3 className="text-2xl font-semibold text-slate-700">Accelerated Wealth Creation</h3>
                <p className="text-lg text-slate-600 mt-2">
                  Our strategic investment model, combined with the collective’s ability to quickly raise funds and capitalize on high-potential ventures, is designed to generate substantial and sustainable wealth for all members.
                </p>
              </li>
              <li>
                <h3 className="text-2xl font-semibold text-slate-700">Entrepreneurial Opportunity & Leadership</h3>
                <p className="text-lg text-slate-600 mt-2">
                  Members will have the unique opportunity to independently lead and grow companies that are strategically supported by the parent group, benefiting from initial investment and ongoing guidance.
                </p>
              </li>
              <li>
                <h3 className="text-2xl font-semibold text-slate-700">Professional Growth & Skill Diversification</h3>
                <p className="text-lg text-slate-600 mt-2">
                  By working across diverse sectors and engaging with cutting-edge technologies like AI and drone systems, members will continuously expand their professional skills, knowledge, and experience.
                </p>
              </li>
              <li>
                <h3 className="text-2xl font-semibold text-slate-700">Powerful Networking & Collaboration</h3>
                <p className="text-lg text-slate-600 mt-2">
                  The group fosters a strong collaborative environment, connecting members with a network of highly skilled engineers, industry leaders, and strategic stakeholders, opening doors to new ideas and opportunities.
                </p>
              </li>
              <li>
                <h3 className="text-2xl font-semibold text-slate-700">Direct Impact on National Development</h3>
                <p className="text-lg text-slate-600 mt-2">
                  Members will play a direct and tangible role in the industrial and technological advancement of Zimbabwe, contributing to the nation’s prosperity and achieving a shared vision of elevating the country.
                </p>
              </li>
              <li>
                <h3 className="text-2xl font-semibold text-slate-700">Special Privileges for Founding Members</h3>
                <p className="text-lg text-slate-600 mt-2">
                  Those who commit early will receive special rights, recognizing their foundational contribution to the group’s establishment and initial success.
                </p>
              </li>
            </ul>
            <div className="mt-8">
              <Link
                href="/contact"
                className="bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 my-2 font-medium rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Contact us
                <svg
                  className="w-4 h-4 ml-1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 flex flex-col justify-center mt-8 lg:mt-0">
            <Image alt="card img" className="rounded-lg shadow-lg" src={img} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Intro;
// import React from 'react';
// import Image from 'next/image';
// import img from '/public/images/Web-developer.svg';
// import Link from 'next/link';

// interface IntroProps {} // Define props if needed, otherwise use an empty interface

// const Intro: React.FC<IntroProps> = () => {
//   return (
//     <>
//       <div className="m-auto max-w-6xl p-2 md:p-12 h-5/6" id="about">
//         <div className="flex flex-col-reverse lg:flex-row py-4 justify-between lg:text-left" data-aos="fade-up">
//           <div className="lg:w-1/2 flex flex-col lg:mx-4 justify-center">
//             <Image alt="card img" className="rounded-t float-right" src={img} />
//           </div>
//           <div
//             className="flex-col my-2 text-center lg:text-left lg:my-0 lg:justify-end w-full lg:w-1/2 px-8"
//             data-aos="zoom-in"
//             data-aos-delay="500"
//           >
//             <h3 className="text-3xl text-yellow-900 font-bold">
            
//             Joining this collective offers a unique and powerful set of advantages for every member:
        
//             </h3>
//             <div>
             
//             </div>
//             <div>
//               <p className="my-3 text-xl text-gray-600 font-semibold">
//              Accelerated Wealth Creation: Our strategic investment model, combined with the collective&apos;s ability to quickly raise funds and capitalize on high-potential ventures, is designed to generate substantial and sustainable wealth for all members.
//                 </p>
//                <p className="my-3 text-xl text-gray-600 font-semibold">
//             Entrepreneurial Opportunity & Leadership: Members will have the unique opportunity to independently lead and grow companies that are strategically supported by the parent group, benefiting from initial investment and ongoing guidance.
//                </p>    

//            <p className="my-3 text-xl text-gray-600 font-semibold">
//              Professional Growth & Skill Diversification: By working across diverse sectors and engaging with cutting-edge technologies like AI and drone systems, members will continuously expand their professional skills, knowledge, and experience.
//           </p>
          
//            <p className="my-3 text-xl text-gray-600 font-semibold">
//             Powerful Networking & Collaboration: The group fosters a strong collaborative environment, connecting members with a network of highly skilled engineers, industry leaders, and strategic stakeholders, opening doors to new ideas and opportunities.
//           </p>
//             <p className="my-3 text-xl text-gray-600 font-semibold">
//              Direct Impact on National Development: Members will play a direct and tangible role in the industrial and technological advancement of Zimbabwe, contributing to the nation&apos;s prosperity and achieving a shared vision of elevating the country.
//           </p>
//            <p className="my-3 text-xl text-gray-600 font-semibold">
//             Special Privileges for Founding Members: Those who commit early will receive special rights, recognizing their foundational contribution to the group&apos;s establishment and initial success.
//           </p>
         
//             </div>
//             <Link
//               href="/contact"
//               //className="text-white bg-blue-900 hover:bg-blue-800 inline-flex items-center justify-center w-full px-6 py-2 my-4 text-lg shadow-xl rounded-2xl sm:w-auto sm:mb-0 group"
//               className="bg-yellow-300 hover:bg-yellow-600 text-blue-700 inline-flex items-center justify-center w-full px-6 py-3 my-4 font-medium shadow-sm rounded-md sm:w-auto sm:mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
         
//             >
//               Contact us
//               <svg
//                 className="w-4 h-4 ml-1 group-hover: translate-x-2"
//                 xmlns="http://www.w3.org/2000/svg"
//                 viewBox="0 0 20 20"
//                 fill="currentColor"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
//                   clipRule="evenodd"
//                 ></path>
//               </svg>
//             </Link>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Intro;