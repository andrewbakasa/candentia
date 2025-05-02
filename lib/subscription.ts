//import { auth } from "@clerk/nextjs";

import prisma from "@/app/libs/prismadb";

const DAY_IN_MS = 86_400_000;

export const checkSubscription = async () => {
  //const { orgId } = auth();

  // if (!orgId) {
  //   return false;
  // }
  let orgId ='1001'
  const orgSubscription = await prisma.orgSubscription.findUnique({
    where: {
       orgId,
    },
    select: {
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripePriceId: true,
    },
  });

  if (!orgSubscription) {
    return false;
  }

  const isValid =
    orgSubscription.stripePriceId &&
    orgSubscription.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now()

  return !!isValid;
};
