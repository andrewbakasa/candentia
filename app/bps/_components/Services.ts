// /lib/services/projectService.ts
import { PrismaClient, BusinessProjectModel, ProjectToUserRating } from '@prisma/client';

// NOTE: Initialize Prisma Client once
const prisma = new PrismaClient();

// Types for better clarity in the service layer
export type ProjectDetails = BusinessProjectModel & {
    comments: { content: string, userId: string }[];
    projectToUserRatings: ProjectToUserRating[];
    // Add user/proposer details if you populate the relation
};

/**
 * 1. Project Listing and Creation
 */
export async function getProjectsList() {
    // Select essential fields for the list view
    const projects = await prisma.businessProjectModel.findMany({
        where: { active: true, visible: true },
        select: {
            id: true,
            title: true,
            description: true,
            progress: true,
            rating: true, // Use the pre-calculated rating
            viewCount: true,
            timestamp: true,
            userId: true,
            _count: {
                select: { comments: true },
            },
        },
        orderBy: { timestamp: 'desc' }, // Latest proposals first
    });

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
        },
    });
    return newProject;
}

/**
 * 2. Project Detail and Interaction
 */
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