'use client'; 
import React, { useState } from 'react';
import { Wrench, Factory, Truck, HardHat, Brain, ChevronDown, ChevronUp } from 'lucide-react'; 

// --- Interface Definition ---
interface ServiceItem {
    name: string;
    description: string; // Now contains the raw HTML string
    icon: React.ElementType; 
}

// --- Data Definition (NOW CONTAINS RAW HTML STRINGS) ---
const services: ServiceItem[] = [
    { 
        name: "Asset Maintenance & Optimization (MRO)", 
        // HTML tags and <strong> used directly
        description: `<p>We provide <strong>full-scope Maintenance, Repair, and Overhaul (MRO) services</strong>, designed to transition your operations from reactive to <strong>predictive</strong>. Our core function is to maximize asset uptime and operational efficiency.</p>
            <p>We achieve this through:</p>
            <ul class="list-disc space-y-2 ml-6 my-4">
                <li><strong>Predictive Analysis & Diagnostics:</strong> State-of-the-art techniques for early fault detection.</li>
                <li><strong>Integrated Engineering:</strong> Covering Custom Design, Precision Manufacturing, Fabrication, and Expert Engineering Consultancy.</li>
                <li><strong>Support:</strong> Reliable parts sales and structured <strong>long-term maintenance contracts</strong>.</li>
            </ul>
            <p>We also offer a dedicated fleet of <strong>assets for hire</strong> at competitive commercial terms.</p>`, 
        icon: Wrench 
    },
    { 
        name: "Logistics & Supply Chain Solutions", 
        description: `<p>We deliver <strong>seamless global logistics</strong>, integrating all steps from source to consumption with full transparency. Our comprehensive offerings eliminate supply chain complexity.</p>
            <p>Key solutions include:</p>
            <ul class="list-disc space-y-2 ml-6 my-4">
                <li><strong>Global Freight Management:</strong> Efficient customs clearance and global transport with real-time tracking.</li>
                <li><strong>Genuine Materials Sourcing:</strong> Sales and trading of authentic, high-quality materials.</li>
                <li><strong>Infrastructure:</strong> Flexible warehousing, rigorous contract management, and a dedicated network of <strong>Modern Distribution Centers</strong>.</li>
            </ul>
            <p>This approach ensures fully efficient and transparent supply chains.</p>`, 
        icon: Truck 
    },
    { 
        name: "Infrastructure Development & Mining", 
        description: `<p>We deliver sustainable infrastructure and resource development through an integrated model that drives urban and rural progress.</p>
            <p>Core operational areas:</p>
            <ul class="list-disc space-y-2 ml-6 my-4">
                <li><strong>Major Infrastructure Projects:</strong> Rail/Road (BOT models) and Real Estate development.</li>
                <li><strong>Mining & Resources:</strong> Responsible mining exploration.</li>
                <li><strong>Power Strategy:</strong> Utilizing clean sources (solar/hydro) and stable generation (gas/oil). Future strategy incorporates <strong>nuclear power and emerging energy research</strong> (EV infrastructure).</li>
            </ul>`, 
        icon: HardHat 
    },
    { 
        name: "Smart Systems & Data Analytics", 
        description: `<p>We <strong>harness the power of data</strong> to optimize every operation by implementing cutting-edge <strong>Intelligent Systems</strong> tailored for industrial efficiency.</p>
            <p>Our service offers a <strong>full data lifecycle management solution</strong>:</p>
            <ul class="list-disc space-y-2 ml-6 my-4">
                <li><strong>Enterprise Data Collection & Cleaning:</strong> We collect raw data from all sources and rigorously <strong>clean and validate</strong> it, ensuring a single source of truth.</li>
                <li><strong>Custom Data Layer & Integration:</strong> We build a <strong>customized data layer</strong> specific to your industrial needs, integrating disparate data streams to create a unified foundation for all analytics.</li>
                <li><strong>Informed Business Intelligence (BI):</strong> We transform integrated data into <strong>actionable intelligence</strong>, providing robust reporting and visualization that drives informed decision-making.</li>
            </ul>
            <p>Our technology stack includes:</p>
            <ul class="list-disc space-y-2 ml-6 my-4">
                <li><strong>Core Systems:</strong> AI, IoT, Computer Vision, Drone Technology, and PLCs.</li>
                <li><strong>Predictive Solutions:</strong> AI-driven Predictive Maintenance for minimized downtime.</li>
                <li><strong>Software:</strong> Comprehensive Software Solutions (ERP, SaaS, APIs, Cloud Services) and robust <strong>Business Intelligence</strong> reporting.</li>
            </ul>`, 
        icon: Brain 
    },
    { 
        name: "Manufacturing & Agribusiness", 
        description: `<p>We specialize in <strong>General Manufacturing</strong> (industrial products) and <strong>high-yield Agribusiness</strong>.</p>
            <p>Our scope covers:</p>
            <ul class="list-disc space-y-2 ml-6 my-4">
                <li><strong>Agribusiness:</strong> Advanced food processing, intensive farming, controlled-environment agriculture (greenhouses), and efficient livestock management (feedlots).</li>
                <li><strong>Industrial Production:</strong> General manufacturing of essential industrial products.</li>
                <li><strong>Service Model:</strong> Pioneering the <strong>Integrated Service Center Model</strong> combining commercial service points with regional agricultural distribution.</li>
            </ul>`, 
        icon: Factory 
    },
];

// --- Utility Function to Render Raw HTML (Simplified) ---

/**
 * Renders raw HTML strings using dangerouslySetInnerHTML, eliminating the need 
 * for complex string parsing logic.
 */
const RenderRawHTML: React.FC<{ html: string }> = ({ html }) => {
    return (
        <div 
            // ⚠️ Using dangerouslySetInnerHTML is required to render the HTML tags from the string.
            dangerouslySetInnerHTML={{ __html: html }} 
            className="text-base text-gray-700 space-y-4"
        />
    );
};


// --- Main Component (Converted to Accordion/Expandable Rows) ---
const Services: React.FC = () => {
    const [openServiceName, setOpenServiceName] = useState<string | null>(null);

    const toggleService = (name: string) => {
        setOpenServiceName(name === openServiceName ? null : name);
    };

    return (
        <div className="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8" id="our-services">
            <div className="max-w-4xl mx-auto">
                <h3 className="text-3xl font-extrabold text-blue-800 text-center mb-12 uppercase tracking-wider">
                    Our Service Offerings
                </h3>
                
                <div className="flex flex-col space-y-4 mx-auto">
                    {services.map((service) => {
                        const isOpen = service.name === openServiceName;
                        
                        return (
                            <div 
                                key={service.name} 
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
                                        {/* Icon Container */}
                                        <div className={`flex-shrink-0 mr-4 p-3 rounded-full transition duration-300 
                                                        ${isOpen ? 'bg-blue-600' : 'bg-blue-100'}`}>
                                            <service.icon className={`w-6 h-6 transition duration-300 
                                                                    ${isOpen ? 'text-white' : 'text-blue-800'}`} />
                                        </div>
                                        
                                        {/* Title */}
                                        <h4 className="text-xl font-bold text-gray-900">{service.name}</h4>
                                    </div>
                                    
                                    {/* Chevron Icon (Rotation for visual feedback) */}
                                    {isOpen ? (
                                        <ChevronUp className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-6 h-6 text-gray-400 hover:text-blue-600 flex-shrink-0" />
                                    )}
                                </button>

                                {/* Content: Collapsible Area */}
                                <div
                                    id={`content-${service.name.replace(/\s/g, '-')}`}
                                    // Using max-h-fit for better content fit
                                    className={`transition-all duration-500 ease-in-out ${
                                        isOpen ? 'max-h-fit opacity-100 py-4' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="px-6 pt-2 pb-6">
                                        {/* ⚠️ Renders the raw HTML structure */}
                                        <RenderRawHTML html={service.description} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Services; 

// import React, { useState } from 'react';
// import { Wrench, Factory, Truck, HardHat, Brain, ChevronDown, ChevronUp } from 'lucide-react'; 

// // --- Interface Definition ---
// interface ServiceItem {
//     name: string;
//     description: string; // Now contains the raw HTML string
//     icon: React.ElementType; 
// }

// // --- Data Definition (NOW CONTAINS RAW HTML STRINGS) ---
// const services: ServiceItem[] = [
//     { 
//         name: "Asset Maintenance & Optimization (MRO)", 
//         // HTML tags and <strong> used directly
//         description: `<p>We provide <strong>full-scope Maintenance, Repair, and Overhaul (MRO) services</strong>, designed to transition your operations from reactive to <strong>predictive</strong>. Our core function is to maximize asset uptime and operational efficiency.</p>
//             <p>We achieve this through:</p>
//             <ul class="list-disc space-y-2 ml-6 my-4">
//                 <li><strong>Predictive Analysis & Diagnostics:</strong> State-of-the-art techniques for early fault detection.</li>
//                 <li><strong>Integrated Engineering:</strong> Covering Custom Design, Precision Manufacturing, Fabrication, and Expert Engineering Consultancy.</li>
//                 <li><strong>Support:</strong> Reliable parts sales and structured <strong>long-term maintenance contracts</strong>.</li>
//             </ul>
//             <p>We also offer a dedicated fleet of <strong>assets for hire</strong> at competitive commercial terms.</p>`, 
//         icon: Wrench 
//     },
//     { 
//         name: "Logistics & Supply Chain Solutions", 
//         description: `<p>We deliver <strong>seamless global logistics</strong>, integrating all steps from source to consumption with full transparency. Our comprehensive offerings eliminate supply chain complexity.</p>
//             <p>Key solutions include:</p>
//             <ul class="list-disc space-y-2 ml-6 my-4">
//                 <li><strong>Global Freight Management:</strong> Efficient customs clearance and global transport with real-time tracking.</li>
//                 <li><strong>Genuine Materials Sourcing:</strong> Sales and trading of authentic, high-quality materials.</li>
//                 <li><strong>Infrastructure:</strong> Flexible warehousing, rigorous contract management, and a dedicated network of <strong>Modern Distribution Centers</strong>.</li>
//             </ul>
//             <p>This approach ensures fully efficient and transparent supply chains.</p>`, 
//         icon: Truck 
//     },
//     { 
//         name: "Infrastructure Development & Mining", 
//         description: `<p>We deliver sustainable infrastructure and resource development through an integrated model that drives urban and rural progress.</p>
//             <p>Core operational areas:</p>
//             <ul class="list-disc space-y-2 ml-6 my-4">
//                 <li><strong>Major Infrastructure Projects:</strong> Rail/Road (BOT models) and Real Estate development.</li>
//                 <li><strong>Mining & Resources:</strong> Responsible mining exploration.</li>
//                 <li><strong>Power Strategy:</strong> Utilizing clean sources (solar/hydro) and stable generation (gas/oil). Future strategy incorporates <strong>nuclear power and emerging energy research</strong> (EV infrastructure).</li>
//             </ul>`, 
//         icon: HardHat 
//     },
//     { 
//         name: "Smart Systems & Data Analytics", 
//         description: `<p>We <strong>harness the power of data</strong> to optimize every operation by implementing cutting-edge <strong>Intelligent Systems</strong>.</p>
//             <p>Our technology stack includes:</p>
//             <ul class="list-disc space-y-2 ml-6 my-4">
//                 <li><strong>Core Systems:</strong> AI, IoT, Computer Vision, Drone Technology, and PLCs.</li>
//                 <li><strong>Predictive Solutions:</strong> AI-driven Predictive Maintenance for minimized downtime.</li>
//                 <li><strong>Software:</strong> Comprehensive Software Solutions (ERP, SaaS, APIs, Cloud Services) and robust <strong>Business Intelligence</strong> reporting.</li>
//             </ul>`, 
//         icon: Brain 
//     },
//     { 
//         name: "Manufacturing & Agribusiness", 
//         description: `<p>We specialize in <strong>General Manufacturing</strong> (industrial products) and <strong>high-yield Agribusiness</strong>.</p>
//             <p>Our scope covers:</p>
//             <ul class="list-disc space-y-2 ml-6 my-4">
//                 <li><strong>Agribusiness:</strong> Advanced food processing, intensive farming, controlled-environment agriculture (greenhouses), and efficient livestock management (feedlots).</li>
//                 <li><strong>Industrial Production:</strong> General manufacturing of essential industrial products.</li>
//                 <li><strong>Service Model:</strong> Pioneering the <strong>Integrated Service Center Model</strong> combining commercial service points with regional agricultural distribution.</li>
//             </ul>`, 
//         icon: Factory 
//     },
// ];

// // --- Utility Function to Render Raw HTML (Simplified) ---

// /**
//  * Renders raw HTML strings using dangerouslySetInnerHTML, eliminating the need 
//  * for complex string parsing logic.
//  * NOTE: Using dangerouslySetInnerHTML requires careful security review 
//  * if content were coming from an untrusted source.
//  */
// const RenderRawHTML: React.FC<{ html: string }> = ({ html }) => {
//     // Setting Tailwind classes for the <ul> directly in the data strings 
//     // ensures they are picked up, though for complex styling, a dedicated 
//     // parser or component library is usually preferred.
//     return (
//         <div 
//             // ⚠️ Using dangerouslySetInnerHTML is required to render the HTML tags from the string.
//             dangerouslySetInnerHTML={{ __html: html }} 
//             className="text-base text-gray-700 space-y-4"
//         />
//     );
// };


// // --- Main Component (Converted to Accordion/Expandable Rows) ---
// const Services: React.FC = () => {
//     const [openServiceName, setOpenServiceName] = useState<string | null>(null);

//     const toggleService = (name: string) => {
//         setOpenServiceName(name === openServiceName ? null : name);
//     };

//     return (
//         <div className="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8" id="our-services">
//             <div className="max-w-4xl mx-auto">
//                 <h3 className="text-3xl font-extrabold text-blue-800 text-center mb-12 uppercase tracking-wider">
//                     Our Service Offerings
//                 </h3>
                
//                 <div className="flex flex-col space-y-4 mx-auto">
//                     {services.map((service) => {
//                         const isOpen = service.name === openServiceName;
                        
//                         return (
//                             <div 
//                                 key={service.name} 
//                                 className="bg-white rounded-xl shadow-lg border border-gray-200 transition duration-300 overflow-hidden"
//                             >
//                                 {/* Header: Clickable Area */}
//                                 <button
//                                     onClick={() => toggleService(service.name)}
//                                     className={`w-full p-6 flex items-center justify-between text-left 
//                                             transition duration-300 ease-in-out border-b-2 
//                                             ${isOpen ? 'bg-blue-50 border-blue-600' : 'bg-white hover:bg-gray-50 border-transparent'}`}
//                                     aria-expanded={isOpen}
//                                     aria-controls={`content-${service.name.replace(/\s/g, '-')}`}
//                                 >
//                                     <div className="flex items-center">
//                                         {/* Icon Container */}
//                                         <div className={`flex-shrink-0 mr-4 p-3 rounded-full transition duration-300 
//                                                         ${isOpen ? 'bg-blue-600' : 'bg-blue-100'}`}>
//                                             <service.icon className={`w-6 h-6 transition duration-300 
//                                                                     ${isOpen ? 'text-white' : 'text-blue-800'}`} />
//                                         </div>
                                        
//                                         {/* Title */}
//                                         <h4 className="text-xl font-bold text-gray-900">{service.name}</h4>
//                                     </div>
                                    
//                                     {/* Chevron Icon (Rotation for visual feedback) */}
//                                     {isOpen ? (
//                                         <ChevronUp className="w-6 h-6 text-blue-600 flex-shrink-0" />
//                                     ) : (
//                                         <ChevronDown className="w-6 h-6 text-gray-400 hover:text-blue-600 flex-shrink-0" />
//                                     )}
//                                 </button>

//                                 {/* Content: Collapsible Area */}
//                                 <div
//                                     id={`content-${service.name.replace(/\s/g, '-')}`}
//                                     // Using max-h-fit for better content fit
//                                     className={`transition-all duration-500 ease-in-out ${
//                                         isOpen ? 'max-h-fit opacity-100 py-4' : 'max-h-0 opacity-0'
//                                     }`}
//                                 >
//                                     <div className="px-6 pt-2 pb-6">
//                                         {/* ⚠️ Renders the raw HTML structure */}
//                                         <RenderRawHTML html={service.description} />
//                                     </div>
//                                 </div>
//                             </div>
//                         );
//                     })}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Services;
// 'use client'; 
// import React, { useState } from 'react';
// import { Wrench, Factory, Truck, HardHat, Brain, ChevronDown, ChevronUp } from 'lucide-react'; 

// // --- Data Definition (Unchanged) ---
// interface ServiceItem {
//     name: string;
//     description: string;
//     icon: React.ElementType; // Icon component type from lucide-react
// }

// const services: ServiceItem[] = [
//     { 
//         name: "Asset Maintenance & Optimization (MRO)", 
//         description: "We provide full-scope Maintenance, Repair, and Overhaul (MRO) services. We maximize asset uptime and operational efficiency through state of art techniques that involved  predictive analysis and asset diagnostics. Our end-to-end capabilities encompass Engineering, Custom Design, Precision Manufacturing, Fabrication, Installation and Engineering Constultancy, supported by reliable parts sales and long-term maintenance contracts. We have a fleet of assets that we hire out at fair cost", 
//         icon: Wrench 
//     },
//     { 
//         name: "Logistics & Supply Chain Solutions", 
//         description: "We deliver seamless global logistics, integrating all steps from source to consumption. Our comprehensive offerings include the sales and trading of genuine materials, efficient customs clearance, and global freight management with real-time tracking. Furthermore, we provide flexible warehousing, rigorous contract management, and a dedicated network of Modern Distribution Centers for efficient and fully transparent supply chains.", 
//         icon: Truck 
//     },
//     { 
//         name: "Infrastructure Development & Mining", 
//         description: "We deliver sustainable infrastructure and resource development through an integrated model that drives urban and rural progress. Core operations involve major rail/road (BOT), real estate, and mining exploration. Our power strategy utilizes clean sources like solar/hydro and EV infrastructure, while incorporating reliable gas and oil generation. Future strategy includes nuclear power and emerging energy research.", 
//         icon: HardHat 
//     },
//     { 
//         name: "Smart Systems & Data Analytics", 
//         description: "We harness the power of data to optimize every operation by implementing cutting-edge Intelligent Systems (AI, IoT, Computer Vision, Drone Technology, PLCs, and Smart Equipment). Our suite of offerings features AI-driven Predictive Maintenance, comprehensive Software Solutions (ERP, SaaS, APIs, Cloud Services), and robust Business Intelligence.", 
//         icon: Brain 
//     },
//     { 
//         name: "Manufacturing & Agribusiness", 
//         description: "We specialize in General Manufacturing (including industrial products) and high-yield Agribusiness. Our scope covers advanced food processing, intensive farming, controlled-environment agriculture (greenhouses), and efficient livestock management (feedlots). Additionally, we pioneer the Integrated Service Center Model, which seamlessly combines commercial service points with regional agricultural distribution.", 
//         icon: Factory 
//     },
// ];

// // --- Main Component (Converted to Accordion/Expandable Rows) ---
// const Services: React.FC = () => {
//     // State to track the name of the currently open service (null if none are open)
//     const [openServiceName, setOpenServiceName] = useState<string | null>(null);

//     // Toggle function for the accordion logic
//     const toggleService = (name: string) => {
//         setOpenServiceName(name === openServiceName ? null : name);
//     };

//     return (
//         // Removed pt-20/-mt-20 padding from the top div, added it back to the section for standard container spacing
//         <div className="py-16" id="our-services">
//             <h3 className="text-3xl font-extrabold text-blue-800 text-center mb-12 uppercase tracking-wider">
//                 Our Service
//             </h3>
            
//             {/* CHANGE: Removed grid layout (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3) 
//               and replaced it with a simple vertical flex container with spacing (space-y-4)
//             */}
//             <div className="flex flex-col space-y-4  mx-auto">
//                 {services.map((service) => {
//                     const isOpen = service.name === openServiceName;
                    
//                     return (
//                         <div 
//                             key={service.name} 
//                             // Stronger default shadow, border on hover
//                             className="bg-white rounded-xl shadow-lg border border-gray-200 transition duration-300 overflow-hidden"
//                         >
//                             {/* Header: Clickable Area */}
//                             <button
//                                 onClick={() => toggleService(service.name)}
//                                 className={`w-full p-6 flex items-center justify-between text-left 
//                                             transition duration-300 ease-in-out border-b-2 
//                                             ${isOpen ? 'bg-blue-50 border-blue-600' : 'bg-white hover:bg-gray-50 border-transparent'}`}
//                                 aria-expanded={isOpen}
//                                 aria-controls={`content-${service.name.replace(/\s/g, '-')}`}
//                             >
//                                 <div className="flex items-center">
//                                     {/* Icon Container (consistent styling) */}
//                                     <div className={`flex-shrink-0 mr-4 p-3 rounded-full transition duration-300 
//                                                     ${isOpen ? 'bg-blue-600' : 'bg-blue-100'}`}>
//                                         <service.icon className={`w-6 h-6 transition duration-300 
//                                                                   ${isOpen ? 'text-white' : 'text-blue-800'}`} />
//                                     </div>
                                    
//                                     {/* Title */}
//                                     <h4 className={`text-xl font-bold transition duration-300 
//                                                     ${isOpen ? 'text-blue-800' : 'text-gray-900'}`}>{service.name}</h4>
//                                 </div>
                                
//                                 {/* Chevron Icon (Rotation for visual feedback) */}
//                                 {isOpen ? (
//                                     <ChevronUp className="w-6 h-6 text-blue-600 flex-shrink-0" />
//                                 ) : (
//                                     <ChevronDown className="w-6 h-6 text-gray-400 hover:text-blue-600 flex-shrink-0" />
//                                 )}
//                             </button>

//                             {/* Content: Collapsible Area */}
//                             {/* Using a separate div for Tailwind's max-h transition for smooth expansion */}
//                             <div
//                                 id={`content-${service.name.replace(/\s/g, '-')}`}
//                                 className={`transition-all duration-500 ease-in-out ${
//                                     isOpen ? 'max-h-96 opacity-100 py-4' : 'max-h-0 opacity-0'
//                                 }`}
//                             >
//                                 <p className="text-base text-gray-700 px-6 pt-2 pb-6">
//                                     {service.description}
//                                 </p>
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>
            
//             {/* Note: The max-h-96 class is an estimate. For production code, consider a Headless UI component 
//                      like Disclosure (from `@headlessui/react`) for fully dynamic height transitions. */}
//         </div>
//     );
// };

// export default Services;
