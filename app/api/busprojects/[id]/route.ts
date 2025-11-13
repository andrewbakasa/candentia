import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';
import { BusinessProjectModel } from '@prisma/client';

/**
 * Type definition for the acceptable fields that can be updated.
 * This should match the fields used in the client-side ProjectEditModal.
 */
interface UpdateProjectData {
    title?: string;
    description?: string;
    progress?: BusinessProjectModel['progress'];
    irr?: number | null;
    npv?: number | null;
    riskScore?: number | null;
    projectRanking?: number | null;
    initialInvestmentUsd?: number | null; // Assuming Decimal types are handled as numbers in input/output
    monthlyOpexUsd?: number | null;
    // Add other editable fields here
}

// --- PATCH Handler for updating project details ---

/**
 * Handles updating the details of a single business project by ID.
 * @param req The incoming request object containing the updated data.
 * @param params Dynamic route parameters containing the project ID.
 * @returns A NextResponse containing the updated project or an error message.
 */
export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const projectId = params.id;
    const currentUser = await getCurrentUser();

    // 1. Authentication Check
    if (!currentUser) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Project ID Check
    if (!projectId || typeof projectId !== 'string') {
        return new NextResponse('Bad Request: Project ID is required.', { status: 400 });
    }
    

    const allowedRoles = [ 'admin', 'executive'];
    const canEditProject = currentUser?.roles.some(role => 
        allowedRoles.some(allowed => allowed.toLowerCase() === role.toLowerCase())
    );

    // 3. Authorization Check (Crucial for Business Model Governance)
    // Placeholder: Only allow users with 'ADMIN' or 'EXECUTIVE' role to edit the core project details.
    if (!canEditProject) {
        // You might want to allow the project's creator/proposer to edit too:
        // const project = await prisma.businessProjectModel.findUnique({ where: { id: projectId }});
        // if (!project || project.userId !== currentUser.id) { ... authorization failed ... }
        return new NextResponse('Forbidden: User is not authorized to edit this project.', { status: 403 });
    }

    try {
        const body: UpdateProjectData = await req.json();

        // 4. Data Validation (Basic)
        // Ensure at least one valid field is provided
        const validKeys = ['title', 'description', 'progress', 'irr', 'npv', 'riskScore', 'projectRanking', 'initialInvestmentUsd', 'monthlyOpexUsd'];
        const updateData: Record<string, any> = {};

        for (const key of validKeys) {
            if (body[key as keyof UpdateProjectData] !== undefined) {
                // Ensure number fields are stored correctly, and null is handled for empty inputs
                if (typeof body[key as keyof UpdateProjectData] === 'number' && isNaN(body[key as keyof UpdateProjectData] as number)) {
                     updateData[key] = null;
                } else {
                     updateData[key] = body[key as keyof UpdateProjectData];
                }
            }
        }
        
        if (Object.keys(updateData).length === 0) {
            return new NextResponse('Bad Request: No valid fields provided for update.', { status: 400 });
        }
        
        // 5. Update Project in Database
        const updatedProject = await prisma.businessProjectModel.update({
            where: {
                id: projectId,
            },
            data: updateData,
            // Only select necessary fields for a lightweight response
            select: {
                id: true,
                title: true,
                updatedAt: true,
                progress: true,
            }
        });
        
        // 6. Return Success Response (200 OK)
        return NextResponse.json(updatedProject);

    } catch (error) {
        console.error(`[PROJECT_PATCH_ERROR] Database update error for ID ${projectId}:`, error);
        
        // 7. Return Generic Error Response (500 Internal Server Error)
        return new NextResponse(
            JSON.stringify({ message: 'Failed to update project details.' }),
            { status: 500 }
        );
    }
}


// --- GET Handler for fetching project details (Original code, included for completeness) ---

/**
 * Handles fetching the details of a single business project by ID.
 * @param req The incoming request object.
 * @param params Dynamic route parameters containing the project ID.
 * @returns A NextResponse containing the project details or an error message.
 */
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const projectId = params.id;
    const currentUser = await getCurrentUser();

    // 1. Authentication Check
    if (!currentUser) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // 2. Project ID Check
    if (!projectId || typeof projectId !== 'string') {
        return new NextResponse('Bad Request: Project ID is required.', { status: 400 });
    }

    try {
        // 3. Fetch the project, including its ratings and comments.
        const project = await prisma.businessProjectModel.findUnique({
            where: {
                id: projectId,
                active: true,
            },
            include: {
                // Include the ratings relation
                projectToUserRatings: true, 
                // Include the comments relation, and include the associated user for each comment
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                // Add other required user fields here if necessary
                            }
                        }
                    },
                    orderBy: {
                        timestamp: 'desc', // Generally newest comments first
                    }
                },
            },
        });

        // 4. Check if the project was found
        if (!project) {
            return new NextResponse('Not Found: Project does not exist or is inactive.', { status: 404 });
        }

        // 5. Calculate the aggregate rating (a common requirement for detail views)
        const ratings = project.projectToUserRatings;
        const ratingSum = ratings.reduce((sum, r) => sum + r.rate, 0);
        const rating = ratings.length > 0 ? ratingSum / ratings.length : null;

        // 6. Structure the response data (omit unnecessary fields if desired, but include the calculated rating)
        const projectResponse = {
            ...project,
            rating: rating, // Add the calculated aggregate rating
        };
        
        // 7. Return Success Response (200 OK)
        return NextResponse.json(projectResponse);

    } catch (error) {
        console.error(`[PROJECT_GET_ERROR] Database error for ID ${projectId}:`, error);
        
        // 8. Return Generic Error Response (500 Internal Server Error)
        return new NextResponse(
            JSON.stringify({ message: 'Failed to fetch project details.' }),
            { status: 500 }
        );
    }
}