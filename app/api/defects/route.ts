import { NextRequest, NextResponse } from 'next/server';
// Assuming the following imports are correctly defined in your environment
import prisma from "../../libs/prismadb"; 
import getCurrentUser from '@/app/actions/getCurrentUser';
// ✅ UPDATED: Added DefectType to imports
import { Priority, DefectStatus, DefectType } from '@prisma/client';

/**
 * Handles the POST request to create a new Defect record.
 * Route: /api/defects
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Authentication Check
        const currentUser = await getCurrentUser(); 
        if (!currentUser) {
            console.log('[DEBUG] POST failed: User not authenticated.');
            return NextResponse.json(
                { message: 'Authentication required to log a Defect.' },
                { status: 401 } // 401 Unauthorized
            );
        }

        // 2. Parse Request Body - MOVED INSIDE TRY BLOCK
        const body = await request.json();
        console.log('[DEBUG] Request Body Received:', body);
        
        // Destructure necessary fields
        const {
            title,
            description,
            area,
            equipmentTag,
            priority,
            breakdownRelated,
            breakdownId,
            identificationDate,
            // ✅ ADDED: Destructure defectType from the body
            defectType, 
        } = body;

        // 3. Validation and Data Conversion
        
        // Ensure all non-nullable required fields are present and not empty strings
        if (!title || title.trim() === '' || 
            !description || description.trim() === '' ) {
            console.warn('[VALIDATION ERROR] Missing mandatory fields for POST:', body);
            return NextResponse.json(
                { message: 'Missing required fields: title, description, and equipmentTag are mandatory and cannot be empty.' },
                { status: 400 } // 400 Bad Request
            );
        }

        // Ensure Priority is a valid enum value if provided
        if (priority && !Object.values(Priority).includes(priority)) {
            return NextResponse.json(
                { message: `Invalid value for priority. Must be one of: ${Object.values(Priority).join(', ')}.` },
                { status: 400 }
            );
        }
        
        // ✅ ADDED: DefectType validation
        if (defectType && !Object.values(DefectType).includes(defectType)) {
            return NextResponse.json(
                { message: `Invalid value for defect type. Must be one of: ${Object.values(DefectType).join(', ')}.` },
                { status: 400 }
            );
        }

        // Prepare data object for Prisma CREATE operation
        const defectData = {
            title,
            description,
            equipmentTag,
            area: area || null, // Normalize empty string/undefined to null for nullable field
            
            // ✅ ADDED: Map defectType (frontend name) to type (backend model field)
            type: defectType || DefectType.MECHANICAL, // Use value or default
            
            priority: priority || Priority.MEDIUM, // Default if not provided
            breakdownRelated: Boolean(breakdownRelated),
            breakdownId: breakdownId || null, // Normalize empty string/undefined to null

            // Convert identificationDate string to Date object, or let Prisma default to now()
            identificationDate: identificationDate ? new Date(identificationDate) : undefined, 
            
            // Status defaults to 'IDENTIFIED' in the Prisma model if not provided, but setting explicitly ensures correctness.
            status: DefectStatus.IDENTIFIED, 
        };

        console.log('[DEBUG] Data prepared for Defect creation:', defectData);

        // 4. Create the Defect record in the database (CORRECT OPERATION: create)
        const newDefect = await prisma.defect.create({
            data: defectData,
            select: { // Select fields to return to the client
                id: true,
                identificationDate: true,
                title: true,
                description: true,
                area: true,
                equipmentTag: true,
                // ✅ ADDED: Include the new type field in the response
                type: true, 
                priority: true,
                status: true,
                breakdownRelated: true,
                breakdownId: true,
            },
        });

        // 5. Return the created Defect object with status 201 (Created)
        return NextResponse.json(newDefect, { status: 201 });
        
    } catch (error: any) {
        console.error('Defect creation failed:', error);
        
        // Handle unique constraint errors (P2002) - likely on equipmentTag
        if (error.code === 'P2002') {
             const target = error.meta?.target.join(', ') || 'field';
             return NextResponse.json(
                 { message: `Conflict: A defect with this ${target} already exists.` },
                 { status: 409 } // 409 Conflict
             );
        }
        
        // Handle JSON parsing error or other unhandled errors
        const errorMessage = error.message || 'Internal Server Error: Failed to log new Defect.';

        return NextResponse.json(
            { message: errorMessage, detail: 'An unexpected server error occurred.' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // 1. Authentication Check
        const currentUser = await getCurrentUser(); 
        if (!currentUser) {
            console.log('[DEBUG] GET failed: User not authenticated.');
            return NextResponse.json(
                { message: 'Authentication required to view Defects.' },
                { status: 401 } // 401 Unauthorized
            );
        }

        // 2. Fetch all Defects from the database
        // You can add filtering, sorting, or pagination here if needed.
        const defects = await prisma.defect.findMany({
            orderBy: {
                identificationDate: 'desc', // Order by newest first
            },
            select: { // Ensure we only return necessary fields
                id: true,
                identificationDate: true,
                title: true,
                description: true,
                area: true,
                equipmentTag: true,
                // ✅ ADDED: Include the new type field in the response
                type: true, 
                priority: true,
                status: true,
                breakdownRelated: true,
                breakdownId: true,
                // Add other fields you need for the client page
            },
        });

        console.log(`[DEBUG] Successfully fetched ${defects.length} defects.`);
        
        // 3. Return the array of defects with status 200 (OK)
        return NextResponse.json(defects, { status: 200 });

    } catch (error: any) {
        console.error('Defect retrieval failed:', error);
        
        const errorMessage = error.message || 'Internal Server Error: Failed to retrieve Defects.';

        return NextResponse.json(
            { message: errorMessage, detail: 'An unexpected server error occurred during GET.' },
            { status: 500 }
        );
    }
}
// import { NextRequest, NextResponse } from 'next/server';
// // Assuming the following imports are correctly defined in your environment
// import prisma from "../../libs/prismadb"; 
// import getCurrentUser from '@/app/actions/getCurrentUser';
// import { Priority, DefectStatus } from '@prisma/client';

// /**
//  * Handles the POST request to create a new Defect record.
//  * Route: /api/defects
//  */
// export async function POST(request: NextRequest) {
//     try {
//         // 1. Authentication Check
//         const currentUser = await getCurrentUser(); 
//         if (!currentUser) {
//             console.log('[DEBUG] POST failed: User not authenticated.');
//             return NextResponse.json(
//                 { message: 'Authentication required to log a Defect.' },
//                 { status: 401 } // 401 Unauthorized
//             );
//         }

//         // 2. Parse Request Body - MOVED INSIDE TRY BLOCK
//         const body = await request.json();
//         console.log('[DEBUG] Request Body Received:', body);
        
//         // Destructure necessary fields
//         const {
//             title,
//             description,
//             area,
//             equipmentTag,
//             priority,
//             breakdownRelated,
//             breakdownId,
//             identificationDate
//         } = body;

//         // 3. Validation and Data Conversion
        
//         // Ensure all non-nullable required fields are present and not empty strings
//         if (!title || title.trim() === '' || 
//             !description || description.trim() === '' ) {
//             console.warn('[VALIDATION ERROR] Missing mandatory fields for POST:', body);
//             return NextResponse.json(
//                 { message: 'Missing required fields: title, description, and equipmentTag are mandatory and cannot be empty.' },
//                 { status: 400 } // 400 Bad Request
//             );
//         }

//         // Ensure Priority is a valid enum value if provided
//         if (priority && !Object.values(Priority).includes(priority)) {
//             return NextResponse.json(
//                 { message: `Invalid value for priority. Must be one of: ${Object.values(Priority).join(', ')}.` },
//                 { status: 400 }
//             );
//         }

//         // Prepare data object for Prisma CREATE operation
//         const defectData = {
//             title,
//             description,
//             equipmentTag,
//             area: area || null, // Normalize empty string/undefined to null for nullable field
//             priority: priority || Priority.MEDIUM, // Default if not provided
//             breakdownRelated: Boolean(breakdownRelated),
//             breakdownId: breakdownId || null, // Normalize empty string/undefined to null

//             // Convert identificationDate string to Date object, or let Prisma default to now()
//             identificationDate: identificationDate ? new Date(identificationDate) : undefined, 
            
//             // Status defaults to 'IDENTIFIED' in the Prisma model if not provided, but setting explicitly ensures correctness.
//             status: DefectStatus.IDENTIFIED, 
//         };

//         console.log('[DEBUG] Data prepared for Defect creation:', defectData);

//         // 4. Create the Defect record in the database (CORRECT OPERATION: create)
//         const newDefect = await prisma.defect.create({
//             data: defectData,
//             select: { // Select fields to return to the client
//                 id: true,
//                 identificationDate: true,
//                 title: true,
//                 description: true,
//                 area: true,
//                 equipmentTag: true,
//                 priority: true,
//                 status: true,
//                 breakdownRelated: true,
//                 breakdownId: true,
//             },
//         });

//         // 5. Return the created Defect object with status 201 (Created)
//         return NextResponse.json(newDefect, { status: 201 });
        
//     } catch (error: any) {
//         console.error('Defect creation failed:', error);
        
//         // Handle unique constraint errors (P2002) - likely on equipmentTag
//         if (error.code === 'P2002') {
//              const target = error.meta?.target.join(', ') || 'field';
//              return NextResponse.json(
//                  { message: `Conflict: A defect with this ${target} already exists.` },
//                  { status: 409 } // 409 Conflict
//              );
//         }
        
//         // Handle JSON parsing error or other unhandled errors
//         const errorMessage = error.message || 'Internal Server Error: Failed to log new Defect.';

//         return NextResponse.json(
//             { message: errorMessage, detail: 'An unexpected server error occurred.' },
//             { status: 500 }
//         );
//     }
// }

// export async function GET(request: NextRequest) {
//     try {
//         // 1. Authentication Check
//         const currentUser = await getCurrentUser(); 
//         if (!currentUser) {
//             console.log('[DEBUG] GET failed: User not authenticated.');
//             return NextResponse.json(
//                 { message: 'Authentication required to view Defects.' },
//                 { status: 401 } // 401 Unauthorized
//             );
//         }

//         // 2. Fetch all Defects from the database
//         // You can add filtering, sorting, or pagination here if needed.
//         const defects = await prisma.defect.findMany({
//             orderBy: {
//                 identificationDate: 'desc', // Order by newest first
//             },
//             select: { // Ensure we only return necessary fields
//                 id: true,
//                 identificationDate: true,
//                 title: true,
//                 description: true,
//                 area: true,
//                 equipmentTag: true,
//                 priority: true,
//                 status: true,
//                 breakdownRelated: true,
//                 breakdownId: true,
//                 // Add other fields you need for the client page
//             },
//         });

//         console.log(`[DEBUG] Successfully fetched ${defects.length} defects.`);
        
//         // 3. Return the array of defects with status 200 (OK)
//         return NextResponse.json(defects, { status: 200 });

//     } catch (error: any) {
//         console.error('Defect retrieval failed:', error);
        
//         const errorMessage = error.message || 'Internal Server Error: Failed to retrieve Defects.';

//         return NextResponse.json(
//             { message: errorMessage, detail: 'An unexpected server error occurred during GET.' },
//             { status: 500 }
//         );
//     }
// }