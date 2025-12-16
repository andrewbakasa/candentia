import prisma from "@/app/libs/prismadb";
import { Prisma } from "@prisma/client";

// Define a minimal type for the selected fields to ensure type safety.
// This type strictly mirrors the fields requested in the 'select' query below.
type DefectMinimal = Prisma.DefectGetPayload<{
    select: {
        id: true;
        title: true;
        equipmentTag: true;
        status: true;
        type: true;
        priority: true;
        reportedby: true;
        eliminationRecord: { select: { dateClosed: true } };
    };
}>;


/**
 * @description Generates dynamic metadata (title, description) for the Defect detail page.
 * @param {object} params - Contains the 'id' of the Defect from the route segment.
 * @returns {object} The metadata object for the page.
 */
export async function generateMetadata({ 
    params
}: {
    params: { id: string; };
}) {
    
    // 1. Fetch ONLY the required fields using 'select' for optimal performance.
    const defect: DefectMinimal | null = await prisma.defect.findUnique({
        where: {
            id: params.id,
        },
        select: {
            // Core Defect fields
            id: true,
            title: true,
            equipmentTag: true,
            status: true,
            type: true,
            priority: true,
            reportedby: true,
            
            // Related DefectElimination field (only the closure date)
            eliminationRecord: {
                select: {
                    dateClosed: true, 
                }
            },
        }
    });

    // Default title if defect is not found
    if (!defect) {
        return {
            title: "Defect Not Found",
        };
    }
    
    // 2. Construct metadata fields
    const statusText = defect.status;
    const typeText = defect.type;
    const reportedByText = defect.reportedby ? ` (Reported by: ${defect.reportedby})` : '';

    // Primary Title: Short and descriptive for search engines/tabs
    const title = `Defect: ${defect.title} [${defect.equipmentTag}] - Status: ${statusText}`;
    
    // Description: Detailed context for SEO/sharing previews
    const description = 
        `Details for Defect ID ${defect.id} on equipment ${defect.equipmentTag} (${typeText} type). ` +
        `Current Status: ${statusText}. ` +
        `Priority: ${defect.priority}. ` +
        `${defect.eliminationRecord?.dateClosed 
            ? `Closed on: ${defect.eliminationRecord.dateClosed.toLocaleDateString()}.` 
            : 'Still open/in progress.'}` +
        `${reportedByText}`;
        
    return {
        title: title,
        description: description,
    };
}

/**
 * @description Layout component for the Defect detail page.
 * (Typical boilerplate for a page layout in Next.js).
 */
const DefectLayout = async ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return (
        // Renders the child page content (e.g., app/defect/[id]/page.tsx)
        <>
            {children}
        </>
    );
};

export default DefectLayout;