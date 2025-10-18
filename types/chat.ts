import { ChunkWithMetadata } from '@/lib/rag-system';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{
    text: string;
    pageNumber: number;
  }>;
}

export interface ChatHistory {
  id: string;
  lease_data_id: string;
  user_email: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  leaseDataId: string;
  userEmail: string;
  question: string;
  chatHistory?: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  sources: Array<{
    text: string;
    pageNumber: number;
  }>;
  timestamp: string;
}

export interface SuggestedQuestion {
  question: string;
  category: 'red-flags' | 'dates' | 'rights' | 'scenarios' | 'general';
}

export interface StoredChunk {
  text: string;
  pageNumber: number;
  embedding: number[];
  chunkIndex: number;
  startIndex: number;
  endIndex: number;
}

