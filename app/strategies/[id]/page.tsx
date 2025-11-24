import getCurrentUser from '@/app/actions/getCurrentUser';
import Container from '../../components/Container';
import prisma from "@/app/libs/prismadb";
import StrategyClient from './StrategyClient';
import { transformStrategy } from '@/app/actions/getStrategies';

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
  
  // // Fetch the unique strategy using the ID from params
  // const strategy:any= await prisma.strategy.findUnique({
  //   where: { 
  //       // Use the ID from the route parameters
  //       id: params.id,
  //   },
  //   include: {
  //       author: true,
  //       votes: true, 
  //       goals: {
  //           include: {
  //               outcomes: {
  //                   include: {
  //                       outputs: true,
  //                   },
  //               },
  //           },
  //       },
  //   },
  // });

   const updatedStrategy =  await prisma.strategy.findUnique({
                where: { id:  params.id },
                include: {
                    author: true,
                    votes: {
                    // CRITICAL: Include the voter to get the email/name for the Admin view
                    include: {
                        voter: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        }, 
                    }
                }, 
                    goals: {
                        include: {
                            outcomes: {
                                include: {
                                    outputs: true,
                                }
                            }
                        }
                    },
                },
            });
    

        
                    // 6. Transform the fetched data for the client
  const safeUpdateStrategy:any = transformStrategy(updatedStrategy as any);
        

  return (
    <Container>
        <StrategyClient       
          currentUser={currentUser} 
          mockStrategy={safeUpdateStrategy} // Changed prop name to singular
        />
    </Container>
  );
}