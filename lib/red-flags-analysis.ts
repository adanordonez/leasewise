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
  chunk_index?: string;
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

  // STEP 1: Use RAG to find potentially problematic clauses with more specific queries
  const problematicQueries = [
    // Financial issues
    'excessive fees penalties charges beyond standard rent monthly payment',
    'late fees interest charges additional payments beyond rent',
    'security deposit deductions cleaning fees damage charges',
    'rent increases rent adjustments additional rent charges',
    
    // Tenant restrictions and obligations
    'tenant restrictions property use behavior rules limitations',
    'guest policies visitor restrictions occupancy limits',
    'pet policies animal restrictions pet fees deposits',
    'maintenance responsibilities tenant obligations repairs',
    
    // Landlord rights and access
    'landlord entry property access without notice emergency',
    'landlord rights property inspection maintenance access',
    'property inspection entry rights landlord access',
    
    // Legal and liability issues
    'liability waivers hold harmless agreements tenant liability',
    'indemnification clauses tenant responsibility damage liability',
    'insurance requirements tenant insurance liability coverage',
    
    // Termination and eviction
    'lease termination early termination penalties fees',
    'eviction procedures notice requirements termination rights',
    'default breach lease termination conditions',
    
    // Special clauses
    'waiver rights tenant rights waiver legal rights',
    'modification alterations property changes tenant improvements',
    'assignment subletting lease transfer tenant rights',
  ];

  console.log('🔍 Searching for problematic clauses...');
  
  const relevantChunks: Array<{
    text: string;
    pageNumber: number;
    query: string;
  }> = [];

  for (const query of problematicQueries) {
    const chunks = await rag.retrieve(query, 7); // Top 7 for each query (increased for better coverage)
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
3. For each red flag, use the ENTIRE relevant chunk text as the source (not just a small excerpt)
4. Explain WHY it's problematic and what the fair alternative should be
5. Rate severity: HIGH (likely illegal/very unfair), MEDIUM (unfair but common), LOW (potentially problematic)
6. IMPORTANT: Use the full chunk text provided below - don't extract just a small portion

Return JSON array:
{
  "redFlags": [
    {
      "issue": "Brief title of the problem",
      "severity": "high" | "medium" | "low",
      "explanation": "Detailed explanation of why this is problematic and what the fair alternative should be. Include legal context and tenant rights implications.",
      "source": "Use the COMPLETE chunk text from the lease clause above (the entire text block, not just a small excerpt)",
      "page_number": page number where found,
      "chunk_index": "Reference the chunk number from above (e.g., 'Clause 1')"
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
  
  // Post-process to ensure we use full chunk text instead of short excerpts
  const enhancedRedFlags = redFlags.map((flag: RedFlag) => {
    if (flag.chunk_index) {
      // Extract chunk number from "Clause X" format
      const chunkMatch = flag.chunk_index.match(/Clause (\d+)/);
      if (chunkMatch) {
        const chunkNumber = parseInt(chunkMatch[1]) - 1; // Convert to 0-based index
        if (chunkNumber >= 0 && chunkNumber < uniqueChunks.length) {
          const fullChunk = uniqueChunks[chunkNumber];
          console.log(`📝 Replacing short excerpt with full chunk text for: ${flag.issue}`);
          console.log(`   Original: "${flag.source.slice(0, 50)}..."`);
          console.log(`   Full chunk: "${fullChunk.text.slice(0, 50)}..."`);
          
          return {
            ...flag,
            source: fullChunk.text, // Use the complete chunk text
            page_number: fullChunk.pageNumber
          };
        }
      }
    }
    return flag;
  });

  // Log each red flag for debugging
  enhancedRedFlags.forEach((flag: RedFlag, i: number) => {
    console.log(`   ${i + 1}. [${flag.severity.toUpperCase()}] ${flag.issue}`);
    console.log(`      Source length: ${flag.source.length} characters`);
  });

  return enhancedRedFlags;
}

