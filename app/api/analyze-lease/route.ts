import { NextRequest, NextResponse } from 'next/server';
import { analyzeLeaseStructured, generateActionableScenarios } from '@/lib/lease-analysis';
import { extractBasicLeaseInfo } from '@/lib/lease-extraction';
import { extractText } from 'unpdf';
import { getDownloadUrl } from '@vercel/blob';
import { supabase } from '@/lib/supabase';

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
      const { pdfUrl: url, address: addr } = await request.json();
      pdfUrl = url;
      address = addr;

      if (!pdfUrl || !address) {
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

    // Extract text from PDF
    const { text } = await extractText(uint8Array);
    const leaseText = Array.isArray(text) ? text.join(' ') : text;

    // Extract basic lease info first (for map data)
    const basicInfo = await extractBasicLeaseInfo(leaseText, address);
    
    // Check if text is too large and chunk if necessary
    const maxTextSize = 100000; // 100k characters
    let structuredData, scenarios;

    if (leaseText.length > maxTextSize) {
      // For very large texts, use the first chunk for analysis
      const chunks = chunkText(leaseText, maxTextSize);
      const firstChunk = chunks[0];
      
      console.log(`Text too large (${leaseText.length} chars), using first chunk (${firstChunk.length} chars)`);
      
      structuredData = await analyzeLeaseStructured(firstChunk, address);
      scenarios = await generateActionableScenarios(firstChunk, address);
    } else {
      structuredData = await analyzeLeaseStructured(leaseText, address);
      scenarios = await generateActionableScenarios(leaseText, address);
    }

    // Save structured data to Supabase
    let leaseDataId = null;
    try {
      const { data: leaseData, error: leaseError } = await supabase
        .from('lease_data')
        .insert({
          pdf_url: pdfUrl || '', // Will be updated if we have the URL
          user_address: address, // User's input address for map pins
          building_name: basicInfo.building_name,
          property_address: basicInfo.property_address, // AI-extracted address from lease
          monthly_rent: basicInfo.monthly_rent,
          security_deposit: basicInfo.security_deposit,
          lease_start_date: basicInfo.lease_start_date,
          lease_end_date: basicInfo.lease_end_date,
          notice_period_days: structuredData.notice_period_days,
          property_type: basicInfo.property_type,
          square_footage: basicInfo.square_footage,
          bedrooms: basicInfo.bedrooms,
          bathrooms: basicInfo.bathrooms,
          parking_spaces: structuredData.parking_spaces,
          pet_policy: structuredData.pet_policy,
          utilities_included: basicInfo.utilities_included,
          amenities: basicInfo.amenities,
          landlord_name: basicInfo.landlord_name,
          management_company: basicInfo.management_company,
          contact_email: basicInfo.contact_email,
          contact_phone: basicInfo.contact_phone,
          lease_terms: structuredData.lease_terms,
          special_clauses: structuredData.special_clauses,
          market_analysis: structuredData.market_analysis,
          red_flags: structuredData.red_flags,
          tenant_rights: structuredData.tenant_rights,
          key_dates: structuredData.key_dates,
          raw_analysis: structuredData
        })
        .select()
        .single();

      if (leaseError) {
        console.error('Error saving lease data:', leaseError);
      } else {
        leaseDataId = leaseData.id;
        console.log('Lease data saved with ID:', leaseDataId);
      }
    } catch (error) {
      console.error('Error saving to database:', error);
    }

    // Convert structured data to the format expected by the frontend
    const analysis = {
      summary: {
        monthlyRent: `$${basicInfo.monthly_rent.toLocaleString()}`,
        securityDeposit: `$${basicInfo.security_deposit.toLocaleString()}`,
        leaseStart: basicInfo.lease_start_date,
        leaseEnd: basicInfo.lease_end_date,
        noticePeriod: `${structuredData.notice_period_days} days`
      },
      redFlags: structuredData.red_flags,
      rights: structuredData.tenant_rights,
      marketComparison: structuredData.market_analysis,
      keyDates: structuredData.key_dates
    };

    return NextResponse.json({
      success: true,
      analysis,
      scenarios,
      address,
      textLength: leaseText.length,
      chunked: leaseText.length > maxTextSize,
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
