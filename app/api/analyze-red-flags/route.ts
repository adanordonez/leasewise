import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rebuildRAGFromChunks, validateChunks } from '@/lib/rag-rebuild';
import { analyzeRedFlagsWithRAG } from '@/lib/red-flags-analysis';

// Set timeout for this analysis
export const maxDuration = 800; // 13 minutes (Pro plan maximum)

/**
 * On-Demand Red Flags Analysis
 * Called when user clicks to expand red flags section
 * Loads RAG chunks from database and analyzes only red flags
 */
export async function POST(request: NextRequest) {
  try {
    // console.log('🚩 Starting on-demand red flags analysis...');
    
    // Get lease ID from request
    const { leaseDataId } = await request.json();
    
    if (!leaseDataId) {
      return NextResponse.json(
        { error: 'Lease ID is required' },
        { status: 400 }
      );
    }
    
    // console.log(`📋 Loading lease data for ID: ${leaseDataId}`);
    
    // 1. Load lease data with chunks from database
    const { data: lease, error: leaseError } = await supabase
      .from('lease_data')
      .select('*')
      .eq('id', leaseDataId)
      .single();
    
    if (leaseError || !lease) {
      console.error('🚨 Lease not found:', leaseError);
      return NextResponse.json(
        { error: 'Lease not found', code: 'LEASE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Check if red flags already analyzed
    if (lease.red_flags && Array.isArray(lease.red_flags) && lease.red_flags.length > 0) {
      // console.log('✅ Red flags already analyzed - returning cached results');
      return NextResponse.json({
        success: true,
        redFlags: lease.red_flags,
        cached: true
      });
    }
    
    // 2. Validate chunks exist
    if (!lease.chunks || lease.chunks.length === 0) {
      console.error('🚨 No chunks found in lease data');
      return NextResponse.json(
        { 
          error: 'No analysis data found. Please re-upload your lease.',
          code: 'NO_CHUNKS',
          details: 'The lease was processed before the chunks feature was added. Please re-upload to enable detailed analysis.'
        },
        { status: 400 }
      );
    }
    
    // console.log(`📦 Found ${lease.chunks.length} chunks in database`);
    
    // 3. Validate chunk format
    const validation = validateChunks(lease.chunks);
    if (!validation.valid) {
      console.error('🚨 Invalid chunks:', validation.error);
      return NextResponse.json(
        { 
          error: 'Invalid lease data format. Please re-upload your lease.',
          code: 'INVALID_CHUNKS',
          details: validation.error
        },
        { status: 400 }
      );
    }
    
    // 4. Rebuild RAG system from stored chunks
    // console.log('🔄 Rebuilding RAG system from stored chunks...');
    let rag;
    try {
      rag = rebuildRAGFromChunks(lease.chunks);
      
      // ⚡ Check if embeddings exist - if not, create them now!
      const hasEmbeddings = lease.chunks.some((c: { embedding?: number[] }) => 
        c.embedding && c.embedding.length > 0
      );
      
      if (!hasEmbeddings) {
        // console.log('⚡ No embeddings found - creating them now (this will take 10-15s)...');
        
        // Import the embedding creation function
        const { createEmbeddingsBatch } = await import('@/lib/rag-embeddings');
        
        // Create embeddings for all chunks
        const chunksWithEmbeddings = await createEmbeddingsBatch(rag.getAllChunks());
        
        // Update the RAG system with new embeddings
        // @ts-expect-error - accessing private property
        rag.chunks = chunksWithEmbeddings;
        
        // Save embeddings to database for future use
        const updatedChunks = chunksWithEmbeddings.map(chunk => ({
          text: chunk.text,
          pageNumber: chunk.pageNumber,
          embedding: chunk.embedding,
          chunkIndex: chunk.chunkIndex,
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex
        }));
        
        await supabase
          .from('lease_data')
          .update({ chunks: updatedChunks })
          .eq('id', leaseDataId);
        
        // console.log('✅ Embeddings created and saved to database');
      } else {
        // console.log('✅ Embeddings already exist - reusing them');
      }
      
      // console.log('✅ RAG system rebuilt successfully');
    } catch (ragError) {
      console.error('🚨 Failed to rebuild RAG:', ragError);
      return NextResponse.json(
        { 
          error: 'Failed to process lease data',
          code: 'RAG_REBUILD_FAILED',
          details: ragError instanceof Error ? ragError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    // 5. Get locale from cookies
    const locale = request.cookies.get('locale')?.value || 'en';
    // console.log(`🌐 Using locale: ${locale}`);
    
    // 6. Analyze red flags using RAG system
    // console.log('🔍 Analyzing red flags...');
    let redFlags;
    try {
      redFlags = await analyzeRedFlagsWithRAG(rag, {
        monthlyRent: lease.monthly_rent?.toString(),
        securityDeposit: lease.security_deposit?.toString(),
        address: lease.user_address
      }, locale);
      
      // console.log(`✅ Found ${redFlags.length} red flags`);
      
      if (redFlags.length === 0) {
        // console.log('ℹ️ No red flags found - this is good news!');
      }
    } catch (analysisError) {
      console.error('🚨 Red flags analysis failed:', analysisError);
      return NextResponse.json(
        { 
          error: 'Failed to analyze red flags',
          code: 'ANALYSIS_FAILED',
          details: analysisError instanceof Error ? analysisError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    // 7. Save red flags to database
    // console.log('💾 Saving red flags to database...');
    try {
      const { error: updateError } = await supabase
        .from('lease_data')
        .update({ red_flags: redFlags })
        .eq('id', leaseDataId);
      
      if (updateError) {
        console.error('🚨 Failed to save red flags:', updateError);
        // Continue anyway - user still gets the results
        console.warn('⚠️ Continuing without database save...');
      } else {
        // console.log('✅ Red flags saved to database');
      }
    } catch (saveError) {
      console.error('🚨 Database save error:', saveError);
      // Continue anyway
    }
    
    // 8. Return red flags
    return NextResponse.json({
      success: true,
      redFlags,
      cached: false,
      message: redFlags.length === 0 
        ? 'No red flags found in your lease - great news!' 
        : `Found ${redFlags.length} potential concern${redFlags.length > 1 ? 's' : ''} in your lease`
    });
    
  } catch (error) {
    console.error('🚨 Red flags analysis error:', error);
    console.error('🚨 Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : 'No stack'
    });
    
    // Return generic error
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred during red flags analysis',
        code: 'UNKNOWN_ERROR',
        details: error instanceof Error ? error.message : 'Please try again or contact support'
      },
      { status: 500 }
    );
  }
}

