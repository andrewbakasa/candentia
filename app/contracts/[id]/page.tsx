import prisma from "@/app/libs/prismadb"; // Using the user's import path for Prisma
import getCurrentUser from "@/app/actions/getCurrentUser"; // Assuming this path is correct
import Container from "@/app/components/Container"; 
import { notFound } from 'next/navigation';
// import { ContractModel } from "@prisma/client";
//import ContractDetail, { ContractModel } from "./ContractDetails";
import { ContractModel } from "../_components/types/contract";
import ContractDetail from "./ContractDetails";

interface IParams {
  id?: string;
}

// Next.js Server Component for fetching contract data
const ContractPage = async ({ params }: { params: IParams }) => {
  // 1. Fetch User (needed for client component permissions/context)
  const currentUser = await getCurrentUser(); 
  
  const contractId = params.id;
  let contract: ContractModel | null = null;
  
  // Basic check for missing ID
  if (!contractId) {
      notFound();
  }

  try {
    // 2. Fetch the contract, including activities (matching the detail component needs)
    contract = await prisma.contractModel.findUnique({
      where: {
        id: contractId,
      },
      include: {
        // MANDATORY: Include the activities relation required by ContractDetail.tsx
        contractActivityModels: true, 
        // Include related user/project models if needed for the detail view:
        // internalOwner: true, 
        // relatedProject: true,
      },
      // Safely cast to ensure type compatibility with ContractModel
    }) as ContractModel | null; 

  } catch (error) {
    console.error(`[CONTRACT_PAGE_ERROR] Database error for ID ${contractId}:`, error);
    // 'contract' remains null if the fetch failed.
  }

  // --- 3. NOT FOUND CHECK ---
  if (!contract) {
    // Renders the structured not found UI
    return (
      <Container>
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-gray-900">Contract Not Found</h2>
          <p className="text-gray-500 mt-2">The contract you are looking for does not exist or is unavailable.</p>
        </div>
      </Container>
    );
  }

  // --- 4. DATA SERIALIZATION ---
  // Ensure all Date objects are converted to strings before passing to the Client Component
  const safeContract = {
    ...contract,
    // Safely serialize required Date objects from the Prisma Model (handling potential nulls)
    createdAt: contract.createdAt ? contract.createdAt.toString() : null,
    updatedAt: contract.updatedAt ? contract.updatedAt.toString() : null,
    effectiveDate: contract.effectiveDate ? contract.effectiveDate.toString() : null,
    expirationDate: contract.expirationDate ? contract.expirationDate.toString() : null,
    
    // Serialize nested activity dates
    contractActivityModels: contract.contractActivityModels.map(activity => ({
      ...activity,
      createdAt: activity.createdAt.toString(),
      updatedAt: activity.updatedAt.toString(),
      dueDate: activity.dueDate.toString(),
    })),
  };

  // --- 5. RENDER CLIENT COMPONENT ---
  return (
    <Container>
      <ContractDetail
        // Pass the properly serialized data structure
        contract={safeContract as any} 
        // If ContractDetail needs the user context, pass it here
        // currentUser={currentUser} 
      />
    </Container>
  );
};

export default ContractPage;