import prisma from "../libs/prismadb";
import { InvestmentPortfolio } from "@prisma/client";
import getCurrentUser from "./getCurrentUser";
export default async function getInvestmentPortfolios() {
  try {
    const currentUser = await getCurrentUser();
    // No need to check if currentUser exists if you want to show public job openings

    let record: InvestmentPortfolio[];

    const investmentInclude = {
      investor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    };

    if (currentUser?.isAdmin) {
      // Admin can view all active job openings
      record = await prisma.investmentPortfolio.findMany({
        where: {
          active: true,
        },
        orderBy: { updatedAt: "desc" },
        include: {
          investments: {
            include: investmentInclude,
          },
          // ... other relations
        },
      });
    } else {
      // Non-admin users can view all active job openings (assuming all are public)
      record = await prisma.investmentPortfolio.findMany({
        where: {
          active: true,
        },
        orderBy: { updatedAt: "desc" },
        include: {
          investments: {
            include: investmentInclude,
          },
          // ... other relations
        },
      });
    }
    //console.log(`record:${record}`)
    // Transform the career data if needed for the frontend
    const safeRecord = record.map((x) => ({
      ...x,
      createdAt: x.createdAt ? x.createdAt.toISOString() : null,
      updatedAt: x.updatedAt ? x.updatedAt.toISOString() : null,
      // Add any other transformations if necessary
    }));

    return safeRecord;
  } catch (error: any) {
    throw new Error(error);
  }
}

