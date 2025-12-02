import getCurrentUser from "@/app/actions/getCurrentUser";
import Container from "@/app/components/Container";
import DefectsListPage from "./DefectClientsPage";


/**
 * Server Component to fetch the list of business projects and render the client list view.
 */
const ProjectsPage = async () => {
    const currentUser = await getCurrentUser(); 
    // The Awaited type from getProjectsList must now include the financial fields
 


    // --- 4. RENDER CLIENT COMPONENT ---
    return (
        <Container>
            <DefectsListPage 
                // Pass the array of correctly serialized project data
                currentUser={currentUser} // May be null
            />
        </Container>
    );
}

export default ProjectsPage;