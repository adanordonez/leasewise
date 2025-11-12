import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type RouteDecision = 
  | 'lease_only'      // Search lease document only
  | 'perplexity_only' // Use web search only
  | 'hybrid'          // Use both lease and web
  | 'irrelevant'      // Off-topic, reject
  | 'needs_clarification'; // Too vague, ask for more info

export interface RoutingDecision {
  decision: RouteDecision;
  reasoning: string;
  confidence: number; // 0.0-1.0
  clarificationMessage?: string; // If needs_clarification
  suggestedQuestions?: string[]; // If needs_clarification
  rejectionMessage?: string; // If irrelevant
}

/**
 * Unified intelligent router that uses GPT to make ALL decisions:
 * - Is it relevant to leases?
 * - Is it too vague?
 * - What search strategy should be used?
 */
export async function routeQuestion(
  question: string,
  conversationHistory?: string
): Promise<RoutingDecision> {
  try {
    console.log(`🧠 Context-aware routing for: "${question}"`);
    if (conversationHistory) {
      const lines = conversationHistory.split('\n');
      console.log(`   📝 Recent context (${lines.length} messages):`);
      lines.forEach(line => console.log(`      ${line.substring(0, 80)}...`));
    } else {
      console.log(`   ⚠️ No conversation context available`);
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cheap for routing
      messages: [
        {
          role: 'system',
          content: `You are an intelligent, context-aware router for a lease document chat assistant. You are part of a natural CONVERSATION with a human.

CORE PRINCIPLE: Trust the user and use context. Humans speak naturally with pronouns, typos, and incomplete sentences. Your job is to understand their intent, not be pedantic about wording.

ASSUME: The user's question makes sense given recent conversation. Use context to resolve ANY ambiguity.

YOUR OPTIONS:

1. **lease_only** - Question is clearly about their specific lease document
   Examples:
   - "What is my monthly rent?"
   - "When does my lease start?"
   - "What does page 5 say?"
   - "Can I have pets?" (if asking about THEIR lease policy)

2. **perplexity_only** - Question is about general housing information, not their specific lease
   Examples:
   - "What is a security deposit?" (definition)
   - "How do leases work in general?"
   - "What are typical lease terms?"

3. **hybrid** - Question needs BOTH their lease AND external/legal information
   Examples:
   - "Is my rent too high?" (needs their rent + market comparison)
   - "What happens if I don't pay rent?" (needs their lease terms + legal consequences)
   - "Is this legal?" (needs their lease clause + laws)
   - "Can my landlord do this?" (needs their lease + tenant rights)

4. **needs_clarification** - RARE. Only use when NO context exists and question is impossible to interpret.
   
   DEFAULT ASSUMPTION: The user's question makes sense. Look at recent conversation to understand it.
   
   HOW TO HANDLE AMBIGUITY:
   - Pronouns (they/it/that/them) → Refer to the subject of the last message
   - Incomplete questions → Fill in from context
   - Typos (payin/wen/wats) → Ignore, understand intent
   - Domain defaults → "payment" in lease context = rent
   
   EXAMPLES - These should NOT need clarification:
   ✅ "how much are they payin" (after discussing tenants) → they = tenants, payin = paying, what = rent
   ✅ "when is it due" (after discussing rent) → it = rent, due = payment date
   ✅ "what about that" (after discussing pets) → that = pet policy
   ✅ "deposit" → security deposit
   ✅ "yes" / "no" → response to previous question
   
   ONLY ask for clarification if:
   ❌ Zero context AND question is literally impossible to interpret
   ❌ Examples: "what?" (no prior context), "tell me" (no subject, no context)

5. **irrelevant** - Question is completely off-topic (sports, weather, entertainment, etc.)
   Examples:
   - "Who will win the world series?"
   - "What's the weather like?"
   - "Tell me a joke"
   - "How do I cook pasta?"

CRITICAL RULES FOR CONTEXT-AWARE ROUTING:

1. **ALWAYS look at recent conversation first** - Most ambiguity disappears with context
2. **Pronouns refer to the last relevant noun** - "they" = subject just discussed
3. **Assume domain knowledge** - In lease chat, "payment" = rent, "deposit" = security deposit
4. **Ignore typos and informal language** - "payin" = paying, "wats" = what's
5. **Fill in gaps from context** - Incomplete questions are normal in conversation
6. **Trust the user** - If it could make sense given context, assume it does
7. **Clarification is a LAST RESORT** - Only if truly impossible to interpret

When in doubt between lease_only and hybrid, ask: "Does this need external legal/market context?" If yes → hybrid

${conversationHistory ? `
═══════════════════════════════════════
RECENT CONVERSATION (Your most important tool):
${conversationHistory}
═══════════════════════════════════════

HOW TO USE CONTEXT:
1. Read the conversation above CAREFULLY
2. What was just discussed? That's what pronouns refer to
3. Is the user's question a natural follow-up? Then it's valid
4. Example: If last message mentioned "tenants", then "they/them" = those tenants
5. Example: If last message mentioned "rent", then "it/that" = rent
6. Example: After discussing pets, "how much" = pet deposit/fee

NEVER ask for clarification if the question makes sense given the above conversation.` : ''}

Return JSON:
{
  "decision": "lease_only" | "perplexity_only" | "hybrid" | "needs_clarification" | "irrelevant",
  "reasoning": "brief explanation of why",
  "confidence": 0.0-1.0,
  "clarificationMessage": "friendly message asking for clarification (if needs_clarification)",
  "suggestedQuestions": ["example question 1", "example question 2", "example question 3"] (if needs_clarification),
  "rejectionMessage": "friendly rejection message (if irrelevant)"
}`,
        },
        {
          role: 'user',
          content: `Route this question: "${question}"`,
        },
      ],
      temperature: 0.3, // Slightly higher for more natural, context-aware decisions
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    const routing: RoutingDecision = {
      decision: result.decision || 'needs_clarification',
      reasoning: result.reasoning || 'No reasoning provided',
      confidence: result.confidence ?? 0.5,
      clarificationMessage: result.clarificationMessage,
      suggestedQuestions: result.suggestedQuestions || [],
      rejectionMessage: result.rejectionMessage,
    };
    
    console.log(`✅ Routing decision: ${routing.decision} (confidence: ${routing.confidence})`);
    console.log(`   💭 Reasoning: ${routing.reasoning}`);
    
    return routing;
    
  } catch (error) {
    console.error('🚨 Intelligent routing failed:', error);
    // Safe fallback: ask for clarification rather than risk bad answer
    return {
      decision: 'needs_clarification',
      reasoning: 'Error during routing, asking for clarification to be safe',
      confidence: 0.0,
      clarificationMessage: "I want to make sure I understand your question correctly. Could you please be more specific about what you'd like to know about your lease?",
      suggestedQuestions: [
        "What is my monthly rent?",
        "When does my lease start and end?",
        "What are my pet policies?"
      ],
    };
  }
}

