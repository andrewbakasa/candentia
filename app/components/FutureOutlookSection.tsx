import React from 'react';
import Image from 'next/image';
import { Lightbulb, TrendingUp, Users } from 'lucide-react'; // Icons for the themes

// Define the structure for a future focus card
interface FutureFocus {
  title: string;
  description: string;
  image: string;
  icon: React.ElementType;
}

const futureFoci: FutureFocus[] = [
  {
    title: "Future Direction",
    description: "Horizon21's future is centered on being the premier diversified investment and operational vehicle in the SADC. It will continue to drive client operational excellence by integrating expert engineering, procurement, logistics, and technology.",
    image: "/images/future/aggric.jpg", // Placeholder image path
    icon: TrendingUp,
  },
  {
    title: "Growth Plans",
    description: "The primary growth engine is the expansion and scaling of our integrated Strategic Business Units (SBUs), particularly the technology unit, Smart Systems & Data Analytics. This SBU will solidify a Software as a Service (SaaS) business model to deliver solutions for maintenance, logistics, and quality improvement, positioning Horizon21 as an industrial technology hub.",
    image: "/images/future/manuf.jpg", // Placeholder image path
    icon: Lightbulb,
  },
  {
    title: "Potential Opportunities",
    description: "Significant opportunities exist in modernizing SADC's industrial landscape. We will capitalize on the region's demand for advanced transport corridors, improved productive efficiency through emerging global technologies (AI, IoT), and the critical need to reduce high operational costs associated with legacy systems. Our agile network and technical depth position us to drive digital transformation and sustainable development.",
    image: "/images/future/transport.jpg", // Placeholder image path
    icon: Users,
  },
];

const FutureOutlookSection: React.FC = () => {
  return (
    <div className="pt-16 mt-16 border-t border-gray-200 bg-gray-50 p-8 rounded-xl" id="future">
      
      {/* Centered Heading and Short Description (Right Aligned) */}
      <div className="text-center md:text-right mb-12">
        <h3 className="text-4xl font-extrabold text-blue-800 uppercase tracking-wider mb-4">
          Future Outlook
        </h3>
        {/* Shortened description text and right-aligned for medium screens and up */}
        <p className="text-lg text-gray-700 max-w-full md:max-w-3xl ml-auto">
          Horizon21 &apos;s future outlook is premised on a bold future direction, aggressive growth plans, and abundant potential opportunities to solidify its position as the integrated industrial partner for excellence in the SADC region and beyond.
        </p>
      </div>

      {/* 3-Column Grid for Focus Areas */}
      {/* Grid columns: 1 column on mobile (col), 2 on medium (md), 3 on large (lg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {futureFoci.map((focus, index) => (
          <div 
            key={index} 
            className="flex flex-col rounded-xl shadow-2xl overflow-hidden transform hover:scale-[1.03] transition duration-500 bg-white"
          >
            {/* Image/Icon Block (Golden Background) */}
            <div className="relative h-64 w-full bg-yellow-600/10 flex items-center justify-center p-6 border-b-4 border-yellow-600">
              {/* NOTE: You must ensure images exist at these paths or replace them with suitable placeholders. */}
              <Image
                src={focus.image}
                alt={focus.title}
                width={400}
                height={200}
                objectFit="cover"
                className="opacity-70 rounded-lg shadow-inner"
              />
              <focus.icon className="absolute w-12 h-12 text-blue-800 opacity-90" />
            </div>

            {/* Content Block */}
            <div className="p-6 flex-grow">
              <h4 className="text-2xl font-bold text-blue-800 mb-3 flex items-center">
                {focus.title}
              </h4>
              <p className="text-gray-600 text-base">{focus.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FutureOutlookSection;
