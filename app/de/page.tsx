import getCurrentUser from "@/app/actions/getCurrentUser";
import Container from "@/app/components/Container";
import DefectListClient from "./DefectListClient";
const ProjectsPage = async () => {
    const currentUser = await getCurrentUser(); 
    return (
        <Container>
            <DefectListClient
                // Pass the array of correctly serialized project data
                currentUser={currentUser} // May be null
            />
        </Container>
    );
}

export default ProjectsPage;