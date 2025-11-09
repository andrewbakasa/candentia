// /pages/api/projects/[id]/comment.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { updateProjectRating } from '@/app/bps/_components/Services';
import getCurrentUser from '@/app/actions/getCurrentUser';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   
     const currentUser = await getCurrentUser();
        
    if (!currentUser) {
        return res.status(401).json({ message: 'Authentication required.' });
    }       

    const { id } = req.query; // Project ID

    if (req.method === 'POST') {
        const { rate } = req.body;
        const rateValue = parseInt(rate as string);

        if (isNaN(rateValue) || typeof id !== 'string') {
            return res.status(400).json({ message: 'A valid rating (1-5) and Project ID are required.' });
        }

        try {
            const rating = await updateProjectRating(id, currentUser.id, rateValue);
            return res.status(200).json(rating);
        } catch (error: any) {
            console.error(error);
            // Catch business logic errors from the service
            if (error.message.includes('Rating must be between')) {
                 return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Failed to update rating.' });
        }
    }

    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}


