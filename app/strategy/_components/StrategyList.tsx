// components/StrategyList.tsx
// This component should be a Server Component to fetch the data initially

import { SafeUser } from "@/app/types";
import { StrategyWithRBM } from "../types/strategy";
import FilterSidebar from "./FilterSideBar";
import StrategyCard from "./StrategyCard";

interface StrategyListProps {
  strategies: StrategyWithRBM[];
  currrentUser:SafeUser|null
}

export default function StrategyList({ strategies , currrentUser}: StrategyListProps) {
  
  // Placeholder for the list of strategies
  if (strategies.length === 0) {
    return <p className="text-center text-gray-500 mt-10">No strategies found. Start a new submission!</p>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      
      {/* 1. Filtering Area (Sidebar on Desktop, Hidden/Modal on Mobile) */}
      <div className="lg:w-1/4">
        {/* The FilterSidebar component would use CSS classes 
            like 'hidden lg:block' to hide it on small screens, 
            and a mobile-only button to show a filter modal. */}
        <FilterSidebar />
      </div>

      {/* 2. Strategy List Area (Full width on Mobile, 3/4 on Desktop) */}
      <div className="lg:w-3/4 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 hidden lg:block">Active Proposals ({strategies.length})</h2>
        
        {strategies.map((strategy) => (
          // We use the StrategyCard component from earlier, which displays key data.
          <StrategyCard key={strategy.id} strategy={strategy} currentUser={currrentUser} />
        ))}
      </div>
    </div>
  );
}