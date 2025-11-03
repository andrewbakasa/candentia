// app/api/metrics/visits/route.ts

import { NextResponse } from 'next/server';
import prisma from "@/app/libs/prismadb";
import { getStartOfTodayUTC, 
    getStartOfWeekUTC, 
    getStartOfMonthUTC, 
    getStartOfLastMonthUTC } from '@/app/libs/dateUtils';
// import { 
//   getStartOfTodayUTC, 
//   getStartOfWeekUTC, 
//   getStartOfMonthUTC, 
//   getStartOfLastMonthUTC 
// } from '@/utils/dateUtils'; // Import the utilities

export async function GET() {
  const now = new Date();

  // Define Time Periods using the utilities
  const startOfToday = getStartOfTodayUTC();
  const startOfWeek = getStartOfWeekUTC();
  const startOfMonth = getStartOfMonthUTC();
  const { start: startOfLastMonth, end: endOfLastMonth } = getStartOfLastMonthUTC();

  try {
    // --- 1. COUNT QUERIES ---

    // A. Today's Visits (Total Today)
    const totalToday = prisma.visit.count({
      where: { timestamp: { gte: startOfToday } },
    });

    // B. This Week's Visits (Since Sunday UTC)
    const totalThisWeek = prisma.visit.count({
      where: { timestamp: { gte: startOfWeek } },
    });
    
    // C. This Month's Visits
    const totalThisMonth = prisma.visit.count({
      where: { timestamp: { gte: startOfMonth } },
    });

    // D. Last Month's Visits
    const totalLastMonth = prisma.visit.count({
      where: { 
        timestamp: { 
          gte: startOfLastMonth, 
          lt: endOfLastMonth // Less than the start of the current month
        } 
      },
    });

    // Execute all queries concurrently for performance
    const [
      countToday, 
      countThisWeek, 
      countThisMonth, 
      countLastMonth
    ] = await Promise.all([
      totalToday, 
      totalThisWeek, 
      totalThisMonth, 
      totalLastMonth
    ]);

    // --- 2. FORMAT AND RETURN RESULTS ---

    return NextResponse.json({
      metrics: {
        totalToday: countToday,
        totalThisWeek: countThisWeek,
        totalThisMonth: countThisMonth,
        totalLastMonth: countLastMonth,
      },
    });
    
  } catch (error) {
    console.error('Failed to fetch visit metrics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve visit metrics.' }, 
      { status: 500 }
    );
  }
}