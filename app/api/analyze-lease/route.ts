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
// import { generateRAGScenarios } from '@/lib/rag-scenarios';

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
    
    // Try to break at a sentence or paragraph
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > start + maxChunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }
    
    chunks.push(text.slice(start, end));
    start = end;
  }
  
  return chunks;
}

export async function POST(request: NextRequest) {
  // Set a global timeout for the entire operation
  const globalTimeout = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Analysis timeout - please try with a smaller file')), 240000) // 4 minutes
  );
  
  const analysisPromise = performAnalysis(request);
  
  try {
    return await Promise.race([analysisPromise, globalTimeout]);
  } catch (error) {
    console.error('Analysis failed:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Analysis failed',
        details: 'The lease analysis timed out. Please try with a smaller PDF file or contact support if the issue persists.'
      },
      { status: 504 }
    );
  }
}

async function performAnalysis(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let pdfUrl: string | null = null;
    let address: string | null = null;
    let userName: string | null = null;
    let userEmail: string | null = null;
    let uint8Array: Uint8Array;

    // Check if this is a direct file upload or PDF URL request
    if (contentType?.includes('multipart/form-data')) {
      // Direct file upload (legacy support)
      const formData = await request.formData();
      const file = formData.get('file') as File;
      address = formData.get('address') as string;

      if (!file || !address) {
        return NextResponse.json(
          { error: 'File and address are required' },
          { status: 400 }
        );
      }

      // Convert file to Uint8Array
      const bytes = await file.arrayBuffer();
      uint8Array = new Uint8Array(bytes);
    } else {
      // PDF URL request (new Supabase approach)
      const { pdfUrl: url, address: addr, userName: name, userEmail: email } = await request.json();
      pdfUrl = url;
      address = addr;
      userName = name;
      userEmail = email;

      if (!pdfUrl || !address || !userName || !userEmail) {
        return NextResponse.json(
          { error: 'PDF URL and address are required' },
          { status: 400 }
        );
      }

      // Download the file from Supabase
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to download PDF from storage' },
          { status: 400 }
        );
      }
      
      const arrayBuffer = await response.arrayBuffer();
      uint8Array = new Uint8Array(arrayBuffer);

      // Check file size (50MB limit for Supabase)
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      if (uint8Array.length > maxFileSize) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 50MB.' },
          { status: 413 }
        );
      }
    }

    // Extract text from PDF with page tracking
    const pdfData = await extractTextWithPageNumbers(uint8Array);
    const leaseText = pdfData.fullText;

    // Extract basic lease info first (for map data)
    const basicInfo = await extractBasicLeaseInfo(leaseText, address);
    
    // Initialize RAG system for accurate source attribution
    console.log('🚀 Initializing RAG system...');
    const rag = await createLeaseRAG(pdfData.pages, true); // true = use embeddings
    const ragStats = rag.getStats();
    console.log('✅ RAG system ready:', ragStats);
    
    // Analyze lease using RAG (no more hallucinations!) - with timeout protection
    console.log('🔍 Analyzing lease with RAG...');
    const structuredDataPromise = analyzeLeaseWithRAG(rag, address);
    const structuredData = await withTimeout(structuredDataPromise, 60000, 'Lease analysis timeout');
    
    // Enrich with exact sources from chunks
    console.log('📄 Enriching with exact sources...');
    const enrichPromise = enrichWithSources(structuredData, rag);
    const enrichedData = await withTimeout(enrichPromise, 30000, 'Source enrichment timeout');
    console.log('✨ Source attribution complete');
    
    // Analyze red flags with dedicated RAG system
    console.log('🚩 Analyzing red flags with RAG...');
    const redFlagsPromise = analyzeRedFlagsWithRAG(rag, {
      monthlyRent: basicInfo.monthly_rent?.toString(),
      securityDeposit: basicInfo.security_deposit?.toString(),
      address: address
    });
    const redFlags = await withTimeout(redFlagsPromise, 45000, 'Red flags analysis timeout');
    console.log(`✅ Found ${redFlags.length} red flags`);
    
    // Replace enrichedData red flags with the new RAG-based analysis
    enrichedData.red_flags = redFlags.map(flag => ({
      issue: flag.issue,
      severity: flag.severity,
      explanation: flag.explanation,
      source: flag.source,
      page_number: flag.page_number
    }));
    
    // Generate RAG-powered scenarios - inline approach for debugging
    console.log('🎯 Generating RAG-powered scenarios...');
    console.log('📊 RAG System Ready:', rag.getStats());
    console.log('📍 User Address:', address);
    
    let scenarios;
    
    // Test RAG system first
    console.log('🧪 Testing RAG system with simple query...');
    try {
      const testChunks = await rag.retrieve('rent payment', 3);
      console.log(`🧪 RAG Test: Found ${testChunks.length} chunks for "rent payment"`);
      if (testChunks.length > 0) {
        console.log(`🧪 RAG Test: First chunk preview: "${testChunks[0].text.substring(0, 100)}..."`);
      }
    } catch (testError) {
      console.error('❌ RAG Test Failed:', testError);
    }
    
    // Generate scenarios with RAG - optimized with timeout
    console.log('🔍 Generating scenarios with RAG...');
    const scenarioQuestions = [
      "What if something breaks?",
      "Getting my security deposit back", 
      "Landlord entry and privacy rights",
      "Breaking my lease early"
    ];
    
    const enhancedScenarios = [];
    
    // Process scenarios with timeout protection
    for (const question of scenarioQuestions) {
      console.log(`🔍 Processing scenario: ${question}`);
      
      try {
        // Use RAG to find relevant lease content with timeout
        const ragPromise = rag.retrieve(question, 3); // Reduced from 5 to 3 chunks
        const relevantChunks = await withTimeout(ragPromise, 10000, `RAG timeout for ${question}`);
        
        if (relevantChunks.length === 0) {
          console.log(`   ❌ No relevant chunks found for: ${question}`);
          enhancedScenarios.push(createFallbackScenario(question));
          continue;
        }

        // Get the most relevant chunk
        const topChunk = relevantChunks[0];
        console.log(`   ✅ Found relevant chunk on page ${topChunk.pageNumber}`);

        // Generate advice with timeout
        const advicePromise = generateAdvice(question, topChunk.text);
        const simpleAdvice = await withTimeout(advicePromise, 15000, `Advice generation timeout for ${question}`);
        
        // Get scenario-specific action steps
        const actionableSteps = getActionableSteps(question);

        enhancedScenarios.push({
          title: question,
          advice: simpleAdvice,
          leaseRelevantText: topChunk.text,
          pageNumber: topChunk.pageNumber,
          severity: 'medium' as const,
          actionableSteps: actionableSteps
        });
        
      } catch (scenarioError) {
        console.error(`❌ Error processing scenario "${question}":`, scenarioError);
        enhancedScenarios.push(createFallbackScenario(question));
      }
    }
    
    scenarios = { scenarios: enhancedScenarios };
    console.log(`✅ Generated ${scenarios.scenarios.length} RAG-powered scenarios`);
    console.log('📋 Scenarios Summary:', scenarios.scenarios.map((s: any) => ({
      title: s.title,
      hasLeaseText: !!s.leaseRelevantText,
      pageNumber: s.pageNumber,
      severity: s.severity
    })));

    // Save structured data to Supabase
    let leaseDataId = null;
    try {
      const { data: leaseData, error: leaseError } = await supabase
        .from('lease_data')
        .insert({
          user_name: userName,
          user_email: userEmail,
          pdf_url: pdfUrl || '', // Will be updated if we have the URL
          user_address: address, // User's input address for map pins
          building_name: basicInfo.building_name,
          property_address: basicInfo.property_address, // AI-extracted address from lease
          monthly_rent: basicInfo.monthly_rent,
          security_deposit: basicInfo.security_deposit,
          lease_start_date: basicInfo.lease_start_date,
          lease_end_date: basicInfo.lease_end_date,
          notice_period_days: enrichedData.notice_period_days,
          property_type: basicInfo.property_type,
          square_footage: basicInfo.square_footage,
          bedrooms: basicInfo.bedrooms,
          bathrooms: basicInfo.bathrooms,
          parking_spaces: enrichedData.parking_spaces,
          pet_policy: enrichedData.pet_policy,
          utilities_included: basicInfo.utilities_included,
          amenities: basicInfo.amenities,
          landlord_name: basicInfo.landlord_name,
          management_company: basicInfo.management_company,
          contact_email: basicInfo.contact_email,
          contact_phone: basicInfo.contact_phone,
          lease_terms: enrichedData.lease_terms,
          special_clauses: enrichedData.special_clauses,
          market_analysis: enrichedData.market_analysis,
          red_flags: enrichedData.red_flags,
          tenant_rights: enrichedData.tenant_rights,
          key_dates: enrichedData.key_dates,
          raw_analysis: enrichedData
        })
        .select()
        .single();

      if (leaseError) {
        console.error('Error saving lease data:', leaseError);
      } else {
        leaseDataId = leaseData.id;
        console.log('Lease data saved with ID:', leaseDataId);
        
        // Save PDF upload metadata to pdf_uploads table if we have a URL
        if (pdfUrl) {
          try {
            // Extract file info from the URL
            const urlParts = pdfUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            
            const { error: uploadError } = await supabase
              .from('pdf_uploads')
              .insert({
                file_name: fileName,
                file_size: uint8Array.length,
                file_type: 'application/pdf',
                storage_url: pdfUrl,
                address: address,
                lease_data_id: leaseDataId
              });

            if (uploadError) {
              console.error('Error saving PDF upload metadata:', uploadError);
            } else {
              console.log('PDF upload metadata saved for lease:', leaseDataId);
            }
          } catch (uploadError) {
            console.error('Error saving PDF metadata:', uploadError);
          }
        }
      }
    } catch (error) {
      console.error('Error saving to database:', error);
    }

    // Convert enriched data to the format expected by the frontend
    // Note: enrichedData already has sources and page_numbers from RAG!
    const analysis = {
      summary: {
        monthlyRent: `$${basicInfo.monthly_rent.toLocaleString()}`,
        securityDeposit: `$${basicInfo.security_deposit.toLocaleString()}`,
        leaseStart: basicInfo.lease_start_date,
        leaseEnd: basicInfo.lease_end_date,
        noticePeriod: `${enrichedData.notice_period_days} days`,
        sources: enrichedData.sources, // Exact sources from RAG chunks
        pageNumbers: enrichedData.page_numbers // Accurate page numbers from RAG
      },
      redFlags: enrichedData.red_flags, // Already has source + page_number from RAG
      rights: enrichedData.tenant_rights, // Already has source + page_number from RAG
      keyDates: enrichedData.key_dates, // Already has source + page_number from RAG
      pdfUrl: pdfUrl || undefined // Include PDF URL for viewer
    };

    return NextResponse.json({
      success: true,
      analysis,
      scenarios,
      address,
      textLength: leaseText.length,
      ragStats, // Include RAG statistics for debugging
      leaseDataId
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
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
