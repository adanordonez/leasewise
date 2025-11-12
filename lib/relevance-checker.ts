import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Use GPT to determine if a question is relevant to leases/housing
 * This is a final check for questions that pass the keyword filter
 */
export async function isQuestionRelevantToLease(question: string): Promise<{
  isRelevant: boolean;
  confidence: number;
  reason: string;
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a relevance classifier for a lease document assistant.

Determine if the user's question is relevant to:
- Lease agreements
- Rental properties
- Tenant rights
- Landlord responsibilities
- Housing laws
- Property maintenance
- Rent payments
- Security deposits
- Lease terms

Return JSON:
{
  "isRelevant": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}

Examples:
- "What is my rent?" → {"isRelevant": true, "confidence": 1.0, "reason": "Direct lease question"}
- "Who will win the world series?" → {"isRelevant": false, "confidence": 1.0, "reason": "Sports question, not lease-related"}
- "What's the weather?" → {"isRelevant": false, "confidence": 1.0, "reason": "Weather, not lease-related"}`,
        },
        {
          role: 'user',
          content: `Is this question relevant to leases/housing? "${question}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      isRelevant: result.isRelevant ?? true, // Default to true to avoid false positives
      confidence: result.confidence ?? 0.5,
      reason: result.reason || 'No reason provided',
    };
    
  } catch (error) {
    console.error('🚨 Relevance check failed:', error);
    // On error, assume relevant to avoid blocking legitimate questions
    return {
      isRelevant: true,
      confidence: 0.0,
      reason: 'Error during classification',
    };
  }
}

