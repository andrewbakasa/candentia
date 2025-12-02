
import prisma from '../libs/prismadb'; 
import { Prisma } from '@prisma/client'; 

/**
 * Migration function to update ALL Defect records to ensure 'createdAt' and 'updatedAt' 
 * fields have the current timestamp.
 * * NOTE: This uses prisma.defect.updateMany() without a 'where' clause, meaning it 
 * overwrites these fields for every record in the table. This is the fastest way 
 * to perform a full migration sweep.
 */
export async function migrateDefectTimestamps() {
    console.log("Starting full Defect timestamp migration to set 'createdAt' and 'updatedAt' fields...");

    const currentDate = new Date();

    try {
        // Step 1: Update all records using updateMany with no 'where' clause.
        // This is the most efficient way to achieve a bulk update across the entire table.
        const result = await prisma.defect.updateMany({
            data: {
                createdAt: currentDate,
                updatedAt: currentDate,
            }
        });
        
        console.log(`Successfully updated timestamps on ${result.count} Defect records.`);

    } catch (error) {
        console.error("Migration failed due to an error during update process:", error);
    }
}

// Example usage (typically called from a custom migration script or startup process)
// migrateDefectTimestamps()
//   .catch(e => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
// import prisma from "../libs/prismadb" 
// import { Prisma } from '@prisma/client'; // Import Prisma namespace for type casting


// /**
//  * Migration function to update all Defect records that are missing 
//  * required 'createdAt' or 'updatedAt' timestamps.
//  * * This is necessary to correct historical data that was created before 
//  * the @default(now()) and @updatedAt directives were added to the schema.
//  */
// export async function migrateDefectTimestamps() {
//     console.log("Starting Defect timestamp migration to set missing 'createdAt' and 'updatedAt' fields...");

//     const currentDate = new Date();

//     try {
//         // We define the filter to explicitly check for null values using the standard SQL approach.
//         // We use 'as any' on the null value to temporarily bypass the TypeScript error, 
//         // as the schema now declares the fields as non-nullable, but the legacy data holds 'null'.
//         const missingFieldFilter: Prisma.DefectWhereInput = {
//             OR: [
//                 { createdAt: null as any }, 
//                 { updatedAt: null as any }  
//             ]
//         };

//         // Step 1: Find all Defect records where createdAt or updatedAt is explicitly null/missing.
//         const defectsToMigrate = await prisma.defect.findMany({
//             where: missingFieldFilter,
//             // Select minimal fields required for checking and updating
//             select: { id: true, createdAt: true, updatedAt: true }
//         });

//         if (defectsToMigrate.length === 0) {
//             console.log("No Defect records found requiring timestamp migration. All records appear valid.");
//             return;
//         }

//         console.log(`Found ${defectsToMigrate.length} Defect records needing timestamp correction...`);
        
//         let updateCount = 0;

//         // Step 2: Iterate and update each record.
//         for (const defect of defectsToMigrate) {
            
//             // Object to hold only the fields that need updating
//             const updateData: { createdAt?: Date, updatedAt?: Date } = {};

//             // Check if the retrieved value is truly null
//             if (defect.createdAt === null) {
//                 updateData.createdAt = currentDate;
//             }

//             if (defect.updatedAt === null) {
//                 updateData.updatedAt = currentDate;
//             }

//             // Only perform the update if at least one field needs correction
//             if (Object.keys(updateData).length > 0) {
//                  await prisma.defect.update({
//                     where: { id: defect.id },
//                     data: updateData,
//                 });
//                 updateCount++;
//             }
//         }
        
//         console.log(`Successfully corrected timestamps on ${updateCount} Defect records.`);

//     } catch (error) {
//         console.error("Migration failed due to an error during update process:", error);
//     }
// }

// Example usage (typically called from a custom migration script or startup process)
// migrateDefectTimestamps()
//   .catch(e => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

// Example usage (typically called from a custom migration script or startup process)
// migrateDefectTimestamps()
//   .catch(e => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });