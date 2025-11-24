import getCurrentUser from '@/app/actions/getCurrentUser';
import Container from '../../components/Container';
import prisma from "@/app/libs/prismadb";
import StrategyClient from './StrategyClient';

interface StrategyIdPageProps {
  params: {
    id: string;
  };
};

// Correct export structure for a dynamic route in Next.js App Router
export default async function StrategiesDashboard({
  params,
}: StrategyIdPageProps) {
  const currentUser = await getCurrentUser(); // Authenticated user data
  
  // Fetch the unique strategy using the ID from params
  const strategy:any= await prisma.strategy.findUnique({
    where: { 
        // Use the ID from the route parameters
        id: params.id,
    },
    include: {
        author: true,
        votes: true, 
        goals: {
            include: {
                outcomes: {
                    include: {
                        outputs: true,
                    },
                },
            },
        },
    },
  });

  return (
    <Container>
        <StrategyClient       
          currentUser={currentUser} 
          mockStrategy={strategy} // Changed prop name to singular
        />
    </Container>
  );
}