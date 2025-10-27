import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { LeaseRAGSystem } from '@/lib/rag-system';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 60;

// Helper function to get comprehensive context for a scenario using multiple RAG queries
async function getScenarioContext(
  rag: any,
  question: string,
  scenarioType: string
): Promise<Array<{ text: string; pageNumber: number }>> {
  const allChunks: Array<{ text: string; pageNumber: number }> = [];
  const seenTexts = new Set<string>();
  
  // Define multiple specific queries based on scenario type
  let queries: string[] = [];
  
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('something breaks') || lowerQuestion.includes('rompe') || lowerQuestion.includes('se rompe')) {
    queries = [
      'maintenance repairs tenant responsibility landlord responsibility',
      'emergency repairs urgent repairs maintenance requests',
      'broken appliances fixtures equipment failures',
      'repair timeline response time maintenance procedures',
      'maintenance request process how to report issues'
    ];
  } else if (lowerQuestion.includes('security deposit') || lowerQuestion.includes('depósito')) {
    queries = [
      'security deposit return refund timeline',
      'security deposit deductions damage charges',
      'move-out inspection final walkthrough',
      'security deposit itemized list receipt',
      'cleaning requirements move-out checklist'
    ];
  } else if (lowerQuestion.includes('entry') || lowerQuestion.includes('privacy') || lowerQuestion.includes('entrada')) {
    queries = [
      'landlord entry access property inspection',
      'notice requirements entry notice advance notice',
      'emergency access landlord keys property access',
      'inspection schedule property showing',
      'tenant privacy rights quiet enjoyment'
    ];
  } else if (lowerQuestion.includes('breaking') || lowerQuestion.includes('early') || lowerQuestion.includes('romper')) {
    queries = [
      'early termination break lease terminate lease',
      'lease termination fees penalties early termination',
      'notice requirements termination notice',
      'subletting assignment lease transfer',
      'lease termination conditions default breach'
    ];
  } else {
    // Generic queries for other scenarios
    queries = [
      question,
      `${question} procedures requirements process`,
      `${question} fees costs amounts`,
      `${question} timeline notice period`,
      `${question} tenant obligations responsibilities`
    ];
  }
  
  console.log(`   🔍 Running ${queries.length} RAG queries to get comprehensive context...`);
  
  // Execute all queries and collect unique chunks
  for (const query of queries) {
    try {
      const chunks = await rag.retrieve(query, 2); // Reduced from 3 to 2 for faster processing
      
      for (const chunk of chunks) {
        if (!seenTexts.has(chunk.text)) {
          seenTexts.add(chunk.text);
          allChunks.push({
            text: chunk.text,
            pageNumber: chunk.pageNumber
          });
        }
      }
    } catch (error) {
      console.error(`   ⚠️ Query failed: ${query}`, error);
      // Continue with other queries even if one fails
    }
  }
  
  console.log(`   ✅ Collected ${allChunks.length} unique chunks from ${queries.length} queries`);
  
  // Limit chunks to avoid token overflow
  const MAX_CHUNKS = 15; // Limit per scenario to prevent timeout
  if (allChunks.length > MAX_CHUNKS) {
    console.log(`   ⚠️ Too many chunks (${allChunks.length}), limiting to ${MAX_CHUNKS}`);
    allChunks.splice(MAX_CHUNKS);
  }
  
  return allChunks;
}

// Helper function to generate advice and action steps with comprehensive context
async function generateAdviceWithSteps(
  question: string, 
  allRelevantChunks: Array<{ text: string; pageNumber: number }>,
  locale: string = 'en'
): Promise<{ advice: string; actionSteps: string[] }> {
  const languageInstruction = locale === 'es' 
    ? '\n\nIMPORTANT: This output is for a Spanish speaking tenant. Please respond ENTIRELY in Spanish.' 
    : '';
  
  const comprehensiveContext = allRelevantChunks
    .map((chunk, idx) => `[Excerpt ${idx + 1} from Page ${chunk.pageNumber}]:\n${chunk.text}`)
    .join('\n\n---\n\n');
    
  const advicePrompt = `You are a helpful assistant that explains lease terms using ONLY information from the actual lease document.

QUESTION: ${question}

RELEVANT EXCERPTS FROM THE ACTUAL LEASE:
${comprehensiveContext}

CRITICAL REQUIREMENTS:
1. Read ALL the excerpts above - they provide different relevant information about this topic
2. ONLY use information explicitly stated in these lease excerpts
3. Synthesize information from multiple excerpts if they relate to the same topic
4. Include specific numbers, dates, amounts, procedures, and section references from the excerpts
5. If a specific process is described, explain that EXACT process step-by-step
6. DO NOT make assumptions or provide generic advice not found in the excerpts
7. If the excerpts don't fully answer the question, acknowledge what IS covered and what ISN'T

INSTRUCTIONS FOR ADVICE (2-4 sentences):
- Explain what the lease says about this topic using information from the excerpts
- Include ALL relevant specific details (amounts, timeframes, procedures, section numbers)
- Reference which page numbers contain the key information
- Use everyday language but be precise about what the lease states
- If multiple excerpts address the topic, synthesize them into a coherent explanation

INSTRUCTIONS FOR ACTION STEPS (2-5 steps):
- Generate actionable steps based ONLY on information in the excerpts
- Each step must reference specific lease terms found in the excerpts above
- Include exact amounts, timeframes, or procedures (e.g., "Give 30 days written notice as required on page 5")
- If the lease specifies WHO to contact or HOW to do something, include that
- If the lease mentions required documentation or forms, include that
- Steps should be practical and directly traceable to the excerpts above
- Quality over quantity - only include steps that are actually supported by the lease text${languageInstruction}

Return your response in this JSON format:
{
  "advice": "Your 2-4 sentence explanation synthesizing all relevant excerpts with specific details and page references",
  "actionSteps": ["Step 1 with specific details from lease and page reference", "Step 2...", "Step 3..."]
}`;

  try {
    const adviceCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a precise lease document analyst. You synthesize information from multiple lease excerpts to provide accurate, specific explanations. You ONLY use information explicitly stated in the provided excerpts. You never make assumptions. You always include specific details (numbers, dates, procedures, pages) when they appear in the text. If information is missing, you clearly state what is and isn\'t covered in the provided excerpts.'
        },
        {
          role: 'user',
          content: advicePrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(adviceCompletion.choices[0].message.content || '{}');
    return {
      advice: response.advice || `Here's what you should know about ${question.toLowerCase()}. Check your lease for specific details.`,
      actionSteps: response.actionSteps || []
    };
  } catch (error) {
    console.error('🚨 OpenAI scenario generation failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      if (error.message.includes('token') || error.message.includes('limit')) {
        console.error('   ⚠️ Token limit exceeded for scenario generation');
      }
    }
    // Return fallback on any error
    return {
      advice: `Here's what you should know about ${question.toLowerCase()}. Check your lease for specific details.`,
      actionSteps: []
    };
  }
}

function getActionableSteps(question: string, locale: string): string[] {
  const lowerQ = question.toLowerCase();
  
  if (locale === 'es') {
    if (lowerQ.includes('rompe') || lowerQ.includes('se rompe')) {
      return ['Revisar el contrato de arrendamiento para la sección de mantenimiento'];
    } else if (lowerQ.includes('depósito')) {
      return ['Revisar el contrato para los términos del depósito de seguridad'];
    } else if (lowerQ.includes('entrada')) {
      return ['Revisar el contrato para los derechos de entrada del propietario'];
    } else if (lowerQ.includes('romper')) {
      return ['Revisar el contrato para las condiciones de terminación anticipada'];
    }
  } else {
    if (lowerQ.includes('breaks')) {
      return ['Review your lease for the maintenance section'];
    } else if (lowerQ.includes('deposit')) {
      return ['Review your lease for security deposit terms'];
    } else if (lowerQ.includes('entry')) {
      return ['Review your lease for landlord entry rights'];
    } else if (lowerQ.includes('breaking')) {
      return ['Review your lease for early termination conditions'];
    }
  }
  
  return locale === 'es' 
    ? ['Revisar el contrato para los términos relevantes']
    : ['Review your lease for relevant terms'];
}

function createFallbackScenario(question: string, locale: string = 'en') {
  const advice = locale === 'es'
    ? `Esto es lo que debe saber sobre ${question.toLowerCase()}. Verifique su contrato para obtener detalles específicos.`
    : `Here's what you should know about ${question.toLowerCase()}. Check your lease for specific details.`;
  
  return {
    title: question,
    advice,
    leaseRelevantText: '',
    pageNumber: 0,
    severity: 'medium' as const,
    actionableSteps: getActionableSteps(question, locale)
  };
}

export async function POST(request: NextRequest) {
  try {
    const { leaseDataId } = await request.json();
    
    console.log(`📋 Generating scenarios for lease ${leaseDataId}...`);
    
    // Get locale from cookies
    const locale = request.cookies.get('locale')?.value || 'en';
    
    // Fetch lease data with stored chunks
    const { data: leaseData, error: fetchError } = await supabase
      .from('lease_data')
      .select('chunks, property_address')
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
    console.log(`🔄 Rebuilding RAG system from ${leaseData.chunks.length} stored chunks...`);
    const rag = new LeaseRAGSystem(true);
    rag['chunks'] = leaseData.chunks.map((chunk: any) => ({
      text: chunk.text,
      pageNumber: chunk.pageNumber,
      embedding: chunk.embedding || [],
      chunkIndex: chunk.chunkIndex,
      startIndex: chunk.startIndex || 0,
      endIndex: chunk.endIndex || 0
    }));
    console.log('✅ RAG system rebuilt successfully');
    
    // Generate scenarios
    const scenarioQuestions = locale === 'es' ? [
      "¿Qué pasa si algo se rompe?",
      "Recuperar mi depósito de seguridad",
      "Derechos de entrada del propietario y privacidad",
      "Romper mi contrato anticipadamente"
    ] : [
      "What if something breaks?",
      "Getting my security deposit back", 
      "Landlord entry and privacy rights",
      "Breaking my lease early"
    ];
    
    const scenarios = [];
    
    for (const question of scenarioQuestions) {
      console.log(`🔍 Processing scenario: ${question}`);
      const startTime = Date.now();
      
      try {
        // Gather context with timeout protection
        const allRelevantChunks = await Promise.race([
          getScenarioContext(rag, question, question),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Context gathering timeout')), 15000)
          )
        ]);
        
        if (allRelevantChunks.length === 0) {
          console.log(`   ❌ No relevant chunks found for: ${question}`);
          scenarios.push(createFallbackScenario(question, locale));
          continue;
        }

        console.log(`   ✅ Collected ${allRelevantChunks.length} relevant chunks`);

        // Generate advice with timeout protection
        const result = await Promise.race([
          generateAdviceWithSteps(question, allRelevantChunks, locale),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Advice generation timeout')), 15000)
          )
        ]);
        
        const displayChunk = allRelevantChunks[0];
        scenarios.push({
          title: question,
          advice: result.advice,
          leaseRelevantText: displayChunk.text,
          pageNumber: displayChunk.pageNumber,
          severity: 'medium' as const,
          actionableSteps: result.actionSteps
        });
        
        const elapsed = Date.now() - startTime;
        console.log(`   ⏱️ Scenario completed in ${elapsed}ms`);
        
      } catch (scenarioError) {
        console.error(`❌ Error processing scenario "${question}":`, scenarioError);
        const elapsed = Date.now() - startTime;
        console.error(`   ⏱️ Failed after ${elapsed}ms`);
        scenarios.push(createFallbackScenario(question, locale));
      }
    }
    
    console.log(`✅ Generated ${scenarios.length} scenarios (${scenarios.filter(s => s.leaseRelevantText).length} with lease context)`);
    
    return NextResponse.json({ scenarios });
    
  } catch (error) {
    console.error('🚨 Scenarios generation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Scenarios generation failed',
        details: 'An error occurred while generating scenarios'
      },
      { status: 500 }
    );
  }
}

