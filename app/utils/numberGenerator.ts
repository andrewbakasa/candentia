// src/utils/numberGenerator.ts (Example implementation)
import prisma from '../libs/prismadb'; // Adjust path as needed

/**
 * Gener Generates a unique, sequential quotation number.
 * @param prefix The prefix for the document (e.g., 'QTE')
 * @returns A promise that resolves to the new quotation number string (e.g., 'QTE-00001').
 */
export async function generateQuotationNumber(prefix: string): Promise<string> {
    // This function must be robust enough to handle concurrent creation!
    
    // 1. Find the highest existing quotation number
    const lastQuotation = await prisma.quotation.findFirst({
        orderBy: {
            quotationNumber: 'desc',
        },
        select: {
            quotationNumber: true,
        },
        // Filter by prefix if you have multiple document types
        // where: { quotationNumber: { startsWith: prefix } },
    });

    let sequence = 1;
    if (lastQuotation) {
        // Example: Extracts '00001' from 'QTE-00001' and increments
        const lastNumberMatch = lastQuotation.quotationNumber.match(/(\d+)$/);
        if (lastNumberMatch) {
            sequence = parseInt(lastNumberMatch[1], 10) + 1;
        }
    }

    // Pad the number to 5 digits (e.g., 1 -> 00001)
    const newNumber = sequence.toString().padStart(5, '0');
    
    return `${prefix}-${newNumber}`;
}