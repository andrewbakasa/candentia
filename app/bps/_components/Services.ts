// /lib/services/projectService.ts

import { PrismaClient, BusinessProjectModel, ProjectToUserRating, ProjectProgress } from '@prisma/client';
import { Commenter, ProjectListItem } from '../BusinessProjectClient';
import { Decimal } from '@prisma/client/runtime/library';

// NOTE: Initialize Prisma Client once
const prisma = new PrismaClient();

// Types for better clarity in the service layer
export type ProjectDetails = BusinessProjectModel & {
    comments: { content: string, userId: string }[];
    projectToUserRatings: ProjectToUserRating[];
    // Add user/proposer details if you populate the relation
};

// Type for the data that can be updated in a project
// Matches the fields added in the improved schema
export interface ProjectUpdateData {
    title?: string;
    description?: string;
    progress?: ProjectProgress;
    irr?: number | null;
    npv?: number | null;
    riskScore?: number | null;
    projectRanking?: number | null;
    initialInvestmentUsd?: number | null ;
    monthlyOpexUsd?: number | null ;
    notes?: string | null;
    // Add other editable fields here as needed
}
// Interface for updating a comment (NEW)
export interface CommentUpdateParams {
    commentId: string;
    newContent: string;
    authorId: string; // ID of the user attempting the update (for authorization)
}
export async function getProjectsList() {
    // Select all scalar fields by default and explicitly include related models
    const projects = await prisma.businessProjectModel.findMany({
        where: { active: true, visible: true },
        
        // REMOVED top-level 'select' block. 
        // All scalar fields (id, title, progress, npv, etc.) are included automatically.

        include: {
            // Keep _count here as it's a special field
            _count: {
                select: { comments: true },
            },
            
            // Include commenter details for the front-end hover/modal feature
            comments: {
                select: { // Use select here to only fetch user data, not the comment body
                    user: { 
                        select: { 
                            id: true, 
                            email: true, 
                            // Assuming 'name' and 'image' are available for UI display
                            name: true, 
                            image: true,
                        } 
                    } 
                }, 
                orderBy: { timestamp: 'asc' },
            },
             // ✅ NEW: Include the proposer details using the relation name 'proposer'
            proposer: {
            select: {
                id: true,
                email: true,
                // Add other required user fields here (e.g., name, image)
            }
            },
            projectToUserRatings: true, // Ratings list (for calculating average if rating isn't pre-calculated)
        },
        
        // --- ORDERING ---
        orderBy: [
            { npv: 'desc' }, 
            { rating: 'desc' },
            { createdAt: 'desc' },
        ],
    });
    
    // The comments data fetched here will be an array of objects like:
    // [{ user: { id: '...', name: '...', email: '...' } }, ...]
    // You will need to process this in your client-side map function 
    // to extract a unique list of commenters.

    console.log("Services.ts:", projects);
    return projects;
}

export async function createNewProject(data: { title: string, description: string, userId: string }) {
    // Add validation/sanitization here
    const newProject = await prisma.businessProjectModel.create({
        data: {
            title: data.title,
            description: data.description,
            userId: data.userId,
            order: 0, // Set default order
            visible: true, // Default to visible upon creation
            progress: 'PROPOSAL', // Ensure new projects start at PROPOSAL stage
        },
    });
    return newProject;
}

// ----------------------------------------------------------------------
// 2. Project Detail and Interaction
// ----------------------------------------------------------------------

export async function getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
    const project = await prisma.businessProjectModel.findUnique({
        where: { id: projectId },
        include: {
            comments: {
                include: { user: { select: { id: true, email: true } } }, // Include commenter
                orderBy: { timestamp: 'asc' },
            },
            projectToUserRatings: true, // Ratings list
        },
    });

    if (project) {
        // Increment view count (fire and forget)
        prisma.businessProjectModel.update({
            where: { id: projectId },
            data: { viewCount: { increment: 1 } },
        }).catch(e => console.error("Could not update view count:", e));
    }

    return project as ProjectDetails | null;
}

/**
 * 3. NEW: Project Editing Function
 * Used by the PATCH API route to update core project data.
 * This is crucial for adhering to the "Executive Committee Review" (Section 4) 
 * and updating the evaluation criteria (Section 5) in your guidelines.
 */
export async function updateProjectDetails(projectId: string, data: ProjectUpdateData) {
    // Use the Prisma Decimal type constructor for financial inputs to ensure precision
    const dataWithDecimals: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            if (key === 'initialInvestmentUsd' || key === 'monthlyOpexUsd') {
                // Convert number/string to Decimal object, or set null
                dataWithDecimals[key] = (value === null || typeof value === 'undefined') 
                                        ? null 
                                        : new Decimal(value as number | string);
            } else {
                dataWithDecimals[key] = value;
            }
        }
    }

    const updatedProject = await prisma.businessProjectModel.update({
        where: { id: projectId },
        data: dataWithDecimals,
    });
    
    return updatedProject;
}

// ----------------------------------------------------------------------
// 4. Commenting and Rating (Unchanged)
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// 4. Commenting and Rating
// ----------------------------------------------------------------------

/**
 * Updates the content of an existing comment, ensuring the user is the original author.
 * @param data Parameters including commentId, newContent, and authorId for authorization.
 * @returns The updated comment object or null if not found/unauthorized.
 * @throws Error if the user is not the author.
 */
export async function updateProjectComment(data: CommentUpdateParams) {
    // 1. Check if the comment exists and if the user is the author
    const existingComment = await prisma.projectComment.findUnique({
        where: { id: data.commentId },
        select: { userId: true },
    });

    if (!existingComment) {
        // Return null so the API route can send a 404
        return null;
    }

    if (existingComment.userId !== data.authorId) {
        // Throw an error to be caught by the API route's catch block, resulting in a 500 or specific handling
        throw new Error("Unauthorized: Only the original author can edit this comment.");
    }
    
    // 2. Perform the update
    const updatedComment = await prisma.projectComment.update({
        where: { id: data.commentId },
        data: {
            content: data.newContent, // Update the content
            // The `updatedAt` field should automatically update via Prisma's defaults if configured
        },
    });

    return updatedComment;
}

export async function addProjectComment(projectId: string, userId: string, content: string) {
    // Content is expected to be a string from the Editor
    const newComment = await prisma.projectComment.create({
        data: {
            projectId,
            userId,
            content,
        },
    });
    return newComment;
}

export async function updateProjectRating(projectId: string, userId: string, rate: number) {
    // Validate rate (e.g., 1-5)
    if (rate < 1 || rate > 5) {
        throw new Error('Rating must be between 1 and 5.');
    }

    // Upsert: update if a rating exists, create otherwise
    const ratingEntry = await prisma.projectToUserRating.upsert({
        where: {
            projectId_userId: { // Unique constraint defined in Prisma model
                projectId: projectId,
                userId: userId,
            },
        },
        update: { rate: rate },
        create: {
            projectId: projectId,
            userId: userId,
            rate: rate,
        },
    });

    // Recalculate and update the overall project rating asynchronously
    recalculateProjectRating(projectId).catch(e => console.error("Rating recalculation failed:", e));

    return ratingEntry;
}

// Helper to recalculate average rating
async function recalculateProjectRating(projectId: string) {
    const result = await prisma.projectToUserRating.aggregate({
        _avg: { rate: true },
        where: { projectId: projectId },
    });

    const newRating = result._avg.rate;

    await prisma.businessProjectModel.update({
        where: { id: projectId },
        data: { rating: newRating },
    });
}

