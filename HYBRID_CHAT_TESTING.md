# 🧪 Hybrid Chat Testing Guide

## Quick Test Checklist

### Prerequisites
✅ Ensure you have these environment variables set:
```bash
OPENAI_API_KEY=your_key
PERPLEXITY_API_KEY=your_key
```

---

## Test Scenarios

### 1️⃣ Lease-Only Questions (Should use RAG only)

Try these questions after uploading a lease:

```
✅ "What does my lease say about pets?"
✅ "Which page mentions the security deposit?"
✅ "What are the renewal terms in my contract?"
✅ "How much notice is required in my lease?"
✅ "What does section 5 of my lease say?"
```

**Expected behavior**:
- Console shows: `usePerplexity: false, useBoth: false`
- Console shows: `📄 Searching lease document...`
- Response has **only purple badges** (From Your Lease)
- Sources are clickable page numbers

---

### 2️⃣ Perplexity-Only Questions (Should use web search only)

```
✅ "What is a security deposit?"
✅ "Explain tenant rights in California"
✅ "How does the eviction process work?"
✅ "What are typical lease terms?"
✅ "Define subletting"
```

**Expected behavior**:
- Console shows: `usePerplexity: true, useBoth: false`
- Console shows: `🌐 Searching web with Perplexity...`
- Response has **only blue badges** (From Web Search)
- Sources are clickable external links
- Answer mentions "This is general information"

---

### 3️⃣ Hybrid Questions (Should use BOTH sources)

```
✅ "Is my security deposit amount legal?"
✅ "What are my rights about repairs?"
✅ "Is this lease clause fair?"
✅ "Can my landlord do this according to law?"
✅ "Compare my rent increase to typical limits"
```

**Expected behavior**:
- Console shows: `usePerplexity: false, useBoth: true` (or both true)
- Console shows: `📄 Searching lease document...`
- Console shows: `🌐 Searching web with Perplexity...`
- Response has **BOTH purple AND blue badges**
- Answer clearly separates: "According to your lease..." vs "In general..."

---

## Console Log Examples

### Lease-Only:
```
🧠 Question analysis: { usePerplexity: false, useBoth: false, question: 'What does my lease say about pets?' }
📄 Searching lease document...
✅ Found 5 relevant lease chunks
🤖 Generating answer...
✅ Answer generated using LEASE ONLY
```

### Perplexity-Only:
```
🧠 Question analysis: { usePerplexity: true, useBoth: false, question: 'What are tenant rights?' }
🌐 Searching web with Perplexity...
🔍 Using Perplexity for web search: What are tenant rights?
✅ Perplexity search completed with 3 citations
🤖 Generating answer...
✅ Answer generated using PERPLEXITY
```

### Hybrid:
```
🧠 Question analysis: { usePerplexity: false, useBoth: true, question: 'Is my deposit legal?' }
📄 Searching lease document...
✅ Found 3 relevant lease chunks
🌐 Searching web with Perplexity...
🔍 Using Perplexity for web search: Is my deposit legal?
✅ Perplexity search completed with 2 citations
🤖 Generating answer...
✅ Answer generated using BOTH sources
```

---

## Visual Verification

### UI Elements to Check:

1. **Source Badges**:
   - 🟣 Purple dot = "From Your Lease:"
   - 🔵 Blue dot = "From Web Search:"
   - Both appear in hybrid responses

2. **Lease Sources**:
   - Purple badges with page numbers
   - Clickable → opens PDF to that page
   - Example: "Page 3", "Page 7"

3. **Web Sources**:
   - Blue badges with external link icon
   - Clickable → opens source URL in new tab
   - Example: "Source 1", "Source 2"

4. **Answer Format**:
   - Lease-only: Direct quotes with page refs
   - Web-only: General info + "check your lease"
   - Hybrid: Clear sections for each source

---

## Response Time Expectations

| Type | Expected Time | Note |
|------|---------------|------|
| Lease-only | 2-3 seconds | Fastest (RAG only) |
| Perplexity-only | 3-4 seconds | Web search time |
| Hybrid | 4-6 seconds | Both sources |

---

## Common Issues & Solutions

### Issue 1: "Perplexity search failed"
**Cause**: Missing/invalid PERPLEXITY_API_KEY
**Solution**: 
```bash
# Check .env.local has:
PERPLEXITY_API_KEY=your_actual_key
```

### Issue 2: Always using lease-only
**Cause**: Question classifier being too conservative
**Solution**: Try more explicit questions like:
- "What is X?" (not "What does my lease say about X?")
- "Explain tenant rights"
- "What are typical rules for X?"

### Issue 3: No sources showing
**Cause**: Old messages in chat history
**Solution**: Refresh page to start new chat session

### Issue 4: Hybrid not triggering
**Cause**: Need specific patterns
**Solution**: Use questions with:
- "is this legal"
- "is this fair"
- "compare"
- "what are my rights"

---

## Feature Demonstration

### Demo Script (5 minutes):

1. **Upload lease** → Complete analysis

2. **Lease question**:
   - Ask: "What does my lease say about pets?"
   - Show purple badges
   - Click page citation

3. **General question**:
   - Ask: "What are tenant rights for security deposits in California?"
   - Show blue badges
   - Click external link

4. **Hybrid question**:
   - Ask: "Is my security deposit amount legal?"
   - Show BOTH badge types
   - Highlight clear source separation in answer

5. **Point out**:
   - Automatic routing (no user action needed)
   - Clear visual distinction
   - All sources are verifiable
   - Comprehensive answers

---

## Edge Cases to Test

### 1. Ambiguous Questions
```
"Tell me about pets"
```
Should default to lease search (conservative)

### 2. Empty Lease Context
```
"What is the eviction process?"
```
Should use Perplexity if lease has no info

### 3. Multiple Questions
```
"What does my lease say about pets and what are typical pet policies?"
```
Should trigger hybrid mode

### 4. Spanish Questions (if supported)
```
"¿Qué dice mi contrato sobre mascotas?"
```
Should still route correctly

---

## Success Criteria

✅ Questions route to correct source(s)
✅ Console logs show routing decisions
✅ UI clearly shows source types
✅ Sources are clickable and work
✅ Answers clearly label source of info
✅ No errors in console
✅ Response times < 10 seconds
✅ Fallback works if Perplexity fails

---

## Performance Monitoring

### What to Log:
- Question classification accuracy
- Source selection appropriateness  
- Response times per type
- Perplexity failure rate
- User click-through on sources

### Metrics to Track:
- % questions using each mode
- Average tokens per response
- Cost per message
- User satisfaction (implicit from usage)

---

## Next Steps After Testing

1. ✅ Verify all question types work
2. ✅ Check console logs are informative
3. ✅ Confirm UI displays correctly
4. ✅ Test source links work
5. 📊 Monitor usage patterns
6. 🎯 Tune classification if needed
7. 📈 Optimize prompts based on responses

---

**Ready to test! Start with a simple lease question and work through all three modes.** 🚀

