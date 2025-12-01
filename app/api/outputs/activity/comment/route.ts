// pages/api/outputs/activity/comment.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from "../../../../libs/prismadb"; 
import getCurrentUser from '@/app/actions/getCurrentUser';

// Define the expected structure of the request body (authorId is REMOVED)
interface CommentBody {
    activityId: string;
    content: string;
}

/**
 * Handles POST requests to create a new Strategy Activity Comment.
 * Route: /api/outputs/activity/comment
 */
export async function POST(request: NextRequest) {
    
    const currentUser = await getCurrentUser();

    // 1. 🔒 Authentication Check
    if (!currentUser || !currentUser.id) {
        return NextResponse.json(
            { message: 'Unauthorized: Authentication required to post a comment.' },
            { status: 401 }
        );
    }
    // 💡 Get the current user ID directly from the session/token.
    const currentUserId = currentUser.id; 

    // 2. 📝 Parse Request Body & Type Assertion
    let body: CommentBody; 
    try {
        body = await request.json() as CommentBody;
    } catch (e) {
        return NextResponse.json(
            { message: 'Invalid JSON format in request body.' },
            { status: 400 } 
        );
    } 
    
    // 3. 🎯 Input Validation (authorId is REMOVED from destructuring and check)
    const { activityId, content } = body;

    if (!activityId || !content) {
        return NextResponse.json(
            { message: 'Missing required fields: activityId or content.' },
            { status: 400 }
        );
    }
    
    // 4. 🔑 Security Check (REMOVED: Use the ID from the session directly, no need to check against body)
    
    try {
        // 5. Check if the associated StrategyActivity exists
        const activityExists = await prisma.strategyActivity.findUnique({
            where: { id: activityId },
            select: { id: true }
        });

        if (!activityExists) {
            return NextResponse.json(
                { message: 'Activity not found.' },
                { status: 404 }
            );
        }

        // 6. 💾 Database Operation (Use currentUserId from session for the author)
        const newComment = await prisma.strategyActivityComment.create({
            data: {
                content: content.trim(),
                outputActivity: { connect: { id: activityId } }, 
                // *** CRITICAL FIX: Use currentUserId from the session/auth token ***
                author: { connect: { id: currentUserId } }, 
            },
            include: {
                author: {
                    select: { id: true, name: true }
                }
            }
        });

        // 7. ✅ Success Response
        return NextResponse.json(newComment, { status: 201 });

    } catch (error) {
        // 8. ⚠️ Error Handling
        console.error('Error adding comment:', error);
        
        let message = 'Internal Server Error while adding comment.';
        // ... error handling logic ...
        
        return NextResponse.json(
            { message },
            { status: 500 }
        );
    }
}
