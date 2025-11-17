import { NextRequest, NextResponse } from 'next/server';
import prisma from "../../../../libs/prismadb" // Assuming this path is correct
import { Prisma } from '@prisma/client';

// Define the expected structure of the activity update request body
interface UpdateActivityBody {
    title: string;
    activeType: 'LEGAL_REVIEW' | 'NEGOTIATION' | 'EXECUTION' | 'ARCHIVING' | string; // Use your actual Prisma Enum types
    dueDate: string;
    responsiblePersons: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | string; // Use your actual Prisma Enum types
    description: string | null;
}

/**
 * Handles PUT requests to update a specific Contract Activity.
 * Route: /api/contracts/activity/[activityId]
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { activityId: string } } // Access path parameters via the second argument
) {
    const activityId = params.activityId;

    // 1. Parse Request Body
    let body: UpdateActivityBody;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json(
            { message: 'Bad Request: Invalid JSON body.' },
            { status: 400 }
        );
    }
    
    // Note: If you have an `getCurrentUser` or similar function for auth, 
    // it should be called here (e.g., const currUser = await getCurrentUser();)

    // 2. Simple Data Validation (Ensure required fields are present)
    if (!body.title || !body.activeType || !body.dueDate || !body.status) {
        return NextResponse.json(
            { message: 'Missing required fields: title, activityType, dueDate, and status.' }, 
            { status: 400 }
        );
    }

    // Correcting a field name in the original payload structure to match the model
    // Assuming 'activityType' is the correct field name in your Prisma model.
    const activityTypeField = 'activeType' in body ? body.activeType : 'activeType'; 

    try {
        // Prepare the data payload for Prisma update
        const dataToUpdate: Prisma.ContractActivityModelUpdateInput = {
            title: body.title,
            // Use the determined field name and cast for Prisma Enum
            [activityTypeField]: body.activeType as any, 
            dueDate: new Date(body.dueDate), // Convert string to Date
            responsiblePersons: body.responsiblePersons,
            status: body.status as any, // Cast for Prisma Enum
            description: body.description,
            updatedAt: new Date(), // Explicitly set the update timestamp
        };

        // 3. Update the record in the database
        const updatedActivity = await prisma.contractActivityModel.update({
            where: {
                id: activityId,
                // Optional: Add authorization checks here if needed, e.g.,
                // contract: { internalOwnerId: currUser.id }
            },
            data: dataToUpdate,
        });

        // 4. Return the updated activity object
        return NextResponse.json(updatedActivity, { status: 200 });

    } catch (error) {
        console.error('API Error updating contract activity:', error);

        // Handle specific Prisma errors (e.g., record not found)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json(
                { message: `Activity with ID ${activityId} not found.` },
                { status: 404 }
            );
        }

        // Handle other server errors
        return NextResponse.json(
            { message: 'Failed to update contract activity due to a server error.' },
            { status: 500 }
        );
    }
}
// import { NextApiRequest, NextApiResponse } from 'next';
// import prisma from "../../../../libs/prismadb" // Assuming this path is correct
// import { Prisma } from '@prisma/client';

// // Define the expected structure of the activity update request body
// interface UpdateActivityBody {
//     title: string;
//     activityType: 'LEGAL_REVIEW' | 'NEGOTIATION' | 'EXECUTION' | 'ARCHIVING' | string; // Use your actual Prisma Enum types
//     dueDate: string;
//     responsiblePersons: string;
//     status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | string; // Use your actual Prisma Enum types
//     description: string | null;
//     // Note: contractId is determined by the existing activity record, not the body.
// }

// /**
//  * Handles POST requests to update a specific Contract Activity.
//  * Route: /api/contracts/activity/[activityId]
//  */
// export default async function handler(
//     req: NextApiRequest,
//     res: NextApiResponse
// ) {
//     // 1. Check HTTP Method
//     if (req.method !== 'POST') {
//         res.setHeader('Allow', ['POST']);
//         return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
//     }

//     const { activityId } = req.query;
//     const body = req.body as UpdateActivityBody;

//     if (typeof activityId !== 'string') {
//         return res.status(400).json({ message: 'Invalid Activity ID provided.' });
//     }

//     // 2. Simple Data Validation (Ensure required fields are present)
//     if (!body.title || !body.activityType || !body.dueDate || !body.status) {
//         return res.status(400).json({ message: 'Missing required fields: title, activityType, dueDate, and status.' });
//     }

//     try {
//         // Prepare the data payload for Prisma update
//         const dataToUpdate: Prisma.ContractActivityModelUpdateInput = {
//             title: body.title,
//             activeType: body.activityType as any, // Cast to any to handle type compatibility with Prisma Enum
//             dueDate: new Date(body.dueDate),
//             responsiblePersons: body.responsiblePersons,
//             status: body.status as any, // Cast to any for Prisma Enum
//             description: body.description,
//             updatedAt: new Date(), // Explicitly set the update timestamp
//         };

//         // 3. Update the record in the database
//         const updatedActivity = await prisma.contractActivityModel.update({
//             where: {
//                 id: activityId,
//             },
//             data: dataToUpdate,
//         });

//         // 4. Return the updated activity object
//         // The frontend (handleUpdateActivity) is expecting this object.
//         return res.status(200).json(updatedActivity);

//     } catch (error) {
//         console.error('API Error updating contract activity:', error);

//         // Handle specific Prisma errors (e.g., record not found)
//         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
//             return res.status(404).json({ message: `Activity with ID ${activityId} not found.` });
//         }

//         return res.status(500).json({ 
//             message: 'Failed to update contract activity due to a server error.', 
//             error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
//         });
//     }
// }