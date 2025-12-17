import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { QuotationStatus } from '@/app/ar/types/finance';

// Initialize Prisma client (ensure this is done outside the handler for best practice)
const prisma = new PrismaClient();

// Define the structure of the data the API will return
interface QuotationMetrics {
    activeCount: number;
    activeValue: number;
    conversionRate: number; // Decimal (e.g., 0.25)
    expiringSoonCount: number;
}

/**
 * Handles GET requests to calculate and return key quotation metrics.
 * @returns JSON response containing QuotationMetrics.
 */
export async function GET() {
    try {
        // --- 1. Calculate Date Ranges ---
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        // --- 2. Calculate Active Quotes Count and Value (PENDING/ACCEPTED) ---
        // PENDING/SENT quotes that are not yet rejected, expired, or invoiced.
        const activeQuotationStats = await prisma.quotation.aggregate({
            _sum: {
                totalAmount: true, 
            },
            _count: {
                id: true,
            },
            where: {
                status: {
                    // Only count quotes that are awaiting a decision or were accepted but not yet invoiced
                    in: [QuotationStatus.DRAFT, QuotationStatus.PENDING, QuotationStatus.ACCEPTED], 
                },
            },
        });

        console.log("activeQuotationStats", activeQuotationStats)

        const activeCount = activeQuotationStats._count.id || 0;
        // FIX: Remove .toNumber() as the sum is expected to be a number/float after Prisma client generation
        const activeValue = activeQuotationStats._sum.totalAmount || 0; 


        // --- 3. Calculate Conversion Rate (Accepted in last 30 days / Total Sent in last 30 days) ---
        
        // Count of quotes accepted in the last 30 days
        const acceptedCount = await prisma.quotation.count({
            where: {
                status: QuotationStatus.ACCEPTED,
                updatedAt: { // Date the quote was ACCEPTED
                    gte: thirtyDaysAgo,
                },
            },
        });

        // Count of quotes sent to client (PENDING, ACCEPTED, REJECTED, EXPIRED) in the last 30 days.
        // We exclude DRAFTs, but include all outcomes of a sent quote.
        const sentCount = await prisma.quotation.count({
            where: {
                status: {
                    in: [
                       // QuotationStatus.DRAFT,
                        QuotationStatus.PENDING, 
                        QuotationStatus.ACCEPTED, 
                        QuotationStatus.REJECTED, 
                        QuotationStatus.EXPIRED // Include expired in the denominator of total sent
                    ],
                },
                createdAt: { // Date the quote was initially created/sent (proxy for sent time)
                    gte: thirtyDaysAgo,
                },
            },
        });

        // Calculate conversion rate, handling division by zero
        let conversionRate = 0;
        if (sentCount > 0) {
            conversionRate = acceptedCount / sentCount;
        }


        // --- 4. Calculate Expiring Soon Count ---
        const expiringSoonCount = await prisma.quotation.count({
            where: {
                // Only count quotes that are currently PENDING
                status: QuotationStatus.PENDING,
                
                // FIX: Use the new 'validUntil' field
                validUntil: { 
                    gte: now,
                    lte: sevenDaysFromNow,
                },
            },
        });

        // --- 5. Assemble and Return Metrics ---
        const metrics: QuotationMetrics = {
            activeCount,
            activeValue: activeValue, 
            conversionRate,
            expiringSoonCount,
        };
        console.log("metrics:",metrics)
        // Return a successful response
        return NextResponse.json(metrics, { status: 200 });

    } catch (error) {
        console.error('API Error in /quotations/metrics:', error);

        // Return an error response
        return NextResponse.json({ 
            error: 'Failed to retrieve quotation metrics.', 
            details: (error as Error).message 
        }, { status: 500 });
    }
}