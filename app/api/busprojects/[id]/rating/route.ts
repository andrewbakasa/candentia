// /app/api/busprojects/[id]/rate/route.ts (App Router structure)
import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
// Note: Assuming updateProjectRating is correctly implemented in Services
import { updateProjectRating } from '@/app/busprojects/_components/Services'; 

/**
 * Handles posting a rating for a specific project.
 * @param req The incoming request object.
 * @param { params: { id: string } } The context object containing the dynamic route parameter (project ID).
 * @returns A NextResponse containing the updated rating data or an error message.
 */
export async function POST(
    req: Request, 
    { params }: { params: { id: string } } // Correct way to receive dynamic route parameters in App Router
) {
    const projectId = params.id;
    const currentUser = await getCurrentUser();
    
    // 1. Authentication Check
    if (!currentUser) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const { rate } = body;
        
        // Ensure rate is a number (or convert it if it's a string, as required by your original logic)
        const rateValue = typeof rate === 'number' ? rate : parseInt(rate as string, 10);

        // 2. Basic Validation: Check Project ID and Rating value (1-5)
        if (!projectId || typeof projectId !== 'string') {
            return NextResponse.json({ message: 'Missing required route parameter: Project ID.' }, { status: 400 });
        }

        if (isNaN(rateValue) || rateValue < 1 || rateValue > 5) {
            // Using NextResponse.json for structured JSON error response
            return NextResponse.json({ message: 'A valid rating value (1-5) is required.' }, { status: 400 });
        }
        
        // 3. Service Call to Update/Submit Rating
        const rating = await updateProjectRating(projectId, currentUser.id, rateValue);

        // 4. Return Success Response (201 Created or Updated)
        return NextResponse.json(rating, { status: 201 });

    } catch (error: any) {
        console.error('[API_POST_PROJECT_RATING_ERROR]:', error);

        // 5. Return Generic Error Response (500 Internal Server Error)
        return new NextResponse(
            JSON.stringify({ message: `Failed to submit rating: ${error.message || 'An unknown server error occurred.'}` }),
            { status: 500 }
        );
    }
}


