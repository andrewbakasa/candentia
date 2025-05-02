"use server";
import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { z } from "zod";
import prisma from "@/app/libs/prismadb";
import { createAuditLog } from "@/lib/create-audit-log";
import { createSafeAction } from "@/lib/create-safe-action";

// Define the schema to match your InvestmentPortfolio model
const CreatePortfolioSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    type: z.string().min(1, { message: "Type is required" }),
    country: z.string().min(1, { message: "Country is required" }),
    active: z.boolean().default(true),
    targetAmount: z.number().min(0, { message: "Target amount must be a non-negative number" }),
    raisedAmount: z.number().min(0).default(0),
    imageUrl: z.string().min(1, { message: "Image URL is required" }),
    expectedReturn: z.string().optional(),
});

// Define InputType to match the schema
interface InputType {
    title: string;
    description: string;
    type: string;
    country: string;
    active?: boolean;
    targetAmount: number;
    raisedAmount?: number;
    imageUrl: string;
    expectedReturn?: string;
}

interface ReturnType { data?: any; error?: string; }

const handler = async (data: InputType): Promise<ReturnType> => {
    let investmentPortfolio;

    try {
        investmentPortfolio = await prisma.investmentPortfolio.create({
            data: {
                ...data,
            },
        });

        await createAuditLog({
            entityId: investmentPortfolio.id,
            entityTitle: investmentPortfolio.title, // Use a relevant title
            entityType: ENTITY_TYPE.CARD, // Or a more appropriate entity type
            action: ACTION.CREATE,
        });

        revalidatePath('/investmentPortfolios'); // Adjust the path if necessary

    } catch (error) {
        console.error("Error creating portfolio:", error);
        return {
            error: "Failed to create investment portfolio.",
        };
    }

    return { data: investmentPortfolio };
};

export const createPortfolio = createSafeAction(CreatePortfolioSchema, handler);
