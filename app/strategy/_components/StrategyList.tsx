
'use client';

import { SafeUser } from "@/app/types";
import { StrategyWithRBM } from "../types/strategy"; // Assuming StrategyWithRBM is defined here
//import FilterSidebar, { StrategyFilters } from "./FilterSidebar";
import StrategyCard from "./StrategyCard";
import { useState, useMemo } from 'react';
import FilterSidebar, { StrategyFilters } from "./FilterSideBar";

// Define the shape for StrategyWithRBM to enable filtering
export interface StrategyWithRBMExample extends StrategyWithRBM {
    year: string;
    averageScore: number;
}

interface StrategyListProps {
  strategies: StrategyWithRBMExample[]; // Using the enriched type
  currrentUser: SafeUser | null;
}

export default function StrategyList({ strategies, currrentUser }: StrategyListProps) {
    const initialFilters: StrategyFilters = { status: 'ALL', year: 'ALL', minScore: null };
    const [activeFilters, setActiveFilters] = useState<StrategyFilters>(initialFilters);

    // Function passed to the FilterSidebar to update the state
    const handleFilterChange = (newFilters: StrategyFilters) => {
        setActiveFilters(newFilters);
    };

    // Use useMemo to filter strategies only when activeFilters or strategies change
    const filteredStrategies = useMemo(() => {
        return strategies.filter(strategy => {
            
            // 1. Status Filter
            const statusMatch = activeFilters.status === 'ALL' || strategy.status === activeFilters.status;

            // 2. Year Filter
            const yearMatch = activeFilters.year === 'ALL' || strategy.year === activeFilters.year;

            // 3. Minimum Score Filter (Assuming a mock score field called 'averageScore' is available)
            const scoreMatch = activeFilters.minScore === null || strategy.averageScore >= activeFilters.minScore;

            return statusMatch && yearMatch && scoreMatch;
        });
    }, [strategies, activeFilters]);


    // Placeholder for the list of strategies
    if (strategies.length === 0) {
        return <p className="text-center text-gray-500 mt-10">No strategies found. Start a new submission!</p>;
    }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      
      {/* 1. Filtering Area */}
      <div className="lg:w-1/4">
        <FilterSidebar onFilterChange={handleFilterChange} />
      </div>

      {/* 2. Strategy List Area */}
      <div className="lg:w-3/4 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 hidden lg:block">
            Active Proposals ({filteredStrategies.length} / {strategies.length})
        </h2>
        
        {filteredStrategies.length > 0 ? (
          filteredStrategies.map((strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} currentUser={currrentUser} />
          ))
        ) : (
             <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
                 <p className="text-lg text-yellow-800 font-semibold">No results match the current filters.</p>
                 <p className="text-sm text-yellow-600 mt-1">Try adjusting the status, year, or minimum score.</p>
             </div>
        )}
      </div>
    </div>
  );
}// // components/StrategyList.tsx
// // This component should be a Server Component to fetch the data initially

// import { SafeUser } from "@/app/types";
// import { StrategyWithRBM } from "../types/strategy";
// import FilterSidebar from "./FilterSideBar";
// import StrategyCard from "./StrategyCard";

// interface StrategyListProps {
//   strategies: StrategyWithRBM[];
//   currrentUser:SafeUser|null
// }

// export default function StrategyList({ strategies , currrentUser}: StrategyListProps) {
  
//   // Placeholder for the list of strategies
//   if (strategies.length === 0) {
//     return <p className="text-center text-gray-500 mt-10">No strategies found. Start a new submission!</p>;
//   }

//   return (
//     <div className="flex flex-col lg:flex-row gap-6 p-4">
      
//       {/* 1. Filtering Area (Sidebar on Desktop, Hidden/Modal on Mobile) */}
//       <div className="lg:w-1/4">
//         {/* The FilterSidebar component would use CSS classes 
//             like 'hidden lg:block' to hide it on small screens, 
//             and a mobile-only button to show a filter modal. */}
//         <FilterSidebar />
//       </div>

//       {/* 2. Strategy List Area (Full width on Mobile, 3/4 on Desktop) */}
//       <div className="lg:w-3/4 space-y-6">
//         <h2 className="text-2xl font-bold text-gray-800 hidden lg:block">Active Proposals ({strategies.length})</h2>
        
//         {strategies.map((strategy) => (
//           // We use the StrategyCard component from earlier, which displays key data.
//           <StrategyCard key={strategy.id} strategy={strategy} currentUser={currrentUser} />
//         ))}
//       </div>
//     </div>
//   );
// }