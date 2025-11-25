

import getCurrentUser from "@/app/actions/getCurrentUser";
import { exportStrategiesToExcel } from "@/app/actions/exportStrategies";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return new Response("Unauthorized", { status: 401 });
        }

        const buffer = await exportStrategiesToExcel();

        // 1. ✨ ROBUST FIX: Ensure a standard ArrayBuffer is created from the Buffer content.
        // This resolves the issue where a SharedArrayBuffer might be returned, which isn't 
        // compatible with the Web API Response constructor's BodyInit type.
        const arrayBuffer = Buffer.from(buffer as any).buffer; 

        // 2. Return the response using the ArrayBuffer
        return new Response(arrayBuffer as any, {
            status: 200,
            headers: {
                'Content-Disposition': 'attachment; filename="Strategies_Export.xlsx"',
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Length': buffer.length.toString(), 
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Failed to generate Excel file.' }, { status: 500 });
    }
}