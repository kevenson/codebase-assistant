import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  try {
    const pinecone = new Pinecone();
    const indexes = await pinecone.listIndexes();
    console.log("Indexes in your Pinecone account:", indexes);
  } catch (error) {
    console.error("Error connecting to Pinecone:", error);
  }
}

testConnection();
