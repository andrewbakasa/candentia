"use server";
import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import prisma from "@/app/libs/prismadb";
import { createAuditLog } from "@/lib/create-audit-log";
import { createSafeAction } from "@/lib/create-safe-action";
import { z } from "zod";

// --- Schemas ---

const CreateInvestorSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  email: z.string().email({ message: "Invalid email address" }),
});

const CreatePortfolioSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  imageUrl: z.string().url({ message: "Invalid URL" }),
  targetAmount: z.number().min(0, { message: "Target amount must be >= 0" }),
  raisedAmount: z.number().min(0, { message: "Raised amount must be >= 0" }),
  expectedReturn: z.string().optional(),
  type: z.string().min(1, { message: "Type is required" }),
});

const InvestInPortfolioSchema = z.object({
  investorId: z.string().min(1),
  portfolioId: z.string().min(1),
  amount: z.number().min(1, { message: "Investment amount must be > 0" }),
});

// --- Types ---

type InvestorInputType = z.infer<typeof CreateInvestorSchema>;
type PortfolioInputType = z.infer<typeof CreatePortfolioSchema>;
type InvestInPortfolioInputType = z.infer<typeof InvestInPortfolioSchema>;

interface ReturnType<T = any> {
  data?: T | null;
  error?: string;
}

// --- Handlers ---

const handleCreateInvestor = async (data: InvestorInputType): Promise<ReturnType<any>> => {
  try {
    const investor = await prisma.investor.create({
      data: {
        ...data,
      },
    });

    await createAuditLog({
      entityId: investor.id,
      entityTitle: investor.name,
      entityType: ENTITY_TYPE.CARD,
      action: ACTION.CREATE,
    });
   // refresh
    //revalidatePath('/financing');
    return { data: investor };
  } catch (error: any) {
    return { error: `Failed to create investor: ${error.message}` };
  }
};

const handleCreatePortfolio = async (data: PortfolioInputType): Promise<ReturnType<any>> => {
  try {
    const portfolio = await prisma.investmentPortfolio.create({
      data: {
        title: data.title,
        country: data.country,
        description: data.description,
        imageUrl: data.imageUrl,
        targetAmount: data.targetAmount,
        raisedAmount: data.raisedAmount , // Use the provided value or default to 0
        expectedReturn: data.expectedReturn,
        type: data.type,
      },
    });

    await createAuditLog({
      entityId: portfolio.id,
      entityTitle: portfolio.title,
      entityType: ENTITY_TYPE.BOARD,
      action: ACTION.CREATE,
    });

    // refresh
    revalidatePath('/financing');
    return { data: portfolio };
  } catch (error: any) {
    return { error: `Failed to create portfolio: ${error.message}` };
  }
};

const handleInvestInPortfolio = async (data: InvestInPortfolioInputType): Promise<ReturnType<any>> => {
  try {
    const { investorId, portfolioId, amount } = data;

    // Check if both investor and portfolio exist
    const investor = await prisma.investor.findUnique({ where: { id: investorId } });
    const portfolio = await prisma.investmentPortfolio.findUnique({ where: { id: portfolioId } });

    if (!investor) {
      return { error: `Investor with ID "${investorId}" not found.` };
    }
    if (!portfolio) {
      return { error: `Portfolio with ID "${portfolioId}" not found.` };
    }

    const investorInvestment = await prisma.investorInvestment.create({
      data: {
        investorId,
        portfolioId,
        amount,
      },
    });

    // Update the raisedAmount in the InvestmentPortfolio
    await prisma.investmentPortfolio.update({
      where: { id: portfolioId },
      data: {
        raisedAmount: {
          increment: amount,
        },
      },
    });

    await createAuditLog({
      entityId: investorInvestment.id,
      entityTitle: `${investor.name} invested in ${portfolio.title}`,
      entityType: ENTITY_TYPE.CARD,
      action: ACTION.CREATE,
    });

    revalidatePath(`/investors/${investorId}`);
    revalidatePath(`/portfolios/${portfolioId}`);
    return { data: investorInvestment };
  } catch (error: any) {
    return { error: `Failed to invest in portfolio: ${error.message}` };
  }
};

// --- Exports ---
export const createInvestor = createSafeAction(CreateInvestorSchema, handleCreateInvestor);
export const createPortfolio = createSafeAction(CreatePortfolioSchema, handleCreatePortfolio);
export const investInPortfolio = createSafeAction(InvestInPortfolioSchema, handleInvestInPortfolio);
