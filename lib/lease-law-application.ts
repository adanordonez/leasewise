import OpenAI from 'openai';
import { LeaseRAG } from './rag-system';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Use RAG to find relevant parts of the lease and explain how a specific law applies
 */
export async function analyzeHowLawAppliesToLease(
  lawText: string,
  lawType: string,
  leaseRAG: LeaseRAG,
  leaseContext?: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
    address?: string;
  }
): Promise<{
  application: string;
  relevantLeaseText?: string;
  hasMatch: boolean;
}> {
  try {
    console.log(`🔍 Analyzing how "${lawType}" applies to the lease...`);
    
    // Step 1: Use RAG to find relevant parts of the lease
    const query = `Find lease terms related to: ${lawType}. Include any clauses about ${lawType.toLowerCase()}, requirements, timelines, or conditions.`;
    
    const relevantChunks = await leaseRAG.retrieveRelevant(query, 5); // Increased from 3 to 5 for more context
    
    if (relevantChunks.length === 0) {
      console.log('⚠️ No relevant lease clauses found');
      return {
        application: `Your lease does not appear to have specific terms about ${lawType.toLowerCase()}. The law still applies to your tenancy.`,
        hasMatch: false
      };
    }
    
    // Combine the relevant lease chunks
    const leaseText = relevantChunks.map(c => c.text).join('\n\n');
    
    console.log(`✅ Found ${relevantChunks.length} relevant lease sections`);
    
    // Step 2: Use LLM to analyze how the law applies to the lease
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a tenant rights advisor. Compare what the LAW says with what the LEASE says, and explain how this applies to the tenant.

IMPORTANT:
- Be specific about how the lease complies or conflicts with the law
- Use the tenant's actual numbers (rent, deposit, dates) when relevant
- If lease is silent on something the law requires, point that out
- If lease violates the law, clearly state that
- Keep it under 50 words
- Write in second person ("Your lease says...", "You are entitled to...")
- Be direct and clear`
        },
        {
          role: 'user',
          content: `LAW: ${lawType}
"${lawText}"

LEASE CONTEXT:
${leaseContext ? `
- Monthly Rent: ${leaseContext.monthlyRent || 'Not specified'}
- Security Deposit: ${leaseContext.securityDeposit || 'Not specified'}
- Lease Start: ${leaseContext.leaseStart || 'Not specified'}
- Lease End: ${leaseContext.leaseEnd || 'Not specified'}
- Address: ${leaseContext.address || 'Not specified'}
` : 'No context provided'}

RELEVANT LEASE TEXT:
"${leaseText}"

Explain in under 50 words how this law specifically applies to THIS tenant's lease. Focus on what it means for them.`
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    const application = completion.choices[0].message.content || 
      'Unable to determine how this law applies to your specific lease.';
    
    console.log(`✅ Generated application analysis: ${application.slice(0, 80)}...`);
    
    return {
      application: application.trim(),
      relevantLeaseText: leaseText.slice(0, 500), // First 500 chars for reference
      hasMatch: true
    };
    
  } catch (error) {
    console.error('❌ Error analyzing law application:', error);
    return {
      application: `Unable to analyze how this law applies to your lease. The law still protects your rights as a tenant.`,
      hasMatch: false
    };
  }
}

/**
 * Batch process multiple laws and analyze how each applies to the lease
 */
export async function analyzeLawApplications(
  laws: Array<{
    lawType: string;
    lawText: string;
    explanation: string;
  }>,
  leaseRAG: LeaseRAG,
  leaseContext?: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
    address?: string;
  }
): Promise<Array<{
  lawType: string;
  lawText: string;
  explanation: string;
  application: string;
  relevantLeaseText?: string;
  hasMatch: boolean;
}>> {
  console.log(`\n📋 Analyzing how ${laws.length} laws apply to the lease...`);
  
  const results = await Promise.all(
    laws.map(async (law) => {
      const analysis = await analyzeHowLawAppliesToLease(
        law.lawText,
        law.lawType,
        leaseRAG,
        leaseContext
      );
      
      return {
        lawType: law.lawType,
        lawText: law.lawText,
        explanation: law.explanation,
        application: analysis.application,
        relevantLeaseText: analysis.relevantLeaseText,
        hasMatch: analysis.hasMatch
      };
    })
  );
  
  console.log(`✅ Completed analysis for ${results.length} laws`);
  
  return results;
}

