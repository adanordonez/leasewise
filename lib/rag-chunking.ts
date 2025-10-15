import { PageText } from './pdf-utils';

export interface ChunkWithMetadata {
  id: string;
  text: string;
  pageNumber: number;
  startIndex: number;
  endIndex: number;
  chunkIndex: number;
  embedding?: number[]; // OpenAI embedding vector
}

/**
 * Chunk text with overlap for better context retrieval
 * Each chunk knows which page it came from
 */
export function chunkTextWithPages(
  pages: PageText[],
  chunkSize: number = 1500, // ~1500 chars per chunk (increased for even better context)
  overlap: number = 250 // 250 char overlap between chunks (increased for even better context)
): ChunkWithMetadata[] {
  const chunks: ChunkWithMetadata[] = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const pageText = page.text;
    let startIdx = 0;

    while (startIdx < pageText.length) {
      const endIdx = Math.min(startIdx + chunkSize, pageText.length);
      
      // Try to break at sentence boundaries
      let breakPoint = endIdx;
      if (endIdx < pageText.length) {
        // Look for sentence endings near the chunk boundary
        const searchStart = Math.max(startIdx, endIdx - 100);
        const searchText = pageText.substring(searchStart, endIdx);
        const lastPeriod = searchText.lastIndexOf('.');
        const lastQuestion = searchText.lastIndexOf('?');
        const lastExclamation = searchText.lastIndexOf('!');
        
        const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
        if (lastSentenceEnd > 0) {
          breakPoint = searchStart + lastSentenceEnd + 1;
        }
      }

      const chunkText = pageText.substring(startIdx, breakPoint).trim();
      
      if (chunkText.length > 50) { // Only keep meaningful chunks
        chunks.push({
          id: `chunk_${globalChunkIndex}_page_${page.pageNumber}`,
          text: chunkText,
          pageNumber: page.pageNumber,
          startIndex: startIdx,
          endIndex: breakPoint,
          chunkIndex: globalChunkIndex,
        });
        globalChunkIndex++;
      }

      // Move forward with overlap
      startIdx = breakPoint - overlap;
      if (startIdx >= pageText.length - overlap) {
        break; // Avoid infinite loop at end
      }
    }
  }

  return chunks;
}

/**
 * Create a searchable index of chunks
 */
export interface ChunkIndex {
  chunks: ChunkWithMetadata[];
  pageMap: Map<number, ChunkWithMetadata[]>; // Page number -> chunks on that page
  textIndex: Map<string, ChunkWithMetadata[]>; // Keyword -> chunks containing that keyword
}

export function createChunkIndex(chunks: ChunkWithMetadata[]): ChunkIndex {
  const pageMap = new Map<number, ChunkWithMetadata[]>();
  const textIndex = new Map<string, ChunkWithMetadata[]>();

  for (const chunk of chunks) {
    // Build page map
    const pageChunks = pageMap.get(chunk.pageNumber) || [];
    pageChunks.push(chunk);
    pageMap.set(chunk.pageNumber, pageChunks);

    // Build text index (simple keyword extraction)
    const words = chunk.text
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3); // Only significant words

    for (const word of words) {
      const wordChunks = textIndex.get(word) || [];
      if (!wordChunks.includes(chunk)) {
        wordChunks.push(chunk);
      }
      textIndex.set(word, wordChunks);
    }
  }

  return {
    chunks,
    pageMap,
    textIndex,
  };
}

/**
 * Simple keyword-based search (fallback if embeddings not available)
 */
export function searchChunksByKeywords(
  index: ChunkIndex,
  query: string,
  topK: number = 3
): ChunkWithMetadata[] {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Score each chunk by keyword overlap
  const chunkScores = new Map<string, number>();

  for (const word of queryWords) {
    const matchingChunks = index.textIndex.get(word) || [];
    for (const chunk of matchingChunks) {
      const currentScore = chunkScores.get(chunk.id) || 0;
      chunkScores.set(chunk.id, currentScore + 1);
    }
  }

  // Sort by score and return top K
  const sortedChunks = index.chunks
    .filter(chunk => chunkScores.has(chunk.id))
    .sort((a, b) => (chunkScores.get(b.id) || 0) - (chunkScores.get(a.id) || 0))
    .slice(0, topK);

  return sortedChunks;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search chunks using embeddings (most accurate)
 */
export function searchChunksByEmbedding(
  chunks: ChunkWithMetadata[],
  queryEmbedding: number[],
  topK: number = 3
): ChunkWithMetadata[] {
  if (!queryEmbedding || chunks.length === 0) return [];

  // Calculate similarity for each chunk
  const similarities = chunks
    .filter(chunk => chunk.embedding && chunk.embedding.length > 0)
    .map(chunk => ({
      chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding!),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return similarities.map(s => s.chunk);
}

