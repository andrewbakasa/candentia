import prisma from "@/app/libs/prismadb";
import { Prisma } from "@prisma/client"; // Import Prisma for types/client

// Define the type for the included invoice to ensure type safety
// This is a custom type built from Prisma's generated types if you have them,
// or you can define an explicit fragment.
// For simplicity and dependency on the model structure:
type InvoiceWithCustomer = Prisma.InvoiceGetPayload<{
  include: { customer: true };
}>;


export async function generateMetadata({ 
  params
}: {
  params: { id: string; };
}) {
  
  // 1. Eager-load the 'customer' relation
  const invoice: InvoiceWithCustomer | null = await prisma.invoice.findUnique({
    where: {
      id: params.id,
    },
    include: {
      customer: true, // Fetch the related Customer data
    }
  });

  // Default title if invoice is not found
  if (!invoice) {
    return {
      title: "Invoice Not Found",
    };
  }
  
  // 2. Construct a richer title using customer and totalAmount
  const formattedTotal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // Assuming USD, adjust as needed
  }).format(invoice.totalAmount);

  const title = `Invoice #${invoice.invoiceNumber} for ${invoice.customer.name} - Total: ${formattedTotal}`;
    
  return {
    title: title,
    // Add a description for better SEO/sharing context
    description: `Details for Invoice #${invoice.invoiceNumber} issued to ${invoice.customer.name} on ${invoice.invoiceDate.toLocaleDateString()}. Status: ${invoice.status}. Amount Due: ${formattedTotal}.`,
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
// import prisma from "@/app/libs/prismadb";
// export async function generateMetadata({ 
//   params
//  }: {
//   params: { id: string; };
//  }) {
 
//   const defect = await prisma.defect.findUnique({
//     where: {
//       id: params.id,
//     }
//   });


    
//   return {
//     title: `Defect: ${defect?.title}` || "Defect",
//   };
// }
// const DefectLayout = async ({
//   children,
// }: {
//   children: React.ReactNode;
// }) => {

 

//   return (
//     <>
//       {children}
//     </>
//   );
// };

// export default DefectLayout;

