import prisma from "@/app/libs/prismadb";

// Next.js Metadata Function
// This function runs on the server to dynamically generate the page title based on the Strategy ID.
export async function generateMetadata({ 
  params
}: {
  params: { id: string; };
}) {
  
  // Assuming 'prisma' is your Prisma Client instance
// await prisma.strategyOutput.updateMany({
//   where: {
//     // Corresponds to: WHERE "createdAt" IS NULL
//     createdAt: null,
//   },
//   data: {
//     // Corresponds to: SET "createdAt" = NOW()
//     // Prisma automatically uses the database's NOW() function 
//     // when you set a DateTime field to a new Date() object.
//     createdAt: new Date(), 
//   },
// });
  // Fetch the strategy output model from the database using the ID provided in the URL params.
  const strategyOutput = await prisma.strategyOutput.findUnique({
    where: {
      id: params.id,
    }
  });

  // Dynamically set the page title. 
  // Assuming 'name' is the field containing the strategy title in StrategyOutputModel. 
  // If your Prisma model uses 'title', change 'strategyOutput?.name' back to 'strategyOutput?.title'.
  return {
    title: `Strategy Output: ${strategyOutput?.title}` || "Strategy Output",
  };
}

// Next.js Layout Component
// This layout component wraps the page content (children) for the Strategy Output page.
const StrategyLayout = async ({
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

export default StrategyLayout;
