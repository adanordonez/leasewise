import Perplexity from '@perplexity-ai/perplexity_ai';

const client = new Perplexity({
  apiKey: process.env.PERPLEXITY_API_KEY,
});

interface PerplexitySearchResult {
  answer: string;
  citations: string[];
}

/**
 * Search for general information using Perplexity
 * Use when questions go beyond the lease document
 */
export async function searchWithPerplexity(
  question: string,
  context?: {
    leaseLocation?: string;
    additionalContext?: string;
  }
): Promise<PerplexitySearchResult> {
  try {
    console.log('🔍 Using Perplexity for web search:', question);
    console.log('📍 Property location:', context?.leaseLocation || 'Not specified');
    
    // Build enhanced query with prominent location context
    let enhancedQuery = question;
    
    // Add location FIRST if available (most important for legal searches)
    if (context?.leaseLocation) {
      // Extract city and state from address
      const addressParts = context.leaseLocation.split(',').map(s => s.trim());
      const state = addressParts.length >= 2 ? addressParts[addressParts.length - 1] : '';
      const city = addressParts.length >= 3 ? addressParts[addressParts.length - 2] : '';
      
      if (city && state) {
        enhancedQuery = `${question} - Specific to ${city}, ${state}`;
        console.log(`📍 Enhanced with location: ${city}, ${state}`);
      } else if (state) {
        enhancedQuery = `${question} - Specific to ${state}`;
        console.log(`📍 Enhanced with location: ${state}`);
      }
    }
    
    if (context?.additionalContext) {
      enhancedQuery += ` (Context: ${context.additionalContext})`;
    }

    // Build system prompt with location context
    const locationContext = context?.leaseLocation ? 
      `\nIMPORTANT: This question is about a property at ${context.leaseLocation}. Focus on laws and regulations specific to this location.` : '';
    
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that provides accurate, concise answers to questions. 
When answering questions about tenant rights, housing laws, or rental issues, focus on:
- Factual, verifiable information
- Current laws and regulations specific to the location
- Practical guidance
- ALWAYS cite the specific city/state laws when applicable
${locationContext}

Keep answers clear and under 150 words.`,
        },
        {
          role: 'user',
          content: enhancedQuery,
        },
      ],
      model: 'sonar',
      web_search_options: {
        search_recency_filter: 'year', // Focus on recent information
      },
    });

    const answer = completion.choices[0].message.content || 'No answer available.';
    const citations = (completion as any).citations || [];

    console.log('✅ Perplexity search completed. Citations:', citations.length);
    return { answer, citations };
  } catch (error) {
    console.error('🚨 Perplexity search error:', error);
    throw error;
  }
}
