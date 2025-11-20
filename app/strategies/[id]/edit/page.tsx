// app/strategies/[id]/edit/page.tsx

import getCurrentUser from "@/app/actions/getCurrentUser";
import StrategyForm from "@/app/strategy/_components/StrategyForm";
// Dedicated function to call the API
async function getStrategyToEdit(id: string) {
    // const res = await fetch(`/api/strategies/${id}`, {
    //     cache: 'no-store', // Essential to ensure we don't serve stale data for editing
    // });
 const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/strategies/${id}`, {
    cache: 'no-store', // Use 'no-store' for dynamic data
  });

    if (!res.ok) {
        // If the strategy isn't found or API fails, throw an error to trigger Next.js error boundary
        throw new Error(`Failed to load strategy ${id} for editing: ${res.statusText}`);
    }

    return res.json();
}

export default async function EditStrategyPage({ params }: { params: { id: string } }) {
    
    // 🧭 Step 1: Call the new API to fetch the real data
    const strategyToEdit = await getStrategyToEdit(params.id); 
    console.log("strategyToEdit",strategyToEdit)
    const currentUser= await getCurrentUser()

    // NOTE: In a real app, the authorId would come from a session/currentUser check.
    //const MOCK_AUTHOR_ID = 'user_team_member_alpha'; 

    return (
        <div className="max-w-4xl mx-auto py-10">
            {/* StrategyForm receives the real, hydrated data */}
            <StrategyForm 
                initialStrategy={strategyToEdit} 
                authorId={currentUser?.id|| ""} 
            />
        </div>
    );
}