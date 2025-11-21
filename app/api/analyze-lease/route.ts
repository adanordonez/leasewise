import { NextRequest, NextResponse } from 'next/server';
import { analyzeLeaseStructured, generateActionableScenarios } from '@/lib/lease-analysis';
import { extractBasicLeaseInfo, extractDetailedSummary } from '@/lib/lease-extraction';
import { getDownloadUrl } from '@vercel/blob';
import { supabase } from '@/lib/supabase';
import { extractTextWithPageNumbers, findPageNumber } from '@/lib/llamaparse-utils';
import { createLeaseRAG } from '@/lib/rag-system';
import { analyzeLeaseWithRAG, enrichWithSources } from '@/lib/lease-analysis-with-rag';
import { analyzeRedFlagsWithRAG } from '@/lib/red-flags-analysis';
import OpenAI from 'openai';
// import { generateRAGScenarios } from '@/lib/rag-scenarios';

// Set maximum duration for Vercel serverless functions
export const maxDuration = 800; // 13 minutes (Pro plan maximum)

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
    setTimeout(() => reject(new Error('Analysis timeout - please try with a smaller file')), 800000) // 13 minutes
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
    // console.log('🔍 Starting lease analysis...');
    
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
    // console.log('📄 Extracting text from PDF...');
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
    
    // console.log('✅ PDF text extracted successfully:', {
    //   textLength: leaseText.length,
    //   pageCount: pdfData.pages.length,
    //   avgPageLength: Math.round(leaseText.length / pdfData.pages.length)
    // });

    // ⚡ PARALLEL EXTRACTION: Extract both basic AND detailed info at the same time
  
    console.log(`📝 Extracting lease details with locale: ${locale}`);
    
    const [basicInfo, detailedSummary] = await Promise.all([
      extractBasicLeaseInfo(leaseText, address),      // Basic info (4 sec)
      extractDetailedSummary(leaseText, address, locale)       // Detailed summary (10 sec) with locale
    ]);
    
    console.log(`✅ Extraction complete. Sample policy: ${detailedSummary.smoking_policy?.substring(0, 100)}...`);
   
    
    // ⚡ OPTIMIZED: Create RAG WITHOUT embeddings for initial load (much faster!)
    // Embeddings will be created on-demand when user clicks Red Flags/Rights/Chat
    // console.log('🚀 Initializing RAG system (without embeddings for speed)...');
    let rag;
    let ragStats = null;
    try {
      rag = await createLeaseRAG(pdfData.pages, false); // false = NO embeddings (saves 15-20s!)
      ragStats = rag.getStats();
      // console.log('✅ RAG system ready (no embeddings yet):', ragStats);
    } catch (ragError) {
      console.error('🚨 RAG initialization failed:', ragError);
      // Continue without RAG if it fails
      console.warn('⚠️ Continuing analysis without RAG system');
      rag = null;
    }
    
    // ⚡ OPTIMIZED: Extract basic info only (no heavy analysis)
    // console.log('🔍 Extracting basic lease info (fast mode)...');
    
    // Note: basicInfo is already extracted above via extractBasicLeaseInfo()
    // We skip the heavy RAG analysis for now - it will be loaded on-demand
    
    // console.log('✅ Basic info extracted - skipping heavy analysis for performance');
    
    // Scenarios will be loaded separately after analysis to avoid timeout
    // console.log('📋 Scenarios will be loaded separately via /api/generate-scenarios');

    // Save structured data to Supabase
    let leaseDataId = null;
    try {
      // console.log('💾 Saving lease data to Supabase...');
      
      // ⚡ Store chunks WITHOUT embeddings (for speed)
      // Embeddings will be created on-demand when user needs them
      const chunksToStore = rag ? rag.getAllChunks().map(chunk => ({
        text: chunk.text,
        pageNumber: chunk.pageNumber,
        embedding: null, // No embeddings yet - created on-demand!
        chunkIndex: chunk.chunkIndex,
        startIndex: chunk.startIndex || 0,
        endIndex: chunk.endIndex || 0
      })) : [];
      
      // console.log(`💾 Preparing to store ${chunksToStore.length} chunks (no embeddings yet - will create on-demand)...`);
      
      // Prepare lease data object (basic info + detailed summary - heavy analysis done on-demand)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        notice_period_days: detailedSummary.move_out_notice_days || 30,
        property_type: basicInfo.property_type,
        square_footage: basicInfo.square_footage,
        bedrooms: basicInfo.bedrooms,
        bathrooms: basicInfo.bathrooms,
        parking_spaces: 0, // Default - to be analyzed on-demand
        pet_policy: detailedSummary.pet_policy || 'Not specified',
        utilities_included: basicInfo.utilities_included,
        amenities: basicInfo.amenities,
        landlord_name: basicInfo.landlord_name,
        management_company: basicInfo.management_company,
        contact_email: basicInfo.contact_email,
        contact_phone: basicInfo.contact_phone,
        // These will be populated on-demand via separate API calls
        lease_terms: [],
        special_clauses: [],
        market_analysis: {
          rent_percentile: 50,
          deposit_status: 'standard',
          rent_analysis: 'Market analysis available on demand'
        },
        red_flags: null, // Will be populated by /api/analyze-red-flags
        tenant_rights: null, // Will be populated by /api/analyze-rights
        key_dates: [],
   
        raw_analysis: {
          ...basicInfo,
          detailed_summary: detailedSummary,
        },
      };
      
      // Only add chunks if we have them (requires database migration)
      if (chunksToStore && chunksToStore.length > 0) {
        leaseDataToInsert.chunks = chunksToStore;
        // console.log(`💾 Including ${chunksToStore.length} chunks in database insert`);
      } else {
        // console.log('⚠️ No chunks to store (RAG not initialized or migration not run)');
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
        // console.log('✅ Lease data saved with ID:', leaseDataId);
        
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
              // console.log('✅ PDF upload metadata saved for lease:', leaseDataId);
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

    // ⚡ OPTIMIZED RESPONSE: Return basic info + detailed summary immediately
    // Heavy analysis (red flags, rights) will be loaded on-demand
    const analysis = {
      summary: {
        monthlyRent: `$${basicInfo.monthly_rent.toLocaleString()}`,
        securityDeposit: `$${basicInfo.security_deposit.toLocaleString()}`,
        leaseStart: basicInfo.lease_start_date,
        leaseEnd: basicInfo.lease_end_date,
        noticePeriod: detailedSummary.move_out_notice_days ? `${detailedSummary.move_out_notice_days} days` : '30 days',
        buildingName: basicInfo.building_name,
        propertyAddress: basicInfo.property_address,
        propertyType: basicInfo.property_type,
        bedrooms: basicInfo.bedrooms,
        bathrooms: basicInfo.bathrooms,
        squareFootage: basicInfo.square_footage,
        amenities: basicInfo.amenities,
        utilitiesIncluded: basicInfo.utilities_included,
        petPolicy: detailedSummary.pet_policy || 'Not specified',
        landlordName: basicInfo.landlord_name,
        managementCompany: basicInfo.management_company,
        contactEmail: basicInfo.contact_email,
        contactPhone: basicInfo.contact_phone,
      },
      // ✨ NEW: Detailed lease summary (loaded immediately)
      detailedSummary: detailedSummary,
      // These are not ready yet - will be loaded on-demand
      redFlags: null,
      rights: null,
      keyDates: null,
      pdfUrl: pdfUrl || undefined
    };

    return NextResponse.json({
      success: true,
      analysis,
      address,
      textLength: leaseText.length,
      ragStats, // Include RAG statistics for debugging
      leaseDataId,
      // Indicate which analyses are ready
      redFlagsReady: false,
      rightsReady: false,
      scenariosReady: false,
      // Include a message for frontend
      message: '✅ Basic analysis complete! Click sections below to load detailed analysis.'
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
