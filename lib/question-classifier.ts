import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface QuestionClassification {
  searchStrategy: 'lease_only' | 'hybrid' | 'general_only';
  reasoning: string;
  needsLegalContext: boolean;
  needsComparison: boolean;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Use GPT to intelligently classify questions and determine search strategy
 * This is more accurate than keyword matching
 */
export async function classifyQuestion(question: string): Promise<QuestionClassification> {
  try {
    console.log(`🤔 Classifying question: "${question}"`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cheap for classification
      messages: [
        {
          role: 'system',
          content: `You are a question classifier for a lease document chat system.

Analyze the user's question and determine the best search strategy.

SEARCH STRATEGIES:

1. "lease_only" - Question is ONLY about their specific lease document
   Examples:
   - "What is my rent?"
   - "When does my lease start?"
   - "What does page 5 say about pets?"
   - "What are my parking terms?"

2. "hybrid" - Question needs BOTH lease document AND external information
   Examples:
   - "Is my rent too high?" (needs lease amount + market data)
   - "What happens if I don't pay rent?" (needs lease terms + legal consequences)
   - "Is this legal under Chicago law?" (needs lease clause + local laws)
   - "Can my landlord do this?" (needs lease + tenant rights)
   - "Is my security deposit fair?" (needs lease amount + standards)

3. "general_only" - Question is purely about general information, not their lease
   Examples:
   - "What is a sublease?"
   - "Explain tenant rights in general"
   - "How does eviction work?"
   - "What are typical lease terms?"

IMPORTANT RULES:
- If question mentions "law", "legal", "rights", "can landlord", "is this allowed" → hybrid
- If question asks "what happens if", "consequences", "penalty" → hybrid (needs both lease + laws)
- If question compares ("too high", "fair", "reasonable", "normal") → hybrid
- If question is just asking what their lease says → lease_only
- If question is purely educational/definitional → general_only

Return JSON:
{
  "searchStrategy": "lease_only" | "hybrid" | "general_only",
  "reasoning": "brief explanation of why",
  "needsLegalContext": true/false,
  "needsComparison": true/false,
  "confidence": "high" | "medium" | "low"
}`,
        },
        {
          role: 'user',
          content: `Classify this question: "${question}"`,
        },
      ],
      temperature: 0.1, // Low temperature for consistent classification
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    const classification: QuestionClassification = {
      searchStrategy: result.searchStrategy || 'lease_only',
      reasoning: result.reasoning || 'Default classification',
      needsLegalContext: result.needsLegalContext || false,
      needsComparison: result.needsComparison || false,
      confidence: result.confidence || 'medium',
    };
    
    console.log(`✅ Classification: ${classification.searchStrategy}`);
    console.log(`   Reasoning: ${classification.reasoning}`);
    console.log(`   Needs legal context: ${classification.needsLegalContext}`);
    console.log(`   Confidence: ${classification.confidence}`);
    
    return classification;
    
  } catch (error) {
    console.error('🚨 Question classification failed:', error);
    // Fallback: safe default (hybrid to be safe)
    return {
      searchStrategy: 'hybrid',
      reasoning: 'Classification failed, using hybrid as safe default',
      needsLegalContext: true,
      needsComparison: false,
      confidence: 'low',
    };
  }
}

/**
 * Quick validation - does the classification make sense?
 */
export function validateClassification(
  classification: QuestionClassification,
  question: string
): QuestionClassification {
  const lowerQuestion = question.toLowerCase();
  
  // Override: If question explicitly mentions law/legal, force hybrid
  if ((lowerQuestion.includes('law') || 
       lowerQuestion.includes('legal') || 
       lowerQuestion.includes('chicago') ||
       lowerQuestion.includes('rights')) && 
      classification.searchStrategy === 'lease_only') {
    
    console.log(`⚠️ Override: Detected legal keywords, changing to hybrid`);
    return {
      ...classification,
      searchStrategy: 'hybrid',
      needsLegalContext: true,
      reasoning: 'Override: Legal keywords detected',
    };
  }
  
  // Override: If question is very short and specific, probably lease_only
  if (question.split(' ').length <= 5 && 
      (lowerQuestion.includes('what is') || 
       lowerQuestion.includes('when is') ||
       lowerQuestion.includes('how much')) &&
      classification.searchStrategy === 'hybrid') {
    
    console.log(`⚠️ Override: Short specific question, changing to lease_only`);
    return {
      ...classification,
      searchStrategy: 'lease_only',
      reasoning: 'Override: Short specific question about lease',
    };
  }
  
  return classification;
}

