import OpenAI from 'openai';
import { LeaseRAGSystem } from './rag-system';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RedFlag {
  issue: string;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  source: string;
  page_number?: number;
}

/**
 * Dedicated Red Flags Analysis using RAG
 * This uses a focused prompt specifically for identifying problematic lease clauses
 */
export async function analyzeRedFlagsWithRAG(
  rag: LeaseRAGSystem,
  leaseContext: {
    monthlyRent?: string;
    securityDeposit?: string;
    address?: string;
  }
): Promise<RedFlag[]> {
  console.log('🚩 Starting dedicated red flags analysis with RAG...');

  // STEP 1: Use RAG to find potentially problematic clauses
  const problematicQueries = [
    'excessive fees, penalties, or charges beyond standard rent',
    'unusual restrictions on tenant behavior or property use',
    'landlord rights to enter property without proper notice',
    'clauses about repairs, maintenance, or property damage liability',
    'security deposit terms, deductions, or return conditions',
    'lease termination, eviction, or notice requirements',
    'clauses about rent increases or additional payments',
    'liability waivers or hold harmless agreements',
  ];

  console.log('🔍 Searching for problematic clauses...');
  
  const relevantChunks: Array<{
    text: string;
    pageNumber: number;
    query: string;
  }> = [];

  for (const query of problematicQueries) {
    const chunks = await rag.retrieve(query, 5); // Top 5 for each query (increased from 3)
    chunks.forEach(chunk => {
      relevantChunks.push({
        text: chunk.text,
        pageNumber: chunk.pageNumber,
        query: query
      });
    });
  }

  // Remove duplicates
  const uniqueChunks = relevantChunks.filter((chunk, index, self) =>
    index === self.findIndex(c => c.text === chunk.text)
  );

  console.log(`✅ Found ${uniqueChunks.length} potentially problematic clauses`);

  // STEP 2: Analyze each chunk for red flags with GPT-4o
  console.log('🔍 Analyzing clauses for red flags...');
  
  const prompt = `You are an expert tenant rights attorney analyzing a residential lease agreement.

YOUR TASK: Identify ONLY clauses that are GENUINELY problematic, unfair, or potentially illegal for tenants.

LEASE CONTEXT:
- Monthly Rent: ${leaseContext.monthlyRent || 'Not specified'}
- Security Deposit: ${leaseContext.securityDeposit || 'Not specified'}
- Location: ${leaseContext.address || 'Not specified'}

POTENTIALLY PROBLEMATIC CLAUSES FROM LEASE:
${uniqueChunks.map((chunk, i) => `
[Clause ${i + 1}] (Page ${chunk.pageNumber})
${chunk.text}
---`).join('\n')}

CRITICAL INSTRUCTIONS:
1. Only flag clauses that are ACTUALLY problematic (unfair fees, illegal restrictions, unfair liability, etc.)
2. Do NOT flag standard, reasonable lease terms (normal rent, standard deposits, reasonable rules)
3. For each red flag, quote the EXACT problematic text from the clause
4. Explain WHY it's problematic and what the fair alternative should be
5. Rate severity: HIGH (likely illegal/very unfair), MEDIUM (unfair but common), LOW (potentially problematic)

Return JSON array:
{
  "redFlags": [
    {
      "issue": "Brief title of the problem",
      "severity": "high" | "medium" | "low",
      "explanation": "Why this is problematic and what's fair",
      "source": "EXACT text from the lease clause (20-50 words)",
      "page_number": page number where found
    }
  ]
}

If NO red flags found, return: {"redFlags": []}

ONLY RETURN JSON. Be strict - only flag GENUINE problems.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a tenant rights attorney. Only flag GENUINELY problematic lease clauses. Return valid JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"redFlags":[]}');
  const redFlags = result.redFlags || [];

  console.log(`✅ Identified ${redFlags.length} red flags`);
  
  // Log each red flag for debugging
  redFlags.forEach((flag: RedFlag, i: number) => {
    console.log(`   ${i + 1}. [${flag.severity.toUpperCase()}] ${flag.issue}`);
  });

  return redFlags;
}

