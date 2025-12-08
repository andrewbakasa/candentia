import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import Container from "@/app/components/Container";
import { notFound } from 'next/navigation';
import DefectDetailView, { DefectDetailModel } from "./DefectDetailPage"; 


interface IParams {
  id?: string;
}

// Define the route for the main defect list (adjust as necessary)
const ALL_DEFECTS_HREF = '/de';

const DefectPage = async ({ params }: { params: IParams }) => {
  // Fetch the user context
  const currentUser = await getCurrentUser();

  const defectId = params.id;
  let defect: any = null; // Use 'any' before serialization to match Prisma return type

  try {
    if (!defectId) {
      notFound(); // Immediately call notFound if no ID is present
    }

    // 1. Fetch the Defect with ALL its related details
    const result = await prisma.defect.findUnique({
      where: {
        id: defectId,
      },
      include: {
        breakdown: true, // Breakdown: 1-to-1
        eliminationRecord: true, // DefectElimination: 1-to-1
        analyses: true, // AnalysisRecord: 1-to-many
        actions: true, // CorrectiveAction: 1-to-many
        improvementOpportunities: true // INCLUDED
      },
    });

    defect = result;

  } catch (error) {
    console.error(`[DEFECT_PAGE_ERROR] Database error for ID ${defectId}:`, error);
  }

  // --- 2. NOT FOUND CHECK ---
  if (!defect) {
    // If the result is null (e.g., ID not found in database)
    return (
      <Container>
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-gray-900">Defect Record Not Found</h2>
        </div>
      </Container>
    );
  }

  // --- 3. DATA SERIALIZATION ---
  // Convert all nested Date objects to ISO strings before passing to client.
  const safeDefect:DefectDetailModel  = {//DefectDetailModel
    ...defect,
    // Core Defect Date
    identificationDate: defect.identificationDate.toISOString(),

    // Breakdown Relation Serialization
    breakdown: defect.breakdown ? {
      ...defect.breakdown,
      startTime: defect.breakdown.startTime.toISOString(),
      // Ensure property existence before calling toISOString
      endTime: defect.breakdown.endTime ? defect.breakdown.endTime.toISOString() : null,
    } : null,

    // Defect Elimination Relation Serialization
    eliminationRecord: defect.eliminationRecord ? {
      ...defect.eliminationRecord,
      // Ensure property existence before calling toISOString
      dateClosed: defect.eliminationRecord.dateClosed ? defect.eliminationRecord.dateClosed.toISOString() : null,
    } : null,
    
    // Analysis Records (1-to-many) Serialization
    analyses: defect.analyses.map((analysis: any) => ({
      ...analysis,
      analysisDate: analysis.analysisDate.toISOString(),
    })),
    
    // Corrective Actions (1-to-many) Serialization
    actions: defect.actions.map((action: any) => ({
      ...action,
      dueDate: action.dueDate.toISOString(),
      // Ensure property existence before calling toISOString
      completionDate: action.completionDate ? action.completionDate.toISOString() : null,
    })),

    // Improvement Opportunities (1-to-many) Serialization <<<--- NEW BLOCK ADDED HERE
    improvementOpportunities: defect.improvementOpportunities.map((io: any) => ({
      ...io,
      dateIdentified: io.dateIdentified.toISOString(),
      // implementationDate is optional
      implementationDate: io.implementationDate ? io.implementationDate.toISOString() : null,
    })),
  };
 // console.log("safeDefect",safeDefect)
  // --- 4. RENDER CLIENT COMPONENT ---
  return (
    <Container>
      <h1 className="text-4xl font-bold mb-6 hidden">Defect Detail: {safeDefect.title}</h1>
      {/* Pass the new required prop to the client component */}
       <DefectDetailView
        currentUser={currentUser}
        defect={safeDefect}
        allDefectsHref={ALL_DEFECTS_HREF} // <<<--- NEW PROP ADDED HERE --->>>
      /> 
    </Container>
  );
};

export default DefectPage;