
import EmptyState from "../components/EmptyState";
import ClientOnly from "../components/ClientOnly";

import getCurrentUser from "../actions/getCurrentUser";
import CardsClient from "./CardsClient";
import getArchivedCards from "../actions/getArchivedCards";


const ProjectsPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <ClientOnly>
        <EmptyState
          title="Unauthorized"
          subtitle="Please login"
        />
      </ClientOnly>
    );
  }


  const cards = await getArchivedCards();
 

  if (cards.length === 0) {
    return (
      <ClientOnly>
        <EmptyState
          title="No archived cards found"
          subtitle="Looks like you havent any archived cards."
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <CardsClient
        cards={cards}
        currentUser={currentUser}
      />
    </ClientOnly>
  );
}
 
export default ProjectsPage;


