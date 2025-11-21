// app/strategies/page.tsx

// import StrategyList from '@/app/strategy/_components/StrategyList';
import getCurrentUser from '@/app/actions/getCurrentUser';
import { StrategyWithRBM } from '@/app/strategy/types/strategy';
// import StrategyActionHeader from '@/app/strategy/_components/ActionHeader';
import getStrategies from '../actions/getStrategies';
import Container from '../components/Container';
import StrategyClient from './StrategiesClient';


export default async function StrategiesDashboard() {
  const currentUser = await getCurrentUser(); // Authenticated user data
 const strategies: any[] = await getStrategies();

return (
        <Container>
            <StrategyClient 
            // Pass the array of correctly serialized project data
            currentUser={currentUser} // May be null
            mockStrategies={strategies}            />
        </Container>
    );
}