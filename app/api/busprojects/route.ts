import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb'; 
import getCurrentUser from '@/app/actions/getCurrentUser';
// Assuming these service functions exist and handle Prisma logic
import { createNewProject, getProjectsList } from '@/app/busprojects/_components/Services';

/**
 * Handles the creation of a new business project proposal.
 * @param req The incoming request object.
 * @returns A NextResponse containing the created project or an error message.
 */
export async function POST(req: Request) {
    const currentUser = await getCurrentUser();
    
    // 1. Authentication Check
    if (!currentUser) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, description } = body;

        // 2. Basic Validation: Corrected field names
        if (!title || !description) {
            return new NextResponse(
                JSON.stringify({ message: 'Missing required fields: title, description.' }),
                { status: 400 }
            );
        }

        // 3. Service Call to Create Project
        const newProject = await createNewProject({
            title,
            description,
            userId: currentUser.id, // The ID of the logged-in proposer
        });

        // 4. Return Success Response (201 Created)
        return NextResponse.json(newProject, { status: 201 });

    } catch (error: any) {
        console.error('[API_POST_PROJECT_ERROR]:', error);

        // 5. Return Generic Error Response (500 Internal Server Error)
        return new NextResponse(
            JSON.stringify({ message: `Failed to create project: ${error.message || 'An unknown server error occurred.'}` }),
            { status: 500 }
        );
    }
}


/**
 * Handles fetching the list of all active business projects.
 * @param req The incoming request object (unused, but required by Next.js).
 * @returns A NextResponse containing the list of projects or an error message.
 */
export async function GET() {
    const currentUser = await getCurrentUser();
    
    // 1. Authentication Check
    if (!currentUser) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // 2. Service Call to Get Project List
        const projects = await getProjectsList();
        
        // 3. Return Success Response (200 OK)
        return NextResponse.json(projects, { status: 200 });

    } catch (error: any) {
        console.error('[API_GET_PROJECT_ERROR]:', error);
        
        // 4. Return Generic Error Response (500 Internal Server Error)
        return new NextResponse(
            JSON.stringify({ message: `Failed to fetch projects: ${error.message || 'An unknown server error occurred.'}` }),
            { status: 500 }
        );
    }
}