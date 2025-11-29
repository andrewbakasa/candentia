import { NextRequest, NextResponse } from 'next/server';
import prisma from "../../../libs/prismadb"; 
import getCurrentUser from '@/app/actions/getCurrentUser';

// 🚨 Import the generated Prisma types for the model and Enums
import { 
    Prisma, 
    ActivityStatus, 
    ActivityType 
} from '@prisma/client'; 

// --- 1. Update Request Body Interface ---
interface StrategyActivityBody {
    title: string;
    dueDate: string; 
    description: string;
    startDate?: string;
    completionDate?: string;
    progressPercent?: number;
    activityType: ActivityType | string; 
    status: ActivityStatus | string;     
    outputId: string; // The ID of the parent StrategyOutput
}


/**
 * Handles POST requests to create a new Contract Activity (task/follow-up/review)
 * linked to a specific StrategyOutput (outputId).
 * Endpoint: /api/contracts/activity
 * @param request The incoming NextRequest object.
 * @returns A NextResponse containing the created activity or an error message.
 */
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        // 1. 🔒 Authentication Check (Early Exit)
        if (!currentUser) {
            return NextResponse.json(
                { message: 'Unauthorized: Authentication required to create an activity.' },
                { status: 401 }
            );
        }

        // 2. 📝 Parse Request Body & Type Assertion
        // INITIALIZE body to satisfy TypeScript's "used before assignment" check
        let body: StrategyActivityBody = {} as StrategyActivityBody; 
        try {
            body = await request.json() as StrategyActivityBody;
        } catch (e) {
            // Handle case where body is not valid JSON
            return NextResponse.json(
                { message: 'Invalid JSON format in request body.' },
                { status: 400 } // Bad Request
            );
        } // <-- Inner try-catch closed here
        

        // 3. 🎯 Input Validation
        const { 
            title, 
            dueDate, 
            description, 
            activityType, 
            status, 
            outputId,
            startDate, 
            completionDate, 
            progressPercent 
        } = body;
        
        // Check for mandatory fields
        // Note: TypeScript will still rely on the runtime check here, 
        // as the initial assignment `{} as StrategyActivityBody` is a type assertion for TS comfort.
        if (!outputId || !title || !dueDate || !description || !activityType || !status) {
            return NextResponse.json(
                { message: 'Missing required fields: outputId, title, dueDate, description, activityType, status.' },
                { status: 400 }
            );
        }
        
        // Date validation
        const parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
            return NextResponse.json(
                { message: 'Invalid date format provided for dueDate.' },
                { status: 400 }
            );
        }


        // 4. ⚙️ Data Preparation and Formatting
        const data: Prisma.StrategyActivityUncheckedCreateInput = {
            // Required fields
            title,
            description,
            dueDate: parsedDueDate,
            
            // Use the imported Enum types and ensure uppercase formatting
            activityType: activityType.toUpperCase() as ActivityType, 
            status: status.toUpperCase() as ActivityStatus,

            // Linking fields (Foreign Key)
            outputId, 
          
            
            // Optional fields (only include if they exist and are valid)
            ...(startDate && { startDate: new Date(startDate) }),
            ...(completionDate && { completionDate: new Date(completionDate) }),
            ...(progressPercent !== undefined && { progressPercent: Number(progressPercent) }),
        };

        // 5. 💾 Database Operation
        const newActivity = await prisma.strategyActivity.create({
            data,
        });

        // 6. ✅ Success Response
        return NextResponse.json(newActivity, { status: 201 });
        
    } catch (error) { 
        // 7. ⚠️ Error Handling (For database errors, unexpected runtime issues)
        console.error('Contract activity creation failed:', error);
        
        let message = 'Internal Server Error: Failed to save new contract activity.';
        if (process.env.NODE_ENV === 'development') {
            message = `Development Error: ${(error as Error).message}`;
        } 

        return NextResponse.json(
            { message },
            { status: 500 }
        );
    } 
}
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from "../../../libs/prismadb" // Assuming this path is correct
// import getCurrentUser from '@/app/actions/getCurrentUser';



// /**
//  * Handles POST requests to create a new Contract Activity (task/follow-up/review)
//  * linked to a specific ContractModel.
//  * Endpoint: /api/contracts/activity
//  */
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const currentUser = await getCurrentUser();
    
//     // 1. Security Check
//     if (!currentUser) {
//       return NextResponse.json(
//         { message: 'Authentication required to create an activity.' },
//         { status: 401 } // Unauthorized
//       );
//     }
//     console.log("from :", body)
//     // 2. Input Validation (Ensure required fields for linking are present)
//     const { title, dueDate, description, startDate, completionDate, progressPercent, activityType, status, strategyId } = body;

//     if (!strategyId || !title || !dueDate || !description || !activityType || !status) {
//         return NextResponse.json(
//             { message: 'Missing required fields: contractId, title, dueDate, responsiblePersons, type, status.' },
//             { status: 400 } // Bad Request
//         );
//     }
//     console.log("body",body)
//     // 3. Data Preparation
//     const data = {
//       ...body,
//       // Assign the user who created the activity
//       createdByUserId: currentUser.id, 
      
//       // Convert date string to Date object (Prisma requires Date)
//       dueDate: new Date(dueDate), 

//       // Ensure activity type and status are uppercase strings matching the Prisma Enums
//        activityType: activityType.toUpperCase(),
//       status: status.toUpperCase(),
//     };

//     // 4. Create the activity in the database
//     const newActivity = await prisma.contractActivityModel.create({
//       data: data,
//     });

//     // 5. Return the created activity object with status 201 (Created)
//     return NextResponse.json(newActivity, { status: 201 });
    
//   } catch (error) {
//     console.error('Contract activity creation failed:', error);
    
//     const errorMessage = process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal Server Error: Failed to save new contract activity.';

//     return NextResponse.json(
//       { message: errorMessage },
//       { status: 500 }
//     );
//   }
// }