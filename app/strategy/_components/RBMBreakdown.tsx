interface StrategyOutput {
  id: string;
  title: string;
  responsible: string;
  isCompleted: boolean;
}

interface StrategyOutcome {
  id: string;
  title: string;
  kpi: string;
  outputs: StrategyOutput[];
}

interface StrategyGoal {
  id: string;
  title: string;
  targetYear: number;
  outcomes: StrategyOutcome[];
}

interface StrategyWithRBM {
    // Only need the 'goals' property structure for this component
    goals: StrategyGoal & { outcomes: StrategyOutcome[] }[];
}


// --- 1. Sub-Component for Output Items ---
const OutputItem: React.FC<{ output: StrategyOutput }> = ({ output }) => (
  <li className="ml-4 text-sm text-gray-700 list-disc">
    {/* Using strong/bold for emphasis */}
    <strong className="font-semibold">{output.title}</strong> (Responsible: {output.responsible})
    {output.isCompleted && <span className="ml-2 text-green-500 font-bold">✅</span>}
  </li>
);

// --- 2. Sub-Component for Outcome Blocks ---
// NOTE: Explicitly type the outcome prop using the placeholder interfaces
const OutcomeBlock: React.FC<{ outcome: StrategyOutcome }> = ({ outcome }) => (
  <div className="border-l-4 border-indigo-200 pl-4 ml-4 my-4 bg-indigo-50 p-3 rounded-lg">
    <h4 className="text-md font-bold text-indigo-800 mb-1">➡️ Outcome: {outcome.title}</h4>
    <p className="text-xs text-gray-600 mb-2 font-mono">KPI: {outcome.kpi}</p>
    <ul className="space-y-1">
      {outcome.outputs.map(output => (
        <OutputItem key={output.id} output={output} />
      ))}
    </ul>
  </div>
);

// --- 3. Main Component Props Interface ---
// The goals are expected to be an array of the StrategyGoal structure
interface RBMProps {
  goals: StrategyGoal[];
}

// --- 4. Main RBMBreakdown Component ---
const RBMBreakdown: React.FC<RBMProps> = ({ goals }) => {
  return (
    <div className="mt-8 p-6 bg-white shadow-xl rounded-xl border border-gray-100">
      <h3 className="text-2xl font-extrabold mb-5 text-indigo-700 border-b pb-2">
        RBM Results Chain Breakdown
      </h3>
      {goals.length === 0 ? (
          <p className="text-gray-500 italic">No specific RBM goals defined for this strategy.</p>
      ) : (
          <div className="space-y-6">
              {goals.map(goal => (
                  <div key={goal.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-3xl">🎯</span> Goal: {goal.title} 
                          <span className="ml-2 text-sm font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                            Target {goal.targetYear}
                          </span>
                      </h3>
                      <div className="ml-4">
                          {goal?.outcomes?.map(outcome => (
                              <OutcomeBlock key={outcome.id} outcome={outcome} />
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};
export default RBMBreakdown;
// // components/RBMBreakdown.tsx
// import { StrategyGoal, StrategyOutcome, StrategyOutput } from '@prisma/client';
// import { StrategyWithRBM } from '../types/strategy';
// //import { StrategyWithRBM } from '@/types/strategy';

// interface RBMProps {
//   goals: StrategyWithRBM['goals'];
// }

// const OutputItem: React.FC<{ output: StrategyOutput }> = ({ output }) => (
//   <li className="ml-4 text-sm text-gray-700 list-disc">
//     **{output.title}** (Responsible: {output.responsible})
//     {output.isCompleted && <span className="ml-2 text-green-500">✅</span>}
//   </li>
// );

// const OutcomeBlock: React.FC<{ outcome: StrategyOutcome & { outputs: StrategyOutput[] } }> = ({ outcome }) => (
//   <div className="border-l-2 pl-4 ml-4 my-2">
//     <h4 className="text-md font-medium text-indigo-700">Outcome: {outcome.title}</h4>
//     <p className="text-xs text-gray-500 mb-2">KPI: {outcome.kpi}</p>
//     <ul>
//       {outcome.outputs.map(output => (
//         <OutputItem key={output.id} output={output} />
//       ))}
//     </ul>
//   </div>
// );

// const RBMBreakdown: React.FC<RBMProps> = ({ goals }) => {
//   return (
//     <div className="mt-6 border-t pt-4">
//       <h3 className="text-xl font-semibold mb-3 text-indigo-600">RBM Results Chain</h3>
//       {goals.map(goal => (
//         <div key={goal.id} className="mb-4">
//           <h3 className="text-lg font-bold text-gray-900">🎯 Goal: {goal.title} ({goal.targetYear})</h3>
//           {goal.outcomes.map(outcome => (
//             <OutcomeBlock key={outcome.id} outcome={outcome} />
//           ))}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default RBMBreakdown;