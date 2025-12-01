// // pages/api/outputs/activity/comment/[commentId].ts


import { NextRequest, NextResponse } from 'next/server';
import prisma from "../../../../../libs/prismadb"; 
import getCurrentUser from '@/app/actions/getCurrentUser';

// Define the expected structure of the request body for an update
interface UpdateCommentBody {
    content: string;
}

/**
 * Common handler for authentication and authorization checks.
 * @param request The incoming NextRequest.
 * @param id The ID of the comment from the URL parameter.
 * @returns The current user ID and the existing comment, or a NextResponse object for early exit.
 */
async function authAndAuthorize(commentId: string) {
    // 1. 🔒 Authentication Check
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.id) {
        return { 
            response: NextResponse.json(
                { message: 'Unauthorized: Authentication required.' },
                { status: 401 }
            ) 
        };
    }
    const currentUserId = currentUser.id;

    // 2. Find the comment
    const existingComment = await prisma.strategyActivityComment.findUnique({
        where: { id: commentId },
        select: { authorId: true }
    });

    if (!existingComment) {
        return { 
            response: NextResponse.json(
                { message: 'Comment not found.' },
                { status: 404 }
            ) 
        };
    }

    // 3. 🔑 Authorization Check (Only author can modify)
    if (existingComment.authorId !== currentUserId) {
        return { 
            response: NextResponse.json(
                { message: 'Forbidden: You can only modify your own comments.' },
                { status: 403 }
            ) 
        };
    }

    // Success
    return { currentUserId, existingComment };
}

/**
 * Handles PATCH requests to edit an existing Strategy Activity Comment.
 * Route: /api/outputs/activity/comment/[commentId]
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const commentId = params.id;

    try {
        // Run Auth/Auth checks
        const result = await authAndAuthorize(commentId);
        if (result.response) return result.response;
        // const { currentUserId, existingComment } = result; // Destructure if needed later

        // 1. 📝 Parse Request Body & Input Validation
        const body: UpdateCommentBody = await request.json();
        const { content } = body;

        if (!content || typeof content !== 'string' || content.trim() === '') {
            return NextResponse.json(
                { message: 'Missing or invalid required field: content.' },
                { status: 400 }
            );
        }

        // 2. 💾 Database Operation: Update the comment
        const updatedComment = await prisma.strategyActivityComment.update({
            where: { id: commentId },
            data: { content: content.trim() },
            include: {
                author: {
                    select: { id: true, name: true }
                }
            }
        });

        // 3. ✅ Success Response
        return NextResponse.json(updatedComment, { status: 200 });

    } catch (error) {
        // 4. ⚠️ Error Handling
        console.error(`Error updating comment ID ${commentId}:`, error);
        return NextResponse.json(
            { message: 'Internal Server Error while updating comment.' },
            { status: 500 }
        );
    }
}

/**
 * Handles DELETE requests to remove an existing Strategy Activity Comment.
 * Route: /api/outputs/activity/comment/[commentId]
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const commentId = params.id;

    try {
        // Run Auth/Auth checks
        const result = await authAndAuthorize(commentId);
        if (result.response) return result.response;
        // const { currentUserId, existingComment } = result; // Destructure if needed later

        // 1. 💾 Database Operation: Delete the comment
        await prisma.strategyActivityComment.delete({
            where: { id: commentId },
        });

        // 2. ✅ Success Response (204 No Content)
        return new NextResponse(null, { status: 204 });

    } catch (error) {
        // 3. ⚠️ Error Handling
        console.error(`Error deleting comment ID ${commentId}:`, error);
        return NextResponse.json(
            { message: 'Internal Server Error while deleting comment.' },
            { status: 500 }
        );
    }
}
// import { NextApiRequest, NextApiResponse } from 'next';
// import prisma from "../../../../../libs/prismadb"; 
// import { getSession } from 'next-auth/react'; 

// export default async function handle(req: NextApiRequest, res: NextApiResponse) {
//     const { commentId } = req.query; // Get ID from the URL path

//     // 1. Authentication Check (Applies to all methods)
//     const session = await getSession({ req });
//     if (!session || !session.user || !session.user.id) {
//         return res.status(401).json({ message: 'Unauthorized. Please log in.' });
//     }
//     const currentUserId = session.user.id;

//     try {
//         // Find the comment and check authorization
//         const existingComment = await prisma.strategyActivityComment.findUnique({
//             where: { id: String(commentId) },
//             select: { authorId: true }
//         });

//         if (!existingComment) {
//             return res.status(404).json({ message: 'Comment not found.' });
//         }
        
//         // 2. Authorization Check (Only author can edit/delete)
//         if (existingComment.authorId !== currentUserId) {
//             return res.status(403).json({ message: 'Forbidden. You can only modify your own comments.' });
//         }

//         // --- PUT/PATCH: Edit Comment ---
//         if (req.method === 'PUT' || req.method === 'PATCH') {
//             const { content } = req.body;
            
//             if (!content || typeof content !== 'string' || content.trim() === '') {
//                 return res.status(400).json({ message: 'Missing or invalid required field: content.' });
//             }

//             const updatedComment = await prisma.strategyActivityComment.update({
//                 where: { id: String(commentId) },
//                 data: { content: content.trim() },
//                 include: {
//                     author: {
//                         select: { id: true, name: true } 
//                     }
//                 }
//             });

//             return res.status(200).json(updatedComment);
//         }

//         // --- DELETE: Remove Comment ---
//         if (req.method === 'DELETE') {
            
//             await prisma.strategyActivityComment.delete({
//                 where: { id: String(commentId) },
//             });

//             // 204 No Content for successful deletion
//             return res.status(204).end(); 
//         }

//         // --- Method Not Allowed ---
//         return res.status(405).json({ message: 'Method Not Allowed' });

//     } catch (error) {
//         console.error(`Error processing comment ID ${commentId}:`, error);
//         return res.status(500).json({ message: 'Internal Server Error.' });
//     }
// }