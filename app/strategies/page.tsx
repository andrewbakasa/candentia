// app/strategies/page.tsx

import StrategyList from '@/app/strategy/_components/StrategyList';
import getCurrentUser from '@/app/actions/getCurrentUser';
import { StrategyWithRBM } from '@/app/strategy/types/strategy';
import StrategyActionHeader from '@/app/strategy/_components/ActionHeader';
//import StrategyActionHeader from '@/app/strategy/_components/StrategyActionHeader'; // ⬅️ NEW IMPORT

// Function to fetch data from the internal API route
async function getStrategies(): Promise<StrategyWithRBM[]> {
  // ... (existing data fetching logic) ...
//   const res = await fetch(`/api/strategies`, {
//     cache: 'no-store',
//   });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/strategies`, {
    cache: 'no-store', // Use 'no-store' for dynamic data
  });

  if (!res.ok) {
    console.error('Failed to fetch strategies:', res.statusText);
    return []; 
  }
  return res.json();
}

export default async function StrategiesDashboard() {
  const strategies = await getStrategies();
  const currentUser = await getCurrentUser(); // Authenticated user data

  return (
    <div className="container mx-auto p-4 lg:p-10">
      
      {/* This component now handles the header, the button, and the form visibility */}
      <StrategyActionHeader currentUser={currentUser} />

      {/* The Strategy List Component */}
      <StrategyList strategies={strategies} currrentUser={currentUser} />

    </div>
  );
}