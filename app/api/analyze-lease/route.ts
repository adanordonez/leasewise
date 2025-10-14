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
    
    // Analyze lease using RAG (no more hallucinations!)
    console.log('🔍 Analyzing lease with RAG...');
    const structuredData = await analyzeLeaseWithRAG(rag, address);
    
    // Enrich with exact sources from chunks
    console.log('📄 Enriching with exact sources...');
    const enrichedData = await enrichWithSources(structuredData, rag);
    console.log('✨ Source attribution complete');
    
    // Analyze red flags with dedicated RAG system
    console.log('🚩 Analyzing red flags with RAG...');
    const redFlags = await analyzeRedFlagsWithRAG(rag, {
      monthlyRent: basicInfo.monthly_rent?.toString(),
      securityDeposit: basicInfo.security_deposit?.toString(),
      address: address
    });
    console.log(`✅ Found ${redFlags.length} red flags`);
    
    // Replace enrichedData red flags with the new RAG-based analysis
    enrichedData.red_flags = redFlags.map(flag => ({
      issue: flag.issue,
      severity: flag.severity,
      explanation: flag.explanation,
      source: flag.source,
      page_number: flag.page_number
    }));
    
    // Generate scenarios
    const scenarios = await generateActionableScenarios(leaseText, address);

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
