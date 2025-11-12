# 🧪 Context-Aware Routing Test Suite

## Purpose
Thoroughly test the context-first routing system to ensure it handles natural conversation, pronouns, typos, and follow-ups correctly.

---

## Test Category 1: Pronoun Resolution

### Test 1A: "They" after discussing people
```
Turn 1:
User: "Who are the tenants in the lease?"
Expected: lease_only ✅
Response: "The tenants are John Doe and Jane Smith."

Turn 2:
User: "how much are they paying"
Expected: lease_only ✅ (they = tenants, paying = rent)
Should NOT ask for clarification ❌
```

### Test 1B: "It" after discussing a thing
```
Turn 1:
User: "What is my rent?"
Expected: lease_only ✅
Response: "Your monthly rent is $2,500."

Turn 2:
User: "when is it due"
Expected: lease_only ✅ (it = rent)
Should NOT ask for clarification ❌
```

### Test 1C: "That" after discussing a policy
```
Turn 1:
User: "What is the pet policy?"
Expected: lease_only ✅
Response: "Pets are not allowed except service animals."

Turn 2:
User: "is that legal"
Expected: hybrid ✅ (that = pet policy, needs legal context)
Should NOT ask for clarification ❌
```

### Test 1D: "Them" after discussing plural things
```
Turn 1:
User: "What utilities am I responsible for?"
Expected: lease_only ✅
Response: "You are responsible for electricity and gas."

Turn 2:
User: "how much are them usually"
Expected: hybrid/perplexity_only ✅ (them = utilities, typo "them" instead of "they")
Should NOT ask for clarification ❌
```

---

## Test Category 2: Typos and Informal Language

### Test 2A: Common typos
```
Turn 1:
User: "Who are the tenants?"
Expected: lease_only ✅

Turn 2:
User: "how much r they payin"
Expected: lease_only ✅
Notes: "r" = are, "payin" = paying, "they" = tenants
Should work perfectly ✅
```

### Test 2B: Missing words
```
Turn 1:
User: "What is the security deposit?"
Expected: lease_only ✅

Turn 2:
User: "wen do i get back"
Expected: lease_only ✅
Notes: "wen" = when, implicit "it" = deposit
Should work ✅
```

### Test 2C: Slang/informal
```
Turn 1:
User: "What's the deal with parking?"
Expected: lease_only ✅

Turn 2:
User: "wats the cost tho"
Expected: lease_only ✅
Notes: "wats" = what's, "tho" = though, "cost" = parking cost
Should work ✅
```

---

## Test Category 3: Incomplete Questions

### Test 3A: Just a pronoun
```
Turn 1:
User: "What is my monthly rent?"
Expected: lease_only ✅
Response: "$2,500"

Turn 2:
User: "it"
Expected: needs_clarification ⚠️
Notes: Too vague even with context - "it" what? asking about it? confirming it?
Should ask for clarification ✅
```

### Test 3B: Just a verb
```
Turn 1:
User: "Can I have pets?"
Expected: lease_only ✅
Response: "No, pets are not allowed except service animals."

Turn 2:
User: "change?"
Expected: needs_clarification ⚠️
Notes: Change what? Change the policy? Change my mind? Too vague.
Should ask for clarification ✅
```

### Test 3C: Missing subject but clear intent
```
Turn 1:
User: "What is the security deposit?"
Expected: lease_only ✅
Response: "$2,500"

Turn 2:
User: "when do i get back"
Expected: lease_only ✅ (implicit "it" = deposit from context)
Should NOT ask for clarification ✅
```

---

## Test Category 4: Multi-Turn Context

### Test 4A: Three-turn conversation
```
Turn 1:
User: "Who are the tenants?"
Expected: lease_only ✅
Response: "John Doe and Jane Smith"

Turn 2:
User: "how much are they paying"
Expected: lease_only ✅
Response: "$2,500 per month"

Turn 3:
User: "is that too much"
Expected: hybrid ✅ (that = $2,500 rent, needs market comparison)
Should NOT ask for clarification ✅
```

### Test 4B: Topic change
```
Turn 1:
User: "What is my rent?"
Expected: lease_only ✅
Response: "$2,500"

Turn 2:
User: "can i have pets"
Expected: lease_only ✅ (new topic, no pronoun)
Response: "No, not allowed"

Turn 3:
User: "what about service dogs"
Expected: lease_only ✅ ("about" implies continuation of pets topic)
Should work ✅
```

### Test 4C: Returning to previous topic
```
Turn 1:
User: "What is my rent?"
Expected: lease_only ✅
Response: "$2,500"

Turn 2:
User: "Can I paint my walls?"
Expected: lease_only ✅
Response: "No, alterations require written permission"

Turn 3:
User: "back to the rent, when is it due"
Expected: lease_only ✅ (explicit topic return)
Should work ✅
```

---

## Test Category 5: Clarification Responses

### Test 5A: Responding to clarifying question
```
Turn 1:
User: "what about deposit"
Expected: needs_clarification ⚠️ (genuinely vague)
Response: "What would you like to know about the deposit?
           • How much is it?
           • When do I get it back?"

Turn 2:
User: "the amount"
Expected: lease_only ✅ (responding to clarification)
Should NOT ask for clarification again ✅
```

### Test 5B: Yes/No response
```
Turn 1:
User: "what is the security deposit"
Expected: lease_only ✅
Response: "$2,500. Would you like to know when you'll get it back?"

Turn 2:
User: "yes"
Expected: lease_only ✅ (affirmative to offered question)
Should work ✅
```

### Test 5C: Picking an option
```
Turn 1:
User: "tell me about pets"
Expected: needs_clarification ⚠️
Response: "What would you like to know?
           • Can I have pets?
           • Pet deposit amount?
           • Pet restrictions?"

Turn 2:
User: "the restrictions"
Expected: lease_only ✅
Should work ✅
```

---

## Test Category 6: Edge Cases

### Test 6A: No context, genuinely vague
```
Turn 1 (no prior messages):
User: "what about it"
Expected: needs_clarification ✅
Notes: No "it" to refer to
Should ask for clarification ✅
```

### Test 6B: Off-topic then back on topic
```
Turn 1:
User: "Who won the world series"
Expected: irrelevant ✅
Response: "I'm specialized in lease questions..."

Turn 2:
User: "ok, what is my rent"
Expected: lease_only ✅ (valid lease question despite previous rejection)
Should work ✅
```

### Test 6C: Multiple pronouns
```
Turn 1:
User: "What are the tenant names and rent amount?"
Expected: lease_only ✅
Response: "John Doe and Jane Smith pay $2,500"

Turn 2:
User: "are they paying it on time"
Expected: lease_only/perplexity_only ✅ (they = tenants, it = rent)
Notes: Can't be answered from lease, needs external info
Should route to perplexity ✅
```

### Test 6D: Ambiguous pronoun with multiple referents
```
Turn 1:
User: "What are the tenant names and their rent?"
Expected: lease_only ✅
Response: "John Doe and Jane Smith. Rent is $2,500."

Turn 2:
User: "what about them"
Expected: needs_clarification ⚠️
Notes: "them" could = tenants OR rent (last noun)
Reasonable to ask for clarification here ✅
```

---

## Test Category 7: Domain-Specific Defaults

### Test 7A: "Payment" defaults to rent
```
Turn 1:
User: "what is the payment"
Expected: lease_only ✅
Notes: In lease context, "payment" = rent payment
Should understand and answer about rent ✅
```

### Test 7B: "Deposit" defaults to security deposit
```
Turn 1:
User: "how much is the deposit"
Expected: lease_only ✅
Notes: "deposit" = security deposit in lease context
Should work ✅
```

### Test 7C: "End date" means lease end
```
Turn 1:
User: "what is the end date"
Expected: lease_only ✅
Notes: Clearly means lease end date
Should work ✅
```

---

## Test Category 8: Complex Natural Language

### Test 8A: Run-on with multiple clauses
```
Turn 1:
User: "who r the tenants and how much r they payin and wen is it due"
Expected: lease_only ✅
Notes: Multiple questions, typos, pronouns - should handle all
Should work ✅
```

### Test 8B: Question within question
```
Turn 1:
User: "What is my rent (and is that including utilities?)"
Expected: lease_only or hybrid ✅
Notes: Main question about rent, sub-question about utilities
Should work ✅
```

### Test 8C: Hypothetical follow-up
```
Turn 1:
User: "Can I have a dog?"
Expected: lease_only ✅
Response: "No, pets not allowed except service animals"

Turn 2:
User: "what if it's a service dog"
Expected: lease_only ✅ (it = dog, logical follow-up)
Should work ✅
```

---

## Success Criteria

### ✅ PASS Criteria:
1. **Pronoun resolution**: Correctly identifies referents from last 1-2 messages
2. **Typo tolerance**: Understands "payin", "wen", "wats", "r", etc.
3. **Follow-up handling**: Never asks for clarification on natural follow-ups
4. **Context memory**: Uses last 4 messages (2 exchanges) effectively
5. **Domain defaults**: Understands "deposit" = security deposit, etc.

### ❌ FAIL Criteria:
1. Asks for clarification on clear follow-ups like "how much are they paying" after discussing tenants
2. Cannot resolve obvious pronouns (it/they/that)
3. Confused by common typos
4. Asks for clarification when user is responding to a previous clarification
5. Treats each question in isolation, ignoring context

---

## Quick Test Script

Copy-paste this into the chat to run a quick validation:

```
# Test 1: Pronoun resolution
1. "Who are the tenants in the lease?"
2. "how much are they payin"
   ✅ Should answer without clarification

# Test 2: Topic continuation
1. "What is my rent?"
2. "when is it due"
   ✅ Should answer without clarification

# Test 3: Typos
1. "What is the security deposit?"
2. "wen do i get it back"
   ✅ Should understand despite typo

# Test 4: Follow-up to clarification
1. "deposit"
   (System asks what about deposit)
2. "the amount"
   ✅ Should answer, not ask again

# Test 5: Multi-turn
1. "Who are the tenants?"
2. "how much are they paying"
3. "is that fair"
   ✅ All should work with context
```

---

## Debugging Guide

If tests fail, check console output:

```bash
🧠 Context-aware routing for: "how much are they paying"
   📝 Recent context (2 messages):
      user: Who are the tenants in the lease?...
      assistant: The tenants are John Doe and Jane Smith...
✅ Routing decision: lease_only (confidence: 0.9)
   💭 Reasoning: User asking about rent for tenants just discussed
```

**Look for:**
1. Is context being passed? Check "Recent context" output
2. Is reasoning sound? Check "Reasoning" output
3. Is confidence high? Should be >0.7 for clear cases
4. Is decision correct? lease_only/hybrid/etc.

---

## Expected Behavior Summary

| Scenario | Should Ask Clarification? | Why |
|----------|---------------------------|-----|
| "they" after discussing tenants | ❌ NO | Clear referent |
| "it" after discussing rent | ❌ NO | Clear referent |
| "how much are they payin" (with typos) | ❌ NO | Typos OK + context |
| "the amount" after clarification | ❌ NO | Responding to clarification |
| "what" (no context) | ✅ YES | Genuinely impossible |
| "it" (no prior context) | ✅ YES | No referent available |
| "them" with 2+ possible referents | ⚠️ MAYBE | Legitimately ambiguous |

---

## Notes

- **90% of questions should NOT need clarification** when there's context
- Clarification should be **rare** - only for truly impossible cases
- System should **trust the user** - if it could make sense, assume it does
- **Typos and informal language** should never trigger clarification
- **Pronouns** should always be resolved from recent conversation

The system is now **context-first** instead of **rule-based**. It should feel like talking to a human who remembers what was just discussed.

