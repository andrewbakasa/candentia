'use client'
import { AlertTriangle, Plus, Zap } from "lucide-react";
import StrategyCard, { StrategyWithRBM, StrategyWithUserVotes } from "@/app/strategy/_components/StrategyCard";
import { useMemo, useState } from "react";
import StrategyForm, { StrategyWithRBMFull } from "@/app/strategy/_components/StrategyForm";
import { toast, Toaster } from "sonner";
import { SafeUser } from "@/app/types";
import useLoginModal from "@/app/hooks/useLoginModal";
// Import redirect but use it selectively, not for viewing access control

// NOTE: FilterSidebar imports and related types/constants are removed 
// as they are irrelevant for a single-strategy view.

const ProposalStatus = {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    VOTING_OPEN: 'VOTING_OPEN',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

// 1. UPDATED PROPS: Expects a single strategy object (Full type) or null
interface StrategyClientProps {
    currentUser: SafeUser | null;
    mockStrategy: StrategyWithUserVotes| null ;//StrategyWithRBMFull | null; // Use Full type for consistency
}
    
const StrategyClient: React.FC<StrategyClientProps> = ({
    currentUser,
    mockStrategy, // Destructure the single strategy
}) => {
    const mockAuthorId = 'user-123-alice';
    const loginModal = useLoginModal();
    // --- ACCESS CONTROL CHECK (For actions/forms) ---
    const allowedRoles: string[] = ['admin', 'executive'];

    const hasRequiredRole = useMemo(() => {
        if (!currentUser) return false;
        const isGlobalAdmin = currentUser.isAdmin === true;
        const hasRoleAccess = currentUser.roles 
            && currentUser.roles.some(role => 
                allowedRoles.includes(role.toLowerCase())
            );
        return isGlobalAdmin || hasRoleAccess;
    }, [currentUser]);

   
    const [strategy, setStrategy] = useState<StrategyWithUserVotes | null>(mockStrategy);
    
    const [view, setView] = useState<'list' | 'form'>('list'); // 'list' or 'form'
    const [selectedStrategy, setSelectedStrategy] = useState<StrategyWithUserVotes | null>(null); 


    const handleVoteAction = async (strategyId: string,voteType: 'YES' | 'NO', action: 'NEW' | 'SWITCH') => {
        const method = action === 'NEW' ? 'POST' : 'PUT';
        const endpoint = `/api/strategies/${strategyId}/vote`; // Assuming vote API structure

        if (!currentUser?.id) {
                toast.error("You must be logged in to vote.");            
                loginModal.onOpen();// CORRECTED: Open the login modal
                return;
            }

        const payload = {
                voterId: currentUser.id,
                voteType: voteType,
            };

        console.log(`method: ${method}, voteType: ${voteType}`)
        try {
            // Logic to call the API based on method
            const response = await fetch(endpoint, {
                method: method,
                // Mandatory check for user
                headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
               
                
                

                    if (!response.ok) {
                        let errorDetail = response.statusText;
                        try {
                            const errorBody = await response.json();
                            errorDetail = errorBody.message || errorDetail;
                        } catch (e) {
                            // Ignore if not JSON
                        }
                        toast.error(`Vote failed: ${errorDetail}`);
                        return;
                    }

                   // Success Path: Use the returned data to update the single state object.
            const result: StrategyWithUserVotes = await response.json(); 
            console.log(`result: ${result}`)
            setStrategy(result); 
            
            toast.success(`Your "${voteType}" vote for "${result.title}" was recorded!`);
                    
        } catch (error) {
            console.error("Voting API error:", error);
            toast.error("An unexpected network error occurred while voting.");
        }
    };


    // 3. Voting Logic - Updates the single strategy state (Requires login, checked inside)
    const handleVote = async (strategyId: string, voteType: 'YES' | 'NO') => {
        if (!currentUser?.id) {
            toast.error("You must be logged in to vote.");
            loginModal.onOpen();
            return;
        }
        
        // Ensure we only vote on the strategy currently being viewed
        if (!strategy || strategy.id !== strategyId) {
             toast.error("Strategy data is unavailable for voting.");
             return;
        }

        const payload = { voterId: currentUser.id, voteType: voteType };
        
        try {
            const response = await fetch(`/api/strategies/${strategyId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorDetail = response.statusText;
                try {
                    const errorBody = await response.json();
                    errorDetail = errorBody.message || errorDetail;
                } catch (e) {}
                toast.error(`Vote failed: ${errorDetail}`);
                return;
            }

            // Success Path: Use the returned data to update the single state object.
            const result: StrategyWithUserVotes = await response.json(); 
            
            setStrategy(result); 
            
            toast.success(`Your "${voteType}" vote for "${result.title}" was recorded!`);
            
        } catch (error) {
            console.error("Voting API error:", error);
            toast.error("An unexpected network error occurred while voting.");
        }
    };

    // 4. Cancel Vote Logic (NEW IMPLEMENTATION)
    const handleCancelVote = async (strategyId: string) => {
        // Mandatory check for user
        if (!currentUser?.id) {
            toast.error("You must be logged in to cancel a vote.");
            loginModal.onOpen();
            return;
        }

        // Ensure we only cancel a vote on the strategy currently being viewed
        if (!strategy || strategy.id !== strategyId) {
            toast.error("Strategy data is unavailable for vote cancellation.");
            return;
        }

        try {
            // Use DELETE method to remove the existing vote
            const response = await fetch(`/api/strategies/${strategyId}/vote?voterId=${currentUser.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                let errorDetail = response.statusText;
                try {
                    const errorBody = await response.json();
                    errorDetail = errorBody.message || errorDetail;
                } catch (e) {
                    // Ignore if not JSON
                }
                toast.error(`Cancellation failed: ${errorDetail}`);
                return;
            }

            // Success Path: Use the returned data (or logic to reset state)
            const result: StrategyWithUserVotes = await response.json(); 

            // CORRECTED: Set the single object state
            setStrategy(result); 

            toast.success("Your vote was successfully canceled.", {
                description: "You can now cast a new vote."
            });

        } catch (error) {
            console.error("Cancel Vote API error:", error);
            toast.error("An unexpected network error occurred while canceling the vote.");
        }
    };

    // 5. Navigation Handlers
    const handleStrategyClick = (strategyToEdit: StrategyWithUserVotes) => {
        // Only authorized users can click the card to edit (go to form)
        if (!hasRequiredRole) {
            toast.error("You must be an admin or executive to edit this proposal.");
            return;
        }
        setSelectedStrategy(strategyToEdit);
        setView('form');
    };

    const handleCancelForm = () => {
        setSelectedStrategy(null);
        setView('list');
    };

    // 6. Form Save Handler - Updates the single strategy state (Only accessible via form view for authorized users)
    const handleSave = (updatedStrategy: StrategyWithRBM) => {
        // Since the StrategyForm component is typed to return StrategyWithRBM, 
        // and we are replacing the existing strategy, we must ensure the vote fields are kept/restored.
        // In a single-view setup, the safest way is to fetch the full updated object after saving, 
        // but for mock purposes, we will merge the update into the current state's full type.
        
        if (strategy) {
            const updatedFullStrategy: StrategyWithUserVotes = {
                ...strategy, // Keep voting and other fields
                ...updatedStrategy, // Apply the fields from the form
                // NOTE: If the save logic changed status, it must be handled by the form/API
            };
            setStrategy(updatedFullStrategy);
            toast.success(`Proposal "${updatedStrategy.title}" updated successfully.`);
        } else {
            // This scenario shouldn't happen if selectedStrategy was the initial state, 
            // but for a *new* proposal, a default StrategyWithUserVotes object must be constructed.
            toast.error("Cannot save: Strategy state is null.");
        }
        
        handleCancelForm(); 
    };

    // --- Render Logic ---

    // Show the form only if user is authorized AND view is 'form'
    if (view === 'form') {
        if (!hasRequiredRole) {
             // This ensures users can't manually access the /strategies/id route with ?view=form
             toast.error("Access denied. You cannot view the editing form.");
             setView('list'); // Fallback to list view
             return null;
        }
        return (
            <StrategyForm 
                initialStrategy={selectedStrategy}
                authorId={currentUser?.id || mockAuthorId} 
                onSave={handleSave as (strategy: StrategyWithUserVotes) => void}
                onCancel={handleCancelForm}
                currentUser={currentUser}
            />
        );
    }
    
    // The single strategy to show is the state variable itself
    const singleStrategyToShow = strategy; 


     return (
         <div className="min-h-screen bg-gray-50 font-sans p-1 sm:p-4">
             <Toaster position="top-right" richColors />
            
             <header className="max-w-7xl mx-auto mb-8">
                 <h1 className="text-4xl font-black text-gray-900 border-b-4 border-indigo-600 pb-2 inline-block">
                     Strategy Proposal Review
                 </h1>
                 <p className="text-gray-600 mt-2">
                     Review and vote on this specific proposal identified by ID. You are currently: 
                     <span className="text-red-500 font-bold ml-1">
                         {currentUser ? (hasRequiredRole ? `${currentUser.name} (Authorized)` : `${currentUser.name} (View Only)`) : 'Unauthenticated (View Only)'}
                     </span>
                 </p>
             </header>
            
             <hr className="my-8"/>

             <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                 {/* Sidebar - Retain structure for navigation/notes */}
                 <div className="lg:col-span-1">
                     <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
                         <h3 className="font-bold text-gray-800 mb-2">Access Status</h3>
                         <p className="text-xs text-gray-500">
                             {hasRequiredRole ? 'You can view, edit, and submit new proposals.' : 'You can only view this proposal.'}
                         </p>
                     </div>
                    
                     {/* Conditional rendering of the "Submit New Proposal" button */}
                     {hasRequiredRole ? (
                         <button 
                             onClick={() => {
                                 setSelectedStrategy(null); // Clear selected to start new form
                                 setView('form');
                             }}
                             className="mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold text-base shadow-xl transition duration-300 flex items-center justify-center gap-2"
                         >
                             <Plus className="w-5 h-5"/> Submit New Proposal
                         </button>
                     ) : (
                         <div className="mt-6 p-3 w-full border border-gray-300 bg-gray-200 text-gray-700 rounded-xl text-sm text-center font-medium">
                             Log in as Admin/Executive to Submit or Edit.
                         </div>
                     )}

                     {/* Policy Note */}
                     <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                         <p className="font-semibold flex items-center gap-1"><Zap className='w-4 h-4'/> Policy Note</p>
                         <p className='mt-1 text-xs'>
                             All submissions are assessed against <strong>Guideline 1 of 2025 (Business Model Requirements)</strong> before moving to the VOTING\_OPEN status, as per the rules dated 14 September 2025.
                         </p>
                     </div>
                 </div>
                
                 {/* Proposal Detail */}
                 <div className="lg:col-span-3">
                     <h2 className="text-2xl font-bold text-gray-800 mb-6">
                         {singleStrategyToShow ? `Proposal: ${singleStrategyToShow.title}` : "Loading Proposal"}
                     </h2>

                     <div className="grid grid-cols-1 gap-6">
                         {singleStrategyToShow ? (
                            <StrategyCard
                                key={singleStrategyToShow.id}
                                strategy={singleStrategyToShow}
                                onStrategyClick={handleStrategyClick}
                                onVote={handleVoteAction}
                                onCancelVote={handleCancelVote} // <-- CORRECTED: PASS THE NEW HANDLER
                                currentUser={currentUser}
                                counter={1} 
                            />
                        ) : (
                            <div className="p-8 text-center bg-white rounded-xl shadow-lg border border-gray-200">
                                <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3"/>
                                <p className="text-lg font-semibold text-gray-700">Proposal Not Found</p>
                                <p className="text-sm text-gray-500 mt-1">The strategy ID you requested may be invalid.</p>
                            </div>
                        )}
                     </div>
                 </div>
             </main>
         </div>
     );
};

export default StrategyClient;