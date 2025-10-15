import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createLeaseRAG } from '@/lib/rag-system';
import { analyzeLeaseWithRAG, enrichWithSources } from '@/lib/lease-analysis-with-rag';
import { analyzeRedFlagsWithRAG } from '@/lib/red-flags-analysis';
import { extractTextWithPageNumbers } from '@/lib/pdf-utils';
import OpenAI from 'openai';

export const maxDuration = 300; // 5 minutes

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to add timeout to promises
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

// Helper function to generate advice
async function generateAdvice(question: string, leaseText: string): Promise<string> {
  const advicePrompt = `You are a helpful assistant that explains lease terms in clear, professional language that's easy to understand.

QUESTION: ${question}
LEASE TEXT: ${leaseText}

INSTRUCTIONS:
1. Read the lease text carefully and identify the key terms
2. Explain what this means for the tenant in clear, professional language
3. Keep your answer to 2-3 sentences maximum
4. Use clear, everyday language that any adult can understand
5. Focus on practical implications and what the tenant should know
6. Avoid legal jargon but don't oversimplify

Write a clear explanation:`;

  const adviceCompletion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a knowledgeable assistant who explains lease terms in clear, professional language. Use everyday language that any adult can understand, but don\'t oversimplify or use childish language. Be informative and practical.'
      },
      {
        role: 'user',
        content: advicePrompt
      }
    ],
    temperature: 0.3,
    max_tokens: 150
  });

  return adviceCompletion.choices[0].message.content?.trim() || `Here's what you should know about ${question.toLowerCase()}. Check your lease for specific details.`;
}

// Helper function to get scenario-specific action steps
function getActionableSteps(question: string): string[] {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('something breaks') || lowerQuestion.includes('broken')) {
    return [
      'Report the problem to your landlord immediately',
      'Take photos of the damage',
      'Keep records of your request',
      'Follow up if not fixed quickly'
    ];
  } else if (lowerQuestion.includes('security deposit')) {
    return [
      'Clean the apartment thoroughly before moving out',
      'Take photos of the condition',
      'Give proper notice to your landlord',
      'Request a written list of any deductions'
    ];
  } else if (lowerQuestion.includes('entry') || lowerQuestion.includes('privacy')) {
    return [
      'Know your privacy rights in your state',
      'Ask for proper notice before entry',
      'Document any unauthorized entries',
      'Contact local housing authority if needed'
    ];
  } else if (lowerQuestion.includes('breaking') || lowerQuestion.includes('early')) {
    return [
      'Check your lease for early termination fees',
      'Give proper written notice',
      'Try to find a replacement tenant',
      'Understand the financial consequences'
    ];
  }
  
  // Default action steps
  return [
    'Check your lease for specific terms',
    'Contact your landlord if needed',
    'Keep records of all communication',
    'Know your local tenant rights'
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leaseDataId, pdfUrl, address } = body;

    if (!leaseDataId || !pdfUrl || !address) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting enhanced analysis for lease:', leaseDataId);

    // Update status to processing
    await supabase
      .from('lease_data')
      .update({ 
        analysis_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', leaseDataId);

    // Extract text from PDF
    console.log('📖 Extracting text from PDF...');
    
    // Fetch PDF as buffer
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
    }
    const pdfBuffer = new Uint8Array(await pdfResponse.arrayBuffer());
    
    const pdfData = await extractTextWithPageNumbers(pdfBuffer);
    const leaseText = pdfData.pages.map(page => page.text).join('\n\n');

    // Initialize RAG system
    console.log('🚀 Initializing RAG system...');
    const rag = await createLeaseRAG(pdfData.pages, true);

    // Enhanced analysis with RAG
    console.log('🔍 Starting enhanced RAG analysis...');
    const structuredData = await withTimeout(
      analyzeLeaseWithRAG(rag, address),
      60000, // 1 minute
      'Enhanced analysis timeout'
    );

    // Enrich with sources
    console.log('📄 Enriching with sources...');
    const enrichedData = await withTimeout(
      enrichWithSources(structuredData, rag),
      30000, // 30 seconds
      'Source enrichment timeout'
    );

    // Enhanced red flags analysis
    console.log('🚩 Analyzing red flags...');
    const redFlags = await withTimeout(
      analyzeRedFlagsWithRAG(rag, {
        monthlyRent: structuredData.summary?.monthly_rent?.toString(),
        securityDeposit: structuredData.summary?.security_deposit?.toString(),
        address: address
      }),
      45000, // 45 seconds
      'Red flags analysis timeout'
    );

    // Enhanced scenarios with RAG
    console.log('🎯 Generating enhanced scenarios...');
    const scenarioQuestions = [
      "What if something breaks?",
      "Getting my security deposit back", 
      "Landlord entry and privacy rights",
      "Breaking my lease early"
    ];
    
    const enhancedScenarios = [];
    
    for (const question of scenarioQuestions) {
      try {
        // Use RAG to find relevant lease content
        const relevantChunks = await withTimeout(
          rag.retrieve(question, 3),
          10000, // 10 seconds
          `RAG timeout for ${question}`
        );
        
        if (relevantChunks.length === 0) {
          enhancedScenarios.push({
            title: question,
            advice: `Here's what you should know about ${question.toLowerCase()}. Check your lease and local laws for specific details.`,
            leaseRelevantText: '',
            pageNumber: 0,
            severity: 'medium' as const,
            actionableSteps: getActionableSteps(question)
          });
          continue;
        }

        const topChunk = relevantChunks[0];
        const advice = await withTimeout(
          generateAdvice(question, topChunk.text),
          15000, // 15 seconds
          `Advice generation timeout for ${question}`
        );

        enhancedScenarios.push({
          title: question,
          advice: advice,
          leaseRelevantText: topChunk.text,
          pageNumber: topChunk.pageNumber,
          severity: 'medium' as const,
          actionableSteps: getActionableSteps(question)
        });
        
      } catch (scenarioError) {
        console.error(`Error processing scenario "${question}":`, scenarioError);
        enhancedScenarios.push({
          title: question,
          advice: `Here's what you should know about ${question.toLowerCase()}. Check your lease and local laws for specific details.`,
          leaseRelevantText: '',
          pageNumber: 0,
          severity: 'medium' as const,
          actionableSteps: getActionableSteps(question)
        });
      }
    }

    // Update database with enhanced analysis
    const enhancedAnalysis = {
      summary: enrichedData.summary,
      red_flags: redFlags.map(flag => ({
        issue: flag.issue,
        severity: flag.severity,
        explanation: flag.explanation,
        source: flag.source,
        page_number: flag.page_number
      })),
      tenant_rights: enrichedData.tenant_rights,
      key_dates: enrichedData.key_dates,
      sources: enrichedData.sources,
      pageNumbers: enrichedData.page_numbers,
      enhanced_scenarios: enhancedScenarios
    };

    await supabase
      .from('lease_data')
      .update({ 
        analysis_data: enhancedAnalysis,
        analysis_status: 'completed',
        enhanced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', leaseDataId);

    console.log('✅ Enhanced analysis completed for lease:', leaseDataId);

    return NextResponse.json({
      success: true,
      leaseDataId,
      message: 'Enhanced analysis completed'
    });

  } catch (error) {
    console.error('Enhanced analysis error:', error);
    
    // Update status to failed
    if (body?.leaseDataId) {
      await supabase
        .from('lease_data')
        .update({ 
          analysis_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', body.leaseDataId);
    }
    
    return NextResponse.json(
      { error: 'Enhanced analysis failed' },
      { status: 500 }
    );
  }
}
