// app/strategies/page.tsx (Server Component)

import { getCurrUser } from "@/actions/getcurrent-user";
import StrategyCard from "./_components/StrategyCard";
import { StrategyWithRBM } from "./types/strategy";
import getCurrentUser from "../actions/getCurrentUser";

//import { StrategyWithRBM } from '@/types/strategy';
//import StrategyCard from '@/components/StrategyCard'; // Client Component

// Function to fetch data from the internal API route
async function getStrategies(): Promise<StrategyWithRBM[]> {
    // 💡 Fix: Construct the full absolute URL
 const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/strategies`, {
    cache: 'no-store', // Use 'no-store' for dynamic data
  });

  if (!res.ok) {
    throw new Error('Failed to fetch strategies');
  }

  return res.json();
}

export default async function StrategiesPage() {
  const strategies = await getStrategies();
  const currentUser= await getCurrentUser()

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Business Strategy Proposals 🚀</h1>
      <p className="mb-8 text-gray-600">
        Review, evaluate, and vote on submitted strategies.
      </p>

      <div className="space-y-6">
        {strategies.map((strategy) => (
          <StrategyCard key={strategy.id} strategy={strategy} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
}