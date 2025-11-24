import getCurrentUser from '@/app/actions/getCurrentUser';
import getStrategies from '../actions/getStrategies';
import Container from '../components/Container';
import StrategyClient from './StrategiesClient';
import { StrategiesReturnType, StrategyWithIndividualVotes } from '../strategy/types/strategy';
import { StrategyWithUserVotes } from '../strategy/_components/StrategyCard';


export default async function StrategiesDashboard() {
  const currentUser = await getCurrentUser(); // Authenticated user data
 const strategies: any[] = await getStrategies();
console.log("strategies,", strategies)
return (
        <Container>
            <StrategyClient 
            // Pass the array of correctly serialized project data
            currentUser={currentUser} // May be null
            mockStrategies={strategies}            />
        </Container>
    );
}