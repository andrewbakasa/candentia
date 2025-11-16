
import prisma from "@/app/libs/prismadb";
export async function generateMetadata({ 
  params
 }: {
  params: { id: string; };
 }) {
  //console.log(`id: ${params.id}`)
  const contract = await prisma.contractModel.findUnique({
    where: {
      id: params.id,
    }
  });


    
  return {
    title: contract?.title || "Contract",
  };
}
const ContractLayout = async ({
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

export default ContractLayout;

