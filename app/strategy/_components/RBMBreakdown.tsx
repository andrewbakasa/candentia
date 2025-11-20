// components/RBMBreakdown.tsx
import { StrategyGoal, StrategyOutcome, StrategyOutput } from '@prisma/client';
import { StrategyWithRBM } from '../types/strategy';
//import { StrategyWithRBM } from '@/types/strategy';

interface RBMProps {
  goals: StrategyWithRBM['goals'];
}

const OutputItem: React.FC<{ output: StrategyOutput }> = ({ output }) => (
  <li className="ml-4 text-sm text-gray-700 list-disc">
    **{output.title}** (Responsible: {output.responsible})
    {output.isCompleted && <span className="ml-2 text-green-500">✅</span>}
  </li>
);

const OutcomeBlock: React.FC<{ outcome: StrategyOutcome & { outputs: StrategyOutput[] } }> = ({ outcome }) => (
  <div className="border-l-2 pl-4 ml-4 my-2">
    <h4 className="text-md font-medium text-indigo-700">Outcome: {outcome.title}</h4>
    <p className="text-xs text-gray-500 mb-2">KPI: {outcome.kpi}</p>
    <ul>
      {outcome.outputs.map(output => (
        <OutputItem key={output.id} output={output} />
      ))}
    </ul>
  </div>
);

const RBMBreakdown: React.FC<RBMProps> = ({ goals }) => {
  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-xl font-semibold mb-3 text-indigo-600">RBM Results Chain</h3>
      {goals.map(goal => (
        <div key={goal.id} className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">🎯 Goal: {goal.title} ({goal.targetYear})</h3>
          {goal.outcomes.map(outcome => (
            <OutcomeBlock key={outcome.id} outcome={outcome} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default RBMBreakdown;