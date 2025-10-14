import { PageText } from './pdf-utils';
import { ChunkWithMetadata, chunkTextWithPages, createChunkIndex, searchChunksByKeywords } from './rag-chunking';
import { createEmbeddingsBatch, retrieveRelevantChunks, findSourceChunk } from './rag-embeddings';

/**
 * RAG System for Lease Analysis
 * Provides accurate source attribution by retrieving exact text chunks
 */
export class LeaseRAGSystem {
  private chunks: ChunkWithMetadata[] = [];
  private chunkIndex: any;
  private useEmbeddings: boolean;

  constructor(useEmbeddings: boolean = true) {
    this.useEmbeddings = useEmbeddings;
  }

  /**
   * Initialize the RAG system with PDF pages
   */
  async initialize(pages: PageText[]): Promise<void> {
    console.log('Initializing RAG system...');
    
    // Step 1: Chunk the text with page tracking
    console.log('Creating chunks from', pages.length, 'pages...');
    this.chunks = chunkTextWithPages(pages, 800, 150); // Increased chunk size from 500 to 800, overlap from 100 to 150
    console.log('Created', this.chunks.length, 'chunks');

    // Step 2: Create index for fast keyword search (fallback)
    this.chunkIndex = createChunkIndex(this.chunks);

    // Step 3: Create embeddings (if enabled)
    if (this.useEmbeddings) {
      console.log('Creating embeddings for chunks...');
      this.chunks = await createEmbeddingsBatch(this.chunks);
      console.log('Embeddings created successfully');
    }
  }

  /**
   * Retrieve relevant chunks for a query
   */
  async retrieve(query: string, topK: number = 5): Promise<ChunkWithMetadata[]> {
    if (this.useEmbeddings && this.chunks.length > 0 && this.chunks[0].embedding) {
      // Use semantic search with embeddings
      return await retrieveRelevantChunks(query, this.chunks, topK);
    } else {
      // Fallback to keyword search
      return searchChunksByKeywords(this.chunkIndex, query, topK);
    }
  }

  /**
   * Get chunks for a specific page
   */
  getChunksForPage(pageNumber: number): ChunkWithMetadata[] {
    return this.chunkIndex.pageMap.get(pageNumber) || [];
  }

  /**
   * Get all chunks
   */
  getAllChunks(): ChunkWithMetadata[] {
    return this.chunks;
  }

  /**
   * Build context from relevant chunks for AI analysis
   */
  async buildContext(query: string, maxChunks: number = 5): Promise<string> {
    const relevantChunks = await this.retrieve(query, maxChunks);
    
    return relevantChunks
      .map((chunk, idx) => `[CHUNK ${idx + 1} - Page ${chunk.pageNumber}]\n${chunk.text}`)
      .join('\n\n');
  }

  /**
   * Find exact source for a data point
   * Returns the most relevant chunk with page number
   */
  async findSource(
    dataPoint: string,
    context: string = ''
  ): Promise<{ text: string; pageNumber: number } | null> {
    const sourceChunk = await findSourceChunk(dataPoint, context, this.chunks);
    
    if (sourceChunk) {
      return {
        text: sourceChunk.text,
        pageNumber: sourceChunk.pageNumber,
      };
    }
    
    return null;
  }

  /**
   * Get statistics about the RAG system
   */
  getStats() {
    return {
      totalChunks: this.chunks.length,
      chunksWithEmbeddings: this.chunks.filter(c => c.embedding).length,
      pagesIndexed: this.chunkIndex.pageMap.size,
      averageChunkLength: Math.round(
        this.chunks.reduce((sum, c) => sum + c.text.length, 0) / this.chunks.length
      ),
    };
  }
}

/**
 * Helper function to create a RAG system for a lease
 */
export async function createLeaseRAG(
  pages: PageText[],
  useEmbeddings: boolean = true
): Promise<LeaseRAGSystem> {
  const rag = new LeaseRAGSystem(useEmbeddings);
  await rag.initialize(pages);
  return rag;
}

