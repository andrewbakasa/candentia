import prisma from "@/app/libs/prismadb";

import getCurrentUser from "@/app/actions/getCurrentUser";
import MediaClient from "./DrawingItem";

interface MediaPageProps {
  params: {
    id: string;
  };
};

const MediaPage = async ({
  params,
}: MediaPageProps) => {


  const currentUser = await getCurrentUser();
  try {
  
    let drawingItem
    

    drawingItem = await prisma.cardImage.findUnique({
        where: {
            id: params.id,
       },
         
         
      });
    
    
    return (
      <div className="p-0  h-full overflow-x-auto">
         <MediaClient
            currentUser={currentUser}
            drawingItem={drawingItem}
            id={params.id}
          />
       </div>
   );
  
  }catch (err) {
    //console.log(err)
    return {
      error: "Something went wrong!" 
    }
  };
};


export default MediaPage;

