import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';
import type { ChatMessage, ChatRequest, ChatResponse, ChatSource } from '@/types/chat';
import { rebuildRAGFromChunks } from '@/lib/rag-rebuild';
import { searchWithPerplexity } from '@/lib/perplexity-chat';
import { enhanceQuery } from '@/lib/query-rewriter';
import { routeQuestion } from '@/lib/intelligent-router';

export const maxDuration = 60; // 60 seconds for chat

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    // console.log('📝 No existing chat history, starting fresh');
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
    
    // console.log(`💬 Chat request for lease ${leaseDataId} from ${userEmail}`);
    // console.log(`❓ Question: ${question}`);
    
    if (!leaseDataId || !userEmail || !question) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // STEP 1: INTELLIGENT ROUTING - Single LLM call makes all decisions
    // Load chat history and merge with current session
    const dbChatHistory = await loadChatHistory(leaseDataId, userEmail);
    const fullHistory = [...dbChatHistory, ...chatHistory];
    
    // Pass last 4 messages (2 exchanges) for context to router
    const recentContext = fullHistory
      .slice(-4)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const routing = await routeQuestion(question, recentContext);
    
    // Handle irrelevant questions
    if (routing.decision === 'irrelevant') {
      console.log(`⚠️ Question rejected as irrelevant: "${question}"`);
      
      const irrelevantResponse: ChatResponse = {
        answer: routing.rejectionMessage || "I'm specialized in helping with lease and housing-related questions. Please ask me about your lease agreement, rental terms, or housing rights.",
        sources: [],
        timestamp: new Date().toISOString(),
        usedPerplexity: false,
      };
      
      return NextResponse.json(irrelevantResponse);
    }
    
    // Handle vague questions that need clarification
    if (routing.decision === 'needs_clarification') {
      console.log(`🤔 Question needs clarification: "${question}"`);
      
      let clarificationResponse = routing.clarificationMessage || "Could you please be more specific about what you'd like to know?";
      
      // Add suggested questions if available
      if (routing.suggestedQuestions && routing.suggestedQuestions.length > 0) {
        clarificationResponse += "\n\nFor example, you could ask:\n" + 
          routing.suggestedQuestions.map(q => `• ${q}`).join('\n');
      }
      
      const clarificationResponseObj: ChatResponse = {
        answer: clarificationResponse,
        sources: [],
        timestamp: new Date().toISOString(),
        usedPerplexity: false,
      };
      
      return NextResponse.json(clarificationResponseObj);
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
    
    // Rebuild RAG from stored chunks
    const rag = await rebuildRAGFromChunks(leaseData.chunks);
    
    // ⚡ Check if embeddings exist - if not, create them now!
    const hasEmbeddings = leaseData.chunks.some((c: { embedding?: number[] }) => 
      c.embedding && c.embedding.length > 0
    );
    
    if (!hasEmbeddings) {
      // console.log('⚡ No embeddings found - creating them now for chat (this will take 10-15s)...');
      
      // Import the embedding creation function
      const { createEmbeddingsBatch } = await import('@/lib/rag-embeddings');
      
      // Create embeddings for all chunks
      const chunksWithEmbeddings = await createEmbeddingsBatch(rag.getAllChunks());
      
      // Update the RAG system with new embeddings
      // @ts-expect-error - accessing private property
      rag.chunks = chunksWithEmbeddings;
      
      // Save embeddings to database for future use
      const updatedChunks = chunksWithEmbeddings.map(chunk => ({
        text: chunk.text,
        pageNumber: chunk.pageNumber,
        embedding: chunk.embedding,
        chunkIndex: chunk.chunkIndex,
        startIndex: chunk.startIndex,
        endIndex: chunk.endIndex
      }));
      
      await supabase
        .from('lease_data')
        .update({ chunks: updatedChunks })
        .eq('id', leaseDataId);
      
      // console.log('✅ Embeddings created and saved to database');
    } else {
      // console.log('✅ Embeddings already exist - reusing them for chat');
    }
    
    // Use routing decision to determine search strategy
    console.log(`🎯 Search Strategy: ${routing.decision}`);
    
    // STEP 1: Enhance the query for better retrieval (now fullHistory is available)
    const conversationContext = fullHistory
      .slice(-2) // Last exchange for context
      .map(msg => msg.content)
      .join(' ');
    
    const enhancedQuery = await enhanceQuery(question, {
      propertyAddress: leaseData.property_address,
      conversationHistory: conversationContext,
    });
    
    // Use enhanced query for RAG search (unless it's perplexity_only)
    const shouldSearchLease = routing.decision !== 'perplexity_only';
    let relevantChunks: any[] = [];
    
    if (shouldSearchLease) {
      const searchQuery = enhancedQuery.enhanced;
      console.log(`📄 Step 2: Searching lease with enhanced query...`);
      console.log(`   Original: "${question}"`);
      console.log(`   Enhanced: "${searchQuery}"`);
      
      // Retrieve more chunks to have better options, we'll select the best one later
      relevantChunks = await rag.retrieve(searchQuery, 10);
      console.log(`✅ Found ${relevantChunks.length} relevant lease chunks`);
    } else {
      console.log(`⏭️ Skipping lease search (perplexity_only question)`);
    }
    
    // Initialize variables
    let leaseContext = '';
    let perplexityAnswer = '';
    const sources: ChatSource[] = [];
    
    // Build lease context for GPT to analyze (use top 5 for context)
    let bestChunk = null;
    if (relevantChunks.length > 0) {
      const topChunks = relevantChunks.slice(0, 5); // Use top 5 for GPT context
      
      leaseContext = topChunks
        .map((chunk, idx) => `[Excerpt ${idx + 1} from Page ${chunk.pageNumber}]:\n${chunk.text}`)
        .join('\n\n');
      
      // The FIRST chunk is usually the most relevant (highest similarity score)
      // We'll let GPT use all 5 for context, but only cite the best one as source
      bestChunk = topChunks[0];
      
      console.log(`📌 Best chunk selected: Page ${bestChunk.pageNumber} (will be shown as source)`);
    }
    
    // Determine if we need Perplexity based on routing decision
    const needsPerplexity = routing.decision === 'hybrid' || 
                            routing.decision === 'perplexity_only';
    
    console.log(`🧠 Analysis:`, { 
      strategy: routing.decision,
      leaseChunks: relevantChunks.length,
      needsPerplexity,
      confidence: routing.confidence,
      question: question.substring(0, 60) + '...'
    });
    
    // DON'T add lease source yet - we'll let GPT identify which chunk it actually used
    
    // Use Perplexity as fallback or supplement (with enhanced query)
    if (needsPerplexity) {
      const perplexityMode = routing.decision === 'hybrid' ? 'supplement' : 'primary';
      console.log(`🌐 Step 3: Using Perplexity as ${perplexityMode}...`);
      try {
        // Use enhanced query for Perplexity too
        const perplexityQuestion = enhancedQuery.enhanced;
        console.log(`   Using enhanced query: "${perplexityQuestion}"`);
        
        const perplexityResult = await searchWithPerplexity(perplexityQuestion, {
          leaseLocation: leaseData.property_address,
          additionalContext: routing.decision === 'hybrid' 
            ? 'User has a lease document and needs legal/comparison context' 
            : 'User asking general question, may not relate to their lease',
        });
        
        perplexityAnswer = perplexityResult.answer;
        
        // Add 2-3 web sources from Perplexity
        const maxWebSources = Math.min(perplexityResult.citations.length, 3); // Up to 3 sources
        
        perplexityResult.citations.slice(0, maxWebSources).forEach((citation, idx) => {
          sources.push({
            type: 'web' as const,
            text: perplexityResult.answer,
            url: citation,
            title: `Web Source ${idx + 1}`,
          });
        });
        
        console.log(`✅ Perplexity completed with ${perplexityResult.citations.length} citations`);
      } catch (error) {
        console.error('🚨 Perplexity search failed:', error);
        // Continue with lease-only response if available
        if (!leaseContext) {
          console.log('⚠️ No lease info AND Perplexity failed - will inform user');
        }
      }
    } else {
      console.log(`✅ Lease has sufficient information - skipping Perplexity`);
    }
    
    // Build conversation history for context (for GPT synthesis)
    const conversationContextForGPT = fullHistory
      .slice(-6) // Last 3 exchanges
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
    
    // Generate answer with GPT-4 based on what we found
    console.log(`🤖 Step 3: Generating answer...`);
    
    let systemPrompt = '';
    let userPrompt = '';
    let answerMode = '';
    let shouldIdentifySource = false; // Track if we need GPT to identify the source
    
    // Determine answer mode based on what information we have
    if (leaseContext && perplexityAnswer) {
      // HYBRID: Have both lease and web info
      answerMode = 'HYBRID';
      shouldIdentifySource = true; // Ask GPT to identify which lease excerpt it used
      
      systemPrompt = `You are a helpful lease and housing assistant that combines information from BOTH the user's lease document AND general legal/housing knowledge.

INSTRUCTIONS:
1. Read ALL lease excerpts carefully
2. You can make reasonable deductions from lease information (calculate dates, combine clauses, etc.)
3. Then add external context from web search to provide comparison or legal context
4. Use clear phrases:
   - "According to your lease..." (for lease info)
   - "In general..." or "According to [location] law..." (for web info)
5. Be helpful and practical - answer what they're actually asking
6. CRITICAL - BE EXTREMELY STRICT about source relevance:
   - ONLY include an excerpt if you directly quoted or paraphrased information from it in your answer
   - If an excerpt is only tangentially related, DON'T include it
   - If you answered the question using web search only, return []
   - If you made deductions without using specific lease text, return []
   - Better to return [] than to include an irrelevant source
   
   ASK YOURSELF: "Did I use specific information from this excerpt to answer the question?"
   - If NO → Don't include it
   - If YES → Include it

Lease Information:
- Property: ${leaseData.property_address || 'Not specified'}
- Monthly Rent: ${leaseData.monthly_rent || 'Not specified'}
- Security Deposit: ${leaseData.security_deposit || 'Not specified'}

Previous Conversation:
${conversationContextForGPT || 'None'}

OUTPUT FORMAT:
Return JSON with this exact structure:
{
  "answer": "your answer here (combining lease info + web context)",
  "excerptsUsed": [2]  // ONLY excerpts you DIRECTLY used. Empty [] is often correct!
}`;

      userPrompt = `Question: ${question}

INFORMATION FROM YOUR LEASE (read all excerpts):
${leaseContext}

GENERAL INFORMATION FROM WEB SEARCH:
${perplexityAnswer}

Return JSON with:
1. A helpful answer that combines lease info + web context
2. An array of excerpt numbers that you DIRECTLY quoted/paraphrased from (or [] if you only used web info)

IMPORTANT: Be STRICT about excerptsUsed!
- If you answered mainly from web search → return []
- If an excerpt didn't contribute to your answer → don't include it
- Only include excerpts where you used specific information from them`;

    } else if (perplexityAnswer && !leaseContext) {
      // PERPLEXITY ONLY: No lease info found, using web as fallback
      answerMode = 'WEB_FALLBACK';
      systemPrompt = `You are a helpful housing and rental assistant. The user's lease document did not contain information about this question, so you're providing general information.

INSTRUCTIONS:
1. Provide clear, accurate information based on the web search results
2. Start by acknowledging: "Your lease doesn't specifically address this..."
3. Then provide helpful general guidance based on location: ${leaseData.property_address || 'your area'}
4. Be practical and actionable
5. Suggest they may want to clarify with their landlord for their specific situation

Lease Location: ${leaseData.property_address || 'Not specified'}

Previous Conversation:
${conversationContextForGPT || 'None'}`;

      userPrompt = `Question: ${question}

WEB SEARCH RESULTS (location-specific information):
${perplexityAnswer}

The lease document did not contain information about this topic. Provide helpful, location-specific guidance based on the web search. Make it clear this is general information for their area, and they should verify specifics with their landlord.`;

    } else if (leaseContext) {
      // LEASE ONLY: Have lease info, it's sufficient
      answerMode = 'LEASE_ONLY';
      shouldIdentifySource = true;
      
      systemPrompt = `You are an intelligent lease document assistant that helps users understand their lease.

INSTRUCTIONS:
1. Use information from the lease excerpts provided below
2. You can make REASONABLE DEDUCTIONS from the information:
   - Calculate dates (e.g., if start date is Jan 1 and term is 12 months, end date is Dec 31)
   - Combine related information (e.g., if rent is $2000 and deposit is 2x rent, deposit is $4000)
   - Infer obvious implications (e.g., if lease says "no pets except service animals", you can answer both "can I have pets?" and "can I have a service dog?")
3. Read ALL excerpts carefully
4. Be direct and helpful - answer what they're actually asking
5. If the lease genuinely doesn't contain enough information to answer, say so clearly
6. CRITICAL - BE EXTREMELY STRICT about source relevance:
   - ONLY include an excerpt if you directly quoted or paraphrased information from it in your answer
   - If an excerpt is only tangentially related, DON'T include it
   - If you can't find relevant information in the excerpts, return []
   - Better to return [] than to include an irrelevant source
   
   ASK YOURSELF: "Did I use specific information from this excerpt to answer the question?"
   - If NO → Don't include it
   - If YES → Include it

EXAMPLES OF GOOD SOURCE SELECTION:
✅ GOOD: Q: "When does my lease end?" + Excerpt 2 has "Start: 1/1/24, Term: 12 months" → excerptsUsed: [2]
✅ GOOD: Q: "How much is my deposit?" + Excerpt 1 has "Deposit: $2000" → excerptsUsed: [1]
❌ BAD: Q: "Can I have pets?" + Excerpt 3 has "No pets" BUT you answered from general knowledge → excerptsUsed: []
❌ BAD: Q: "Is this legal?" + Excerpt has rent info BUT question is about legality → excerptsUsed: []

Lease Information:
- Property: ${leaseData.property_address || 'Not specified'}
- Monthly Rent: ${leaseData.monthly_rent || 'Not specified'}
- Security Deposit: ${leaseData.security_deposit || 'Not specified'}

Previous Conversation:
${conversationContextForGPT || 'None'}

OUTPUT FORMAT:
Return JSON with this exact structure:
{
  "answer": "your answer here (can include calculations or reasonable deductions)",
  "excerptsUsed": [2]  // ONLY excerpts you DIRECTLY used. Empty [] is often correct!
}`;

      userPrompt = `Question: ${question}

Relevant excerpts from YOUR lease:
${leaseContext}

Return JSON with:
1. A helpful answer (using information from excerpts, can make reasonable deductions)
2. An array of excerpt numbers that you DIRECTLY quoted/paraphrased from (or [] if none were useful)

IMPORTANT: Be STRICT about excerptsUsed!
- Only include excerpts where you used specific information from them
- If an excerpt is only vaguely related → don't include it
- If you couldn't find relevant info → return []

Be smart and helpful - if you can reasonably deduce the answer from the information provided, do so!`;


    } else {
      // FALLBACK: No info from either source
      answerMode = 'NO_INFO';
      systemPrompt = `You are a helpful assistant. Unfortunately, neither the lease document nor web search found relevant information.`;
      
      userPrompt = `Question: ${question}

I apologize, but I couldn't find information about this in your lease document, and the web search was unsuccessful. 

Please try:
1. Rephrasing your question
2. Asking about a specific page or section of your lease
3. Contacting your landlord directly for clarification`;
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 600,
      ...(shouldIdentifySource ? { response_format: { type: 'json_object' } } : {}),
    });
    
    let answer = completion.choices[0].message.content || 'Sorry, I could not generate an answer.';
    
    // If we asked GPT to identify the source(s), parse the response and add the correct source(s)
    if (shouldIdentifySource && (answerMode === 'LEASE_ONLY' || answerMode === 'HYBRID')) {
      try {
        const parsed = JSON.parse(answer);
        answer = parsed.answer || answer;
        const excerptsUsed = parsed.excerptsUsed || []; // Array of excerpt numbers
        
        console.log(`✅ Answer generated using mode: ${answerMode}`);
        console.log(`📍 GPT identified ${excerptsUsed.length} relevant excerpt(s): ${JSON.stringify(excerptsUsed)}`);
        
        // Log which excerpts are available for reference
        if (excerptsUsed.length > 0) {
          console.log(`📚 Available excerpts: ${relevantChunks.slice(0, 5).map((c, i) => `${i+1}:Page${c.pageNumber}`).join(', ')}`);
        }
        
        // Add all relevant lease sources that GPT actually used (up to 3)
        if (excerptsUsed.length > 0) {
          const addedPages = new Set<number>(); // Track to avoid duplicate pages
          
          for (const excerptNum of excerptsUsed.slice(0, 3)) { // Max 3 sources
            const usedExcerptIndex = excerptNum - 1; // Convert to 0-based index
            
            if (relevantChunks[usedExcerptIndex]) {
              const actualChunk = relevantChunks[usedExcerptIndex];
              
              // Avoid duplicate pages
              if (!addedPages.has(actualChunk.pageNumber)) {
                sources.unshift({
                  type: 'lease' as const,
                  text: actualChunk.text,
                  pageNumber: actualChunk.pageNumber,
                });
                addedPages.add(actualChunk.pageNumber);
                console.log(`✅ Added lease source: Page ${actualChunk.pageNumber}`);
              }
            }
          }
          
          if (addedPages.size === 0) {
            console.log(`⚠️ No valid excerpts found, not adding any lease sources`);
          }
        } else {
          console.log(`ℹ️ GPT returned empty excerpts array - no lease sources are relevant`);
        }
      } catch (error) {
        console.error('Failed to parse GPT response as JSON:', error);
        // Fallback: use the first chunk as source
        if (relevantChunks.length > 0) {
          sources.unshift({
            type: 'lease' as const,
            text: relevantChunks[0].text,
            pageNumber: relevantChunks[0].pageNumber,
          });
          console.log(`⚠️ JSON parse failed, using first chunk: Page ${relevantChunks[0].pageNumber}`);
        }
      }
    } else {
      console.log(`✅ Answer generated using mode: ${answerMode}`);
    }
    
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
    // console.log(`💾 Chat history saved`);
    
    const response: ChatResponse = {
      answer,
      sources,
      timestamp: assistantMessage.timestamp,
      usedPerplexity: answerMode === 'HYBRID' || answerMode === 'WEB_FALLBACK',
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

