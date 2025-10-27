import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { LeaseRAGSystem } from '@/lib/rag-system';
import OpenAI from 'openai';
import type { ChatMessage, ChatRequest, ChatResponse } from '@/types/chat';

export const maxDuration = 60; // 60 seconds for chat

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Rebuild RAG system from stored chunks (FAST - no re-embedding needed!)
 */
async function rebuildRAGFromChunks(chunks: any[]): Promise<LeaseRAGSystem> {
  console.log(`🔄 Rebuilding RAG from ${chunks.length} stored chunks...`);
  
  const rag = new LeaseRAGSystem(true); // Enable embeddings
  
  // Reconstruct chunks with embeddings
  const reconstructedChunks = chunks.map((chunk: any) => ({
    text: chunk.text,
    pageNumber: chunk.pageNumber,
    embedding: chunk.embedding,
    chunkIndex: chunk.chunkIndex,
    startIndex: chunk.startIndex,
    endIndex: chunk.endIndex,
  }));
  
  // Set chunks directly (bypass initialization)
  (rag as any).chunks = reconstructedChunks;
  (rag as any).chunkIndex = {
    pageMap: new Map(reconstructedChunks.map((c: any) => [c.pageNumber, [c]])),
  };
  
  console.log(`✅ RAG rebuilt with ${reconstructedChunks.length} chunks`);
  return rag;
}

/**
 * Load or create chat history
 */
async function loadChatHistory(leaseDataId: string, userEmail: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_history')
    .select('messages')
    .eq('lease_data_id', leaseDataId)
    .eq('user_email', userEmail)
    .single();
  
  if (error || !data) {
    console.log('📝 No existing chat history, starting fresh');
    return [];
  }
  
  return data.messages as ChatMessage[];
}

/**
 * Save chat history
 */
async function saveChatHistory(
  leaseDataId: string,
  userEmail: string,
  messages: ChatMessage[]
): Promise<void> {
  // Check if history exists
  const { data: existing } = await supabase
    .from('chat_history')
    .select('id')
    .eq('lease_data_id', leaseDataId)
    .eq('user_email', userEmail)
    .single();
  
  if (existing) {
    // Update existing
    await supabase
      .from('chat_history')
      .update({ messages, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    // Create new
    await supabase
      .from('chat_history')
      .insert({
        lease_data_id: leaseDataId,
        user_email: userEmail,
        messages,
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { leaseDataId, userEmail, question, chatHistory = [] } = body;
    
    console.log(`💬 Chat request for lease ${leaseDataId} from ${userEmail}`);
    console.log(`❓ Question: ${question}`);
    
    if (!leaseDataId || !userEmail || !question) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Fetch lease data with stored chunks
    const { data: leaseData, error: fetchError } = await supabase
      .from('lease_data')
      .select('chunks, property_address, monthly_rent, security_deposit')
      .eq('id', leaseDataId)
      .single();
    
    if (fetchError || !leaseData) {
      console.error('🚨 Error fetching lease data:', fetchError);
      return NextResponse.json(
        { error: 'Lease not found' },
        { status: 404 }
      );
    }
    
    if (!leaseData.chunks || leaseData.chunks.length === 0) {
      console.error('🚨 No chunks stored for this lease');
      return NextResponse.json(
        { error: 'Lease analysis not complete - chunks missing' },
        { status: 400 }
      );
    }
    
    // Rebuild RAG from stored chunks (FAST!)
    const rag = await rebuildRAGFromChunks(leaseData.chunks);
    
    // Query RAG for relevant chunks
    console.log(`🔍 Searching for relevant chunks...`);
    const relevantChunks = await rag.retrieve(question, 5);
    console.log(`✅ Found ${relevantChunks.length} relevant chunks`);
    
    // Build context from chunks
    const context = relevantChunks
      .map((chunk, idx) => `[Excerpt ${idx + 1} from Page ${chunk.pageNumber}]:\n${chunk.text}`)
      .join('\n\n');
    
    // Prepare sources for response
    const sources = relevantChunks.map(chunk => ({
      text: chunk.text,
      pageNumber: chunk.pageNumber,
    }));
    
    // Load previous chat history from DB
    const dbChatHistory = await loadChatHistory(leaseDataId, userEmail);
    const fullHistory = [...dbChatHistory, ...chatHistory];
    
    // Build conversation history for context
    const conversationContext = fullHistory
      .slice(-6) // Last 3 exchanges
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
    
    // Generate answer with GPT-4
    console.log(`🤖 Generating answer...`);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a precise lease document assistant that ONLY answers based on the provided lease excerpts.

CRITICAL REQUIREMENTS:
1. ONLY use information explicitly stated in the lease excerpts provided below
2. DO NOT reference or assume state/local laws, regulations, or legal standards
3. DO NOT provide generic advice not found in the lease
4. If the lease excerpts don't contain the answer, clearly state: "The lease excerpts provided don't address this question"
5. Quote specific terms from the lease and cite page numbers
6. If asked about legal matters beyond what's in the lease, respond: "Your lease doesn't specify this. Consult a local tenant rights organization or attorney."

WHAT YOU CAN DO:
- Quote and explain what the lease says
- Point to specific page numbers and sections
- Compare related clauses from different pages
- Clarify lease terminology using what's written in the lease

WHAT YOU CANNOT DO:
- Reference laws, statutes, or regulations not mentioned in the lease
- Make assumptions about "typical" or "standard" practices
- Provide advice on what "should" be in a lease
- Fill in gaps with general knowledge

Lease Information:
- Property: ${leaseData.property_address || 'Not specified'}
- Monthly Rent: ${leaseData.monthly_rent || 'Not specified'}
- Security Deposit: ${leaseData.security_deposit || 'Not specified'}

Previous Conversation:
${conversationContext || 'None'}

Remember: If it's not in the lease excerpts, acknowledge that limitation clearly.`,
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nRelevant excerpts from THIS lease:\n\n${context}\n\nAnswer the question using ONLY the information in these excerpts. Be specific about page numbers.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });
    
    const answer = completion.choices[0].message.content || 'Sorry, I could not generate an answer.';
    console.log(`✅ Answer generated`);
    
    // Create message objects
    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };
    
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: answer,
      timestamp: new Date().toISOString(),
      sources,
    };
    
    // Update chat history
    const updatedHistory = [...fullHistory, userMessage, assistantMessage];
    await saveChatHistory(leaseDataId, userEmail, updatedHistory);
    console.log(`💾 Chat history saved`);
    
    const response: ChatResponse = {
      answer,
      sources,
      timestamp: assistantMessage.timestamp,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('🚨 Chat error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Chat failed',
        details: 'An error occurred while processing your question'
      },
      { status: 500 }
    );
  }
}

