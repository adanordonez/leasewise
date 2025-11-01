import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rebuildRAGFromChunks, validateChunks } from '@/lib/rag-rebuild';
import OpenAI from 'openai';
import { LeaseRAGSystem } from '@/lib/rag-system';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set timeout for this analysis (1 minute should be enough)
export const maxDuration = 60;

/**
 * On-Demand Tenant Rights Analysis
 * Called when user clicks to expand tenant rights section
 * Loads RAG chunks from database and analyzes only tenant rights
 */
export async function POST(request: NextRequest) {
  try {
    // console.log('⚖️ Starting on-demand tenant rights analysis...');
    
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
    
    // Check if tenant rights already analyzed
    if (lease.tenant_rights && Array.isArray(lease.tenant_rights) && lease.tenant_rights.length > 0) {
    //   console.log('✅ Tenant rights already analyzed - returning cached results');
      return NextResponse.json({
        success: true,
        rights: lease.tenant_rights,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasEmbeddings = lease.chunks.some((c: any) => c.embedding && c.embedding.length > 0);
      
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
      
    //   console.log('✅ RAG system rebuilt successfully');
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
    
    // 6. Analyze tenant rights using RAG system
    // console.log('🔍 Analyzing tenant rights...');
    let rights;
    try {
      rights = await analyzeTenantRights(rag, locale);
      
    //   console.log(`✅ Found ${rights.length} tenant rights`);
      
      if (rights.length === 0) {
        // console.log('⚠️ No tenant rights found - this might indicate an incomplete lease');
      }
    } catch (analysisError) {
      console.error('🚨 Tenant rights analysis failed:', analysisError);
      return NextResponse.json(
        { 
          error: 'Failed to analyze tenant rights',
          code: 'ANALYSIS_FAILED',
          details: analysisError instanceof Error ? analysisError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    // 7. Save tenant rights to database
    // console.log('💾 Saving tenant rights to database...');
    try {
      const { error: updateError } = await supabase
        .from('lease_data')
        .update({ tenant_rights: rights })
        .eq('id', leaseDataId);
      
      if (updateError) {
        console.error('🚨 Failed to save tenant rights:', updateError);
        // Continue anyway - user still gets the results
        console.warn('⚠️ Continuing without database save...');
      } else {
        // console.log('✅ Tenant rights saved to database');
      }
    } catch (saveError) {
      console.error('🚨 Database save error:', saveError);
      // Continue anyway
    }
    
    // 8. Return tenant rights
    return NextResponse.json({
      success: true,
      rights,
      cached: false,
      message: rights.length === 0 
        ? 'No explicit tenant rights found in lease' 
        : `Found ${rights.length} tenant right${rights.length > 1 ? 's' : ''} in your lease`
    });
    
  } catch (error) {
    console.error('🚨 Tenant rights analysis error:', error);
    console.error('🚨 Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : 'No stack'
    });
    
    // Return generic error
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred during tenant rights analysis',
        code: 'UNKNOWN_ERROR',
        details: error instanceof Error ? error.message : 'Please try again or contact support'
      },
      { status: 500 }
    );
  }
}

/**
 * Analyze tenant rights from lease using RAG
 */
async function analyzeTenantRights(rag: LeaseRAGSystem, locale: string): Promise<Array<{ right: string; law: string; source: string | undefined; page_number: number | undefined }>> {
  // Get relevant context for tenant rights
  const rightsContext = await rag.buildContext(
    'tenant rights obligations responsibilities maintenance repairs entry notice access quiet enjoyment',
    8  // Get more chunks for comprehensive rights analysis
  );
  
  const languageInstruction = locale === 'es' 
    ? '\n\nThis output is for a Spanish speaking tenant. Please output in simple spanish terms so that tenants can understand.' 
    : '';
  
  const prompt = `You are a tenant rights expert analyzing a residential lease agreement.

RELEVANT LEASE CONTEXT (with page numbers):
${rightsContext}

Identify ALL tenant rights and protections explicitly stated in the lease.

Return JSON in this format:
{
  "tenant_rights": [
    {
      "right": "Clear description of the tenant's right or protection",
      "law": "The specific lease section, clause, or provision that grants this right",
      "source_chunk_id": "CHUNK X" (which chunk this came from)
    }
  ]
}

IMPORTANT:
- ONLY extract rights EXPLICITLY stated in the lease text above
- Focus on: repair/maintenance obligations, entry notice requirements, quiet enjoyment, security deposit return, termination rights, subletting rights, privacy protections
- For "law" field, reference the LEASE section/clause (e.g., "Section 5.2 - Landlord Entry"), NOT external laws
- DO NOT cite or reference external statutes, regulations, or general tenant rights laws
- Note which CHUNK each right came from${languageInstruction}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a tenant rights analysis expert. Extract ONLY tenant rights explicitly stated in the provided lease chunks. Return ONLY valid JSON. Note which CHUNK each right came from."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const result = completion.choices[0].message.content;
  const parsed = JSON.parse(result || '{"tenant_rights": []}');
  
  // Enrich with exact sources
  const enrichedRights = await Promise.all(
    parsed.tenant_rights.map(async (right: { right: string; law: string }) => {
      const query = `${right.right} tenant obligations responsibilities`;
      const source = await rag.findSource(query, '');
      
      return {
        right: right.right,
        law: right.law,
        source: source?.text || undefined,
        page_number: source?.pageNumber || undefined,
      };
    })
  );
  
  return enrichedRights;
}

