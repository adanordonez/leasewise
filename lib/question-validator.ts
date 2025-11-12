export interface QuestionValidation {
  isValid: boolean;
  needsClarification: boolean;
  response?: string;
  clarifyingQuestions?: string[];
}

/**
 * Validate and analyze questions for clarity
 * Returns validation status and suggestions for clarification if needed
 */
export function isValidLeaseQuestion(
  question: string, 
  conversationHistory?: string
): QuestionValidation {
  const lowerQuestion = question.toLowerCase().trim();
  
  // Empty or too short
  if (lowerQuestion.length < 2) {
    return {
      isValid: false,
      response: "Could you please ask a question about your lease?"
    };
  }
  
  // Greetings and pleasantries
  const greetings = [
    'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
    'how are you', 'whats up', "what's up", 'sup', 'yo',
    'thanks', 'thank you', 'bye', 'goodbye', 'see you', 'later'
  ];
  
  if (greetings.includes(lowerQuestion)) {
    return {
      isValid: false,
      needsClarification: false,
      response: "Hello! I'm here to help you understand your lease. What would you like to know about your lease agreement?"
    };
  }
  
  // Detect vague questions that need clarification
  const vagueness = detectVagueness(lowerQuestion, conversationHistory);
  if (vagueness.isVague) {
    return {
      isValid: true, // Valid but needs clarification
      needsClarification: true,
      response: vagueness.clarificationMessage,
      clarifyingQuestions: vagueness.suggestedQuestions,
    };
  }
  
  // Single word questions that are too vague
  const words = lowerQuestion.split(/\s+/);
  if (words.length === 1 && lowerQuestion.length < 4) {
    return {
      isValid: false,
      needsClarification: false,
      response: "Could you please ask a more specific question about your lease? For example: 'What is my monthly rent?' or 'When does my lease end?'"
    };
  }
  
  // Off-topic questions (clearly not about leases or housing)
  const offTopicPatterns = [
    // Sports
    /world series|super bowl|world cup|nba|nfl|mlb|nhl|soccer|football game|basketball|baseball/i,
    /who will win|who won|game score|final score|playoffs/i,
    
    // Entertainment
    /movie|film|tv show|television|netflix|streaming|actor|actress|celebrity/i,
    /song|music|album|concert|band|singer|artist|spotify/i,
    
    // News & Politics
    /president|election|vote|congress|senate|politics|politician/i,
    /breaking news|current events|news today/i,
    
    // Finance (non-housing)
    /stock market|stocks|cryptocurrency|bitcoin|ethereum|trading|investment/i,
    /forex|nasdaq|dow jones/i,
    
    // Geography & Facts
    /what is the capital|which country|how many countries|largest city/i,
    /who invented|when was.*born|how old is/i,
    
    // Weather
    /weather|temperature|forecast|rain|snow|sunny/i,
    
    // Food & Cooking
    /recipe|cooking|restaurant|food delivery|menu/i,
    
    // Technology (non-housing)
    /iphone|android|computer|laptop|gaming|video game|playstation|xbox/i,
    
    // Generic non-lease questions
    /who is.*\?$/i, // "Who is [person]?"
    /what is.*capital/i,
    /how to (cook|make|build|create)/i,
  ];
  
  const isOffTopic = offTopicPatterns.some(pattern => pattern.test(lowerQuestion));
  if (isOffTopic) {
    return {
      isValid: false,
      needsClarification: false,
      response: "I'm specialized in helping with lease-related questions. Please ask me about your lease agreement, rental terms, or housing rights."
    };
  }
  
  // Test questions
  if (lowerQuestion === 'test' || lowerQuestion === 'testing') {
    return {
      isValid: false,
      needsClarification: false,
      response: "I'm ready to help! Ask me anything about your lease, such as rent amount, lease terms, policies, or your rights as a tenant."
    };
  }
  
  // Valid and clear question - proceed with normal processing
  return { 
    isValid: true, 
    needsClarification: false 
  };
}

/**
 * Detect if a question is too vague and suggest clarifications
 */
function detectVagueness(
  question: string, 
  conversationHistory?: string
): {
  isVague: boolean;
  clarificationMessage?: string;
  suggestedQuestions?: string[];
} {
  const lowerQuestion = question.toLowerCase();
  
  // Very short questions without clear topic
  if (question.split(/\s+/).length <= 2) {
    // Pronoun-based questions without context
    if (lowerQuestion.match(/^(what|when|where|how|who|why)\??$/)) {
      return {
        isVague: true,
        clarificationMessage: "I'd be happy to help! Could you be more specific about what aspect of your lease you're asking about?",
        suggestedQuestions: [
          "What is my monthly rent?",
          "When does my lease start?",
          "What are the pet policies?"
        ]
      };
    }
    
    // "How much?" without context
    if (lowerQuestion.match(/^how much\??$/)) {
      return {
        isVague: true,
        clarificationMessage: "How much for what specifically?",
        suggestedQuestions: [
          "How much is my rent?",
          "How much is my security deposit?",
          "How much notice do I need to give?"
        ]
      };
    }
  }
  
  // Vague references without clear subject
  const vaguePatterns = [
    { pattern: /^what about (it|that|this)\??$/i, topic: 'subject' },
    { pattern: /^(it|that|this)\??$/i, topic: 'specific topic' },
    { pattern: /^tell me about (it|that)\??$/i, topic: 'what' },
  ];
  
  for (const { pattern, topic } of vaguePatterns) {
    if (pattern.test(lowerQuestion)) {
      return {
        isVague: true,
        clarificationMessage: `Could you please specify what ${topic} you're asking about?`,
        suggestedQuestions: [
          "What are my pet policies?",
          "What are my parking terms?",
          "What are my maintenance responsibilities?"
        ]
      };
    }
  }
  
  // Questions about "more" or "anything else" without clear topic
  if (lowerQuestion.match(/^(more|anything else|what else)\??$/)) {
    return {
      isVague: true,
      clarificationMessage: "What specific aspect of your lease would you like to know more about?",
      suggestedQuestions: [
        "What are the renewal terms?",
        "What are the subletting rules?",
        "What happens if I break the lease?"
      ]
    };
  }
  
  // Topic mentioned but question is unclear
  const topicPatterns = [
    { 
      keywords: ['pet', 'pets', 'dog', 'cat', 'animal'],
      clarify: "What would you like to know about pets?",
      suggestions: [
        "Can I have pets?",
        "How much is the pet deposit?",
        "Are there breed restrictions?"
      ]
    },
    {
      keywords: ['park', 'parking', 'garage'],
      clarify: "What would you like to know about parking?",
      suggestions: [
        "Is parking included?",
        "How many parking spaces do I get?",
        "Where is my parking spot?"
      ]
    },
    {
      keywords: ['guest', 'visitor', 'guests'],
      clarify: "What would you like to know about guests?",
      suggestions: [
        "Can I have overnight guests?",
        "Are there guest parking rules?",
        "How long can guests stay?"
      ]
    }
  ];
  
  for (const { keywords, clarify, suggestions } of topicPatterns) {
    if (keywords.some(kw => lowerQuestion.includes(kw))) {
      // If question is just the topic word(s) or very short
      if (question.split(/\s+/).length <= 3 && !lowerQuestion.includes('?')) {
        return {
          isVague: true,
          clarificationMessage: clarify,
          suggestedQuestions: suggestions
        };
      }
    }
  }
  
  // Not vague - proceed normally
  return { isVague: false };
}

