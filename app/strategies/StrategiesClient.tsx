'use client'
import { AlertTriangle, Plus, Zap } from "lucide-react";
import StrategyCard , { StrategyWithRBM } from "../strategy/_components/StrategyCard";
import { useMemo, useState } from "react";
import StrategyForm from "../strategy/_components/StrategyForm";
import { toast, Toaster } from "sonner";
import FilterSidebar from "../strategy/_components/FilterSideBar";
import { SafeUser } from "../types";


//interface SafeUser { id: string; name: string | null; email: string | null; }
interface StrategyGoal { id: string; title: string; targetYear: number; }
// interface StrategyWithRBMExample {
//     id: string;
//     title: string;
//     content: string;
//     year: string;
//     status: string; // One of ProposalStatus values
//     score: number | null;
//     votes: { YES: number; NO: number; };
//     authorId: string;
//     goals: StrategyGoal[];
// }
interface Filters { status: string; year: string; minScore: number | null; }
// interface StrategyWithRBM {
//     id: string;
//     title: string;
//     content: string;
//     year: string;
//     status: string; // Note: This is a generic string in the external interface
//     goals: StrategyGoal[];
//     authorId: string;
// }
const ProposalStatus = {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    VOTING_OPEN: 'VOTING_OPEN',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

const initialFilters: Filters = { status: 'ALL', year: 'ALL', minScore: null };
const mockAuthorId = 'user-123-alice';
interface StrategyClientProps {
    currentUser: SafeUser | null;
    mockStrategies: StrategyWithRBM[];
}
    
const StrategyClient: React.FC<StrategyClientProps> = ({
    currentUser,
    mockStrategies,
}) => {

    const [strategies, setStrategies] = useState(mockStrategies);
    const [currentFilters, setCurrentFilters] = useState<Filters>(initialFilters);
    const [view, setView] = useState<'list' | 'form'>('list'); // 'list' or 'form'
    // Ensure selectedStrategy matches the full type or is null
    const [selectedStrategy, setSelectedStrategy] = useState<StrategyWithRBM | null>(null); 

    // --- Core Logic Handlers ---

    // 1. Voting Logic
    const handleVote = async (strategyId: string, voteType: 'YES' | 'NO') => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setStrategies(prevStrategies => 
            prevStrategies.map(s => {
                if (s.id === strategyId) {
                    const newVotes = { ...s.votes };
                    newVotes[voteType] += 1; // Increment the vote count
                    toast.success(`Voted ${voteType} on proposal: ${s.title}`);
                    return { ...s, votes: newVotes };
                }
                return s;
            })
        );
    };

    // 2. Navigation Handlers
    const handleStrategyClick = (strategy: StrategyWithRBM) => {
        setSelectedStrategy(strategy);
        setView('form');
    };

    const handleCancelForm = () => {
        setSelectedStrategy(null);
        setView('list');
    };

    // 3. Form Save Handler (updates strategies array)
    const handleSave = (updatedStrategy: StrategyWithRBM) => {
        setStrategies(prevStrategies => {
            const index = prevStrategies.findIndex(s => s.id === updatedStrategy.id);
            if (index !== -1) {
                // Update existing strategy
                return prevStrategies.map((s, i) => s.id === updatedStrategy.id ? updatedStrategy : s);
            } else {
                // Add new strategy (mocking PENDING_REVIEW status after creation)
                return [...prevStrategies, { 
                    ...updatedStrategy, 
                    // Ensure full structure for new items
                    status: ProposalStatus.PENDING_REVIEW, 
                    score: null, 
                    votes: { YES: 0, NO: 0 }
                }];
            }
        });
        handleCancelForm(); // Go back to the list
    };

    // 4. Filtering Logic
    const filteredStrategies = useMemo(() => {
        return strategies.filter(strategy => {
            // Filter by status
            const statusMatch = currentFilters.status === 'ALL' || strategy.status === currentFilters.status;

            // Filter by year
            const yearMatch = currentFilters.year === 'ALL' || String(strategy.year) === currentFilters.year;

            // Filter by minimum score
            const minScore = currentFilters.minScore;
            const scoreMatch = minScore === null || (strategy.score !== null && strategy.score >= minScore);

            return statusMatch && yearMatch && scoreMatch;
        });
    }, [strategies, currentFilters]);

    // --- Render Logic ---

    if (view === 'form') {
        return (
            <StrategyForm 
                initialStrategy={selectedStrategy}
                authorId={currentUser?.id || mockAuthorId}
                onSave={handleSave}
                onCancel={handleCancelForm}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
            <Toaster position="top-right" richColors />
            
            <header className="max-w-7xl mx-auto mb-8">
                <h1 className="text-4xl font-black text-gray-900 border-b-4 border-indigo-600 pb-2 inline-block">
                    Strategy Proposals
                </h1>
                <p className="text-gray-600 mt-2">
                    Review, filter, and vote on current proposals. You are logged in as <span className="text-red-500 text-bold">{currentUser?.name || mockAuthorId}</span>
                </p>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <FilterSidebar onFilterChange={setCurrentFilters} />
                    
                    <button 
                        onClick={() => {
                            setSelectedStrategy(null);
                            setView('form');
                        }}
                        className="mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold text-base shadow-xl transition duration-300 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5"/> Submit New Proposal
                    </button>
                    
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        <p className="font-semibold flex items-center gap-1"><Zap className='w-4 h-4'/> Policy Note</p>
                        <p className='mt-1 text-xs'>
                            All submissions are assessed against Guideline 1 of 2025 (Business Model Requirements) before moving to the VOTING_OPEN status.
                        </p>
                    </div>
                </div>
                
                {/* Proposal List */}
                <div className="lg:col-span-3">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        {filteredStrategies.length} Active Proposals 
                        <span className='text-base font-medium text-gray-500 ml-2'>(Filtered)</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-1 gap-6">
                        {filteredStrategies.length > 0 ? (
                            filteredStrategies.map(strategy => (
                                <StrategyCard
                                    key={strategy.id}
                                    strategy={strategy}
                                    onStrategyClick={handleStrategyClick}
                                    onVote={handleVote}
                                    currentUser={currentUser}
                                />
                            ))
                        ) : (
                            <div className="md:col-span-2 xl:col-span-3 p-8 text-center bg-white rounded-xl shadow-lg border border-gray-200">
                                <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3"/>
                                <p className="text-lg font-semibold text-gray-700">No Proposals Found</p>
                                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or submit a new strategy proposal!</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StrategyClient