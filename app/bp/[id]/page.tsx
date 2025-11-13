import prisma from "@/app/libs/prismadb";
import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import Container from "@/app/components/Container";
import ProjectDetailPage from "./BusinessClient"; // Assuming BusinessClient.tsx is the path to ProjectDetailPage

interface IParams {
  id?: string;
}

const ProjectPage = async ({ params }: { params: IParams }) => {
  const currentUser = await getCurrentUser(); // currentUser can be null if unlogged

  const id = params.id;
  let proj: any;
  
  try {
    // 2a. Fetch the project, including its ratings and comments.
    proj = await prisma.businessProjectModel.findUnique({
      where: {
        id: id,
        active: true,
      },
      include: {
        // MANDATORY: Include the ratings relation
        projectToUserRatings: true,
        // MANDATORY: Include the comments relation, and include the associated user for each comment
        comments: {
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        // Add other required user fields here if necessary (e.g., name, image)
                    }
                }
            },
            orderBy: {
                timestamp: 'asc', // Order comments chronologically
            }
        },
        // ✅ NEW: Include the proposer details using the relation name 'proposer'
        proposer: {
          select: {
            id: true,
            email: true,
            // Add other required user fields here (e.g., name, image)
          }
        }
      } as any, // Use as any to manage complex relation typing with BusinessProjectModel
    });

  } catch (error) {
    console.error(`[PROJECT_PAGE_ERROR] Database error for ID ${id}:`, error);
    // 'proj' remains null if the fetch failed.
  }

  // --- 3. SECURITY & NOT FOUND CHECK ---
  if (!proj) {
    return (
      <Container>
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-gray-900">Project Not Found</h2>
          <p className="text-gray-500 mt-2">The project you are looking for does not exist, may have been deleted, or is archived.</p>
        </div>
      </Container>
    );
  }

  // --- 4. DATA SERIALIZATION ---
  // Ensure the date objects are serialized to strings before passing to the Client Component
  const safeProject = {
    ...proj,
    // Safely serialize required Date objects from the Prisma Model
    createdAt: proj.createdAt.toISOString(),
    updatedAt: proj.updatedAt.toISOString(),
    // Ensure all comments have serializable dates too
    comments: proj.comments.map((comment: any) => ({
        ...comment,
        createdAt: proj.createdAt.toISOString(),
       updatedAt: proj.updatedAt.toISOString(),
    })),
  };

  // --- 5. RENDER CLIENT COMPONENT ---
  return (
    <Container>
      <ProjectDetailPage
        // Pass the properly serialized data structure
        project={safeProject as any} 
        currentUser={currentUser} // May be null
      />
    </Container>
  );
}

export default ProjectPage;