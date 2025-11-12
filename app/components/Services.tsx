'use client'; 
import React, { useState } from 'react';
import { Wrench, Factory, Truck, HardHat, Brain, ChevronDown, ChevronUp } from 'lucide-react'; 

// --- Interface Definition ---
interface ServiceItem {
    name: string;
    description: string; // Now contains the raw HTML string
    icon: React.ElementType; 
}

// --- Data Definition (NOW CONTAINS RAW HTML STRINGS WITH SPAN/TAILWIND CLASSES) ---
const services: ServiceItem[] = [
    // {
    //     name: "Asset Maintenance & Optimization (MRO)",
    //     description: `<p>We provide <span class="text-yellow-600 shadow-sm">full-scope Maintenance, Repair, and Overhaul (MRO) services</span>, designed to transition your operations from reactive to <span class="text-yellow-600 shadow-sm">predictive</span> while maximizing asset uptime and operational efficiency.</p>
    //         <p>We achieve this through integrated technical expertise and precise lifecycle management:</p>
    //         <ul class="list-disc space-y-2 ml-6 my-4">
    //             <li><span class="text-yellow-600 shadow-sm">Predictive Analysis & Diagnostics:</span> State-of-the-art techniques for early fault detection and condition monitoring.</li>
    //             <li><span class="text-yellow-600 shadow-sm">Integrated Engineering:</span> Covering Custom Design, Precision Manufacturing, Fabrication, and Expert Engineering Consultancy.</li>
    //             <li><span class="text-yellow-600 shadow-sm">Asset Lifecycle Management:</span> Implementing <span class="text-yellow-600 shadow-sm">Asset Tracking</span> for real-time status, location, and history, along with <span class="text-yellow-600 shadow-sm">BOQ Management, Planning, and Costing</span> for detailed project budget control.</li>
    //             <li><span class="text-yellow-600 shadow-sm">Support:</span> Reliable parts sales and structured <span class="text-yellow-600 shadow-sm">long-term maintenance contracts</span>.</li>
    //         </ul>
    //         <p>We also offer a dedicated fleet of <span class="text-yellow-600 shadow-sm">assets for hire</span> at competitive commercial terms.</p>`,
    //     icon: Wrench 
    // },
    {
        name: "Asset Maintenance & Predictive Performance",
        description: `<p>We provide <span class="text-yellow-600 shadow-sm">full-scope Maintenance, Repair, and Overhaul (MRO) services</span>, designed to transition your operations from reactive failure to <span class="text-yellow-600 shadow-sm">predictive performance</span> while maximizing asset uptime and operational efficiency.</p> 
        <p>We achieve this superior level of technical expertise through three integrated pillars:</p> 
        <h3>1. Advanced Technical Expertise & Visualization</h3> 
        <ul class="list-disc space-y-2 ml-6 my-4"> 
            <li><span class="text-yellow-600 shadow-sm">Integrated Engineering:</span> Custom Design, Precision Manufacturing, Fabrication, and Expert Consultancy.</li> 
            <li><span class="text-yellow-600 shadow-sm">Predictive Analysis & Diagnostics:</span> State-of-the-art techniques for early fault detection and condition monitoring.</li> 
            <li><span class="text-yellow-600 shadow-sm">3D Documentation & Training:</span> Creation of detailed <strong>3D machine models and dynamic animations</strong> (using SolidWorks and Blender) for <span class="text-yellow-600 shadow-sm">quick engineering understanding</span> of operations and maintenance procedures.</li> 
        </ul> 
        <h3>2. Precise Lifecycle Management</h3> 
        <ul class="list-disc space-y-2 ml-6 my-4"> 
            <li><span class="text-yellow-600 shadow-sm">Asset Tracking:</span> Real-time status, location, and history reporting for total asset visibility.</li> 
            <li><span class="text-yellow-600 shadow-sm">BOQ Management, Planning, and Costing:</span> Detailed project control for accurate budgeting and timeline management.</li> 
        </ul> 
        <h3>3. Comprehensive Support & Resources</h3> 
        <ul class="list-disc space-y-2 ml-6 my-4"> 
            <li><span class="text-yellow-600 shadow-sm">Contracts & Sales:</span> Reliable parts sales and structured <span class="text-yellow-600 shadow-sm">long-term maintenance contracts</span>.</li> 
        </ul> 
        <p>We also offer a dedicated fleet of <span class="text-yellow-600 shadow-sm">assets for hire</span> at competitive commercial terms.</p>`,
        icon: Wrench
    },
    { 
        name: "Logistics & Supply Chain Solutions", 
        description: `<p>We deliver <span class="text-yellow-600 shadow-sm">seamless global logistics</span>, integrating all steps from source to consumption with full transparency. Our comprehensive offerings eliminate supply chain complexity.</p>
            <p>Key solutions include:</p>
            <ul class="list-disc space-y-2 ml-6 my-4">
                <li><span class="text-yellow-600 shadow-sm">Global Freight Management:</span> Efficient customs clearance and global transport with real-time tracking.</li>
                <li><span class="text-yellow-600 shadow-sm">Genuine Materials Sourcing:</span> Sales and trading of authentic, high-quality materials.</li>
                <li><span class="text-yellow-600 shadow-sm">Infrastructure:</span> Flexible warehousing, rigorous contract management, and a dedicated network of <span class="text-yellow-600 shadow-sm">Modern Distribution Centers</span>.</li>
            </ul>
            <p>This approach ensures fully efficient and transparent supply chains.</p>`, 
        icon: Truck 
    },
    { 
        name: "Infrastructure Development & Mining", 
        description: `<p>We deliver sustainable infrastructure and resource development through an integrated model that drives urban and rural progress.</p>
            <p>Core operational areas:</p>
            <ul class="list-disc space-y-2 ml-6 my-4">
                <li><span class="text-yellow-600 shadow-sm">Major Infrastructure Projects:</span> Rail/Road (BOT models) and Real Estate development.</li>
                <li><span class="text-yellow-600 shadow-sm">Mining & Resources:</span> Responsible mining exploration.</li>
                <li><span class="text-yellow-600 shadow-sm">Power Strategy:</span> Utilizing clean sources (solar/hydro) and stable generation (gas/oil). Future strategy incorporates <span class="text-yellow-600 shadow-sm">nuclear power and emerging energy research</span> (EV infrastructure).</li>
            </ul>`, 
        icon: HardHat 
    },
    
    {
        name: "Smart Systems & Data Analytics",
        description: `<p>We <span class="text-yellow-600 shadow-sm">harness the power of data</span> to optimize every operation by implementing cutting-edge <span class="text-yellow-600 shadow-sm">Intelligent Systems</span> tailored for industrial efficiency and predictability.</p>
        <p>Our service offers a <span class="text-yellow-600 shadow-sm">full data lifecycle management solution</span>:</p>
        <ul class="list-disc space-y-2 ml-6 my-4">
            <li><span class="text-yellow-600 shadow-sm">Enterprise Data Collection & Cleaning:</span> We collect raw data from all sources and rigorously <span class="text-yellow-600 shadow-sm">clean and validate</span> it, ensuring a <span class="text-yellow-600 shadow-sm">Single Source of Truth</span>.</li>
            <li><span class="text-yellow-600 shadow-sm">Custom Data Layer & Integration:</span> We build a <span class="text-yellow-600 shadow-sm">customized data layer</span> specific to your industrial needs, integrating disparate data streams to create a unified foundation for all analytics.</li>
            <li><span class="text-yellow-600 shadow-sm">Informed Business Intelligence (BI):</span> We transform integrated data into <span class="text-yellow-600 shadow-sm">actionable intelligence</span>, providing robust reporting and visualization that drives informed decision-making.</li>
        </ul>
        <p>Our technology stack delivers dual value: predictive maintenance and proactive security, enhanced by new strategic software services:</p>
        <ul class="list-disc space-y-2 ml-6 my-4">
            <li><span class="text-yellow-600 shadow-sm">Core Systems:</span> AI, IoT, Computer Vision, Drone Technology, and PLCs.</li>
            <li><span class="text-yellow-600 shadow-sm">Predictive Solutions:</span> We provide <span class="text-yellow-600 shadow-sm">AI-driven Predictive Maintenance</span> for minimized downtime and maximized asset lifespan.</li>
            <li><span class="text-yellow-600 shadow-sm">Thermal Imaging Security & Loss Prevention:</span> We deploy an Intelligent Security System leveraging <span class="text-yellow-600 shadow-sm">Thermal-Imaging CCTV and Computer Vision</span> for 24/7 <span class="text-yellow-600 shadow-sm">autonomous monitoring</span> to directly <span class="text-yellow-600 shadow-sm">reduce the risk of theft and asset loss</span>.</li>
            <li><span class="text-yellow-600 shadow-sm">Strategic Software & API Services :</span> We offer comprehensive <span class="text-yellow-600 shadow-sm">Software Solutions</span> (ERP, SaaS, and Cloud Services). Crucially, we utilize our platform to <span class="text-yellow-600 shadow-sm">create various API services</span> for industry and commerce, including:
                <ul>
                    <li><span class="text-yellow-600 shadow-sm">Asset Tracking Software & API:</span> Provides real-time, digital management of assets for continuous visibility and optimized deployment.</li>
                    <li><span class="text-yellow-600 shadow-sm">BOQ & Cost Management Software & API:</span> Tools for <span class="text-yellow-600 shadow-sm">Bill of Quantities (BOQ) management, planning, and costing</span> to ensure granular project budget control.</li>
                    <li><span class="text-yellow-600 shadow-sm">Ecosystem Platform:</span> Links customers directly with service providers to efficiently <span class="text-yellow-600 shadow-sm">pool resources and manage risk</span>, removing intermediaries and reducing cost.</li>
                </ul>
            </li>
        </ul>`,
        icon: Brain
    },
    {
    name: "Integrated Manufacturing & Agribusiness",
    description: `<p>We specialize in <span class="text-yellow-600 shadow-sm">General Manufacturing</span> (industrial products) and <span class="text-yellow-600 shadow-sm">High-Yield Agribusiness</span>, operating as a single, vertically integrated unit.</p>
        <p>Our scope covers the full value chain:</p>
        <ul class="list-disc space-y-2 ml-6 my-4">
            <li><span class="text-yellow-600 shadow-sm">Agribusiness & Production:</span> Includes Advanced Food Processing, Intensive Farming, Controlled-Environment Agriculture (greenhouses), and Efficient Livestock Management (feedlots).</li>
            <li><span class="text-yellow-600 shadow-sm">Integrated Feed Manufacturing:</span> Large-scale, high-quality production of specialized, nutritional feeds for all key livestock, including <span class="text-yellow-600 shadow-sm">Cattle, Fish, Goats, and Chicken</span>.</li>
            <li><span class="text-yellow-600 shadow-sm">Industrial Production:</span> General manufacturing of essential industrial products.</li>
            <li><span class="text-yellow-600 shadow-sm">Service & Distribution Model:</span> Pioneering the <span class="text-yellow-600 shadow-sm">Integrated Service Center Model</span> combining commercial service points with regional agricultural distribution. This model is underpinned by a <span class="text-yellow-600 shadow-sm">National Distribution Center Network</span> established across the country for all product logistics.</li>
        </ul>`,
    icon: Factory 
}
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
                                        <h4 className="text-xl font-bold text-yellow-600 shadow-sm">{service.name}</h4>
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