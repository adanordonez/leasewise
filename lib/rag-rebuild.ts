import { LeaseRAGSystem } from './rag-system';
import { ChunkWithMetadata } from './rag-chunking';

interface DatabaseChunk {
  text: string;
  pageNumber: number;
  chunkIndex?: number;
  startIndex?: number;
  endIndex?: number;
  embedding?: number[];
}

/**
 * Rebuild RAG system from stored database chunks
 * This allows us to skip PDF parsing and embedding creation
 */
export function rebuildRAGFromChunks(chunks: DatabaseChunk[]): LeaseRAGSystem {
  const rag = new LeaseRAGSystem(true);
  
  // Convert database chunks to ChunkWithMetadata format
  const chunkData: ChunkWithMetadata[] = chunks.map((chunk, index) => ({
    id: `chunk-${index}`, // Generate ID from index
    text: chunk.text,
    pageNumber: chunk.pageNumber,
    chunkIndex: chunk.chunkIndex ?? index,
    startIndex: chunk.startIndex ?? 0,
    endIndex: chunk.endIndex ?? chunk.text.length,
    embedding: chunk.embedding || undefined,
  }));
  
  // Manually set the chunks in the RAG system (bypassing initialize)
  // @ts-expect-error - accessing private property for performance
  rag.chunks = chunkData;
  
  // Create chunk index for keyword search fallback
  // @ts-expect-error - accessing private property
  rag.chunkIndex = {
    pageMap: new Map(),
    chunks: chunkData
  };
  
  // Build page map
  chunkData.forEach(chunk => {
    // @ts-expect-error - accessing private property
    if (!rag.chunkIndex.pageMap.has(chunk.pageNumber)) {
      // @ts-expect-error - accessing private property
      rag.chunkIndex.pageMap.set(chunk.pageNumber, []);
    }
    // @ts-expect-error - accessing private property
    rag.chunkIndex.pageMap.get(chunk.pageNumber).push(chunk);
  });
  
  return rag;
}

/**
 * Validate that chunks have the required data for analysis
 */
export function validateChunks(chunks: DatabaseChunk[]): { valid: boolean; error?: string } { 
  if (!chunks || chunks.length === 0) {
    return { valid: false, error: 'No chunks found' };
  }
  
  // Check if chunks have required fields
  const firstChunk = chunks[0];
  if (!firstChunk.text || !firstChunk.pageNumber) {
    return { valid: false, error: 'Invalid chunk format' };
  }
  
  // Check if embeddings exist (for semantic search)
  const hasEmbeddings = chunks.some(c => c.embedding && c.embedding.length > 0);
  if (!hasEmbeddings) {
    console.warn('⚠️ No embeddings found in chunks. Semantic search will not work.');
  }
  
  return { valid: true };
}

