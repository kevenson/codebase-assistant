//import { getEmbeddings } from "@/utils/embeddings";
import { getEmbeddingsWithRetry } from "@/utils/embeddings";
import { Document, MarkdownTextSplitter, RecursiveCharacterTextSplitter } from "@pinecone-database/doc-splitter";
import { chunkedUpsert } from "@/utils/chunkedUpsert";
import { promiseBatch } from "@/utils/promiseBatch";
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { LocalCrawler, Page } from "./localCrawler"; // Adjust the import path as needed
import md5 from "md5";
import { truncateStringByBytes } from "@/utils/truncateString";

interface SeedOptions {
  splittingMethod: string;
  chunkSize: number;
  chunkOverlap: number;
}

type DocumentSplitter = RecursiveCharacterTextSplitter | MarkdownTextSplitter;

async function seed(startPath: string, ignoreFile: string, limit: number, indexName: string, options: SeedOptions) {
  console.log('Starting to seed with options:', options);
  try {
    // Initialize the Pinecone client
    const pinecone = new Pinecone();

    // Destructure the options object
    const { splittingMethod, chunkSize, chunkOverlap } = options;

    // Create a new LocalCrawler with a maximum number of pages as limit
    const crawler = new LocalCrawler(limit || 100);

    // Crawl the given directory and get the pages
    const pages = await crawler.crawl(startPath, ignoreFile) as Page[];

    // Choose the appropriate document splitter based on the splitting method
    const splitter: DocumentSplitter = splittingMethod === 'recursive' ?
      new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap }) : new MarkdownTextSplitter({});

    // Prepare documents by splitting the pages
    const documents = await Promise.all(pages.map(page => prepareDocument(page, splitter)));

    // Create Pinecone index if it does not exist
    const indexList = await pinecone.listIndexes();
    const indexExists = indexList.some(index => index.name === indexName);
    if (!indexExists) {
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536,
        waitUntilReady: true,
      });
    }

    const index = pinecone.Index(indexName);

    console.log('Documents prepared. Starting to get embeddings...');

    // Get the vector embeddings for the documents
    const vectors = await promiseBatch(documents.flat(), embedDocument, 10); // Process in batches of 10
    //const vectors = await Promise.all(documents.flat().map(embedDocument));

    console.log('Got embeddings. Starting upsert into Pinecone.');

    // Upsert vectors into the Pinecone index
    await chunkedUpsert(index!, vectors, '', 10);

    console.log('Upsert completed.');

    // Return the first document
    return documents[0];
  } catch (error) {
    console.error("Error seeding:", error);
    throw error;
  }
}

async function embedDocument(doc: Document): Promise<PineconeRecord> {
  try {
    // Generate OpenAI embeddings for the document content
    //const embedding = await getEmbeddings(doc.pageContent);
    // Use the retry mechanism
    const embedding = await getEmbeddingsWithRetry(doc.pageContent);

    // Create a hash of the document content
    const hash = md5(doc.pageContent);

    // Return the vector embedding object
    return {
      id: hash,
      values: embedding,
      metadata: {
        chunk: doc.pageContent,
        text: doc.metadata.text as string,
        filepath: doc.metadata.path as string, // Changed "url" to "filepath"
        hash: doc.metadata.hash as string,
      }
    } as PineconeRecord;
  } catch (error) {
    console.log("Error embedding document: ", error);
    throw error;
  }
}

async function prepareDocument(page: Page, splitter: DocumentSplitter): Promise<Document[]> {
  // Get the content of the page
  const pageContent = page.content;

  // Split the documents using the provided splitter
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        path: page.path, // Changed "url" to "path"
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);

  // Map over the documents and add a hash to their metadata
  return docs.map((doc: Document) => {
    return {
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        hash: md5(doc.pageContent),
      },
    };
  });
}

async function getChangedDocuments(existingDocs: Document[], newDocs: Document[]): Promise<Document[]> {
  const changedDocs: Document[] = [];
  
  for (const newDoc of newDocs) {
      const existingDoc = existingDocs.find(d => d.metadata.path === newDoc.metadata.path);
      if (!existingDoc || existingDoc.metadata.hash !== newDoc.metadata.hash) {
          changedDocs.push(newDoc);
      }
  }

  return changedDocs;
}


export default seed;
