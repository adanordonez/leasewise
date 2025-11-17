import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';
import { LeaseRAGSystem } from '@/lib/rag-system';
import { rebuildRAGFromChunks } from '@/lib/rag-rebuild';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 800; // 13 minutes (Pro plan maximum)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      leaseDataId,
      letterType,
      landlordName,
      landlordAddress,
      additionalDetails,
      userName,
      userEmail,
      tenantAddress,
    } = body;

    // console.log(`📝 Generating ${letterType} letter for lease ${leaseDataId}...`);

    // Fetch lease data from Supabase
    const { data: leaseData, error: leaseError } = await supabase
      .from('lease_data')
      .select('*')
      .eq('id', leaseDataId)
      .single();

    if (leaseError || !leaseData) {
      console.error('Error fetching lease data:', leaseError);
      return NextResponse.json(
        { error: 'Lease data not found' },
        { status: 404 }
      );
    }

    // console.log('✅ Lease data fetched successfully');

    // Rebuild RAG system from stored chunks
    let leaseRAG: LeaseRAGSystem | null = null;
    if (leaseData.chunks && Array.isArray(leaseData.chunks) && leaseData.chunks.length > 0) {
      // console.log(`🔄 Rebuilding RAG system from ${leaseData.chunks.length} stored chunks...`);
      
      try {
        leaseRAG = await rebuildRAGFromChunks(leaseData.chunks);
        
        // ⚡ Check if embeddings exist - if not, create them now!
        const hasEmbeddings = leaseData.chunks.some((c: { embedding?: number[] }) => 
          c.embedding && c.embedding.length > 0
        );
        
        if (!hasEmbeddings) {
          console.log('⚡ No embeddings found - creating them now for letter generation (this will take 10-15s)...');
          
          // Import the embedding creation function
          const { createEmbeddingsBatch } = await import('@/lib/rag-embeddings');
          
          // Create embeddings for all chunks
          const chunksWithEmbeddings = await createEmbeddingsBatch(leaseRAG.getAllChunks());
          
          // Update the RAG system with new embeddings
          // @ts-expect-error - accessing private property
          leaseRAG.chunks = chunksWithEmbeddings;
          
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
          
          console.log('✅ Embeddings created and saved to database');
        } else {
          console.log('✅ Embeddings already exist - reusing them for letter generation');
        }
        
        // console.log('✅ RAG system rebuilt successfully');
      } catch (error) {
        console.error('Error rebuilding RAG:', error);
      }
    }

    // Generate letter based on type
    let letter = '';
    
    if (letterType === 'securityDeposit') {
      letter = await generateSecurityDepositLetter({
        leaseRAG,
        leaseData,
        landlordName,
        landlordAddress,
        additionalDetails,
        userName,
        tenantAddress,
      });
    }

    // console.log('✅ Letter generated successfully');

    return NextResponse.json({
      letter,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error generating legal letter:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to generate letter', details: errorMessage },
      { status: 500 }
    );
  }
}

async function generateSecurityDepositLetter({
  leaseRAG,
  leaseData,
  landlordName,
  landlordAddress,
  additionalDetails,
  userName,
  tenantAddress,
}: {
  leaseRAG: LeaseRAGSystem | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaseData: any;
  landlordName: string;
  landlordAddress: string;
  additionalDetails?: string;
  userName: string;
  tenantAddress: string;
}): Promise<string> {
  
  // console.log('💼 Generating security deposit return letter...');

  // Get relevant context from RAG
  let relevantClauses = '';
  if (leaseRAG) {
    try {
      const queries = [
        'security deposit return process and timeline',
        'security deposit deductions and conditions',
        'move-out procedures and requirements',
        'property condition and damages'
      ];

      for (const query of queries) {
        const chunks = await leaseRAG.retrieve(query, 2);
        if (chunks.length > 0) {
          relevantClauses += chunks.map(c => c.text).join('\n\n') + '\n\n';
        }
      }
      
      // console.log('✅ Retrieved relevant clauses from lease');
    } catch (error) {
      console.error('Error retrieving from RAG:', error);
    }
  }

  // Extract key information from analysis
  const securityDeposit = leaseData.summary?.securityDeposit || 'the security deposit amount';
  const leaseStartDate = leaseData.summary?.leaseStartDate || 'the lease start date';
  const leaseEndDate = leaseData.summary?.leaseEndDate || 'the lease end date';

  const prompt = `You are a professional letter drafter helping a tenant write a formal request for security deposit return.

TENANT INFORMATION:
- Tenant Name: ${userName}
- Tenant Address: ${tenantAddress}
- Email: ${leaseData.user_email}

LANDLORD INFORMATION:
- Landlord Name: ${landlordName}
- Landlord Address: ${landlordAddress || 'Not provided - use standard letter format without landlord address block'}

LEASE DETAILS:
- Security Deposit: ${securityDeposit}
- Lease Start Date: ${leaseStartDate}
- Lease End Date: ${leaseEndDate}
- Property Address: ${tenantAddress}

RELEVANT CLAUSES FROM THE LEASE:
${relevantClauses || 'No specific security deposit clauses were found in the lease.'}

TENANT'S ADDITIONAL CONTEXT:
${additionalDetails || 'None provided.'}

CRITICAL REQUIREMENTS:
1. ONLY reference what's explicitly stated in the lease clauses above
2. DO NOT cite state laws, statutes, or general legal standards unless they appear in the lease itself
3. If the lease specifies return timelines, amounts, or procedures, reference those exact terms
4. If the lease doesn't specify something (e.g., timeline), simply request "prompt return as per the lease terms"
5. Keep the tone professional, polite, and firm
6. This is a template - the tenant will review and may need to adjust based on additional legal advice

LETTER REQUIREMENTS:
1. Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
2. Proper business letter format
3. Salutation to ${landlordName}
4. Opening paragraph: State purpose (request return of security deposit)
5. Middle paragraph(s): 
   - Reference lease end date: ${leaseEndDate}
   - Quote or reference specific lease terms about deposit return (if found in clauses)
   - Mention property was left in good condition (unless contradicted by tenant's notes)
   - If lease specifies procedures (inspection, itemized list, etc.), reference those
6. Closing paragraph:
   - Request prompt return of full deposit: ${securityDeposit}
   - Provide forwarding address for check: ${tenantAddress}
   - Provide contact email: ${leaseData.user_email}
7. Professional closing with tenant's name: ${userName}

IMPORTANT - WHAT TO AVOID:
- Do NOT cite state law unless it's mentioned in the lease clauses
- Do NOT reference "legal rights" beyond what the lease states
- Do NOT make assumptions about legal requirements
- Do NOT mention attorneys or legal action (keep it a simple request)

Generate ONLY the letter text, no additional commentary.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional letter drafter. You write clear, polite business letters based strictly on the provided lease terms. You do NOT reference laws or regulations unless they appear in the lease itself. You help tenants communicate their lease-based requests professionally.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const letter = completion.choices[0]?.message?.content || '';
    // console.log('✅ Letter drafted by AI');
    
    return letter;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

