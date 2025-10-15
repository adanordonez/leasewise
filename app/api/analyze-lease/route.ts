import { NextRequest, NextResponse } from 'next/server';
import { analyzeLeaseStructured, generateActionableScenarios } from '@/lib/lease-analysis';
import { extractBasicLeaseInfo } from '@/lib/lease-extraction';
import { extractText } from 'unpdf';
import { getDownloadUrl } from '@vercel/blob';
import { supabase } from '@/lib/supabase';
import { extractTextWithPageNumbers, findPageNumber } from '@/lib/pdf-utils';
import { createLeaseRAG } from '@/lib/rag-system';
import { analyzeLeaseWithRAG, enrichWithSources } from '@/lib/lease-analysis-with-rag';
import { analyzeRedFlagsWithRAG } from '@/lib/red-flags-analysis';
import OpenAI from 'openai';

// Set maximum duration for Vercel serverless functions
export const maxDuration = 300; // 5 minutes (maximum for Pro plan)

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

// Helper function to create fallback scenario
function createFallbackScenario(question: string) {
  return {
    title: question,
    advice: `Here's what you should know about ${question.toLowerCase()}. Check your lease and local laws for specific details.`,
    leaseRelevantText: '',
    pageNumber: 0,
    severity: 'medium' as const,
    actionableSteps: [
      'Check your lease for specific terms',
      'Contact your landlord if needed',
      'Keep records of all communication',
      'Know your local tenant rights'
    ]
  };
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

// Helper function to chunk large text
function chunkText(text: string, maxChunkSize: number = 50000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // Try to break at a sentence or word boundary
    if (end < text.length) {
      const lastSentence = text.lastIndexOf('.', end);
      const lastWord = text.lastIndexOf(' ', end);
      
      if (lastSentence > start + maxChunkSize * 0.7) {
        end = lastSentence + 1;
      } else if (lastWord > start + maxChunkSize * 0.7) {
        end = lastWord;
      }
    }
    
    chunks.push(text.slice(start, end));
    start = end;
  }
  
  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let pdfUrl: string | null = null;
    let address: string | null = null;
    let userName: string | null = null;
    let userEmail: string | null = null;

    if (contentType?.includes('application/json')) {
      // Handle JSON request (from Supabase upload)
      const body = await request.json();
      pdfUrl = body.pdfUrl;
      address = body.address;
      userName = body.userName;
      userEmail = body.userEmail;
    } else {
      return NextResponse.json(
        { error: 'Invalid content type. Expected JSON.' },
        { status: 400 }
      );
    }

    if (!pdfUrl) {
      return NextResponse.json(
        { error: 'PDF URL is required' },
        { status: 400 }
      );
    }

    if (!address || !userName || !userEmail) {
      return NextResponse.json(
        { error: 'Address, name, and email are required' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting lease analysis...');
    console.log(`📄 PDF URL: ${pdfUrl}`);
    console.log(`📍 Address: ${address}`);
    console.log(`👤 User: ${userName} (${userEmail})`);

    // Extract text from PDF with page numbers
    console.log('📖 Extracting text from PDF...');
    
    // Fetch PDF as buffer
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
    }
    const pdfBuffer = new Uint8Array(await pdfResponse.arrayBuffer());
    
    const pdfData = await extractTextWithPageNumbers(pdfBuffer);
    const leaseText = pdfData.pages.map(page => page.text).join('\n\n');
    console.log(`✅ Extracted ${leaseText.length} characters from ${pdfData.pages.length} pages`);

    // Extract basic lease information
    console.log('🔍 Extracting basic lease information...');
    const basicInfo = await extractBasicLeaseInfo(leaseText, address);
    console.log('✅ Basic info extracted:', {
      monthlyRent: basicInfo.monthly_rent,
      securityDeposit: basicInfo.security_deposit,
      leaseStart: basicInfo.lease_start_date,
      leaseEnd: basicInfo.lease_end_date
    });

    // Initialize RAG system
    console.log('🚀 Initializing RAG system...');
    const rag = await createLeaseRAG(pdfData.pages, true); // true = use embeddings
    const ragStats = rag.getStats();
    console.log('✅ RAG system ready:', ragStats);

    // SIMPLIFIED ANALYSIS - Focus on essential features only
    console.log('🔍 Starting simplified analysis...');
    
    // 1. Basic structured analysis (fastest)
    const structuredData = await withTimeout(
      analyzeLeaseWithRAG(rag, address),
      30000, // 30 seconds
      'Structured analysis timeout'
    );
    console.log('✅ Structured analysis complete');

    // 2. Red flags analysis (essential)
    const redFlags = await withTimeout(
      analyzeRedFlagsWithRAG(rag, {
        monthlyRent: basicInfo.monthly_rent?.toString(),
        securityDeposit: basicInfo.security_deposit?.toString(),
        address: address
      }),
      45000, // 45 seconds
      'Red flags analysis timeout'
    );
    console.log(`✅ Found ${redFlags.length} red flags`);

    // 3. Simple scenarios (no RAG, just basic scenarios)
    console.log('🎯 Generating simple scenarios...');
    const simpleScenarios = await withTimeout(
      generateActionableScenarios(leaseText, address),
      30000, // 30 seconds
      'Scenarios generation timeout'
    );
    
    const scenarios = {
      scenarios: simpleScenarios.scenarios.map((s: any) => ({
        title: s.title,
        advice: s.advice,
        severity: 'medium' as const,
        actionableSteps: [
          'Check your lease for specific terms',
          'Contact your landlord if needed',
          'Keep records of all communication',
          'Know your local tenant rights'
        ]
      }))
    };
    console.log(`✅ Generated ${scenarios.scenarios.length} simple scenarios`);

    // 4. Basic source enrichment (minimal)
    console.log('📄 Adding basic source attribution...');
    const enrichedData = await withTimeout(
      enrichWithSources(structuredData, rag),
      20000, // 20 seconds
      'Source enrichment timeout'
    );
    console.log('✅ Source attribution complete');

    // Save to database
    let leaseDataId = null;
    try {
      const { data: leaseData, error: leaseError } = await supabase
        .from('lease_data')
        .insert({
          address: address,
          monthly_rent: basicInfo.monthly_rent,
          security_deposit: basicInfo.security_deposit,
          lease_start_date: basicInfo.lease_start_date,
          lease_end_date: basicInfo.lease_end_date,
          analysis_data: {
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
            pageNumbers: enrichedData.page_numbers
          },
          user_name: userName,
          user_email: userEmail,
          pdf_url: pdfUrl
        })
        .select()
        .single();

      if (leaseError) {
        console.error('Database error:', leaseError);
      } else {
        leaseDataId = leaseData.id;
        console.log('✅ Saved to database:', leaseDataId);
      }
    } catch (dbError) {
      console.error('Database save failed:', dbError);
    }

    // Return simplified analysis with proper structure
    const analysis = {
      summary: {
        ...enrichedData.summary,
        sources: enrichedData.sources || {},
        pageNumbers: enrichedData.page_numbers || {}
      },
      redFlags: redFlags.map(flag => ({
        issue: flag.issue,
        severity: flag.severity,
        explanation: flag.explanation,
        source: flag.source,
        page_number: flag.page_number
      })),
      rights: enrichedData.tenant_rights,
      keyDates: enrichedData.key_dates,
      pdfUrl: pdfUrl
    };

    return NextResponse.json({
      success: true,
      analysis,
      scenarios,
      address,
      textLength: leaseText.length,
      ragStats,
      leaseDataId,
      simplified: true // Flag to indicate this is a simplified analysis
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Analysis timed out. Please try with a smaller PDF file.',
            details: 'The lease analysis took too long to complete. Try with a shorter lease document.'
          },
          { status: 504 }
        );
      }
      if (error.message.includes('payload') || error.message.includes('too large')) {
        return NextResponse.json(
          { error: 'File too large. Please try with a smaller PDF file.' },
          { status: 413 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze lease. Please try again.' },
      { status: 500 }
    );
  }
}