import getCurrentUser from "@/app/actions/getCurrentUser";
import Container from "@/app/components/Container";
import ProjectListPage, { Commenter } from "./BusinessProjectClient"; 
import { getProjectsList } from "./_components/Services";
// Import the service function


// --- 1. UPDATED TYPE DEFINITION (Includes Financial Metrics) ---
type SafeProjectListItem = {
    id: string;
    title: string;
    progress: string;
    rating: number | null;
    commentCount: number;
    commenters: Commenter[]; // List of users who have left comments
    // --- NEW FINANCIAL FIELDS ADDED ---
    npv: number | null; // Net Present Value
    irr: number | null; // Internal Rate of Return (as percentage)
    roi: number | null; // Return on Investment (as multiple, e.g., 2.5)
    paybackPeriod: number | null; // Payback Period in years/months
    // --- END NEW FIELDS ---
    createdAt: string; 
    updatedAt: string;
    riskScore: number | null;
    projectRanking: number | null;
};

/**
 * Server Component to fetch the list of business projects and render the client list view.
 */
const ProjectsPage = async () => {
    const currentUser = await getCurrentUser(); 
    // The Awaited type from getProjectsList must now include the financial fields
    let proj: Awaited<ReturnType<typeof getProjectsList>> = [];

    // --- 2. FETCH DATA EFFICIENTLY USING SERVICE LAYER ---
    try {
        // Use the dedicated service function to fetch the projects list.
        // It is assumed getProjectsList now retrieves the financial fields.
        const projectsWithCount = await getProjectsList(); 
        
        proj = projectsWithCount;

    } catch (error) {
        console.error(`[PROJECTS_LIST_PAGE_ERROR] Database error fetching list via service:`, error);
    }

    // --- 3. DATA SERIALIZATION (MAPPING THE ARRAY) ---
    const safeProjects: SafeProjectListItem[] = proj.map((p) => {
        // Type assertion: Treat the comments array as CommentWithUser[] to access 'user' safely
        const commentsWithUsers = (p.comments || []) as { user: Commenter }[];

        // Safely extract _count.comments.
        const commentCount = (p as any)._count?.comments || 0; 
        
        // Extract and de-duplicate unique commenters
        const uniqueCommenters: Commenter[] = Array.from(
            new Map(commentsWithUsers.map(comment => [comment.user.id, comment.user])).values()
        );
        
        return {
            id: p.id,
            title: p.title,
            progress: p.progress,
            rating: p.rating,
            commentCount: commentCount, 
            
            // --- PASS THROUGH FINANCIAL METRICS ---
            // Assuming these are numbers (or null) and can be passed directly.
            npv: (p as any).npv || null, 
            irr: (p as any).irr || null,
            roi: (p as any).roi || null,
            riskScore: (p as any).riskScore || null,
            projectRanking: (p as any).projectRanking || null,
            paybackPeriod: (p as any).paybackPeriod || null,
            
            // Assign the de-duplicated list to the 'commenters' field
            commenters: uniqueCommenters, 
            
            // --- END FINANCIAL METRICS ---
            
            // Serialize Date objects to strings
            createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
        }
    });


    // --- 4. RENDER CLIENT COMPONENT ---
    return (
        <Container>
            <ProjectListPage 
                // Pass the array of correctly serialized project data
                projects={safeProjects} 
                currentUser={currentUser} // May be null
            />
        </Container>
    );
}

export default ProjectsPage;
// import getCurrentUser from "@/app/actions/getCurrentUser";
// import Container from "@/app/components/Container";
// import ProjectListPage, { Commenter } from "./BusinessProjectClient"; 
// import { getProjectsList } from "./_components/Services";
// // Import the service function
// //import { getProjectsList } from "@/lib/services/projectService"; 


// // --- 1. UPDATED TYPE DEFINITION (Includes Financial Metrics) ---
// type SafeProjectListItem = {
//     id: string;
//     title: string;
//     progress: string;
//     rating: number | null;
//     commentCount: number;
//     commenters: Commenter[]; // List of users who have left comments
//     // --- NEW FINANCIAL FIELDS ADDED ---
//     npv: number | null; // Net Present Value
//     irr: number | null; // Internal Rate of Return (as percentage)
//     roi: number | null; // Return on Investment (as multiple, e.g., 2.5)
//     paybackPeriod: number | null; // Payback Period in years/months
//     // --- END NEW FIELDS ---
//     createdAt: string; 
//     updatedAt: string;
//     riskScore: number | null;
//     projectRanking: number | null;
// };

// /**
//  * Server Component to fetch the list of business projects and render the client list view.
//  */
// const ProjectsPage = async () => {
//     const currentUser = await getCurrentUser(); 
//     // The Awaited type from getProjectsList must now include the financial fields
//     let proj: Awaited<ReturnType<typeof getProjectsList>> = [];

//     // --- 2. FETCH DATA EFFICIENTLY USING SERVICE LAYER ---
//     try {
//         // Use the dedicated service function to fetch the projects list.
//         // It is assumed getProjectsList now retrieves the financial fields.
//         const projectsWithCount = await getProjectsList(); 
        
//         proj = projectsWithCount;

//     } catch (error) {
//         console.error(`[PROJECTS_LIST_PAGE_ERROR] Database error fetching list via service:`, error);
//     }

//     // --- 3. DATA SERIALIZATION (MAPPING THE ARRAY) ---
//     const safeProjects: SafeProjectListItem[] = proj.map((p) => {
//           // Type assertion: Treat the comments array as CommentWithUser[] to access 'user' safely
//                 const commentsWithUsers = (p.comments || []) as { user: Commenter }[];

//         // Safely extract _count.comments.
//         const commentCount = (p as any)._count?.comments || 0; 
//          const uniqueCommenters: Commenter[] = Array.from(
//                     new Map(commentsWithUsers.map(comment => [comment.user.id, comment.user])).values()
//                 );
//         return {
//             id: p.id,
//             title: p.title,
//             progress: p.progress,
//             rating: p.rating,
//             commentCount: commentCount, 
            
//             // --- PASS THROUGH FINANCIAL METRICS ---
//             // Assuming these are numbers (or null) and can be passed directly.
//             npv: (p as any).npv || null, 
//             irr: (p as any).irr || null,
//             roi: (p as any).roi || null,
//             riskScore: (p as any).riskScore || null,
//             projectRanking: (p as any).projectRanking || null,
//             paybackPeriod: (p as any).paybackPeriod || null,
//              // 2. Assign the de-duplicated list to the 'commenters' field
//                     commenters: uniqueCommenters, // Type is now correctly inferred as Commenter[]
//             // --- END FINANCIAL METRICS ---
            
//             // Serialize Date objects to strings
//             createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
//             updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
//         }
//     });


//     // --- 4. RENDER CLIENT COMPONENT ---
//     return (
//         <Container>
//             <ProjectListPage 
//                 // Pass the array of correctly serialized project data
//                 projects={safeProjects} 
//                 currentUser={currentUser} // May be null
//             />
//         </Container>
//     );
// }

// export default ProjectsPage;