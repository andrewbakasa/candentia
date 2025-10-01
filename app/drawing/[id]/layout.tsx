import prisma from "@/app/libs/prismadb";
export async function generateMetadata({ 
  params
 }: {
  params: { id: string; };
 }) {
  console.log(`id: ${params.id}`)
  const item = await prisma.cardImage.findUnique({
    where: {
      id: params.id,
    }
  });

  return {
    title: item?.fileName || "Drawing #",
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

