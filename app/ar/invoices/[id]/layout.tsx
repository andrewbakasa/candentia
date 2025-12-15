import prisma from "@/app/libs/prismadb";
export async function generateMetadata({ 
  params
 }: {
  params: { id: string; };
 }) {
 
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: params.id,
    }
  });


    
  return {
    title: `Invoice: ${invoice?.invoiceNumber} {${invoice?.subTotal}}` || "Invoice",
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

