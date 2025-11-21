import React from 'react';
import { Target, ArrowRight, CheckCircle, User, Zap, List } from 'lucide-react';
import { StrategyGoal, StrategyOutcome, StrategyOutput } from './StrategyCard';

// --- Type Definitions ---
// interface StrategyOutput {
//     id: string;
//     title: string;
//     responsible: string;
//     isCompleted: boolean;
// }

// interface StrategyOutcome {
//     id: string;
//     title: string;
//     kpi: string;
//     outputs: StrategyOutput[];
// }

// export interface StrategyGoal {
//     id?: string;
//     title: string;
//     targetYear: number;
//     outcomes: StrategyOutcome[];
// }

// --- 1. Sub-Component for Output Items (Actionable Tasks) ---
const OutputItem: React.FC<{ output: StrategyOutput }> = ({ output }) => (
    <li className={`flex items-start gap-2 p-2 rounded-lg transition ${output.isCompleted ? 'bg-green-50' : 'bg-gray-50'}`}>
        <span className={`flex-shrink-0 ${output.isCompleted ? 'text-green-600' : 'text-gray-400'} mt-1`}>
            <List className="w-4 h-4" />
        </span>
        <div className="text-sm">
            <p className={`font-medium ${output.isCompleted ? 'text-green-800' : 'text-gray-800'}`}>{output.title}</p>
            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                <User className="w-3 h-3 mr-1" />
                Responsible: <strong className="ml-1 font-semibold text-gray-700">{output.responsible}</strong>
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
const OutcomeBlock: React.FC<{ outcome: StrategyOutcome }> = ({ outcome }) => (
    // Responsive padding and distinct container using shadow/border
    <div className="border-l-4 border-indigo-400 bg-indigo-50 p-3 sm:p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
        <h4 className="text-base font-extrabold text-indigo-900 mb-2 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-indigo-600" /> Outcome: {outcome.title}
        </h4>
        <p className="text-sm font-mono text-indigo-700 mb-4 border-b border-indigo-200 pb-2 flex items-center gap-1">
            <Zap className="w-4 h-4 text-indigo-600" />
            KPI: <span className="font-semibold">{outcome.kpi}</span>
        </p>
        
        <h5 className="text-sm font-bold text-gray-700 mb-2">Required Outputs:</h5>
        <ul className="space-y-3">
            {outcome.outputs.map(output => (
                <OutputItem key={output.id} output={output} />
            ))}
        </ul>
    </div>
);

// --- 3. Main Component Props Interface ---
interface RBMProps {
    goals: any[];//StrategyGoal[];
}

// --- 4. Main RBMBreakdown Component (Long-Term Impact) ---
const RBMBreakdown: React.FC<RBMProps> = ({ goals }) => {
    return (
        <div className="mt-8 p-4 sm:p-8 bg-white shadow-2xl rounded-xl border border-gray-100">
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-6 text-indigo-800 border-b pb-3">
                RBM Results Chain Breakdown
            </h3>
            
            {goals?.length === 0 ? (
                <p className="text-gray-500 italic p-4">No specific RBM goals defined for this strategy.</p>
            ) : (
                <div className="space-y-10">
                    {goals?.map((goal, index) => (
                        <div key={goal.id} className="p-4 sm:p-6 border-2 border-indigo-500 rounded-xl bg-white shadow-inner-xl">
                            
                            {/* Goal Header */}
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-b-2 border-indigo-100 pb-3">
                                <span className="text-4xl text-indigo-600 flex-shrink-0">
                                    <Target className="w-8 h-8" />
                                </span>
                                <span className="flex-1">{goal.title}</span>
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
                                        <OutcomeBlock key={outcome.id} outcome={outcome} />
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
// interface StrategyOutput {
//   id: string;
//   title: string;
//   responsible: string;
//   isCompleted: boolean;
// }

// interface StrategyOutcome {
//   id: string;
//   title: string;
//   kpi: string;
//   outputs: StrategyOutput[];
// }

// interface StrategyGoal {
//   id: string;
//   title: string;
//   targetYear: number;
//   outcomes: StrategyOutcome[];
// }

// interface StrategyWithRBM {
//     // Only need the 'goals' property structure for this component
//     goals: StrategyGoal & { outcomes: StrategyOutcome[] }[];
// }


// // --- 1. Sub-Component for Output Items ---
// const OutputItem: React.FC<{ output: StrategyOutput }> = ({ output }) => (
//   <li className="ml-4 text-sm text-gray-700 list-disc">
//     {/* Using strong/bold for emphasis */}
//     <strong className="font-semibold">{output.title}</strong> (Responsible: {output.responsible})
//     {output.isCompleted && <span className="ml-2 text-green-500 font-bold">✅</span>}
//   </li>
// );

// // --- 2. Sub-Component for Outcome Blocks ---
// // NOTE: Explicitly type the outcome prop using the placeholder interfaces
// const OutcomeBlock: React.FC<{ outcome: StrategyOutcome }> = ({ outcome }) => (
//   <div className="border-l-4 border-indigo-200 pl-4 ml-4 my-4 bg-indigo-50 p-3 rounded-lg">
//     <h4 className="text-md font-bold text-indigo-800 mb-1">➡️ Outcome: {outcome.title}</h4>
//     <p className="text-xs text-gray-600 mb-2 font-mono">KPI: {outcome.kpi}</p>
//     <ul className="space-y-1">
//       {outcome.outputs.map(output => (
//         <OutputItem key={output.id} output={output} />
//       ))}
//     </ul>
//   </div>
// );

// // --- 3. Main Component Props Interface ---
// // The goals are expected to be an array of the StrategyGoal structure
// interface RBMProps {
//   goals: StrategyGoal[];
// }

// // --- 4. Main RBMBreakdown Component ---
// const RBMBreakdown: React.FC<RBMProps> = ({ goals }) => {
//   return (
//     <div className="mt-8 p-6 bg-white shadow-xl rounded-xl border border-gray-100">
//       <h3 className="text-2xl font-extrabold mb-5 text-indigo-700 border-b pb-2">
//         RBM Results Chain Breakdown
//       </h3>
//       {goals?.length === 0 ? (
//           <p className="text-gray-500 italic">No specific RBM goals defined for this strategy.</p>
//       ) : (
//           <div className="space-y-6">
//               {goals?.map(goal => (
//                   <div key={goal.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
//                       <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
//                           <span className="text-3xl">🎯</span> Goal: {goal.title} 
//                           <span className="ml-2 text-sm font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
//                             Target {goal.targetYear}
//                           </span>
//                       </h3>
//                       <div className="ml-4">
//                           {goal?.outcomes?.map(outcome => (
//                               <OutcomeBlock key={outcome.id} outcome={outcome} />
//                           ))}
//                       </div>
//                   </div>
//               ))}
//           </div>
//       )}
//     </div>
//   );
// };
// export default RBMBreakdown;
// import React from 'react';
// import { Target, ArrowRight, CheckCircle, User, Zap, List } from 'lucide-react';

// // --- Type Definitions ---
// interface StrategyOutput {
//     id: string;
//     title: string;
//     responsible: string;
//     isCompleted: boolean;
// }

// interface StrategyOutcome {
//     id: string;
//     title: string;
//     kpi: string;
//     outputs: StrategyOutput[];
// }

// export interface StrategyGoal {
//     id: string;
//     title: string;
//     targetYear: number;
//     outcomes: StrategyOutcome[];
// }

// // --- 1. Sub-Component for Output Items (Actionable Tasks) ---
// const OutputItem: React.FC<{ output: StrategyOutput }> = ({ output }) => (
//     <li className={`flex items-start gap-2 p-2 rounded-lg transition ${output.isCompleted ? 'bg-green-50' : 'bg-gray-50'}`}>
//         <span className={`flex-shrink-0 ${output.isCompleted ? 'text-green-600' : 'text-gray-400'} mt-1`}>
//             <List className="w-4 h-4" />
//         </span>
//         <div className="text-sm">
//             <p className={`font-medium ${output.isCompleted ? 'text-green-800' : 'text-gray-800'}`}>{output.title}</p>
//             <div className="flex items-center text-xs text-gray-500 mt-0.5">
//                 <User className="w-3 h-3 mr-1" />
//                 Responsible: <strong className="ml-1 font-semibold text-gray-700">{output.responsible}</strong>
//             </div>
//             {output.isCompleted && (
//                 <div className="text-xs text-green-600 font-bold mt-1 flex items-center">
//                     <CheckCircle className="w-3 h-3 mr-1 fill-green-500 text-white" /> Completed
//                 </div>
//             )}
//         </div>
//     </li>
// );

// // --- 2. Sub-Component for Outcome Blocks (Medium-Term Changes) ---
// const OutcomeBlock: React.FC<{ outcome: StrategyOutcome }> = ({ outcome }) => (
//     // Responsive padding and distinct container using shadow/border
//     <div className="border-l-4 border-indigo-400 bg-indigo-50 p-3 sm:p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
//         <h4 className="text-base font-extrabold text-indigo-900 mb-2 flex items-center gap-2">
//             <ArrowRight className="w-5 h-5 text-indigo-600" /> Outcome: {outcome.title}
//         </h4>
//         <p className="text-sm font-mono text-indigo-700 mb-4 border-b border-indigo-200 pb-2 flex items-center gap-1">
//             <Zap className="w-4 h-4 text-indigo-600" />
//             KPI: <span className="font-semibold">{outcome.kpi}</span>
//         </p>
        
//         <h5 className="text-sm font-bold text-gray-700 mb-2">Required Outputs:</h5>
//         <ul className="space-y-3">
//             {outcome.outputs.map(output => (
//                 <OutputItem key={output.id} output={output} />
//             ))}
//         </ul>
//     </div>
// );

// // --- 3. Main Component Props Interface ---
// interface RBMProps {
//     goals: StrategyGoal[];
// }

// // --- 4. Main RBMBreakdown Component (Long-Term Impact) ---
// const RBMBreakdown: React.FC<RBMProps> = ({ goals }) => {
//     return (
//         <div className="mt-8 p-4 sm:p-8 bg-white shadow-2xl rounded-xl border border-gray-100">
//             <h3 className="text-2xl sm:text-3xl font-extrabold mb-6 text-indigo-800 border-b pb-3">
//                 RBM Results Chain Breakdown
//             </h3>
            
//             {goals?.length === 0 ? (
//                 <p className="text-gray-500 italic p-4">No specific RBM goals defined for this strategy.</p>
//             ) : (
//                 <div className="space-y-10">
//                     {goals?.map((goal, index) => (
//                         <div key={goal.id} className="p-4 sm:p-6 border-2 border-indigo-500 rounded-xl bg-white shadow-inner-xl">
                            
//                             {/* Goal Header */}
//                             <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-b-2 border-indigo-100 pb-3">
//                                 <span className="text-4xl text-indigo-600 flex-shrink-0">
//                                     <Target className="w-8 h-8" />
//                                 </span>
//                                 <span className="flex-1">{goal.title}</span>
//                                 <span className="ml-0 sm:ml-auto text-sm font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
//                                     Target: {goal.targetYear}
//                                 </span>
//                             </h3>
                            
//                             {/* Outcomes Container - less indentation, more vertical separation */}
//                             <div className="space-y-6 pt-2">
//                                 {goal?.outcomes?.length === 0 ? (
//                                     <p className="text-gray-500 italic pl-2 text-sm">No outcomes defined for this goal.</p>
//                                 ) : (
//                                     goal?.outcomes?.map(outcome => (
//                                         <OutcomeBlock key={outcome.id} outcome={outcome} />
//                                     ))
//                                 )}
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// };
// export default RBMBreakdown;