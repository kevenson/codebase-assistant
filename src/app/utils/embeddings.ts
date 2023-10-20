
import { OpenAIApi, Configuration } from "openai-edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export async function getEmbeddingsWithRetry(input: string, retries = 3): Promise<number[]> {
  for (let i = 0; i < retries; i++) {
      try {
          return await getEmbeddings(input);
      } catch (e) {
          if (i === retries - 1) throw e; // Throw the error if it's the last retry
          console.log(`Retry ${i + 1} failed, trying again...`);
      }
  }
  throw new Error("All retries failed.");
}

export async function getEmbeddings(input: string) {
  try {
    const response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: input.replace(/\n/g, ' ')
    })

    const result = await response.json();
    return result.data[0].embedding as number[]

  } catch (e) {
    console.log("Error calling OpenAI embedding API: ", e);
    throw new Error(`Error calling OpenAI embedding API: ${e}`);
  }
}