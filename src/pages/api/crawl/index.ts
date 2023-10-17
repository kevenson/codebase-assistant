import { NextApiRequest, NextApiResponse } from 'next';
import seed from './seed';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { startPath, ignoreFile, options } = req.body;

        // Seed the directory and get the documents
        const document = await seed(startPath, ignoreFile, 100, process.env.PINECONE_INDEX!, options);

        res.status(200).json({ success: true, document });
    } catch (error) {
        const errMsg = (error as Error).message;
        res.status(500).json({ success: false, error: errMsg });
    }
};
