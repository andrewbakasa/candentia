// app/api/visits/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/app/libs/prismadb";
import getCurrentUser from '@/app/actions/getCurrentUser';

// Utility to safely get the client's IP address from the request headers
function getVisitorIp(req: NextRequest): string | undefined {
  const xForwardedFor = req.headers.get('x-forwarded-for');

  if (xForwardedFor) {
    // Client IP is typically the first address in the chain
    return xForwardedFor.split(',')[0].trim();
  }
  
  // No reliable fallback for the App Router environment outside of headers
  return undefined; 
}


export async function POST(request: NextRequest) {
  const ipAddress = getVisitorIp(request);
  console.log("ipAddress",ipAddress)
  if (!ipAddress) {
    // Return a 400 error if the IP cannot be determined
    return NextResponse.json(
      { error: 'Could not determine IP address.' }, 
      { status: 400 }
    );
  }

  // --- 1. Parse the request body ---
  let body: { notes?: string };
  try {
    // We expect only locationId and notes, as visitorId might be absent
    const fullBody = await request.json();
    body = {     
      notes: fullBody.notes,
    };
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const {notes } = body;
  
  const currentUser = await getCurrentUser();
  
    
  // Use a placeholder for visitorId when a user is not logged in
  let ANONYMOUS_VISITOR_ID = 'ANONYMOUS_IP_TRACKED';
  let LOCATION_ID = 'ANONYMOUS_LOCATION';
   if (currentUser) {
     ANONYMOUS_VISITOR_ID = currentUser.id;
     LOCATION_ID= currentUser.id// in future location of user
    }

  // --- 2. Calculate the start of "today" (UTC) ---
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); 

  try {
    // --- 3. Check for an existing visit today from this IP ---
    const existingVisit = await prisma.visit.findFirst({
      where: {
        ipAddress: ipAddress,
        timestamp: {
          gte: today, 
        },
      },
    });
    console.log("existingVisit",existingVisit)
    if (existingVisit) {
      // --- 4. Deny the request if a visit is found (429 Rate Limit) ---
      return NextResponse.json(
        { 
          error: 'Rate Limit Exceeded', 
          message: 'This IP address has already recorded a visit today.',
          existingVisitId: existingVisit.id
        },
        { status: 429 } 
      );
    }

    // --- 5. If no visit is found, proceed to create a new one ---
    const newVisit = await prisma.visit.create({
      data: {
        // Use the placeholder value for the required visitorId field
        visitorId: ANONYMOUS_VISITOR_ID, 
        locationId: LOCATION_ID,
        ipAddress: ipAddress, // Crucial for tracking
        notes: notes,
      },
    //   include: {
    //     location: true,
    //   },
    });
    console.log("newVisit",newVisit)
    return NextResponse.json(newVisit, { status: 201 });

  } catch (error) {
    console.error('Database operation failed:', error);
    return NextResponse.json(
      { error: 'Failed to process visit record' }, 
      { status: 500 }
    );
  }
}
// // app/api/visits/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import prisma from "@/app/libs/prismadb";
// // Assuming getVisitorIp is accessible, perhaps in a separate utility file
// // NOTE: You may need to adapt getVisitorIp to work with the standard Web Request object.
// function getVisitorIp(req: NextRequest): string | undefined {
//   // Use the standard Next.js way to read headers from the new Request object
//   const xForwardedFor = req.headers.get('x-forwarded-for');

//   if (xForwardedFor) {
//     return xForwardedFor.split(',')[0].trim();
//   }
  
//   // Fallback for non-proxied environments (less reliable in Vercel/production)
//   // This often requires additional configuration or deployment context.
//   // For most production apps, x-forwarded-for is reliable.
//   return undefined; 
// }


// export async function POST(request: NextRequest) {
//   console.log("here.........");

//   const ipAddress = getVisitorIp(request);
//   if (!ipAddress) {
//     // Use NextResponse for Web API Response objects
//     return NextResponse.json(
//       { error: 'Could not determine IP address.' }, 
//       { status: 400 }
//     );
//   }

//   // --- 1. Parse the request body ---
//   let body: { visitorId: string, locationId: string, notes?: string };
//   try {
//     body = await request.json();
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Invalid JSON body.' },
//       { status: 400 }
//     );
//   }

//   const { visitorId, locationId, notes } = body;

//   // --- 2. Calculate the start of "today" (UTC) ---
//   const today = new Date();
//   today.setUTCHours(0, 0, 0, 0); 

//   try {
//     // --- 3. Check for an existing visit today from this IP ---
//     const existingVisit = await prisma.visit.findFirst({
//       where: {
//         ipAddress: ipAddress,
//         timestamp: {
//           gte: today, 
//         },
//       },
//     });

//     if (existingVisit) {
//       // --- 4. Deny the request if a visit is found (429 Rate Limit) ---
//       return NextResponse.json(
//         { 
//           error: 'Rate Limit Exceeded', 
//           message: 'This IP address has already recorded a visit today.',
//           existingVisitId: existingVisit.id
//         },
//         { status: 429 } // 429 Too Many Requests
//       );
//     }

//     // --- 5. If no visit is found, proceed to create a new one ---
//     const newVisit = await prisma.visit.create({
//       data: {
//         visitorId: visitorId,
//         locationId: locationId,
//         ipAddress: ipAddress,
//         notes: notes,
//       },
//       include: {
//         location: true,
//       },
//     });

//     return NextResponse.json(newVisit, { status: 201 });

//   } catch (error) {
//     console.error('Database operation failed:', error);
//     return NextResponse.json(
//       { error: 'Failed to process visit record' }, 
//       { status: 500 }
//     );
//   }
// }
// // pages/api/visits.ts

// import type { NextApiRequest, NextApiResponse } from 'next'

// import prisma from "@/app/libs/prismadb";
// // ... include the getVisitorIp function from step 1

// export default async function handle(req: NextApiRequest, res: NextApiResponse) {

// console.log("here.........")
//   if (req.method !== 'POST') {
//     res.setHeader('Allow', ['POST'])
//     return res.status(405).end(`Method ${req.method} Not Allowed`)
//   }

//   const ipAddress = getVisitorIp(req);
//   if (!ipAddress) {
//     return res.status(400).json({ error: 'Could not determine IP address.' });
//   }

//   const { visitorId, locationId, notes } = req.body;

//   // --- 1. Calculate the start of "today" ---
//   const today = new Date();
//   today.setUTCHours(0, 0, 0, 0); // Important: Use UTC to avoid timezone issues for a global rule

//   try {
//     // --- 2. Check for an existing visit today from this IP ---
//     const existingVisit = await prisma.visit.findFirst({
//       where: {
//         ipAddress: ipAddress,
//         timestamp: {
//           gte: today, // Greater than or equal to the start of today
//         },
//       },
//     });

//     if (existingVisit) {
//       // --- 3. Deny the request if a visit is found ---
//       return res.status(429).json({ 
//         error: 'Rate Limit Exceeded', 
//         message: 'This IP address has already recorded a visit today.',
//         // Optionally return the existing visit ID
//         existingVisitId: existingVisit.id
//       });
//     }

//     // --- 4. If no visit is found, proceed to create a new one ---
//     const newVisit = await prisma.visit.create({
//       data: {
//         visitorId: visitorId as string,
//         locationId: locationId as string,
//         ipAddress: ipAddress, // Save the IP address
//         notes: notes as string | undefined,
//       },
//       include: {
//         location: true,
//       },
//     });

//     return res.status(201).json(newVisit);

//   } catch (error) {
//     console.error('Database operation failed:', error);
//     return res.status(500).json({ error: 'Failed to process visit record' });
//   }
// }

// // Function to safely extract the IP address
// function getVisitorIp(req: NextApiRequest): string | undefined {
//   // Check common headers used by Vercel/proxies
//   const xForwardedFor = req.headers['x-forwarded-for'];

//   if (xForwardedFor) {
//     // If multiple IPs are listed (proxy chain), the client IP is the first one
//     if (Array.isArray(xForwardedFor)) {
//       return xForwardedFor[0];
//     }
//     return xForwardedFor.split(',')[0].trim();
//   }

//   // Fallback for local development or non-proxied environments
//   return req.socket.remoteAddress;
// }




// ... inside your API handler ...

// // pages/api/visits.ts (Pages Router)
// // or use App Router route.ts/Server Actions for a more modern approach

// import type { NextApiRequest, NextApiResponse } from 'next'
// //import prisma from '../../lib/prisma'


// import prisma from "@/app/libs/prismadb";
// export default async function handle(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === 'POST') {
//     const { visitorId, locationId, notes } = req.body

//     try {
//       const newVisit = await prisma.visit.create({
//         data: {
//           visitorId: visitorId as string, // Type casting from request body
//           locationId: locationId as string,
//           notes: notes as string | undefined,
//         },
//         include: {
//           location: true, // Fetch the location details along with the new visit
//         },
//       })
//       res.status(201).json(newVisit)
//     } catch (error) {
//       console.error(error)
//       res.status(500).json({ error: 'Failed to create new visit' })
//     }
//   } else {
//     // Handle other methods, e.g., GET to fetch all visits
//     res.setHeader('Allow', ['POST'])
//     res.status(405).end(`Method ${req.method} Not Allowed`)
//   }
// }