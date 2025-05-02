import { Investor } from "@prisma/client";
import getCurrentUser from "./getCurrentUser";
import prisma from "../libs/prismadb";

export default async function getInvestors() {
  try {
    const currentUser = await getCurrentUser();

    let record: Investor[];

    if (currentUser?.isAdmin) {
      record = await prisma.investor.findMany({
        where: {
          active: true,
        },
        orderBy: { updatedAt: "desc" },
        include: {
          investments: {
            include: {
              portfolio: {
                select: {
                  title: true,
                  description: true,
                  type: true,
                  country: true,
                  targetAmount: true,
                  raisedAmount: true,
                  imageUrl: true,
                  expectedReturn: true,
                },
              },
            },
          },
        },
      });
    } else {
      record = await prisma.investor.findMany({
        where: {
          active: true,
        },
        orderBy: { updatedAt: "desc" },
        include: {
          investments: {
            include: {
              portfolio: {
                select: {
                  title: true,
                  description: true,
                  type: true,
                  country: true,
                  targetAmount: true,
                  raisedAmount: true,
                  imageUrl: true,
                  expectedReturn: true,
                },
              },
            },
          },
        },
      });
    }

    const safeRecord = record.map((x) => ({
      ...x,
      createdAt: x.createdAt ? x.createdAt.toISOString() : null,
      updatedAt: x.updatedAt ? x.updatedAt.toISOString() : null,
    }));

    return safeRecord;
  } catch (error: any) {
    throw new Error(error);
  }
}


// // export default async function getInvestorsWithTotalInvestment() {
// //   try {
// //     const currentUser = await getCurrentUser();

// //     let investors: Investor[];

// //     if (currentUser?.isAdmin) {
// //       investors = await prisma.investor.findMany({
// //         where: {
// //           active: true,
// //         },
// //         orderBy: { updatedAt: "desc" },
// //         include: {
// //           investments: {
// //             select: {
// //               amount: true,
// //             },
// //           },
// //         },
// //       });
// //     } else {
// //       investors = await prisma.investor.findMany({
// //         where: {
// //           active: true,
// //         },
// //         orderBy: { updatedAt: "desc" },
// //         include: {
// //           investments: {
// //             select: {
// //               amount: true,
// //             },
// //           },
// //         },
// //       });
// //     }

// //     const investorsWithTotal = investors.map((investor) => {
// //       const totalInvestment = investor.investments.reduce(
// //         (sum, investment) => sum + investment.amount,
// //         0
// //       );
// //       return {
// //         ...investor,
// //         totalInvestment,
// //         createdAt: investor.createdAt ? investor.createdAt.toISOString() : null,
// //         updatedAt: investor.updatedAt ? investor.updatedAt.toISOString() : null,
// //       };
// //     });

// //     return investorsWithTotal;
// //   } catch (error: any) {
// //     throw new Error(error);
// //   }
// // }

// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function calculateTotalValuePerPortfolio() {
//   try {
//     const portfolioValues = await prisma.investmentPortfolio.findMany({
//       select: {
//         id: true,
//         title: true,
//         investments: {
//           select: {
//             amount: true,
//           },
//         },
//       },
//     });

//     const totalValuePerPortfolio = portfolioValues.map((portfolio) => {
//       const totalInvestment = portfolio.investments.reduce(
//         (sum, investment) => sum + investment.amount,
//         0
//       );
//       return {
//         portfolioId: portfolio.id,
//         portfolioTitle: portfolio.title,
//         totalValue: totalInvestment,
//       };
//     });

//     console.log('Total Value Invested Per Portfolio:', totalValuePerPortfolio);
//     return totalValuePerPortfolio;
//   } catch (error) {
//     console.error('Error calculating total value per portfolio:', error);
//     throw error;
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// calculateTotalValuePerPortfolio();
