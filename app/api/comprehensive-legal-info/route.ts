import { NextRequest, NextResponse } from 'next/server';
import { searchLegalInfoWithGoogleSearch } from '@/lib/perplexity-legal-search';
import { createLeaseRAG } from '@/lib/rag-system';
import { analyzeLawApplications } from '@/lib/lease-law-application';
import { extractTextWithPageNumbers } from '@/lib/llamaparse-utils';

export const maxDuration = 120; // 120 seconds for verification + RAG analysis

export async function POST(request: NextRequest) {
  console.log('🔍 Comprehensive legal info API called');
  
  try {
    const body = await request.json();
    const { userAddress, leaseContext, pdfUrl } = body;
    
    // Get locale from cookies (for Spanish output)
    const locale = request.cookies.get('locale')?.value || 'en';
    console.log(`🌐 Detected locale: ${locale}`);
    
    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      );
    }
    
    console.log(`📚 Searching legal info with Google search for: ${userAddress}`);
    console.log(`📄 Lease context:`, leaseContext);
    console.log(`📄 PDF URL:`, pdfUrl ? 'Provided' : 'Not provided');
    
    // Use Google search URLs for statutes (more reliable than Justia)
    const result = await searchLegalInfoWithGoogleSearch(userAddress, leaseContext, locale);
    
    console.log(`✅ Got ${result.legalInfo.length} legal categories with Google search URLs`);
    console.log(`📊 Search stats: ${result.searchMetadata.totalSources} total sources`);
    
    // If we have a PDF URL, use RAG to personalize the examples
    if (pdfUrl && result.legalInfo.length > 0) {
      try {
        console.log('🔍 Starting RAG analysis to personalize legal info...');
        
        // Fetch PDF and extract text
        const pdfResponse = await fetch(pdfUrl);
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const { pages: pageTexts, totalPages } = await extractTextWithPageNumbers(new Uint8Array(pdfBuffer));
        
        console.log(`📄 Extracted text from ${totalPages} pages`);
        
        // Create RAG system
        const leaseRAG = await createLeaseRAG(pageTexts);
        console.log(`✅ RAG system created`);
        
        // Convert legal info to format for analysis
        const lawsToAnalyze = result.legalInfo.map(info => ({
          lawType: info.lawType,
          lawText: info.explanation, // Use explanation as the law text
          explanation: info.explanation
        }));
        
        console.log(`🔍 Analyzing ${lawsToAnalyze.length} laws with RAG...`);
        
        // Analyze how each law applies to the lease
        const applications = await analyzeLawApplications(
          lawsToAnalyze,
          leaseRAG,
          leaseContext,
          locale
        );
        
        console.log(`✅ RAG analysis complete!`);
        
        // Log each category's analysis
        applications.forEach((app, index) => {
          console.log(`\n📋 Category ${index + 1}: ${app.lawType}`);
          console.log(`   Application: ${app.application.slice(0, 100)}...`);
          console.log(`   Has Match: ${app.hasMatch ? 'Yes' : 'No'}`);
        });
        
        // Merge applications back into legal info (replace "example" with "application")
        const enrichedLegalInfo = result.legalInfo.map((info, index) => ({
          ...info,
          example: applications[index]?.application || info.example, // Replace example with personalized application
          hasMatch: applications[index]?.hasMatch
        }));
        
        console.log(`✅ Successfully personalized ${enrichedLegalInfo.length} legal categories`);
        
        return NextResponse.json({
          success: true,
          legalInfo: enrichedLegalInfo,
          searchMetadata: result.searchMetadata,
        });
        
      } catch (ragError) {
        console.error('⚠️ RAG analysis failed, returning generic examples:', ragError);
        // Continue with regular legal info if RAG fails
      }
    } else {
      console.log('ℹ️ No PDF URL provided, using generic examples');
    }
    
    return NextResponse.json({
      success: true,
      ...result,
    });
    
  } catch (error) {
    console.error('❌ Comprehensive legal info error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search legal information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

