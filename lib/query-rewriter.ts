import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RewrittenQuery {
  original: string;
  enhanced: string;
  keywords: string[];
  intent: 'lease_specific' | 'comparison' | 'legal' | 'general';
}

/**
 * Enhance a user's question to make it better for RAG retrieval and Perplexity search
 * Examples:
 * - "what is the rent?" → "monthly rent amount payment due date lease agreement"
 * - "when does it start?" → "lease start date commencement term beginning"
 * - "can i have pets?" → "pet policy pets allowed animals restrictions lease terms"
 */
export async function enhanceQuery(
  userQuestion: string,
  context?: {
    propertyAddress?: string;
    conversationHistory?: string;
  }
): Promise<RewrittenQuery> {
  try {
    console.log(`🔄 Enhancing query: "${userQuestion}"`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for speed and cost
      messages: [
        {
          role: 'system',
          content: `You are a query enhancement assistant for a lease document search system.

Your job: Rewrite user questions to be more effective for document retrieval.

RULES:
1. Expand abbreviations and add synonyms
2. Add relevant lease terminology
3. Keep it concise (10-20 words max)
4. Focus on key terms that appear in leases
5. Preserve the original meaning

Examples:
- "what is the rent?" → "monthly rent amount payment lease rental price"
- "when does it start?" → "lease start date commencement beginning term"
- "can i have pets?" → "pet policy pets allowed animals restrictions"
- "security deposit?" → "security deposit amount refund return conditions"
- "is rent too high?" → "monthly rent amount market rate comparison fair rent"

Return JSON with:
{
  "enhanced": "the improved query",
  "keywords": ["key", "terms", "for", "search"],
  "intent": "lease_specific" | "comparison" | "legal" | "general"
}`,
        },
        {
          role: 'user',
          content: `Original question: "${userQuestion}"
${context?.propertyAddress ? `\nProperty: ${context.propertyAddress}` : ''}
${context?.conversationHistory ? `\nRecent context: ${context.conversationHistory}` : ''}

Enhance this query for lease document search.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    const rewritten: RewrittenQuery = {
      original: userQuestion,
      enhanced: result.enhanced || userQuestion,
      keywords: result.keywords || [],
      intent: result.intent || 'lease_specific',
    };
    
    console.log(`✅ Enhanced: "${rewritten.enhanced}"`);
    console.log(`📋 Keywords: ${rewritten.keywords.join(', ')}`);
    console.log(`🎯 Intent: ${rewritten.intent}`);
    
    return rewritten;
    
  } catch (error) {
    console.error('🚨 Query enhancement failed:', error);
    // Fallback: return original query
    return {
      original: userQuestion,
      enhanced: userQuestion,
      keywords: [],
      intent: 'lease_specific',
    };
  }
}

/**
 * Fast keyword extraction without LLM (fallback method)
 */
export function extractKeywords(question: string): string[] {
  const lowerQuestion = question.toLowerCase();
  
  // Common lease terms to look for
  const leaseTerms = {
    rent: ['rent', 'rental', 'payment', 'monthly', 'price'],
    deposit: ['deposit', 'security', 'refund', 'return'],
    dates: ['start', 'end', 'term', 'date', 'when', 'duration'],
    pets: ['pet', 'pets', 'animal', 'animals', 'dog', 'cat'],
    maintenance: ['repair', 'maintenance', 'fix', 'broken', 'damage'],
    utilities: ['utilities', 'water', 'electric', 'gas', 'internet'],
    parking: ['parking', 'garage', 'car', 'vehicle'],
    guests: ['guest', 'visitors', 'occupant', 'tenant'],
  };
  
  const keywords: string[] = [];
  
  for (const [category, terms] of Object.entries(leaseTerms)) {
    if (terms.some(term => lowerQuestion.includes(term))) {
      keywords.push(category);
      keywords.push(...terms.filter(term => lowerQuestion.includes(term)));
    }
  }
  
  return [...new Set(keywords)]; // Remove duplicates
}

