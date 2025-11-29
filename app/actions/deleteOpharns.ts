import prisma from "@/app/libs/prismadb";

// Define the type for the IDs deleted for better logging
interface DeletionResult {
    count: number;
}

/**
 * Finds and deletes all StrategyOutput records that are 'orphaned' 
 * because they are missing a link to a parent Strategy model 
 * via the Outcome and Goal relations.
 */
export async function deleteOrphanedStrategyOutputs(): Promise<DeletionResult> {
    console.log("Starting cleanup for orphaned StrategyOutput records...");
    
    try {
        // 1. Find all StrategyOutput records where the nested Strategy relation is null.
        // This targets the structure: StrategyOutput -> Outcome -> Goal -> Strategy (null)
        const deletionResult: DeletionResult = await prisma.strategyOutput.deleteMany({
            where: {
                // Step 1: Check if the Outcome relation exists and meets criteria
                outcome: {
                    is: {
                        // Step 2: Check if the Goal relation exists under the Outcome
                        goal: {
                            is: {
                                // Step 3: Check if the Strategy relation under the Goal is null
                                strategy: {
                                    is: null, // Targets records where Strategy is missing/null
                                },
                                // Optionally, include other criteria to ensure the Goal itself exists
                                id: {
                                    not: undefined
                                }
                            }
                        }
                    }
                }
            },
        });

        console.log(`\n✅ Successfully deleted ${deletionResult.count} orphaned StrategyOutput records.`);
        return deletionResult;

    } catch (error) {
        console.error("❌ Error deleting orphaned StrategyOutputs. Data integrity may be compromised.", error);
        // It's crucial to handle cascades. If StrategyOutput has dependents (like Activities),
        // your Prisma schema must have `onDelete: Cascade` defined for those relations,
        // otherwise this operation might fail (or only delete the StrategyOutput without cleaning up children).
        throw new Error("Deletion failed due to a database error.");
    } finally {
        // Ensure the database connection is closed after the operation
        await prisma.$disconnect();
    }
}

// Execute the cleanup function
deleteOrphanedStrategyOutputs();