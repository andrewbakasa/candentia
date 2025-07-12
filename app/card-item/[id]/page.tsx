
// app/item-component-page/[id]/page.tsx
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "../../actions/getCurrentUser";
import EmptyState from "@/app/components/EmptyState";
import ClientOnly from "@/app/components/ClientOnly";
import ItemComponentInterface from "./ItemComponentInterface"; // Assuming this component can handle Card details
import { notFound } from "next/navigation"; // Import notFound from next/navigation
import { Prisma } from '@prisma/client'; // Import Prisma for type inference
import { CardWithDetails } from "@/types"; // Make sure this type is correctly defined to include all relations
import getUserNames from "@/app/actions/getUserNames";
import getTagNames from "@/app/actions/getTagNames";

// Define a type for the Card with its relations for better type safety
// This leverages Prisma's generated types for include relations.

interface ItemComponentPageProps {
  params: {
    id: string; // This ID refers to the Card's ID
  };
}


export async function generateMetadata({ params }: ItemComponentPageProps) {
  const card = await prisma.card.findUnique({
    where: {
      id: params.id,
    },
    select: {
      title: true,
      description: true, // Assuming your Card model has a 'description' field
      list: {
        select: {
          board: {
            select: {
              title: true,
            },
          },
          title: true,
        },
      },
      tags: { // Include tags for potential keywords
        select: {
          name: true,
        },
      },
    },
  });

  if (!card) {
    return {
      title: "Card Not Found | Luminous 3D",
      description: "The requested card could not be found.",
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_APP_URL}/item-component-page/${params.id}`,
      },
      robots: {
        index: false, // Don't index a 404 page
        follow: false,
      },
    };
  }

  const cardTitle = card.title || "Untitled Card";
  const listTitle = card.list?.title || "Unknown List";
  const boardTitle = card.list?.board?.title;
  //correct format here....................
  const cardDescription = card.title || `Details for ${cardTitle}.`//card.description || `Details for ${cardTitle}.`;

  // Generate keywords from card title, list title, board title, and tags
  const keywords = [
    cardTitle,
    listTitle,
    boardTitle,
    ...(card.tags?.map(tag => tag.name) || []),
    "card details",
    "Luminous 3D",
  ].filter(Boolean).join(', '); // Filter out any undefined/null entries and join

  return {
    title: `${cardTitle} | ${listTitle} ${boardTitle ? `(${boardTitle})` : ''} | Luminous 3D`,
    description: boardTitle
      ? `${cardDescription} Located in the '${listTitle}' list, part of the '${boardTitle}' board.`
      : `${cardDescription} Located in the '${listTitle}' list.`,
    keywords: keywords,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL}/item-component-page/${params.id}`,
    },
    openGraph: {
      title: cardTitle,
      description: boardTitle
        ? `${cardDescription} Located in the '${listTitle}' list, part of the '${boardTitle}' board.`
        : `${cardDescription} Located in the '${listTitle}' list.`,
      type: 'article',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/item-component-page/${params.id}`,
      siteName: 'Luminous 3D',
      // images: card.cardImages && card.cardImages.length > 0
      //   ? [{ url: card.cardImages[0].url }]
      //   : [],
    },
    twitter: {
      card: 'summary_large_image', // Or 'summary' if no large image
      title: cardTitle,
      description: boardTitle
        ? `${cardDescription} Located in the '${listTitle}' list, part of the '${boardTitle}' board.`
        : `${cardDescription} Located in the '${listTitle}' list.`,
      // images: card.cardImages && card.cardImages.length > 0
      //   ? [card.cardImages[0].url]
      //   : [],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-snippet': -1,
            'max-image-preview': 'large',
            'max-video-preview': -1,
        },
    },
  };
}

// ---
const ItemComponentPage = async ({
  params,
}: ItemComponentPageProps) => {
  const currentUser = await getCurrentUser();

 

  let card: CardWithDetails | null = null; // Explicitly type card

  try {
    card = await prisma.card.findUnique({
      where: {
        id: params.id,
      },
      include: {
        cardImages: true, // Include associated CardImages
        user: true, // Include the User who created the card
        tags: true, // Include associated Tags
        comments: { // Include associated Comments
          include: {
            user: true, // Include the User who made the comment
          },
        },
        list: { // Include the List this card belongs to
          include: {
            board: true, // Include the Board through the List
          },
        },
        taggedUsers: { // Include users tagged in this card
          include: {
            user: true, // Include the User details for tagged users
          },
        },
      },
    });

  } catch (err: any) {
    console.error("Error fetching card details:", err);
    // You might want to log this error to an external service like Sentry
    return (
      <ClientOnly>
        <EmptyState
          title="Something went wrong!"
          subtitle={`Could not load card details. Please try again later.`} // Simplified message for user
        />
      </ClientOnly>
    );
  }

  // If card is null after the fetch, it means it wasn't found.
  // Use Next.js's notFound() function for proper 404 handling.
  if (!card) {
    notFound();
  }

  const userNames =await getUserNames()
   const tagNames =await getTagNames()
  // Pass the fetched card directly to the client component
  return (
    <ClientOnly>
      <ItemComponentInterface
        records={card} // card is guaranteed to be non-null here
        currentUser={currentUser}
        userNames={userNames}
        tagNames={tagNames}
      />
    </ClientOnly>
  );
};

export default ItemComponentPage;