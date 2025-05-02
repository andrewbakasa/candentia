// MediaPage.js
'use server'; // Mark as server component
import getCurrentUser from "../../app/actions/getCurrentUser";
import getUserNames from "../actions/getUserNames";
import ClientOnly from "../components/ClientOnly";
import MediaClient from "./MediaClient";
import getTagNames from "../actions/getTagNames";



const MediaPage = async () => {
  const currentUser = await getCurrentUser();
  const userNames = await getUserNames();
  const tagNames =await getTagNames()
 
  return (
    <ClientOnly>
      <MediaClient 
            currentUser={currentUser}
            tagNames={tagNames}
            userNames={userNames}
           origin="media"
       />
    </ClientOnly>
  );
};

export default MediaPage;

 