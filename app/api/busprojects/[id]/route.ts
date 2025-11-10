import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';

// NOTE: Removed unused imports: createNewProject, getProjectsList

/**
 * Handles fetching the details of a single business project by ID.
 * The data fetched here is used to re-validate the client component state 
 * after a mutation (e.g., rating or commenting).
 * * @param req The incoming request object.
 * @param params Dynamic route parameters containing the project ID.
 * @returns A NextResponse containing the project details or an error message.
 */
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const projectId = params.id;
    const currentUser = await getCurrentUser();

    // 1. Authentication Check (Optional, but good practice for API security)
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
        // NOTE: Must return the fetched data, not 'newProject' as was in the original code.
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