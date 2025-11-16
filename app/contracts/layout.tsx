
import prisma from "@/app/libs/prismadb";
export async function generateMetadata({ 
  //params
 }: {
 // params: { id: string; };
 }) {
  
    
  return {
    title: `All list of contracts`,
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

