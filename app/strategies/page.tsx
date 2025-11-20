// app/strategies/page.tsx

import StrategyList from '@/app/strategy/_components/StrategyList';
import getCurrentUser from '@/app/actions/getCurrentUser';
import { StrategyWithRBM } from '@/app/strategy/types/strategy';
import StrategyActionHeader from '@/app/strategy/_components/ActionHeader';
import getStrategies from '../actions/getStrategies';


export default async function StrategiesDashboard() {
  //const strategies = await getStrategies();
  const currentUser = await getCurrentUser(); // Authenticated user data
 const strategies: any[] = await getStrategies();
// const strategies = await prisma.strategy.findMany({
//       include: {
//         author: true,
//         goals: {
//           include: {
//             outcomes: {
//               include: {
//                 outputs: true,
//               },
//             },
//           },
//         },
//       },
//       orderBy: {
//         submissionDate: 'desc',
//       },
//     });


  return (
    <div className="container mx-auto p-4 lg:p-10">
      
      {/* This component now handles the header, the button, and the form visibility */}
      <StrategyActionHeader currentUser={currentUser} />

      {/* The Strategy List Component */}
      <StrategyList strategies={strategies} currrentUser={currentUser} />

    </div>
  );
}