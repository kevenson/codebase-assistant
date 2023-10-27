import { NextApiRequest, NextApiResponse } from 'next';
import seed from './crawl/seed';
import { Document } from '@pinecone-database/doc-splitter';
import { LocalCrawler, Page } from './crawl/localCrawler'; // Adjust the import path as needed
import md5 from "md5";
import fs from "fs";
import path from "path";

const HASHES_FILE_PATH = path.join(__dirname, "hashes.json"); // Path relative to current directory

export default async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const ignoreFile = ".ignore";
        const limit = 100;  // Adjust if needed
        const indexName = process.env.PINECONE_INDEX!;
        const { startPath, options } = req.body;

        // 1. Crawl the directory to get the latest documents
        const crawler = new LocalCrawler(limit);
        const pages: Page[] = await crawler.crawl(startPath, ignoreFile);
        const newDocs: Document[] = pages.map(page => ({
            pageContent: page.content,
            metadata: {
                path: page.path,
                text: page.content,
                hash: md5(page.content)
            }
        }));

        // 2. Load existing hashes from local file
        let existingHashes: { [key: string]: string } = {};
        if (fs.existsSync(HASHES_FILE_PATH)) {
            existingHashes = JSON.parse(fs.readFileSync(HASHES_FILE_PATH, 'utf-8'));
        }

        // 3. Identify the changed documents
        const changedDocs = newDocs.filter(newDoc => {
            const path = newDoc.metadata.path as string;
            return !existingHashes[path] || existingHashes[path] !== newDoc.metadata.hash;
        });

        // 4. If there are changed documents, seed them again
        if (changedDocs.length > 0) {
            await seed(startPath, ignoreFile, limit, indexName, options);
        }

        // 5. Update the local hashes file
        changedDocs.forEach(doc => {
            const path = doc.metadata.path as string;
            existingHashes[path] = doc.metadata.hash;
        });
        fs.writeFileSync(HASHES_FILE_PATH, JSON.stringify(existingHashes, null, 2));

        res.status(200).json({ success: true, message: 'Embeddings updated', updatedDocs: changedDocs });

    } catch (error) {
        console.error('Error updating embeddings:', error);
        res.status(500).json({ success: false, message: 'Error updating embeddings', error: (error as Error).message });
    }
}
