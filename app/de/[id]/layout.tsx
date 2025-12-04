import prisma from "@/app/libs/prismadb";
export async function generateMetadata({ 
  params
 }: {
  params: { id: string; };
 }) {
 
  const defect = await prisma.defect.findUnique({
    where: {
      id: params.id,
    }
  });


    
  return {
    title: `Defect: ${defect?.title}` || "Defect",
  };
}
const DefectLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {

 

  return (
    <>
      {children}
    </>
  );
};

export default DefectLayout;

