"use server";
import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import prisma from "@/app/libs/prismadb";
import { createAuditLog } from "@/lib/create-audit-log";
import { createSafeAction } from "@/lib/create-safe-action";
import { z } from "zod";

// --- Schemas ---

const UpdateInvestorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, { message: "Name is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  email: z.string().email({ message: "Invalid email address" }),
});

const UpdatePortfolio2Schema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, { message: "Title is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  imageUrl: z.string().url({ message: "Invalid URL" }),
  targetAmount: z.number().min(0, { message: "Target amount must be >= 0" }),
  raisedAmount: z.number().min(0, { message: "Raised amount must be >= 0" }),
  expectedReturn: z.string().optional(),
  type: z.string().min(1, { message: "Type is required" }),
});

const UpdatePortfolioSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  type: z.string().min(1, { message: "Type is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  active: z.boolean(),
  targetAmount: z.number().min(0, { message: "Target amount must be a non-negative number" }),
  raisedAmount: z.number().min(0),
  imageUrl: z.string().min(1, { message: "Image URL is required" }),
  expectedReturn: z.string().optional(),
});


const UpdateInvestmentSchema = z.object({
  id: z.string().min(1), //  ID of the InvestorInvestment record to update
  amount: z.number().min(1, { message: "Investment amount must be > 0" }),
});

// --- Types ---

type InvestorUpdateType = z.infer<typeof UpdateInvestorSchema>;
type PortfolioUpdateType = z.infer<typeof UpdatePortfolioSchema>;
type InvestmentUpdateType = z.infer<typeof UpdateInvestmentSchema>;

interface ReturnType<T = any> {
  data?: T | null;
  error?: string;
}

// --- Handlers ---

const handleUpdateInvestor = async (data: InvestorUpdateType): Promise<ReturnType<any>> => {
  try {
    const { id, ...updateData } = data;
    const existingInvestor = await prisma.investor.findUnique({ where: { id } });
    if (!existingInvestor) {
      return { error: `Investor with ID "${id}" not found.` };
    }

    const updatedInvestor = await prisma.investor.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      entityId: updatedInvestor.id,
      entityTitle: updatedInvestor.name,
      entityType: ENTITY_TYPE.CARD,
      action: ACTION.UPDATE,
    });

    revalidatePath(`/investors/${id}`); //  Revalidate the specific investor's page
    revalidatePath('/investors');       //  and the general investors page
    return { data: updatedInvestor };
  } catch (error: any) {
    return { error: `Failed to update investor: ${error.message}` };
  }
};

const handleUpdatePortfolio = async (data: PortfolioUpdateType): Promise<ReturnType<any>> => {
  try {
    const { id, ...updateData } = data;
    const existingPortfolio = await prisma.investmentPortfolio.findUnique({ where: { id } });
    if (!existingPortfolio) {
      return { error: `Portfolio with ID "${id}" not found.` };
    }
    const updatedPortfolio = await prisma.investmentPortfolio.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      entityId: updatedPortfolio.id,
      entityTitle: updatedPortfolio.title,
      entityType: ENTITY_TYPE.BOARD, //  Adjust if you have a more specific type
      action: ACTION.UPDATE,
    });

    revalidatePath(`/portfolios/${id}`);  // Revalidate specific portfolio page.
    revalidatePath('/edit-investments');        //  and the general portfolios page
    return { data: updatedPortfolio };
  } catch (error: any) {
    return { error: `Failed to update portfolio: ${error.message}` };
  }
};

const handleUpdateInvestment = async (data: InvestmentUpdateType): Promise<ReturnType<any>> => {
  try {
    const { id, amount } = data;

    const existingInvestment = await prisma.investorInvestment.findUnique({ where: { id } });
    if (!existingInvestment) {
      return { error: `Investment with ID "${id}" not found.` };
    }

    //  Get the old amount for calculating the difference.
    const oldAmount = existingInvestment.amount;

    //  Update the InvestorInvestment record.
    const updatedInvestment = await prisma.investorInvestment.update({
      where: { id },
      data: { amount },
    });

    //  Calculate the difference in amount.
    const amountDifference = amount - oldAmount;

    //  Update the raisedAmount in the InvestmentPortfolio.
    await prisma.investmentPortfolio.update({
      where: { id: existingInvestment.portfolioId },
      data: {
        raisedAmount: {
          increment: amountDifference, //  Add the difference (can be negative).
        },
      },
    });

    const investor = await prisma.investor.findUnique({where: {id: existingInvestment.investorId}});
    const portfolio = await prisma.investmentPortfolio.findUnique({where: {id: existingInvestment.portfolioId}});
    await createAuditLog({
      entityId: updatedInvestment.id,
      entityTitle: `Investment in ${portfolio?.title} by ${investor?.name} updated`,
      entityType: ENTITY_TYPE.CARD,  //  Adjust
      action: ACTION.UPDATE,
    });

    revalidatePath(`/investors/${existingInvestment.investorId}`);
    revalidatePath(`/portfolios/${existingInvestment.portfolioId}`);
    return { data: updatedInvestment };
  } catch (error: any) {
    return { error: `Failed to update investment: ${error.message}` };
  }
};

// --- Exports ---
export const updateInvestor = createSafeAction(UpdateInvestorSchema, handleUpdateInvestor);
export const updatePortfolio = createSafeAction(UpdatePortfolioSchema, handleUpdatePortfolio);
export const updateInvestment = createSafeAction(UpdateInvestmentSchema, handleUpdateInvestment);
