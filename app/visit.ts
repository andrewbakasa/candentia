// services/visits.ts

import { Visit, } from '@prisma/client' // Import the types

// Define a type for a Visit that includes the Location data
export type VisitWithLocation = Visit 

// Function to call the API route to create a visit
export async function recordVisit(
  //locationId: string,
  notes?: string
): Promise<Visit> {
  const response = await fetch('/api/visitors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({notes}),
  })

  if (!response.ok) {
    throw new Error('Failed to record visit')
  }

  // The response body is automatically type-checked by your implementation!
  return (await response.json()) as Visit
}

