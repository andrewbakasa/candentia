import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import { updateProjectComment } from '@/app/bps/_components/Services'; // Assuming this service function exists

/**
 * Handles updating the content of an existing comment on a project.
 * * The route structure is /api/busprojects/[projectId]/comment/[commentId]
 * * @param req The incoming request object (containing new 'content' in the body).
 * @param { params: { id: string, commentId: string } } The context object containing the dynamic route parameters.
 * @returns A NextResponse containing the updated comment or an error message.
 */
export async function POST(
    req: Request, 
    { params }: { params: { commentId: string } } 
) {
    
    const commentId = params.commentId; // Comment ID (the resource to update)
    const currentUser = await getCurrentUser();
     console.log("Here...", commentId,currentUser)
    // 1. Authentication Check
    if (!currentUser) {
        return new NextResponse(JSON.stringify({ message: 'Unauthorized. You must be logged in to update a comment.' }), { status: 401 });
    }

    // 2. ID Validation
    if (!commentId) {
        return new NextResponse(
            JSON.stringify({ message: 'Missing required route parameter: Comment ID.' }),
            { status: 400 }
        );
    }

    try {
        const body = await req.json();
        const { content } = body;
        console.log("body", body)
        // 3. Content Validation
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return new NextResponse(
                JSON.stringify({ message: 'Missing or invalid required field: content for update.' }),
                { status: 400 }
            );
        }
        
        // 4. Service Call to Update Comment
        // The service function should handle the check that currentUser.id is the original author
        const updatedComment = await updateProjectComment({
            commentId: commentId,
            newContent: content,
            authorId: currentUser.id, // Used for authorization check in the service layer
        });

        // 5. Check if the comment was found/updated
        if (!updatedComment) {
            return new NextResponse(
                JSON.stringify({ message: 'Comment not found or you are not authorized to edit it.' }),
                { status: 404 }
            );
        }
        
        // 6. Return Success Response (200 OK for successful update)
        return NextResponse.json(updatedComment, { status: 200 });

    } catch (error: any) {
        console.error(`[API_PATCH_COMMENT_ERROR] for Comment ID ${commentId}:`, error);

        // 7. Return Generic Error Response (500 Internal Server Error)
        return new NextResponse(
            JSON.stringify({ message: `Failed to update comment: ${error.message || 'An unknown server error occurred.'}` }),
            { status: 500 }
        );
    }
}