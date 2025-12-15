import prisma from "@/app/libs/prismadb";
export async function generateMetadata({ 
  params
 }: {
  params: { id: string; };
 }) {
 
  const invoice = await prisma.product.findUnique({
    where: {
      id: params.id,
    }
  });


    
  return {
    title: `Product: ${invoice?.name} {${invoice?.sku}}` || "Procut",
  };
}
const InvoiceLayout = async ({
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

export default InvoiceLayout;

