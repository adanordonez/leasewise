import OpenAI from 'openai';
import { ChunkWithMetadata } from './rag-chunking';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Create embeddings for a single text chunk
 */
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Fast and cost-effective
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw error;
  }
}

/**
 * Create embeddings for multiple chunks in batch
 * OpenAI allows up to 2048 inputs per request
 */
export async function createEmbeddingsBatch(
  chunks: ChunkWithMetadata[],
  batchSize: number = 100
): Promise<ChunkWithMetadata[]> {
  const chunksWithEmbeddings: ChunkWithMetadata[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    // console.log(`Creating embeddings for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`);
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch.map(chunk => chunk.text),
      });

      // Add embeddings to chunks
      batch.forEach((chunk, idx) => {
        chunksWithEmbeddings.push({
          ...chunk,
          embedding: response.data[idx].embedding,
        });
      });

      // Rate limiting: wait a bit between batches
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error creating embeddings for batch starting at ${i}:`, error);
      // Continue with remaining batches
    }
  }

  // console.log(`Created embeddings for ${chunksWithEmbeddings.length} chunks`);
  return chunksWithEmbeddings;
}

/**
 * Retrieve relevant chunks for a query using embeddings
 */
export async function retrieveRelevantChunks(
  query: string,
  chunks: ChunkWithMetadata[],
  topK: number = 5
): Promise<ChunkWithMetadata[]> {
  // Create embedding for the query
  const queryEmbedding = await createEmbedding(query);

  // Calculate cosine similarity with all chunks
  const similarities = chunks
    .filter(chunk => chunk.embedding && chunk.embedding.length > 0)
    .map(chunk => {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding!);
      return { chunk, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return similarities.map(s => s.chunk);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Find the best matching chunk for a specific data point
 * This is used to get source attribution for extracted fields
 */
export async function findSourceChunk(
  dataPoint: string,
  context: string,
  chunks: ChunkWithMetadata[]
): Promise<ChunkWithMetadata | null> {
  // Create a query that combines the data point with context
  const query = `${dataPoint} ${context}`;
  
  // Find the most relevant chunk
  const relevantChunks = await retrieveRelevantChunks(query, chunks, 1);
  
  return relevantChunks.length > 0 ? relevantChunks[0] : null;
}

/**
 * Cost estimation for embeddings
 */
export function estimateEmbeddingCost(numChunks: number): {
  tokens: number;
  cost: number;
} {
  // text-embedding-3-small: $0.02 per 1M tokens
  // Average chunk is ~500 chars, roughly ~125 tokens
  const avgTokensPerChunk = 125;
  const totalTokens = numChunks * avgTokensPerChunk;
  const costPerMillionTokens = 0.02;
  const cost = (totalTokens / 1_000_000) * costPerMillionTokens;

  return {
    tokens: totalTokens,
    cost: Math.round(cost * 10000) / 10000, // Round to 4 decimal places
  };
}

