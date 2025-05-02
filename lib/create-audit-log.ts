//import { auth, currentUser } from "@clerk/nextjs";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";

interface Props {
  entityId: string;
  entityType: ENTITY_TYPE,
  entityTitle: string;
  action: ACTION;
};

export const createAuditLog = async (props: Props) => {
  try {
    //const { orgId } = auth();
    //const user = await currentUser();
    const user = await getCurrentUser();
    // if (!user || !orgId) {
    //   throw new Error("User not found!");
    // }

    const { entityId, entityType, entityTitle, action } = props;
    //console.log (user)
    await prisma.auditLog.create({
      data: {
        orgId:'10102',
        entityId,
        entityType,
        entityTitle,
        action,
        userId: user?.id,
        userImage: user?.image || '/public/images/placeholder.jpg',
        userName: user?.name || " unknown"
      }
    });
  } catch (error) {
    console.log("[AUDIT_LOG_ERROR]", error);
  }
}