'use client'; 
import React, { useState } from 'react';
import { Wrench, Factory, Truck, HardHat, Brain, ChevronDown, ChevronUp } from 'lucide-react'; 

// --- Data Definition (Unchanged) ---
interface ServiceItem {
    name: string;
    description: string;
    icon: React.ElementType; // Icon component type from lucide-react
}

const services: ServiceItem[] = [
    { 
        name: "Asset Maintenance & Optimization (MRO)", 
        description: "We provide full-scope Maintenance, Repair, and Overhaul (MRO) services. By applying predictive analytics and asset diagnostics, we maximize uptime and operational efficiency. Our end-to-end capabilities encompass Engineering, Custom Design, Precision Manufacturing, Fabrication, and Installation, supported by reliable parts sales and long-term maintenance contracts.", 
        icon: Wrench 
    },
    { 
        name: "Logistics & Supply Chain Solutions", 
        description: "We deliver seamless global logistics, integrating steps from source to consumption. Our comprehensive offerings include the sales and trading of genuine materials, efficient customs clearance, and global freight management with real-time tracking. Furthermore, we provide flexible warehousing, rigorous contract management, and a dedicated network of Modern Distribution Centers for efficient and fully transparent supply chains.", 
        icon: Truck 
    },
    { 
        name: "Infrastructure Development & Mining", 
        description: "We deliver sustainable infrastructure and resource development through an integrated model that drives urban and rural progress. Core operations involve major rail/road (BOT), real estate, and mining exploration. Our power strategy utilizes clean sources like solar/hydro and EV infrastructure, while incorporating reliable gas and oil generation. Future strategy includes nuclear power and emerging energy research.", 
        icon: HardHat 
    },
    { 
        name: "Smart Systems & Data Analytics", 
        description: "We harness the power of data to optimize every operation by implementing cutting-edge Intelligent Systems (AI, IoT, Computer Vision, Drone Technology, PLCs, and Smart Equipment). Our suite of offerings features AI-driven Predictive Maintenance, comprehensive Software Solutions (ERP, SaaS, APIs, Cloud Services), and robust Business Intelligence.", 
        icon: Brain 
    },
    { 
        name: "Manufacturing & Agribusiness", 
        description: "We specialize in General Manufacturing (including industrial products) and high-yield Agribusiness. Our scope covers advanced food processing, intensive farming, controlled-environment agriculture (greenhouses), and efficient livestock management (feedlots). Additionally, we pioneer the Integrated Service Center Model, which seamlessly combines commercial service points with regional agricultural distribution.", 
        icon: Factory 
    },
];

// --- Main Component (Converted to Accordion/Expandable Rows) ---
const Services: React.FC = () => {
    // State to track the name of the currently open service (null if none are open)
    const [openServiceName, setOpenServiceName] = useState<string | null>(null);

    // Toggle function for the accordion logic
    const toggleService = (name: string) => {
        setOpenServiceName(name === openServiceName ? null : name);
    };

    return (
        // Removed pt-20/-mt-20 padding from the top div, added it back to the section for standard container spacing
        <div className="py-16" id="our-services">
            <h3 className="text-3xl font-extrabold text-blue-800 text-center mb-12 uppercase tracking-wider">
                Our Service
            </h3>
            
            {/* CHANGE: Removed grid layout (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3) 
              and replaced it with a simple vertical flex container with spacing (space-y-4)
            */}
            <div className="flex flex-col space-y-4  mx-auto">
                {services.map((service) => {
                    const isOpen = service.name === openServiceName;
                    
                    return (
                        <div 
                            key={service.name} 
                            // Stronger default shadow, border on hover
                            className="bg-white rounded-xl shadow-lg border border-gray-200 transition duration-300 overflow-hidden"
                        >
                            {/* Header: Clickable Area */}
                            <button
                                onClick={() => toggleService(service.name)}
                                className={`w-full p-6 flex items-center justify-between text-left 
                                            transition duration-300 ease-in-out border-b-2 
                                            ${isOpen ? 'bg-blue-50 border-blue-600' : 'bg-white hover:bg-gray-50 border-transparent'}`}
                                aria-expanded={isOpen}
                                aria-controls={`content-${service.name.replace(/\s/g, '-')}`}
                            >
                                <div className="flex items-center">
                                    {/* Icon Container (consistent styling) */}
                                    <div className={`flex-shrink-0 mr-4 p-3 rounded-full transition duration-300 
                                                    ${isOpen ? 'bg-blue-600' : 'bg-blue-100'}`}>
                                        <service.icon className={`w-6 h-6 transition duration-300 
                                                                  ${isOpen ? 'text-white' : 'text-blue-800'}`} />
                                    </div>
                                    
                                    {/* Title */}
                                    <h4 className={`text-xl font-bold transition duration-300 
                                                    ${isOpen ? 'text-blue-800' : 'text-gray-900'}`}>{service.name}</h4>
                                </div>
                                
                                {/* Chevron Icon (Rotation for visual feedback) */}
                                {isOpen ? (
                                    <ChevronUp className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-6 h-6 text-gray-400 hover:text-blue-600 flex-shrink-0" />
                                )}
                            </button>

                            {/* Content: Collapsible Area */}
                            {/* Using a separate div for Tailwind's max-h transition for smooth expansion */}
                            <div
                                id={`content-${service.name.replace(/\s/g, '-')}`}
                                className={`transition-all duration-500 ease-in-out ${
                                    isOpen ? 'max-h-96 opacity-100 py-4' : 'max-h-0 opacity-0'
                                }`}
                            >
                                <p className="text-base text-gray-700 px-6 pt-2 pb-6">
                                    {service.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Note: The max-h-96 class is an estimate. For production code, consider a Headless UI component 
                     like Disclosure (from `@headlessui/react`) for fully dynamic height transitions. */}
        </div>
    );
};

export default Services;
// import React from 'react';
// import { Wrench, Factory, Truck, HardHat, Brain } from 'lucide-react'; 

// // Define the structure for a service item
// interface ServiceItem {
//   name: string;
//   description: string;
//   icon: React.ElementType; // Icon component type from lucide-react
// }

// const services: ServiceItem[] = [
//   { 
//     name: "Asset Maintenance & Optimization (MRO)", 
//     description: "We provide full-scope Maintenance, Repair, and Overhaul (MRO) services. By applying predictive analytics and asset diagnostics, we maximize uptime and operational efficiency. Our end-to-end capabilities encompass Engineering, Custom Design, Precision Manufacturing, Fabrication, and Installation, supported by reliable parts sales and long-term maintenance contracts.", 
//     icon: Wrench 
//   },
//   { 
//     name: "Logistics & Supply Chain Solutions", 
//     description: "We deliver seamless global logistics, integrating steps from source to consumption. Our comprehensive offerings include the sales and trading of genuine materials, efficient customs clearance, and global freight management with real-time tracking. Furthermore, we provide flexible warehousing, rigorous contract management, and a dedicated network of Modern Distribution Centers for efficient and fully transparent supply chains.", 
//     icon: Truck 
//   },
//   { 
//     name: "Infrastructure Development & Mining", 
//     description: "We deliver sustainable infrastructure and resource development through an integrated model that drives urban and rural progress. Core operations involve major rail/road (BOT), real estate, and mining exploration. Our power strategy utilizes clean sources like solar/hydro and EV infrastructure, while incorporating reliable gas and oil generation. Future strategy includes nuclear power and emerging energy research.", 
//     icon: HardHat 
//   },
//   { 
//     name: "Smart Systems & Data Analytics", 
//     description: "We harness the power of data to optimize every operation by implementing cutting-edge Intelligent Systems (AI, IoT, Computer Vision, Drone Technology, PLCs, and Smart Equipment). Our suite of offerings features AI-driven Predictive Maintenance, comprehensive Software Solutions (ERP, SaaS, APIs, Cloud Services), and robust Business Intelligence.", 
//     icon: Brain 
//   },
//   { 
//     name: "Manufacturing & Agribusiness", 
//     description: "We specialize in General Manufacturing (including industrial products) and high-yield Agribusiness. Our scope covers advanced food processing, intensive farming, controlled-environment agriculture (greenhouses), and efficient livestock management (feedlots). Additionally, we pioneer the Integrated Service Center Model, which seamlessly combines commercial service points with regional agricultural distribution.", 
//     icon: Factory 
//   },
// ];

// const Services: React.FC = () => {
//   return (
//     // Updated ID to 'our-services' to match NavLinks.jsx
//     // Added pt-20 and -mt-20 to ensure correct scroll positioning below a sticky header
//     <div className="pt-20 -mt-20 border-t border-gray-200" id="our-services">
//       <h3 className="text-3xl font-extrabold text-blue-800 text-center mb-12 uppercase tracking-wider">
//         Illuminating Solutions Across Key Sectors
//       </h3>
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
//         {services.map((service) => (
//           <div 
//             key={service.name} 
//             className="flex flex-col items-start p-6 bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transition duration-500 border-t-4 border-blue-600 group hover:bg-blue-50"
//           >
//             {/* Icon Container */}
//             <div className="flex-shrink-0 mb-4 p-3 rounded-full bg-blue-100 group-hover:bg-yellow-600 transition duration-300">
//               <service.icon className="w-6 h-6 text-blue-800 group-hover:text-white" />
//             </div>
            
//             <h4 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h4>
//             <p className="text-base text-gray-600">{service.description}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Services;