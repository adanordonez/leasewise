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
  },
  locale: string = 'en'
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
    try {
      const chunks = await rag.retrieve(query, 3); // Reduced from 7 to 3 to avoid token limits
      chunks.forEach(chunk => {
        relevantChunks.push({
          text: chunk.text,
          pageNumber: chunk.pageNumber,
          query: query
        });
      });
    } catch (error) {
      console.error(`⚠️ RAG query failed for: "${query}"`, error);
      // Continue with other queries even if one fails
    }
  }

  // Remove duplicates
  const uniqueChunks = relevantChunks.filter((chunk, index, self) =>
    index === self.findIndex(c => c.text === chunk.text)
  );

  console.log(`✅ Found ${uniqueChunks.length} potentially problematic clauses`);
  
  // If we have too many chunks, limit to avoid token limits
  const MAX_CHUNKS = 40; // Limit to prevent token overflow
  if (uniqueChunks.length > MAX_CHUNKS) {
    console.log(`⚠️ Too many chunks (${uniqueChunks.length}), limiting to ${MAX_CHUNKS}`);
    uniqueChunks.splice(MAX_CHUNKS);
  }
  
  // If we have no chunks at all, return empty array
  if (uniqueChunks.length === 0) {
    console.log('⚠️ No chunks found for red flags analysis');
    return [];
  }

  // STEP 2: Analyze each chunk for red flags with GPT-4o
  console.log('🔍 Analyzing clauses for red flags...');
  
  const languageInstruction = locale === 'es' 
    ? '\n\nThis output is for a Spanish speaking tenant. Please output in simple spanish terms so that tenants can understand.' 
    : '';
  
  const prompt = `You are an expert tenant advocate analyzing a residential lease for genuinely problematic clauses.

YOUR TASK: Identify ONLY clauses that are ACTUALLY problematic, unfair, or unreasonable based on what's written in THIS lease.

LEASE CONTEXT:
- Monthly Rent: ${leaseContext.monthlyRent || 'Not specified'}
- Security Deposit: ${leaseContext.securityDeposit || 'Not specified'}
- Property Location: ${leaseContext.address || 'Not specified'}

POTENTIALLY PROBLEMATIC CLAUSES FROM THIS LEASE:
${uniqueChunks.map((chunk, i) => `
[Clause ${i + 1}] (Page ${chunk.pageNumber})
${chunk.text}
---`).join('\n')}

CRITICAL REQUIREMENTS:
1. ONLY flag clauses based on what's actually written in the lease text above
2. DO NOT reference or assume state/local laws - analyze based on fairness and reasonableness
3. DO NOT flag if it's a standard, reasonable lease term
4. ONLY flag if the clause is clearly unfair, excessive, or one-sided against the tenant

WHAT TO FLAG (with examples):
- Excessive fees: Late fee of $500/day, cleaning fees of $1000+
- Unreasonable restrictions: No guests ever, no cooking certain foods
- Unfair liability: Tenant responsible for ALL damages including natural disasters
- Unreasonable entry: Landlord can enter anytime without notice for any reason
- Excessive penalties: Forfeiture of entire deposit for minor issues
- Rights waivers: Tenant waives right to sue, habitability rights, etc.

WHAT NOT TO FLAG (these are standard):
- Rent due on 1st of month
- Standard late fees ($50-75 or 5% of rent)
- Reasonable security deposits (1-2 months rent)
- Normal noise/behavior rules
- No pets or standard pet deposits
- Reasonable move-out cleaning requirements
- Standard 24-48 hour entry notice for non-emergency repairs

RATING SEVERITY:
- HIGH: Clearly unreasonable, excessive, or grossly unfair (e.g., $500 late fee after 1 day)
- MEDIUM: Unfair but seen in leases, disadvantages tenant significantly
- LOW: Potentially problematic depending on context, may be negotiable

EXPLANATION REQUIREMENTS:
- State WHAT the clause says (quote key parts)
- Explain WHY it's problematic using specific numbers/details from the clause
- Compare to what would be reasonable (e.g., "This $500 late fee is excessive compared to typical $50-75 fees")
- DO NOT cite specific laws - focus on fairness and reasonableness
- Use the COMPLETE chunk text as the source${languageInstruction}

Return JSON:
{
  "redFlags": [
    {
      "issue": "Brief, specific title referencing the actual problem",
      "severity": "high" | "medium" | "low",
      "explanation": "Quote the problematic part, explain why it's unfair with specific details, note what would be more reasonable. Be specific about amounts/terms from the clause.",
      "source": "The COMPLETE chunk text from above (entire [Clause X] text block)",
      "page_number": page number,
      "chunk_index": "Clause 1, Clause 2, etc"
    }
  ]
}

If NO red flags found, return: {"redFlags": []}

IMPORTANT: Be conservative. Only flag clear problems. When in doubt, don't flag it.`;

  let redFlags: RedFlag[] = [];
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a tenant advocate who analyzes leases for genuinely problematic clauses. You only flag clear, specific problems found in the lease text. You do NOT reference laws or make assumptions. You compare clauses to reasonable industry standards. You are conservative - when in doubt, you do NOT flag it. You return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
      max_tokens: 3000 // Add explicit token limit
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"redFlags":[]}');
    redFlags = result.redFlags || [];
    
    console.log(`✅ OpenAI identified ${redFlags.length} red flags`);
  } catch (error) {
    console.error('🚨 OpenAI red flags analysis failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      // Check if it's a token limit error
      if (error.message.includes('token') || error.message.includes('limit')) {
        console.error('   ⚠️ Token limit exceeded - too many chunks sent to OpenAI');
      }
    }
    // Return empty array on error instead of throwing
    return [];
  }

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

