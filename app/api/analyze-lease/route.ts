import { NextRequest, NextResponse } from 'next/server';
import { analyzeLeaseStructured, generateActionableScenarios } from '@/lib/lease-analysis';
import { extractBasicLeaseInfo } from '@/lib/lease-extraction';
import { getDownloadUrl } from '@vercel/blob';
import { supabase } from '@/lib/supabase';
import { extractTextWithPageNumbers, findPageNumber } from '@/lib/llamaparse-utils';
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
    console.log('🔍 Starting lease analysis...');
    
    // Get locale from cookies (for Spanish output)
    const locale = request.cookies.get('locale')?.value || 'en';
    console.log(`🌐 Detected locale: ${locale}`);
    
    // Validate request headers
    const contentType = request.headers.get('content-type');
    if (!contentType) {
      console.error('🚨 Missing content-type header');
      return NextResponse.json(
        { error: 'Invalid request format', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }
    
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

    // Extract text from PDF with page tracking and retry logic
    console.log('📄 Extracting text from PDF...');
    let pdfData;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        pdfData = await extractTextWithPageNumbers(uint8Array);
        break;
      } catch (extractError) {
        retryCount++;
        console.error(`🚨 PDF extraction attempt ${retryCount} failed:`, extractError);
        
        if (retryCount >= maxRetries) {
          throw new Error(`PDF extraction failed after ${maxRetries} attempts: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`);
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    if (!pdfData) {
      throw new Error('PDF extraction failed - no data returned');
    }
    
    const leaseText = pdfData.fullText;
    
    // Validate extracted text
    if (!leaseText || leaseText.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains no readable text. Please ensure the PDF has selectable text.');
    }
    
    if (leaseText.length < 100) {
      console.warn('⚠️ Very short lease text extracted:', leaseText.length, 'characters');
    }
    
    console.log('✅ PDF text extracted successfully:', {
      textLength: leaseText.length,
      pageCount: pdfData.pages.length,
      avgPageLength: Math.round(leaseText.length / pdfData.pages.length)
    });

    // Extract basic lease info first (for map data)
    const basicInfo = await extractBasicLeaseInfo(leaseText, address);
    
    // Initialize RAG system for accurate source attribution
    console.log('🚀 Initializing RAG system...');
    let rag;
    let ragStats = null;
    try {
      rag = await createLeaseRAG(pdfData.pages, true); // true = use embeddings
      ragStats = rag.getStats();
      console.log('✅ RAG system ready:', ragStats);
    } catch (ragError) {
      console.error('🚨 RAG initialization failed:', ragError);
      // Continue without RAG if it fails
      console.warn('⚠️ Continuing analysis without RAG system');
      rag = null;
    }
    
    // Analyze lease using RAG (no more hallucinations!) - with timeout protection
    console.log('🔍 Analyzing lease with RAG...');
    let structuredData;
    try {
      const structuredDataPromise = analyzeLeaseWithRAG(rag, address, locale);
      structuredData = await withTimeout(structuredDataPromise, 60000, 'Lease analysis timeout');
    } catch (analysisError) {
      console.error('🚨 Lease analysis failed:', analysisError);
      // Fallback to basic analysis without RAG
      console.warn('⚠️ Falling back to basic analysis...');
      try {
        structuredData = await analyzeLeaseStructured(leaseText, address);
      } catch (fallbackError) {
        console.error('🚨 Fallback analysis also failed:', fallbackError);
        throw new Error(`Lease analysis failed: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`);
      }
    }
    
    // Enrich with exact sources from chunks
    console.log('📄 Enriching with exact sources...');
    let enrichedData;
    try {
      const enrichPromise = enrichWithSources(structuredData, rag);
      enrichedData = await withTimeout(enrichPromise, 30000, 'Source enrichment timeout');
    } catch (enrichError) {
      console.error('🚨 Source enrichment failed:', enrichError);
      console.warn('⚠️ Continuing without source enrichment...');
      // Use original data without enrichment
      enrichedData = structuredData;
    }
    console.log('✨ Source attribution complete');
    
    // Analyze red flags with dedicated RAG system
    console.log('🚩 Analyzing red flags with RAG...');
    let redFlags = [];
    try {
      const redFlagsPromise = analyzeRedFlagsWithRAG(rag, {
        monthlyRent: basicInfo.monthly_rent?.toString(),
        securityDeposit: basicInfo.security_deposit?.toString(),
        address: address
      }, locale);
      redFlags = await withTimeout(redFlagsPromise, 45000, 'Red flags analysis timeout');
      console.log(`✅ Found ${redFlags.length} red flags`);
    } catch (redFlagsError) {
      console.error('🚨 Red flags analysis failed:', redFlagsError);
      console.warn('⚠️ Continuing without red flags analysis...');
      // Use empty array as fallback
      redFlags = [];
    }
    
    // Replace enrichedData red flags with the new RAG-based analysis
    enrichedData.red_flags = redFlags.map(flag => ({
      issue: flag.issue,
      severity: flag.severity,
      explanation: flag.explanation,
      source: flag.source,
      page_number: flag.page_number
    }));
    
    // Scenarios will be loaded separately after analysis to avoid timeout
    console.log('📋 Scenarios will be loaded separately via /api/generate-scenarios');

    // Save structured data to Supabase
    let leaseDataId = null;
    try {
      console.log('💾 Saving lease data to Supabase...');
      
      // Store chunks with embeddings for fast RAG rebuild in chat
      // NOTE: This requires the database migration to be run first
      const chunksToStore = rag ? rag.getAllChunks().map(chunk => ({
        text: chunk.text,
        pageNumber: chunk.pageNumber,
        embedding: chunk.embedding || [],
        chunkIndex: chunk.chunkIndex,
        startIndex: chunk.startIndex || 0,
        endIndex: chunk.endIndex || 0
      })) : [];
      
      console.log(`💾 Preparing to store ${chunksToStore.length} chunks with embeddings...`);
      
      // Prepare lease data object
      const leaseDataToInsert: any = {
        user_name: userName,
        user_email: userEmail,
        pdf_url: pdfUrl || '',
        user_address: address,
        building_name: basicInfo.building_name,
        property_address: basicInfo.property_address,
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
        raw_analysis: enrichedData,
      };
      
      // Only add chunks if we have them (requires database migration)
      if (chunksToStore && chunksToStore.length > 0) {
        leaseDataToInsert.chunks = chunksToStore;
        console.log(`💾 Including ${chunksToStore.length} chunks in database insert`);
      } else {
        console.log('⚠️ No chunks to store (RAG not initialized or migration not run)');
      }
      
      const { data: leaseData, error: leaseError } = await supabase
        .from('lease_data')
        .insert(leaseDataToInsert)
        .select()
        .single();

      if (leaseError) {
        console.error('🚨 Error saving lease data:', leaseError);
        console.error('🚨 Lease error details:', {
          message: leaseError.message,
          details: leaseError.details,
          hint: leaseError.hint,
          code: leaseError.code
        });
        // Continue without saving to database
        console.warn('⚠️ Continuing analysis without database save...');
      } else {
        leaseDataId = leaseData.id;
        console.log('✅ Lease data saved with ID:', leaseDataId);
        
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
              console.error('🚨 Error saving PDF upload metadata:', uploadError);
              console.error('🚨 Upload error details:', {
                message: uploadError.message,
                details: uploadError.details,
                hint: uploadError.hint,
                code: uploadError.code
              });
            } else {
              console.log('✅ PDF upload metadata saved for lease:', leaseDataId);
            }
          } catch (uploadError) {
            console.error('🚨 Error saving PDF metadata:', uploadError);
            console.warn('⚠️ Continuing without PDF metadata save...');
          }
        }
      }
    } catch (error) {
      console.error('🚨 Error saving to database:', error);
      console.error('🚨 Database error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : 'No stack trace'
      });
      console.warn('⚠️ Continuing analysis without database save...');
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
      address,
      textLength: leaseText.length,
      ragStats, // Include RAG statistics for debugging
      leaseDataId
    });

  } catch (error) {
    console.error('🚨 Analysis error:', error);
    console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('🚨 Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('🚨 Error message:', error instanceof Error ? error.message : String(error));
    
    // Handle specific error types with detailed logging
    if (error instanceof Error) {
      console.error('🚨 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
      
      // OpenAI API errors
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        console.error('🚨 OpenAI API key issue');
        return NextResponse.json(
          { 
            error: 'AI service configuration error. Please contact support.',
            code: 'AI_CONFIG_ERROR'
          },
          { status: 500 }
        );
      }
      
      // Rate limiting
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        console.error('🚨 Rate limit exceeded');
        return NextResponse.json(
          { 
            error: 'Service temporarily unavailable due to high demand. Please try again in a few minutes.',
            code: 'RATE_LIMIT'
          },
          { status: 429 }
        );
      }
      
      // File size errors
      if (error.message.includes('payload') || error.message.includes('too large') || error.message.includes('413')) {
        console.error('🚨 File too large');
        return NextResponse.json(
          { 
            error: 'File too large. Please try with a smaller PDF file (under 20MB).',
            code: 'FILE_TOO_LARGE'
          },
          { status: 413 }
        );
      }
      
      // PDF processing errors
      if (error.message.includes('PDF') || error.message.includes('extract') || error.message.includes('unpdf')) {
        console.error('🚨 PDF processing error');
        return NextResponse.json(
          { 
            error: 'Unable to process PDF file. Please ensure it\'s a valid PDF and try again.',
            code: 'PDF_PROCESSING_ERROR'
          },
          { status: 400 }
        );
      }
      
      // Supabase errors
      if (error.message.includes('supabase') || error.message.includes('database') || error.message.includes('storage')) {
        console.error('🚨 Database/Storage error');
        return NextResponse.json(
          { 
            error: 'Database service temporarily unavailable. Please try again.',
            code: 'DATABASE_ERROR'
          },
          { status: 503 }
        );
      }
      
      // Timeout errors
      if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        console.error('🚨 Timeout error');
        return NextResponse.json(
          { 
            error: 'Analysis timed out. Please try with a smaller file or try again later.',
            code: 'TIMEOUT'
          },
          { status: 504 }
        );
      }
      
      // Memory errors
      if (error.message.includes('memory') || error.message.includes('heap') || error.message.includes('allocation')) {
        console.error('🚨 Memory error');
        return NextResponse.json(
          { 
            error: 'File too complex to process. Please try with a simpler PDF.',
            code: 'MEMORY_ERROR'
          },
          { status: 413 }
        );
      }
    }
    
    // Generic error fallback with more context
    console.error('🚨 Unhandled error type:', typeof error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred during analysis. Please try again or contact support if the issue persists.',
        code: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
