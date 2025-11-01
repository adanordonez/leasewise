import { NextRequest, NextResponse } from 'next/server';
import { searchEnhancedLegalSources } from '@/lib/legal-search';
import { createLeaseRAG } from '@/lib/rag-system';
import { analyzeLawApplications } from '@/lib/lease-law-application';
import { extractTextWithPageNumbers } from '@/lib/llamaparse-utils';

export const maxDuration = 90; // 90 seconds for Jina AI + RAG analysis

export async function POST(request: NextRequest) {
  // console.log('🔍 Enhanced legal sources API called');
  
  try {
    const body = await request.json();
    const { rightText, userAddress, description, pdfUrl, leaseContext } = body;
    
    if (!rightText || !userAddress || !description) {
      return NextResponse.json(
        { error: 'rightText, userAddress, and description are required' },
        { status: 400 }
      );
    }
    
    // console.log(`📚 Searching enhanced legal sources for: "${description}"`);
    // console.log(`📍 Location: ${userAddress}`);
    
    const result = await searchEnhancedLegalSources(rightText, userAddress, description);
    
    // Check if we found any relevant sources
    if (result.sources.length === 0) {
      return NextResponse.json({
        success: true,
        sources: [],
        message: `We searched ${result.totalSearched} legal sources but couldn't find specific legal text about "${description}" for your area. This may mean:
        
• The law doesn't have publicly available text online
• Your area may not have specific regulations on this topic
• The legal text requires manual research by an attorney

We recommend consulting with a local tenant rights attorney for specific legal advice.`,
        totalSearched: result.totalSearched,
        notFoundCount: result.notFoundCount
      });
    }
    
    // If we have a PDF URL, create RAG and analyze how laws apply to the lease
    let enrichedSources = result.sources;
    
    if (pdfUrl && result.sources.length > 0) {
      try {
        // console.log('🔍 Analyzing how laws apply to the lease with RAG...');
        
        // Fetch PDF and extract text
        const pdfResponse = await fetch(pdfUrl);
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const { pages: pageTexts } = await extractTextWithPageNumbers(Buffer.from(pdfBuffer));
        
        // Create RAG system
        const leaseRAG = await createLeaseRAG(pageTexts);
        
        // Analyze how each law applies to the lease
        const lawsToAnalyze = result.sources.map(s => ({
          lawType: s.title,
          lawText: s.statuteText,
          explanation: s.explanation
        }));
        
        const applications = await analyzeLawApplications(
          lawsToAnalyze,
          leaseRAG,
          leaseContext
        );
        
        // Merge applications with sources
        enrichedSources = result.sources.map((source, index) => ({
          ...source,
          application: applications[index]?.application,
          hasMatch: applications[index]?.hasMatch
        }));
        
        // console.log(`✅ Successfully analyzed ${applications.length} law applications`);
        
      } catch (ragError) {
        console.error('⚠️ RAG analysis failed, returning sources without application analysis:', ragError);
        // Continue with regular sources if RAG fails
      }
    } else {
      // console.log('ℹ️ No PDF URL provided, skipping lease-specific analysis');
    }
    
    return NextResponse.json({
      success: true,
      sources: enrichedSources,
      totalSearched: result.totalSearched,
      notFoundCount: result.notFoundCount,
      message: `Found ${result.sources.length} relevant legal source${result.sources.length === 1 ? '' : 's'} with specific statute text.`
    });
    
  } catch (error) {
    console.error('❌ Enhanced legal sources error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search legal sources',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

