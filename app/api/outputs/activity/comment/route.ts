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
// // pages/api/outputs/activity/comment.ts
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from "../../../../libs/prismadb"; 
// import getCurrentUser from '@/app/actions/getCurrentUser';
// // Define the expected structure of the request body
// interface CommentBody {
//     activityId: string;
//     content: string;
//     authorId: string;
// }

// /**
//  * Handles POST requests to create a new Strategy Activity Comment.
//  * Route: /api/outputs/activity/comment
//  */
// export async function POST(request: NextRequest) {
    
//     // NOTE: Using getCurrentUser() as requested, which should handle session logic
//     // and return the authenticated user object, or null/undefined.
//     const currentUser = await getCurrentUser();

//     // 1. 🔒 Authentication Check (Early Exit)
//     if (!currentUser || !currentUser.id) {
//         return NextResponse.json(
//             { message: 'Unauthorized: Authentication required to post a comment.' },
//             { status: 401 }
//         );
//     }
//     const currentUserId = currentUser.id;

//     // 2. 📝 Parse Request Body & Type Assertion
//     let body: CommentBody; 
//     try {
//         body = await request.json() as CommentBody;
//     } catch (e) {
//         return NextResponse.json(
//             { message: 'Invalid JSON format in request body.' },
//             { status: 400 } 
//         );
//     } 
    
//     // 3. 🎯 Input Validation
//     const { activityId, content, authorId } = body;

//     if (!activityId || !content || !authorId) {
//         return NextResponse.json(
//             { message: 'Missing required fields: activityId, content, and authorId.' },
//             { status: 400 }
//         );
//     }
    
//     // 4. 🔑 Security Check: Ensure the user posting the comment is the logged-in user
//     if (authorId !== currentUserId) {
//         return NextResponse.json(
//             { message: 'Forbidden: Cannot post comment as another user.' },
//             { status: 403 }
//         );
//     }
    
//     try {
//         // 5. Check if the associated StrategyActivity exists
//         const activityExists = await prisma.strategyActivity.findUnique({
//             where: { id: activityId },
//             select: { id: true }
//         });

//         if (!activityExists) {
//             return NextResponse.json(
//                 { message: 'Activity not found.' },
//                 { status: 404 }
//             );
//         }

//         // 6. 💾 Database Operation (using the correct relational syntax)
//         const newComment = await prisma.strategyActivityComment.create({
//             data: {
//                 content: content.trim(),
//                 // Connect the comment to the activity using the relation field name (outputActivity)
//                 outputActivity: { connect: { id: activityId } }, 
//                 // Connect the comment to the author using the relation field name (author)
//                 author: { connect: { id: authorId } },
//             },
//             include: {
//                 author: {
//                     select: { id: true, name: true } // Select minimal author info
//                 }
//             }
//         });

//         // 7. ✅ Success Response
//         return NextResponse.json(newComment, { status: 201 });

//     } catch (error) {
//         // 8. ⚠️ Error Handling
//         console.error('Error adding comment:', error);
        
//         let message = 'Internal Server Error while adding comment.';
//         if (error instanceof Error) {
//             message = `Error processing request: ${error.message}`;
//         }
        
//         return NextResponse.json(
//             { message },
//             { status: 500 }
//         );
//     }
// }
// import { NextApiRequest, NextApiResponse } from 'next';
// import prisma from "../../../../libs/prismadb"; 
// import { getSession } from 'next-auth/react'; // Assuming authentication is used

// export default async function handle(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method !== 'POST') {
//         return res.status(405).json({ message: 'Method Not Allowed' });
//     }

//     const session = await getSession({ req });
//     if (!session || !session.user) {
//         // Assuming your session structure includes user data
//         return res.status(401).json({ message: 'Unauthorized' });
//     }

//     // Input validation
//     const { activityId, content, authorId } = req.body;

//     if (!activityId || !content || !authorId) {
//         return res.status(400).json({ message: 'Missing required fields: activityId, content, and authorId.' });
//     }

//     // Security Check: Ensure the user posting the comment is the logged-in user
//     if (authorId !== session.user.id) {
//         return res.status(403).json({ message: 'Forbidden: Cannot post comment as another user.' });
//     }
    
//     // Check if the associated Activity exists
//     const activityExists = await prisma.strategyActivity.findUnique({
//         where: { id: activityId },
//         select: { id: true }
//     });

//     if (!activityExists) {
//         return res.status(404).json({ message: 'Activity not found.' });
//     }


//     try {
//        const newComment = await prisma.strategyActivityComment.create({
//             data: {
//                 content: content,
//                 // --- FIX: Use the Relation Name ('outputActivity') and 'connect' ---
//                 outputActivity: { connect: { id: activityId } }, 
//                 // You were already using the correct relation syntax for 'author'
//                 author: { connect: { id: authorId } },
//                 // 'likesCount' will automatically default to 0
//             },
//             include: {
//                 author: {
//                     select: { id: true, name: true } // Select minimal author info
//                 }
//             }
//         });

//         // Success response
//         return res.status(201).json(newComment);

//     } catch (error) {
//         console.error('Error adding comment:', error);
//         return res.status(500).json({ message: 'Internal Server Error while adding comment.' });
//     }
// }