import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';
import { LeaseRAGSystem } from '@/lib/rag-system';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    console.log(`📝 Generating ${letterType} letter for lease ${leaseDataId}...`);

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

    console.log('✅ Lease data fetched successfully');

    // Rebuild RAG system from stored chunks
    let leaseRAG: LeaseRAGSystem | null = null;
    if (leaseData.chunks && Array.isArray(leaseData.chunks) && leaseData.chunks.length > 0) {
      console.log(`🔄 Rebuilding RAG system from ${leaseData.chunks.length} stored chunks...`);
      
      try {
        leaseRAG = new LeaseRAGSystem(true); // Enable embeddings
        
        // Reconstruct chunks with embeddings
        const reconstructedChunks = leaseData.chunks.map((chunk: any) => ({
          text: chunk.text,
          pageNumber: chunk.pageNumber,
          embedding: chunk.embedding || [],
          chunkIndex: chunk.chunkIndex,
          startIndex: chunk.startIndex || 0,
          endIndex: chunk.endIndex || 0
        }));
        
        // Set chunks directly
        leaseRAG['chunks'] = reconstructedChunks;
        console.log('✅ RAG system rebuilt successfully');
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

    console.log('✅ Letter generated successfully');

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
  leaseData: any;
  landlordName: string;
  landlordAddress: string;
  additionalDetails?: string;
  userName: string;
  tenantAddress: string;
}): Promise<string> {
  
  console.log('💼 Generating security deposit return letter...');

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
      
      console.log('✅ Retrieved relevant clauses from lease');
    } catch (error) {
      console.error('Error retrieving from RAG:', error);
    }
  }

  // Extract key information from analysis
  const securityDeposit = leaseData.summary?.securityDeposit || 'the security deposit amount';
  const leaseStartDate = leaseData.summary?.leaseStartDate || 'the lease start date';
  const leaseEndDate = leaseData.summary?.leaseEndDate || 'the lease end date';
  
  // Get state for applicable law (extract from address)
  const stateMatch = tenantAddress.match(/\b([A-Z]{2})\b/);
  const state = stateMatch ? stateMatch[1] : '';

  // Get relevant legal info from analysis
  const securityDepositLaw = leaseData.legalInfo?.find((law: any) => 
    law.category?.toLowerCase().includes('security deposit') ||
    law.lawType?.toLowerCase().includes('security deposit')
  );

  const prompt = `You are a professional legal assistant helping a tenant draft a formal letter to request the return of their security deposit.

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

RELEVANT LEASE CLAUSES:
${relevantClauses || 'No specific clauses found.'}

APPLICABLE LAW:
${securityDepositLaw ? `State: ${state}
Law Type: ${securityDepositLaw.lawType}
What It Says: ${securityDepositLaw.whatItSays}
Example: ${securityDepositLaw.example}
Statute: ${securityDepositLaw.statute || 'Not specified'}` : 'State law information not available.'}

ADDITIONAL DETAILS FROM TENANT:
${additionalDetails || 'None provided.'}

INSTRUCTIONS:
Draft a professional, formal letter requesting the return of the security deposit. The letter should:
1. Be dated today (${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })})
2. Use proper business letter format (include landlord address block if provided, otherwise use simplified format)
3. Start with proper salutation to ${landlordName}
4. Reference specific lease clauses about security deposit return
5. Cite applicable state law (if available)
6. Be polite but firm
7. Request the full return of the security deposit
8. Provide the tenant's forwarding address (${tenantAddress}) for the deposit check
9. Mention that the property was left in good condition (if not contradicted by additional details)
10. Reference the lease end date and required timeline for return
11. Include the tenant's contact information (${leaseData.user_email})
12. Include a professional closing with the tenant's name (${userName})

NOTE: The tenant's address (${tenantAddress}) should appear in the letter as their return/forwarding address, NOT as the recipient address.

The letter should sound like it was written by a knowledgeable tenant who understands their rights, but maintain a respectful and professional tone throughout.

Generate ONLY the letter text, no additional commentary or explanations.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional legal document writer specializing in tenant-landlord correspondence. Write clear, professional, legally-sound letters.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const letter = completion.choices[0]?.message?.content || '';
    console.log('✅ Letter drafted by AI');
    
    return letter;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

