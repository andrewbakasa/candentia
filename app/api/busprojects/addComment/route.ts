// /pages/api/projects/[id]/comment.ts
import getCurrentUser from '@/app/actions/getCurrentUser';
import { addProjectComment } from '@/app/busprojects/_components/Services';
import type { NextApiRequest, NextApiResponse } from 'next';
//import { addProjectComment } from '../../../../lib/services/projectService';
// import { getSessionUser } from '../../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    
    const currentUser = await getCurrentUser();
    
      if (!currentUser) {
        return res.status(401).json({ message: 'Authentication required.' });
      }
    

    const { id } = req.query; // Project ID

    if (req.method === 'POST') {
        const { content } = req.body; // Content from the editor
        if (!content || typeof id !== 'string') {
            return res.status(400).json({ message: 'Comment content and Project ID are required.' });
        }

        try {
            const newComment = await addProjectComment(id, currentUser.id, content);
            return res.status(201).json(newComment);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to add comment.' });
        }
    }

    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
