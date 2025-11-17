import { NextApiRequest, NextApiResponse } from 'next';
import prisma from "../../../../libs/prismadb" // Assuming this path is correct
import { Prisma } from '@prisma/client';

// Define the expected structure of the activity update request body
interface UpdateActivityBody {
    title: string;
    activityType: 'LEGAL_REVIEW' | 'NEGOTIATION' | 'EXECUTION' | 'ARCHIVING' | string; // Use your actual Prisma Enum types
    dueDate: string;
    responsiblePersons: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | string; // Use your actual Prisma Enum types
    description: string | null;
    // Note: contractId is determined by the existing activity record, not the body.
}

/**
 * Handles PUT requests to update a specific Contract Activity.
 * Route: /api/contracts/activity/[activityId]
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // 1. Check HTTP Method
    if (req.method !== 'PUT') {
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const { activityId } = req.query;
    const body = req.body as UpdateActivityBody;

    if (typeof activityId !== 'string') {
        return res.status(400).json({ message: 'Invalid Activity ID provided.' });
    }

    // 2. Simple Data Validation (Ensure required fields are present)
    if (!body.title || !body.activityType || !body.dueDate || !body.status) {
        return res.status(400).json({ message: 'Missing required fields: title, activityType, dueDate, and status.' });
    }

    try {
        // Prepare the data payload for Prisma update
        const dataToUpdate: Prisma.ContractActivityModelUpdateInput = {
            title: body.title,
            activeType: body.activityType as any, // Cast to any to handle type compatibility with Prisma Enum
            dueDate: new Date(body.dueDate),
            responsiblePersons: body.responsiblePersons,
            status: body.status as any, // Cast to any for Prisma Enum
            description: body.description,
            updatedAt: new Date(), // Explicitly set the update timestamp
        };

        // 3. Update the record in the database
        const updatedActivity = await prisma.contractActivityModel.update({
            where: {
                id: activityId,
            },
            data: dataToUpdate,
        });

        // 4. Return the updated activity object
        // The frontend (handleUpdateActivity) is expecting this object.
        return res.status(200).json(updatedActivity);

    } catch (error) {
        console.error('API Error updating contract activity:', error);

        // Handle specific Prisma errors (e.g., record not found)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ message: `Activity with ID ${activityId} not found.` });
        }

        return res.status(500).json({ 
            message: 'Failed to update contract activity due to a server error.', 
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
        });
    }
}