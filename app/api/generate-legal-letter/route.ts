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
      // Late Rent specific
      paymentDate,
      partialPaymentAmount,
      // Repair Request specific
      repairIssues,
      // Emergency Repair specific
      emergencyIssue,
      // Lease Non-Renewal specific
      moveOutDate,
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
    } else if (letterType === 'lateRent') {
      letter = await generateLateRentLetter({
        leaseRAG,
        leaseData,
        landlordName,
        landlordAddress,
        additionalDetails,
        userName,
        tenantAddress,
        paymentDate,
        partialPaymentAmount,
      });
    } else if (letterType === 'repairRequest') {
      letter = await generateRepairRequestLetter({
        leaseRAG,
        leaseData,
        landlordName,
        landlordAddress,
        additionalDetails,
        userName,
        tenantAddress,
        repairIssues,
      });
    } else if (letterType === 'emergencyRepair') {
      letter = await generateEmergencyRepairLetter({
        leaseRAG,
        leaseData,
        landlordName,
        landlordAddress,
        additionalDetails,
        userName,
        tenantAddress,
        emergencyIssue,
      });
    } else if (letterType === 'leaseNonRenewal') {
      letter = await generateLeaseNonRenewalLetter({
        leaseRAG,
        leaseData,
        landlordName,
        landlordAddress,
        additionalDetails,
        userName,
        tenantAddress,
        moveOutDate,
      });
    } else {
      throw new Error(`Unknown letter type: ${letterType}`);
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

async function generateLateRentLetter({
  leaseRAG,
  leaseData,
  landlordName,
  landlordAddress,
  additionalDetails,
  userName,
  tenantAddress,
  paymentDate,
  partialPaymentAmount,
}: {
  leaseRAG: LeaseRAGSystem | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaseData: any;
  landlordName: string;
  landlordAddress: string;
  additionalDetails?: string;
  userName: string;
  tenantAddress: string;
  paymentDate: string;
  partialPaymentAmount?: string;
}): Promise<string> {
  
  // console.log('💼 Generating late rent payment request letter...');

  // Get relevant context from RAG
  let relevantClauses = '';
  if (leaseRAG) {
    try {
      const queries = [
        'rent payment due date and terms',
        'late fees and payment penalties',
        'grace period for rent payment',
        'payment schedule and procedures'
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
  const monthlyRent = leaseData.summary?.monthlyRent || 'the monthly rent amount';
  const rentDueDate = leaseData.summary?.rentDueDate || 'the rent due date';

  // Format payment date nicely
  const formattedPaymentDate = paymentDate 
    ? new Date(paymentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'a specific date';

  const prompt = `You are a professional letter drafter helping a tenant write a respectful request for additional time to pay rent.

TENANT INFORMATION:
- Tenant Name: ${userName}
- Tenant Address: ${tenantAddress}
- Email: ${leaseData.user_email}

LANDLORD INFORMATION:
- Landlord Name: ${landlordName}
- Landlord Address: ${landlordAddress || 'Not provided - use standard letter format without landlord address block'}

LEASE DETAILS:
- Monthly Rent: ${monthlyRent}
- Rent Due Date: ${rentDueDate}
- Property Address: ${tenantAddress}

RELEVANT CLAUSES FROM THE LEASE:
${relevantClauses || 'No specific rent payment clauses were found in the lease.'}

TENANT'S PAYMENT PLAN:
- Can pay full rent by: ${formattedPaymentDate}
${partialPaymentAmount ? `- Willing to make partial payment of: ${partialPaymentAmount} on the original due date` : '- No partial payment offered at this time'}

TENANT'S ADDITIONAL CONTEXT:
${additionalDetails || 'None provided.'}

CRITICAL REQUIREMENTS:
1. Keep the tone respectful, apologetic, and professional
2. Express that this is a temporary situation
3. Show responsibility and commitment to fulfilling the obligation
4. Reference lease terms about late payments if found in the clauses
5. Clearly state when full payment will be made
6. If partial payment is offered, mention it prominently
7. Request understanding and flexibility
8. Offer to discuss or complete any necessary forms or agreements
9. DO NOT make excuses or go into too much personal detail
10. This is a template - keep it professional and concise

LETTER REQUIREMENTS:
1. Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
2. Proper business letter format
3. Salutation to ${landlordName}
4. Opening paragraph: Express hope landlord is well, state purpose (request additional time for rent)
5. Middle paragraph(s):
   - Acknowledge inability to pay full rent by usual due date
   - Assure this is temporary
   - State specific date for full payment: ${formattedPaymentDate}
   ${partialPaymentAmount ? `   - Offer partial payment: ${partialPaymentAmount} on original due date` : ''}
   - If lease mentions late fees or grace periods, reference those terms
6. Closing paragraph:
   - Express value for the tenancy relationship
   - Thank landlord for understanding
   - Offer to discuss further or complete any necessary paperwork
   - Provide contact email: ${leaseData.user_email}
7. Professional closing with tenant's name: ${userName}

IMPORTANT - WHAT TO AVOID:
- Do NOT make elaborate excuses or share too much personal information
- Do NOT sound demanding or entitled
- Do NOT mention legal rights or protections
- Keep it brief, respectful, and solution-focused

Generate ONLY the letter text, no additional commentary.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional letter drafter. You write respectful, concise letters that help tenants communicate temporary financial difficulties while maintaining good relationships with landlords. You focus on solutions and commitments rather than excuses.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const letter = completion.choices[0]?.message?.content || '';
    // console.log('✅ Late rent letter drafted by AI');
    
    return letter;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

async function generateRepairRequestLetter({
  leaseRAG,
  leaseData,
  landlordName,
  landlordAddress,
  additionalDetails,
  userName,
  tenantAddress,
  repairIssues,
}: {
  leaseRAG: LeaseRAGSystem | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaseData: any;
  landlordName: string;
  landlordAddress: string;
  additionalDetails?: string;
  userName: string;
  tenantAddress: string;
  repairIssues: string[];
}): Promise<string> {
  
  // console.log('💼 Generating repair request letter...');

  // Get relevant context from RAG
  let relevantClauses = '';
  if (leaseRAG) {
    try {
      const queries = [
        'repair and maintenance responsibilities',
        'maintenance request procedures',
        'landlord obligations for repairs',
        'habitability and property condition requirements'
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

  // Format repair issues list
  const issuesList = repairIssues
    .filter(issue => issue.trim() !== '')
    .map((issue, index) => `${index + 1}. ${issue}`)
    .join('\n');

  const prompt = `You are a professional letter drafter helping a tenant write a formal repair request to their landlord.

TENANT INFORMATION:
- Tenant Name: ${userName}
- Tenant Address: ${tenantAddress}
- Email: ${leaseData.user_email}

LANDLORD INFORMATION:
- Landlord Name: ${landlordName}
- Landlord Address: ${landlordAddress || 'Not provided - use standard letter format without landlord address block'}

LEASE DETAILS:
- Property Address: ${tenantAddress}

RELEVANT CLAUSES FROM THE LEASE:
${relevantClauses || 'No specific repair or maintenance clauses were found in the lease.'}

REPAIR ISSUES TO ADDRESS:
${issuesList}

TENANT'S ADDITIONAL CONTEXT:
${additionalDetails || 'None provided.'}

CRITICAL REQUIREMENTS:
1. Keep the tone professional, polite, but firm
2. Clearly list each repair issue that needs attention
3. Reference lease terms about repairs and maintenance if found in the clauses
4. Emphasize impact on safety, comfort, or habitability (if applicable)
5. Request prompt scheduling of repairs
6. Offer availability for maintenance access
7. Provide contact information for coordination
8. Request confirmation of when repairs will be addressed
9. Document the request formally (this creates a paper trail)
10. This is a template - the tenant may need to follow up or escalate if ignored

LETTER REQUIREMENTS:
1. Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
2. Proper business letter format
3. Salutation to ${landlordName}
4. Opening paragraph: Express hope landlord is well, state purpose (formal request for repairs)
5. Middle paragraph(s):
   - Clearly list each repair issue with specific details
   - If applicable, mention impact on safety/comfort/habitability
   - If lease specifies repair procedures or response times, reference those
   - Emphasize that issues need attention "as soon as possible"
6. Closing paragraph:
   - State availability to provide access for maintenance workers
   - Provide contact information: ${leaseData.user_email} and offer phone coordination
   - Request confirmation of when repairs will be addressed
   - Thank landlord for prompt attention
7. Professional closing with tenant's name: ${userName}

IMPORTANT - WHAT TO AVOID:
- Do NOT threaten legal action or withholding rent
- Do NOT cite specific laws unless they appear in the lease
- Do NOT be overly aggressive or confrontational
- Keep it professional and solution-focused
- This is a first request - stay polite but document the issues clearly

Generate ONLY the letter text, no additional commentary.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional letter drafter. You write clear, firm but polite repair request letters that help tenants document maintenance issues and request timely repairs. You focus on clarity and creating a professional paper trail.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1800,
    });

    const letter = completion.choices[0]?.message?.content || '';
    // console.log('✅ Repair request letter drafted by AI');
    
    return letter;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

async function generateEmergencyRepairLetter({
  leaseRAG,
  leaseData,
  landlordName,
  landlordAddress,
  additionalDetails,
  userName,
  tenantAddress,
  emergencyIssue,
}: {
  leaseRAG: LeaseRAGSystem | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaseData: any;
  landlordName: string;
  landlordAddress: string;
  additionalDetails?: string;
  userName: string;
  tenantAddress: string;
  emergencyIssue: string;
}): Promise<string> {
  
  // console.log('💼 Generating emergency repair request letter...');

  // Get relevant context from RAG
  let relevantClauses = '';
  if (leaseRAG) {
    try {
      const queries = [
        'emergency repairs and urgent maintenance',
        'landlord emergency contact information',
        'habitability and safety requirements',
        'immediate repair obligations'
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

  const prompt = `You are a professional letter drafter helping a tenant write an URGENT emergency repair request to their landlord.

TENANT INFORMATION:
- Tenant Name: ${userName}
- Tenant Address: ${tenantAddress}
- Email: ${leaseData.user_email}

LANDLORD INFORMATION:
- Landlord Name: ${landlordName}
- Landlord Address: ${landlordAddress || 'Not provided - use standard letter format without landlord address block'}

LEASE DETAILS:
- Property Address: ${tenantAddress}

RELEVANT CLAUSES FROM THE LEASE:
${relevantClauses || 'No specific emergency repair clauses were found in the lease.'}

EMERGENCY ISSUE:
${emergencyIssue}

TENANT'S ADDITIONAL CONTEXT:
${additionalDetails || 'None provided.'}

CRITICAL REQUIREMENTS:
1. Emphasize URGENCY and EMERGENCY nature of the situation
2. Clearly describe the safety risk or habitability impact
3. Request IMMEDIATE attention and action
4. State tenant is available at ANY TIME for access
5. Provide clear contact information
6. Request immediate confirmation of when help will arrive
7. Keep tone professional but convey urgency
8. Reference emergency repair obligations from lease if found
9. This is NOT a regular maintenance request - it's an emergency
10. DO NOT threaten or be confrontational - focus on urgent need for action

LETTER REQUIREMENTS:
1. Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
2. Subject line or opening indicating URGENT/EMERGENCY
3. Proper business letter format
4. Salutation to ${landlordName}
5. Opening paragraph: Immediately state this is urgent/emergency, describe the issue
6. Middle paragraph:
   - Explain why this is an emergency (safety risk, habitability affected)
   - Describe the specific problem: ${emergencyIssue}
   - If lease has emergency procedures or requirements, reference those
   - State that immediate repairs are needed
7. Closing paragraph:
   - State availability for access at ANY TIME
   - Provide contact information: ${leaseData.user_email} and mention phone availability
   - Request immediate confirmation of when someone will arrive
   - Thank for urgent attention
8. Professional closing with tenant's name: ${userName}

IMPORTANT - TONE:
- Professional but urgent
- Serious but not panicked
- Clear about safety/habitability concerns
- Respectful but firm about need for immediate action
- Do NOT sound demanding or threatening
- Focus on the emergency nature of the situation

Generate ONLY the letter text, no additional commentary.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional letter drafter specializing in urgent communications. You write clear, urgent emergency repair requests that convey the seriousness of safety and habitability issues while maintaining professionalism. You help tenants get immediate attention for genuine emergencies.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const letter = completion.choices[0]?.message?.content || '';
    // console.log('✅ Emergency repair letter drafted by AI');
    
    return letter;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

async function generateLeaseNonRenewalLetter({
  leaseRAG,
  leaseData,
  landlordName,
  landlordAddress,
  additionalDetails,
  userName,
  tenantAddress,
  moveOutDate,
}: {
  leaseRAG: LeaseRAGSystem | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaseData: any;
  landlordName: string;
  landlordAddress: string;
  additionalDetails?: string;
  userName: string;
  tenantAddress: string;
  moveOutDate?: string;
}): Promise<string> {
  
  // console.log('💼 Generating lease non-renewal notice letter...');

  // Get relevant context from RAG
  let relevantClauses = '';
  if (leaseRAG) {
    try {
      const queries = [
        'lease termination and notice requirements',
        'move-out procedures and inspection',
        'security deposit return process',
        'notice period for non-renewal'
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
  const leaseEndDate = leaseData.summary?.leaseEndDate || 'the lease end date';
  const securityDeposit = leaseData.summary?.securityDeposit || 'the security deposit';

  // Format move-out date if provided
  const formattedMoveOutDate = moveOutDate 
    ? new Date(moveOutDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : leaseEndDate;

  const prompt = `You are a professional letter drafter helping a tenant write a formal notice of lease non-renewal to their landlord.

TENANT INFORMATION:
- Tenant Name: ${userName}
- Tenant Address: ${tenantAddress}
- Email: ${leaseData.user_email}

LANDLORD INFORMATION:
- Landlord Name: ${landlordName}
- Landlord Address: ${landlordAddress || 'Not provided - use standard letter format without landlord address block'}

LEASE DETAILS:
- Property Address: ${tenantAddress}
- Lease End Date: ${leaseEndDate}
- Security Deposit: ${securityDeposit}
- Intended Move-Out Date: ${formattedMoveOutDate}

RELEVANT CLAUSES FROM THE LEASE:
${relevantClauses || 'No specific termination or notice clauses were found in the lease.'}

TENANT'S ADDITIONAL CONTEXT:
${additionalDetails || 'None provided.'}

CRITICAL REQUIREMENTS:
1. State clearly that tenant will NOT be renewing the lease
2. Reference the lease end date
3. Confirm intent to vacate on or before that date
4. Reference notice requirements from lease if found in clauses
5. Request information about move-out procedures
6. Request information about final inspection
7. Request information about security deposit return process
8. Maintain professional and courteous tone
9. Express appreciation for the tenancy
10. This is a formal notice - creates documentation of proper notice

LETTER REQUIREMENTS:
1. Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
2. Proper business letter format
3. Salutation to ${landlordName}
4. Opening paragraph: Formally notify of intent NOT to renew lease
5. Middle paragraph(s):
   - State lease end date: ${leaseEndDate}
   - Confirm will vacate on or before: ${formattedMoveOutDate}
   - If lease specifies notice period, reference compliance with that requirement
   - Request move-out procedure information (inspection, keys, etc.)
   - State intent to leave property in good condition (normal wear and tear)
6. Closing paragraph:
   - Request security deposit return with itemized deductions (if any)
   - Provide forwarding address for deposit: ${tenantAddress} (or mention will provide)
   - Express appreciation for providing housing during tenancy
   - Thank for cooperation during move-out process
   - Provide contact information: ${leaseData.user_email}
7. Professional closing with tenant's name: ${userName}

IMPORTANT - TONE:
- Professional and courteous
- Clear and formal about non-renewal decision
- Appreciative of the tenancy relationship
- Cooperative about move-out process
- Do NOT provide reasons for leaving (keep it simple and professional)
- Do NOT mention any complaints or issues (this is not the place)
- Focus on smooth transition and proper procedures

Generate ONLY the letter text, no additional commentary.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional letter drafter. You write clear, courteous lease termination notices that help tenants formally notify their landlord of non-renewal while maintaining positive relationships and ensuring proper procedures are followed.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const letter = completion.choices[0]?.message?.content || '';
    // console.log('✅ Lease non-renewal letter drafted by AI');
    
    return letter;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

