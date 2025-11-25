import getCurrentUser from '@/app/actions/getCurrentUser';
import getStrategies from '../actions/getStrategies';
import Container from '../components/Container';
import StrategyClient from './StrategiesClient';
//import getStrategiesWithRecalculation from '../actions/getStrategiesWithRecalculation';


export default async function StrategiesDashboard() {
  const currentUser = await getCurrentUser(); // Authenticated user data 
 //const strategiesWithRecalculation: any[] = await getStrategiesWithRecalculation()
 const strategies: any[] = await getStrategies();
//console.log("strategies,", strategies)
return (
        <Container>
            <StrategyClient 
            // Pass the array of correctly serialized project data
            currentUser={currentUser} // May be null
            mockStrategies={strategies}            />
        </Container>
    );
}