// /app/api/busprojects/[id]/comment/route.ts (App Router structure)
import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import { addProjectComment } from '@/app/bps/_components/Services'; // Assuming this service function exists

/**
 * Handles posting a new comment to a specific project.
 * @param req The incoming request object.
 * @param { params: { id: string } } The context object containing the dynamic route parameter (project ID).
 * @returns A NextResponse containing the created comment or an error message.
 */
export async function POST(
    req: Request, 
    { params }: { params: { id: string } } // Correct way to receive dynamic route parameters
) {
    const projectId = params.id;
    const currentUser = await getCurrentUser();
    
    // 1. Authentication Check
    if (!currentUser) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const { content } = body;

        // 2. Basic Validation: Ensure content and projectId are present
        if (!content) {
            return new NextResponse(
                JSON.stringify({ message: 'Missing required field: content.' }),
                { status: 400 }
            );
        }
        
        if (!projectId) {
            return new NextResponse(
                JSON.stringify({ message: 'Missing required route parameter: Project ID.' }),
                { status: 400 }
            );
        }

        // 3. Service Call to Add Comment
        // Note: The service layer should handle adding the comment to the database.
        const newComment = await addProjectComment(projectId, currentUser.id, content);

        // 4. Return Success Response (201 Created)
        return NextResponse.json(newComment, { status: 201 });

    } catch (error: any) {
        console.error('[API_POST_PROJECT_COMMENT_ERROR]:', error);

        // 5. Return Generic Error Response (500 Internal Server Error)
        return new NextResponse(
            JSON.stringify({ message: `Failed to add comment: ${error.message || 'An unknown server error occurred.'}` }),
            { status: 500 }
        );
    }
}