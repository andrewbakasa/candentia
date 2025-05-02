import React from 'react';
import Link from 'next/link';

interface PortfolioProps {} // Define props if needed, otherwise use an empty interface

const Portfolio: React.FC<PortfolioProps> = () => {
  return (
    <>
      <div className="my-4 py-4" id="portfolio">
        <h2 className="my-2 text-center text-3xl text-yellow-900 uppercase font-bold">
        Experience Candentia&apos;s Innovative Products That Shine
        </h2>
        <div className="flex justify-center">
          <div className="w-24 border-b-4 border-yellow-400 mb-8"></div>
        </div>

        <div className="px-4" data-aos="fade-down" data-aos-delay="600">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white transition-all ease-in-out duration-400 overflow-hidden text-gray-700 hover:scale-105 rounded-lg shadow-2xl p-3 min-h-max">
               <div className="m-2 text-justify text-sm flex-grow flex flex-col"> {/* Added flex-grow and flex-col here */}

                <h4 className="font-semibold my-4 text-lg md:text-2xl text-center mb-4 h-12">
                  Smart Equipment Maintenance
                </h4>
                <p className="text-md font-medium leading-5 h-auto md:h-auto flex-grow"> {/* Added flex-grow here */}
 
                Employing AI vision technology and drone data enables scalable and efficient rail equipment maintenance, 
                proactively addressing potential issues for cost-effectiveness. This approach captures engineering 
                operation data to predict failures and provide maintenance insights, facilitating effective management 
                of rail equipment and infrastructure for optimized operations and safety. Schedule a demo to see how 
                this drone-powered AI solution transforms rail equipment management
                </p>
                 <div className="flex justify-center"> {/* Removed my-4 from here */}


                  <Link
                    href="/media?search=smart equipment"
                    className="w-full inline-flex items-center px-6 py-3 bg-yellow-300 hover:bg-yellow-600 text-blue-700 rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  
                  >
                    Schedule Demo
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
            </div>

             <div className="bg-white transition-all ease-in-out duration-400 overflow-hidden text-gray-700 hover:scale-105 rounded-lg shadow-2xl p-3 min-h-max flex flex-col justify-between">
              <div className="m-2 text-justify text-sm flex-grow flex flex-col"> {/* Added flex-grow and flex-col here */}
                <h4 className="font-semibold my-4 text-lg md:text-2xl text-center mb-4 h-12">
                Interactive 3D Visualization
                </h4>
                <p className="text-md font-medium leading-5 h-auto md:h-auto flex-grow"> {/* Added flex-grow here */}
 
                  We provide a platform to create and visualize Planning, Engineering, and Projects as an interactive 
                  3D Bill of Quantities (BOQ) with integrated CAD models. By incorporating costing, financing, 
                  purchasing, and supplier management, we offer cutting-edge visualized views. This platform 
                  facilitates participation in the design process for all stakeholders, including non-engineers, 
                  potential investors, prototyping teams, process engineers, and manufacturing/maintenance personnel
                </p>
                 <div className="flex justify-center"> {/* Removed my-4 from here */}


                  <Link
                   href="/media?search=CAD"
                   className="w-full inline-flex items-center px-6 py-3 bg-yellow-300 hover:bg-yellow-600 text-blue-700 rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                   >
                    Schedule Demo
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
            </div>

             <div className="bg-white transition-all ease-in-out duration-400 overflow-hidden text-gray-700 hover:scale-105 rounded-lg shadow-2xl p-3 min-h-max flex flex-col justify-between">



               <div className="m-2 text-justify text-sm flex-grow flex flex-col"> {/* Added flex-grow and flex-col here */}

                <h4 className="font-semibold my-4 text-lg md:text-2xl text-center mb-4 h-12">
                Outsource Business Intelligence 
                </h4>
               <p className="text-md font-medium leading-5 h-auto md:h-auto flex-grow"> {/* Added flex-grow here */}
 
                Outsourcing smart employees can delegate tasks and provide technical and business insights for your business.
                Harness comprehensive data mining and scraping across all traditional sources (files, Word, Excel), emails, 
                social media, and general data sources to unlock organizational insights. Identify trends, understand 
                root causes, analyze failure modes, reduce costs, and discover better processes. Build APIs for 
                maintenance, planning, and operations based on these findings.
                </p>
                 <div className="flex justify-center"> {/* Removed my-4 from here */}


                  <Link
                    href="/media?search=business intelligence"
                    className="w-full inline-flex items-center px-6 py-3 bg-yellow-300 hover:bg-yellow-600 text-blue-700 rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                    Schedule Demo
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
            </div>

             <div className="bg-white transition-all ease-in-out duration-400 overflow-hidden text-gray-700 hover:scale-105 rounded-lg shadow-2xl p-3 min-h-max flex flex-col justify-between">



               <div className="m-2 text-justify text-sm flex-grow flex flex-col"> {/* Added flex-grow and flex-col here */}

                <h4 className="font-semibold my-4 text-lg md:text-2xl text-center mb-4 h-12">
                Strategic ERP with Business Simulation
                </h4>
               <p className="text-md font-medium leading-5 h-auto md:h-auto flex-grow"> {/* Added flex-grow here */}
 
                Our ERP software streamlines core business operations, including operations, maintenance, 
                planning, and finance, through customizable and efficient workflows. Leveraging a 
                cloud platform, it provides easy online access to Standard Operating Procedures 
                (SOPs) and a comprehensive catalog, enhancing knowledge sharing across diverse business needs.
                </p>
                 <div className="flex justify-center"> {/* Removed my-4 from here */}


                  <Link
                    href="/media?search=erp"
                    className="w-full inline-flex items-center px-6 py-3 bg-yellow-300 hover:bg-yellow-600 text-blue-700 rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                    Schedule Demo
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Portfolio;