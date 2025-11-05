// serviceData.ts

import { Wrench, Factory, Truck, HardHat, Brain, LucideIcon } from 'lucide-react'; 

// --- Interface Definition ---
export interface ServiceItem {
    name: string;
    description: string; // Contains the raw HTML string
    icon: LucideIcon; // Using LucideIcon type for type safety
}

// --- Data Definition (RAW HTML STRINGS WITH SPAN/TAILWIND CLASSES) ---
export const services: ServiceItem[] = [
    {
        name: "Asset Maintenance & Optimization (MRO)",
        description: `<p>We provide <span class="text-yellow-600 shadow-sm">full-scope Maintenance, Repair, and Overhaul (MRO) services</span>, designed to transition your operations from reactive to <span class="text-yellow-600 shadow-sm">predictive</span> while maximizing asset uptime and operational efficiency.</p>
            <p>We achieve this through integrated technical expertise and precise lifecycle management:</p>
            <ul class="list-disc space-y-2 ml-6 my-4">
                <li><span class="text-yellow-600 shadow-sm">Predictive Analysis & Diagnostics:</span> State-of-the-art techniques for early fault detection and condition monitoring.</li>
                <li><span class="text-yellow-600 shadow-sm">Integrated Engineering:</span> Covering Custom Design, Precision Manufacturing, Fabrication, and Expert Engineering Consultancy.</li>
                <li><span class="text-yellow-600 shadow-sm">Asset Lifecycle Management:</span> Implementing <span class="text-yellow-600 shadow-sm">Asset Tracking</span> for real-time status, location, and history, along with <span class="text-yellow-600 shadow-sm">BOQ Management, Planning, and Costing</span> for detailed project budget control.</li>
                <li><span class="text-yellow-600 shadow-sm">Support:</span> Reliable parts sales and structured <span class="text-yellow-600 shadow-sm">long-term maintenance contracts</span>.</li>
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