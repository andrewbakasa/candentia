import React from 'react';
import { Target, ArrowRight, CheckCircle, User, Zap, List } from 'lucide-react';
import { StrategyGoal, StrategyOutcome, StrategyOutput } from './StrategyCard';


// --- Helper Function for Highlighting (New Addition) ---
interface HighlightResult {
    __html: string;
}

/**
 * Splits the text by the search term (case-insensitive) and wraps matches in a <mark> tag.
 * @param text The source string.
 * @param search The search term.
 * @returns An object to be used in dangerouslySetInnerHTML.
 */
const highlightText = (text: string, search: string): HighlightResult => {
    if (!search) {
        return { __html: text };
    }
    
    // Create a regular expression for global, case-insensitive match
    const regex = new RegExp(`(${search})`, 'gi');
    
    // Split the text by the search term, keeping the delimiters (the matches)
    const parts = text.split(regex);
    
    // Reconstruct the string, wrapping matches in <mark>
    const highlightedHtml = parts.map(part => {
        // Check if the part matches the search term (case-insensitive)
        if (regex.test(part)) {
            // Apply yellow background using style property for simplicity
            return `<mark style="background-color: yellow; padding: 0 2px; border-radius: 3px;">${part}</mark>`;
        }
        return part;
    }).join('');
    
    return { __html: highlightedHtml };
};


// --- 1. Sub-Component for Output Items (Actionable Tasks) ---
// Prop change: added searchText
const OutputItem: React.FC<{ output: StrategyOutput, searchText: string }> = ({ output, searchText }) => (
     <li className={`flex items-start gap-2 p-2 rounded-lg transition ${output.isCompleted ? 'bg-green-50' : 'bg-gray-50'}`}>
         <span className={`flex-shrink-0 ${output.isCompleted ? 'text-green-600' : 'text-gray-400'} mt-1`}>
             <List className="w-4 h-4" />
         </span>
         <div className="text-sm">
             <p className={`font-medium ${output.isCompleted ? 'text-green-800' : 'text-gray-800'}`}
                dangerouslySetInnerHTML={highlightText(output.title, searchText)}/>

             <div className="flex items-center text-xs text-gray-500 mt-0.5">
                 <User className="w-3 h-3 mr-1" />
                 Responsible: <strong  className="ml-1 font-semibold text-gray-700"  dangerouslySetInnerHTML={highlightText(output.responsible, searchText)}
                />
             </div>
             {output.isCompleted && (
                 <div className="text-xs text-green-600 font-bold mt-1 flex items-center">
                     <CheckCircle className="w-3 h-3 mr-1 fill-green-500 text-white" /> Completed
                 </div>
             )}
         </div>
     </li>
 );


 // --- 2. Sub-Component for Outcome Blocks (Medium-Term Changes) ---
const OutcomeBlock: React.FC<{ outcome: StrategyOutcome, searchText: string }> = ({ outcome, searchText }) => (
     // Responsive padding and distinct container using shadow/border
     <div className="border-l-4 border-indigo-400 bg-indigo-50 p-1 sm:p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
         <h4 className="text-base font-extrabold text-indigo-900 mb-2 flex items-center gap-2">
             <ArrowRight className="w-5 h-5 text-indigo-600" /> Outcome:  <span  dangerouslySetInnerHTML={highlightText(outcome.title, searchText)}
            />
         </h4>
         <p className="text-sm font-mono text-indigo-700 mb-4 border-b border-indigo-200 pb-2 flex items-center gap-1">
             <Zap className="w-4 h-4 text-indigo-600" />
             KPI:  <span  className="font-semibold"   dangerouslySetInnerHTML={highlightText(outcome.kpi, searchText)}
            />
         </p>
        
         <h5 className="text-sm font-bold text-gray-700 mb-2">Required Outputs:</h5>
         <ul className="space-y-3">
             {outcome.outputs.map(output => (
                 <OutputItem key={output.id} output={output} searchText={searchText} />
             ))}
         </ul>
     </div>
);


// --- 3. Main Component Props Interface ---
interface RBMProps {
    goals: any[];//StrategyGoal[];
    pos:number;
    searchText: string; // New prop for search term
}

// --- 4. Main RBMBreakdown Component (Long-Term Impact) ---
const RBMBreakdown: React.FC<RBMProps> = ({ goals, pos, searchText }) => {
    return (

          <div className="mt-8 p-1 sm:p-4 bg-white shadow-2xl rounded-xl border border-gray-100">
             <h3 className="text-xl sm:text-2xl font-extrabold mb-6 text-indigo-800 border-b pb-3">
                 {pos+1}.1 RBM Results Chain Breakdown
             </h3>
            
            {goals?.length === 0 ? (
                <p className="text-gray-500 italic p-1">No specific RBM goals defined for this strategy.</p>
            ) : (


                <div className="space-y-10">
                     {goals?.map((goal, index) => (
                         <div key={goal.id} className="p-1 sm:p-4 border-2 border-indigo-500 rounded-xl bg-white shadow-inner-xl">
                            
                             {/* Goal Header */}
                             <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-b-2 border-indigo-100 pb-3">
                                 <span className="text-4xl text-indigo-600 flex-shrink-0">
                                     <Target className="w-8 h-8" />
                                 </span>
                                 <span className="flex-1 text-sm" dangerouslySetInnerHTML={highlightText(`${pos+1}.1.${index+1}. ${goal.title}`, searchText)}/>
                                  {/* Highlight Goal Title */}
                                  <span className="ml-0 sm:ml-auto text-sm font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                                     Target: {goal.targetYear}
                                 </span>
                             </h3>
                            
                             {/* Outcomes Container - less indentation, more vertical separation */}
                             <div className="space-y-6 pt-2">
                                 {goal?.outcomes?.length === 0 ? (
                                     <p className="text-gray-500 italic pl-2 text-sm">No outcomes defined for this goal.</p>
                                 ) : (
                                     goal?.outcomes?.map((outcome: StrategyOutcome) => (
                                         <OutcomeBlock key={outcome.id} outcome={outcome} searchText={searchText} />
                                     ))
                                 )}
                             </div>
                         </div>
                     ))}
                 </div>
            )}
        </div>
    );
};
export default RBMBreakdown;