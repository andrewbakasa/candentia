
import { Metadata } from 'next';

export const metadata: Metadata = { // Explicitly type metadata
  title: 'Media',
  description: 'Media Management',
};

const MediaLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {

  // You can make the title dynamic if needed:
  // const dynamicTitle = `Media - Board ${params.boardId}`;
  // metadata.title = dynamicTitle; // Update metadata if dynamic

  return (
    <>
      {children}
    </>
  );
};

export default MediaLayout;
