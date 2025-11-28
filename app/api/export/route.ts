

import { exportStrategiesToExcel } from "@/app/actions/exportStrategies";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from 'next/server';

interface ExportPayload {
    strategies: any[]; // Use a more specific type if known, e.g., StrategyWithUserVotes[]
}

// **ACTION: Handle POST request**
export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser(); // Authenticate user
        if (!currentUser) {
            return new Response("Unauthorized", { status: 401 });
        }

        // 1. Extract the strategies from the request body
        const payload: ExportPayload = await request.json();
        const { strategies } = payload;
        
        if (!strategies || strategies.length === 0) {
            // If the client sends an empty list, return a 400 Bad Request
             return NextResponse.json({ error: 'No strategies provided for export.' }, { status: 400 });
        }

        // 2. Generate the Excel file using the *provided* strategies
        // Your server-side function must be updated to accept the strategies list.
        const buffer = await exportStrategiesToExcel(strategies); 

        // 3. Prepare the buffer for the Response constructor
        const arrayBuffer = Buffer.from(buffer as any).buffer; 

        // 4. Return the response with file headers
        return new Response(arrayBuffer as any, {
            status: 200,
            headers: {
                'Content-Disposition': 'attachment; filename="Strategies_Export.xlsx"',
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Length': buffer.length.toString(), 
                // Necessary CORS headers might be needed here depending on your setup
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        // Using NextResponse.json is often cleaner for error responses in App Router
        return NextResponse.json({ error: 'Failed to generate Excel file.' }, { status: 500 });
    }
}

// export async function GET() {
//     try {
//         const currentUser = await getCurrentUser();

//         if (!currentUser) {
//             return new Response("Unauthorized", { status: 401 });
//         }

//         const buffer = await exportStrategiesToExcel();

//         // 1. ✨ ROBUST FIX: Ensure a standard ArrayBuffer is created from the Buffer content.
//         // This resolves the issue where a SharedArrayBuffer might be returned, which isn't 
//         // compatible with the Web API Response constructor's BodyInit type.
//         const arrayBuffer = Buffer.from(buffer as any).buffer; 

//         // 2. Return the response using the ArrayBuffer
//         return new Response(arrayBuffer as any, {
//             status: 200,
//             headers: {
//                 'Content-Disposition': 'attachment; filename="Strategies_Export.xlsx"',
//                 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//                 'Content-Length': buffer.length.toString(), 
//             },
//         });
//     } catch (error) {
//         console.error('Export error:', error);
//         return NextResponse.json({ error: 'Failed to generate Excel file.' }, { status: 500 });
//     }
// }