

import { exportDefectToExcel } from "@/app/actions/exportDefect";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from 'next/server';

interface ExportPayload {
    defect: any[]; // Use a more specific type if known, e.g., StrategyWithUserVotes[]
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
        const { defect } = payload;

        //console.log("Defect strcuture:",defect)
        
        if (!defect) {
            // If the client sends an empty list, return a 400 Bad Request
             return NextResponse.json({ error: 'No strategies provided for export.' }, { status: 400 });
        }

        // 2. Generate the Excel file using the *provided* strategies
        // Your server-side function must be updated to accept the strategies list.
        const buffer = await exportDefectToExcel(defect); 

        // 3. Prepare the buffer for the Response constructor
        const arrayBuffer = Buffer.from(buffer as any).buffer; 

        // 4. Return the response with file headers
        return new Response(arrayBuffer as any, {
            status: 200,
            headers: {
                'Content-Disposition': 'attachment; filename="Defect_Elimination_Export.xlsx"',
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

