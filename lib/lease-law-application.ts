import OpenAI from 'openai';
import { LeaseRAGSystem } from './rag-system';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Use RAG to find relevant parts of the lease and explain how a specific law applies
 */
export async function analyzeHowLawAppliesToLease(
  lawText: string,
  lawType: string,
  leaseRAG: LeaseRAGSystem,
  leaseContext?: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
    address?: string;
  },
  locale: string = 'en'
): Promise<{
  application: string;
  relevantLeaseText?: string;
  hasMatch: boolean;
}> {
  try {
    // console.log(`🔍 Analyzing how "${lawType}" applies to the lease...`);
    
    // Step 1: Use RAG to find relevant parts of the lease with more specific queries
    const specificQueries = [
      `Find lease terms related to: ${lawType}`,
      `lease clauses about ${lawType.toLowerCase()}`,
      `tenant obligations for ${lawType.toLowerCase()}`,
      `landlord requirements for ${lawType.toLowerCase()}`,
      `timeline requirements for ${lawType.toLowerCase()}`,
      `conditions related to ${lawType.toLowerCase()}`
    ];
    
    const allChunks: any[] = [];
    for (const query of specificQueries) {
      const chunks = await leaseRAG.retrieve(query, 4); // 4 chunks per query
      allChunks.push(...chunks);
    }
    
    // Remove duplicates and get top chunks
    const uniqueChunks = allChunks.filter((chunk, index, self) =>
      index === self.findIndex(c => c.text === chunk.text)
    );
    
    const relevantChunks = uniqueChunks.slice(0, 8); // Top 8 most relevant chunks
    
    if (relevantChunks.length === 0) {
      // console.log('⚠️ No relevant lease clauses found');
      return {
        application: `Your lease doesn't specify ${lawType.toLowerCase()}; law still applies.`,
        hasMatch: false
      };
    }
    
    // Combine the relevant lease chunks
    const leaseText = relevantChunks.map(c => c.text).join('\n\n');
    
    // console.log(`✅ Found ${relevantChunks.length} relevant lease sections`);
    
    // Step 2: Use LLM to analyze how the law applies to the lease
    const languageInstruction = locale === 'es' 
      ? '\n\nThis output is for a Spanish speaking tenant. Please output in simple spanish terms so that tenants can understand.' 
      : '';
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a tenant rights advisor. Compare what the LAW says with what the LEASE says, and provide a VERY BRIEF example.

CRITICAL RULES:
- Maximum 40 words total
- ONE to TWO sentence only
- Use actual numbers from lease (rent, deposit, dates)
- Be specific but EXTREMELY concise
- Format: "Your lease [states fact] which [complies/conflicts] with [law]."
- If no match: "Your lease doesn't specify this; law still applies."

Examples of good responses:
- "Your $2,400 deposit equals 2 months rent, complying with the state's maximum limit."
- "Your lease requires 12-hour entry notice, less than the 24-hour legal minimum."
- "Your lease doesn't specify repair timelines; landlord must fix within reasonable time."`
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

Provide ONE to TWO SENTENCE (maximum 50 words) explaining how this law applies to THIS lease. Use actual numbers from the lease context.${languageInstruction}`
        }
      ],
      temperature: 0.3,
      max_tokens: 50 // Short and concise examples only
    });

    const application = completion.choices[0].message.content || 
      'Unable to determine how this law applies to your specific lease.';
    
    // console.log(`✅ Generated application analysis: ${application.slice(0, 80)}...`);
    
    return {
      application: application.trim(),
      relevantLeaseText: leaseText.slice(0, 300), // First 300 chars for reference
      hasMatch: true
    };
    
  } catch (error) {
    console.error('❌ Error analyzing law application:', error);
    return {
      application: `Unable to analyze this law for your lease.`,
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
  leaseRAG: LeaseRAGSystem,
  leaseContext?: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
    address?: string;
  },
  locale: string = 'en'
): Promise<Array<{
  lawType: string;
  lawText: string;
  explanation: string;
  application: string;
  relevantLeaseText?: string;
  hasMatch: boolean;
}>> {
  // console.log(`\n📋 Analyzing how ${laws.length} laws apply to the lease...`);
  
  const results = await Promise.all(
    laws.map(async (law) => {
      const analysis = await analyzeHowLawAppliesToLease(
        law.lawText,
        law.lawType,
        leaseRAG,
        leaseContext,
        locale
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
  
  // console.log(`✅ Completed analysis for ${results.length} laws`);
  
  return results;
}

