import React from 'react';
import { Wrench, Factory, Truck, HardHat, Brain } from 'lucide-react'; 

// Define the structure for a service item
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

const Services: React.FC = () => {
  return (
    // Full-Width Service Component Section (Below Main Content)
    <div className="pt-16 mt-16 border-t border-gray-200" id="services">
      <h3 className="text-3xl font-extrabold text-blue-800 text-center mb-12 uppercase tracking-wider">
        Illuminating Solutions Across Key Sectors
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <div 
            key={service.name} 
            className="flex flex-col items-start p-6 bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transition duration-500 border-t-4 border-blue-600 group hover:bg-blue-50"
          >
            {/* Icon Container */}
            <div className="flex-shrink-0 mb-4 p-3 rounded-full bg-blue-100 group-hover:bg-yellow-600 transition duration-300">
              <service.icon className="w-6 h-6 text-blue-800 group-hover:text-white" />
            </div>
            
            <h4 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h4>
            <p className="text-base text-gray-600">{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;
