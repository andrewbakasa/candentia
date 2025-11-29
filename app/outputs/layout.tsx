
import prisma from "@/app/libs/prismadb";
export async function generateMetadata({ 
  //params
 }: {
 // params: { id: string; };
 }) {
  
    
  return {
    title: `All list of Strategic Outputs Open`,// Some outputs are closed, some are wip in progress some are for future
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

