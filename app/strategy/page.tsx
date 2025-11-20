// app/strategies/page.tsx (Server Component)

import { getCurrUser } from "@/actions/getcurrent-user";
import StrategyCard from "./_components/StrategyCard";
import { StrategyWithRBM } from "./types/strategy";
import getCurrentUser from "../actions/getCurrentUser";
import getStrategies from "../actions/getStrategies";



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