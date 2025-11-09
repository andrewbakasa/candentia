/* eslint-disable @next/next/no-img-element */
'use client'
import React from 'react';
interface TeamMember {
  id: number;
  name: string;
  role: string;
  description: string;
  image: string; // Path to the team member's image
}
// 1. Define the path for the fallback image
const DEFAULT_AVATAR_SRC = '/public/images/placeholder.jpg'; // Make sure this file exists in your public/images folder
const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Rodreck Tavaziva",
    role: "Chairman",
    description: `B.Eng | MEng | MSOM | MBA | Experience in Distribution, Logistics, Manufacturing (Agrochemicals, Tobacco, Packaging), ICT & Finance Audit | Data Analytics (BI, Dashboards) | Seasoned solutions Architect (ERP Specialist) with over 20yrs+. Lead by bridging high-level strategy and technical execution.`,
    image: "/images/team/rodreck-tavaziva.jpg", // Placeholder image path
  },
  {
    id: 2,
    name: "Loice Gudukeya",
    role: "Executive Director Finance",
    description: "B.Eng | MEng | PhD Environmental Sustainability | Prof Eng. MZwe.IE, M.ECZ | Board member ECZ and ZIE | Leader in Renewable Energy, drives innovative, sustainable, and equitable solutions in engineering.",
    image: "/images/team/loice-gudukeya.jpg", // New Placeholder image path
  },
  {
    id: 3,
    name: "Blessed Mketo",
    role: "Executive Director Operations ",
    description: `B.Eng | MEng | Prof Eng. MZwe.IE, M.ECZ, M.ECN, M.SAIIE, M.ERB, 20yrs+ experience in Engineering, Operations, Construction & Transport across South Africa, Namibia, Botswana and Zimbabwe
`,
    image: "/images/team/blessed-mketo.jpg", // Placeholder image path
  },
  {
    id: 4,
    name: "Sipiwe Trinity Nyadongo",
    role: "Executive Director Logistics & Supply Chain Solutions.",
    description: `B.Eng | MEng | PhD IME | Prof Eng. MZwe.IE, M.ECZ | ERB | AUDA-NEPAD 3D Printing Expert | Expert in Metal Additive Manufacturing, Circular Economy | Zimbabwe, Botswana, Nambia
`,
    image: "/images/team/sipiwe-nyadongo.jpg", // Placeholder image path
  },
  {
    id: 5,
    name: "Wellington Chingwere",
    role: "Executive Director Infrastructure Development & Mining",
    description: `B.Eng | PMP | Prof Eng MZwe.IE, M.ECZ | 20yrs Asset Management, Maintenance | Consultancy | Project Management | Mining | Underground Ore Handling | Ore Process Plants, Upgading/Installation | Zimbabwe. 
`,
    image:DEFAULT_AVATAR_SRC// "/images/team/wellington-chengwere.jpg", // Placeholder image path
  },
  
  {
    id: 6,
    name: "Graham Tongai Ndanga",
    role: "Executive Director Smart Systems & Data Analytics",
    description: `B.Eng | MSc Fin Eng | 17 yrs+ | Experience in Fin Eng, ICT, Industrial Engineering, Project Finance | South Africa`,
    image: "/images/team/graham-ndanga.jpg", // New Placeholder image path
  },

  
  {
    id: 7,
    name: "Bhekimpilo Nkonjela",
    role: "Executive Director Asset Maintenance & Optimization ",
    description: `B.Eng 15yrs+ in mining and infrastructural development
`,
    image: DEFAULT_AVATAR_SRC//"/images/team/bhekimplio-nkonjela.jpg", // New Placeholder image path
  },
  {
    id: 8,
    name: "Ishmael Mavhenge",
    role: "Executive Director Research, Innovation & Developement ",
    description: `B.Eng | Ms Eng. Mgt | GCC | PMP | 20yrs Asset Management, Maintenance | Consultancy | Project Management | Manufacturing | Pulp & Paper | Sugar & Ethanol | Forestry | South Africa | Swaziland | Zimbabwe
`,
    image:"/images/team/ishmael-mavhenge.jpg", // New Placeholder image path
  },

    {
    id: 9,
    name: "Phillip Makaniwa",
    role: "Non-Executive Director ",
    description: `B.Eng | MEng | 12yrs+ Cost & Risk Engineering Consultant in the Oil & Gas as well as Nuclear Industry | South Africa, Saudi Arabia, UAE
`,
    image: "/images/team/phillip-makaniwa.jpg", // New Placeholder image path
  },
    {
    id: 10,
    name: "Kupakwashe Chamakavinga",
    role: "Non-Executive Director",
    description: `B.Eng(NUST). MPhil Cambridge, 20yrs+ experience | Manufacturing Executive & M&A Analyst | Expert in driving Sub-Saharan African export growth, operational efficiency (Plant Utilization), and strategic M&A integration | UK, Zimbabwe
`,
    image: "/images/team/kupakwashe-chamakavinga.jpg", // New Placeholder image path
  },

    {
    id: 11,
    name: "Andrew Bakasa",
    role: "Non-Executive Director",
    description: `B.Eng, MSc Investment, Prof Eng. MZwe.IE, M.ECZ 
  10yrs+ Machine Learning | ERP | Data Analytics | Business Intelligence | Clould Computing | Computer Vision |Project Finance | 20yrs Rail Technology, Engine Rebuilts/Upgrades, Plant Maintenance 
`,
    image: "/images/team/andrew-bakasa.jpg", // New Placeholder image path
  },
  {
    id: 12,
    name: "Happson Tshuma",
    role: "Non-Executive Director",
    description: `B.Eng Industrial | MBL | MSc (CHEP | Isuzu | Volvo | Cummins | Marcopolo| CBI Electric), 18yrs+ experience | EU | South Africa| Zimbabwe
`,
    image: "/images/team/happison-tshuma.jpg", // New Placeholder image path
  },
    {
    id: 13,
    name: "Lamuel Mudzamiri",
    role: "Non-Executive Director",
    description: `B.Eng Industrial Engineering | Engineer Asset Leader | MBA - GSB UCT | PGDip Management, 17yrs+ experience| Zimbabwe |South Africa
`,
    image: "/images/team/lamuel-mudzamiri.jpg", // New Placeholder image path
  },
    {
    id: 14,
    name: "Takawira Chikowore",
    role: "Non-Executive Director ",
    description: `B.Eng | MEng | Prof Eng. MZwe.IE, M.ECZ , 15yrs+ Lean and Six Sigma | Continuous Improvement | Quality | Supply Chain and Logistics
`,
    image: "/images/team/takawira-chikowore.jpg", // New Placeholder image path
  },
    {
    id: 15,
    name: "Maina Nyoni",
    role: "Non-Executive Director",
    description: `B.Eng | MSc specializing in Engineering Project Management and Quality Monitoring & Control. Proven expertise in providing cross-functional oversight for building and construction initiatives | South Africa| Zimbabwe
`,
    image: "/images/team/maina-nyoni.jpg", // New Placeholder image path
  },
    
];

const TeamSection: React.FC = () => {
  return (
    // 1. Changed ID from 'team' to 'our-team' to match NavLinks.jsx
    // 2. Added pt-20 and -mt-20 to create a scroll margin and prevent the sticky header from hiding the title.
    <div className="border-t border-gray-200 pt-20 -mt-20" id="our-team">
      <h3 className="text-3xl font-extrabold text-blue-800 text-center mb-12 uppercase tracking-wider">
        Meet Our Dynamic Team
      </h3>
      {/* Updated grid layout to handle 5 or more members gracefully */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {teamMembers.map((member) => (
          <div 
            key={member.id} 
            className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transition duration-500 border-b-4 border-yellow-600 group"
          >
            <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden border-4 border-blue-600 group-hover:border-yellow-600 transition-colors duration-300">
              {/* Replaced Next/Image with standard <img> tag */}
              <img
                src={member.image} 
                alt={member.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                // onError={({ currentTarget }) => {
                //   currentTarget.onerror = null; // Prevents infinite loop if fallback image also fails
                //   currentTarget.src = DEFAULT_AVATAR_SRC; // Set the fallback image source
                // }}
              />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h4>
            <p className="text-blue-700 font-semibold mb-3 text-sm uppercase tracking-wide">{member.role}</p>
            <p className="text-gray-600 text-sm">{member.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamSection;