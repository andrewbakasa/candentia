import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import Container from "@/app/components/Container";
// Assuming the client component is correctly named and located
import ProjectListPage from "./BusinessProjectClient"; 
import { BusinessProjectModel } from "@prisma/client";
import ProjectDetailPage from "./BusinessProjectClient";

// Define a safe type for what we will pass to the client component
type SafeProjectListItem = {
    id: string;
    title: string;
    progress: string;
    rating: number | null;
    commentCount: number;
    createdAt: string;
    updatedAt: string;
};

// Since this is a list page, we typically do not need `params.id`
const ProjectsPage = async () => {
    const currentUser = await getCurrentUser(); 
    let proj: (BusinessProjectModel & { _count: { comments: number } })[] = [];

    // --- 1. FETCH DATA EFFICIENTLY FOR THE LIST VIEW ---
    try {
        // Fetch necessary fields + comment count. Avoid fetching large nested relations.
        const projectsWithCount = await prisma.businessProjectModel.findMany({
            where: {
                active: true,
            },
            select: {
                id: true,
                title: true,
                progress: true,
                rating: true, // Assuming rating is pre-calculated/stored on the model
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        comments: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc', // Sort by newest first
            },
        }) as any; 
        
        proj = projectsWithCount;

    } catch (error) {
        console.error(`[PROJECTS_LIST_PAGE_ERROR] Database error:`, error);
        // We let 'proj' remain an empty array on error, and the client component handles the display.
    }

    // --- 2. DATA SERIALIZATION (MAPPING THE ARRAY) ---
    const safeProjects: any[] = proj.map((p) => ({
        id: p.id,
        title: p.title,
        progress: p.progress,
        rating: p.rating,
        // Extract the comment count from the aggregated field
        commentCount: p._count.comments, 
        // Serialize all date objects
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
    }));


    // --- 3. RENDER CLIENT COMPONENT ---
    return (
        <Container>
            <ProjectDetailPage
                // Pass the array of correctly serialized project data
                projects={safeProjects} 
                currentUser={currentUser} // May be null
            />
        </Container>
    );
}

export default ProjectsPage;