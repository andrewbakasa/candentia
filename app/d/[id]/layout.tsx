import prisma from "@/app/libs/prismadb";
export async function generateMetadata({ 
  params
 }: {
  params: { id: string; };
 }) {
  console.log(`id: ${params.id}`)
  const card = await prisma.card.findUnique({
    where: {
      id: params.id,
    }
  });

  return {
    title: card?.title || "Card",
  };
}
const MediaLayout = async ({
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

export default MediaLayout;

