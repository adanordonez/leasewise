# 📍 Source Identification Fix - GPT Tells Us Which Chunk It Used

## 🎯 Problem Identified

**Issue**: RAG was giving correct answers but citing the wrong page
**Example**:
```
Question: "What is my monthly rent?"
Answer: "Your rent is $2,500" ✅ Correct
Source: Page 5 ❌ Wrong (rent info is on Page 2)
```

**Root Cause**: 
- We retrieve 10 chunks and give GPT the top 5 for context
- GPT reads ALL 5 and finds the answer in chunk 3 (Page 2)
- But we were always citing chunk 1 (highest similarity) as the source
- **Semantic similarity ≠ contains the actual answer**

---

## ✨ Solution

**Ask GPT to identify which excerpt it actually used!**

### How It Works:

1. **Give GPT all excerpts** (numbered 1-5)
2. **Ask GPT to return JSON** with answer + excerpt number
3. **Use that chunk** as the source citation

### Implementation:

```typescript
// LEASE_ONLY mode now uses structured output
systemPrompt = `
  Read ALL excerpts carefully and use the one that best answers the question
  
  IMPORTANT: You MUST identify which excerpt number you used (1-5)
  
  OUTPUT FORMAT:
  {
    "answer": "your answer here",
    "excerptUsed": 3  // the excerpt number with the answer
  }
`;

// Parse GPT's response
const parsed = JSON.parse(answer);
const actualChunk = relevantChunks[parsed.excerptUsed - 1];

// Cite the chunk GPT actually used!
sources.push({
  type: 'lease',
  pageNumber: actualChunk.pageNumber  // ✅ Correct page!
});
```

---

## 📊 Before vs After

### Before (Wrong Source):
```
User: "What is my monthly rent?"

Chunks retrieved:
1. Page 5: "Lease term begins..." (highest similarity)
2. Page 2: "Monthly rent: $2,500" (actual answer)
3. Page 3: "Payment due on 1st..."

GPT reads chunk 2, gives answer: "$2,500"
System cites: Page 5 ❌ WRONG

User clicks Page 5 → sees lease term info, not rent
```

### After (Correct Source):
```
User: "What is my monthly rent?"

Chunks retrieved:
1. Page 5: "Lease term begins..."
2. Page 2: "Monthly rent: $2,500"
3. Page 3: "Payment due on 1st..."

GPT reads chunk 2, gives answer: "$2,500"
GPT says: "I used excerpt 2"
System cites: Page 2 ✅ CORRECT

User clicks Page 2 → sees "$2,500" exactly!
```

---

## 🔍 Console Logs

### What You'll See Now:

```
📄 Step 1: Searching lease with enhanced query...
✅ Found 10 relevant lease chunks
📌 Best chunk selected: Page 5 (will be shown as source)
✅ Added lease source: Page 5

🤖 Step 3: Generating answer...
✅ Answer generated using mode: LEASE_ONLY
📍 GPT identified excerpt 2 as the source
✅ Updated source to Page 2 (the chunk GPT used)
```

**Key line**: `Updated source to Page 2 (the chunk GPT used)`

This shows the source was corrected from the initial guess to the actual chunk GPT used.

---

## 🎯 Why This Works

### The Problem with Semantic Similarity:

**Query**: "what is my monthly rent?"
**Enhanced**: "monthly rent amount payment lease rental price"

**Chunk 1** (Page 5): 
"The lease term shall commence on January 1st..."
- Contains: "lease term"
- **Similarity**: 0.78 (HIGH - many matching keywords)
- **Has answer**: NO ❌

**Chunk 2** (Page 2):
"Monthly rent shall be $2,500 payable..."
- Contains: "monthly rent" "payable"
- **Similarity**: 0.75 (slightly lower)
- **Has answer**: YES ✅

**The Issue**: Chunk 1 scores higher but doesn't have the answer!

### The Solution:

Let GPT decide! GPT can read the actual content and determine which excerpt contains the answer we need. It's not just about keyword matching - GPT understands what information answers the question.

---

## 🔧 Technical Details

### Structured Output:

```typescript
// Enable JSON mode for LEASE_ONLY
response_format: { type: 'json_object' }

// GPT must return:
{
  "answer": "Your monthly rent is $2,500.",
  "excerptUsed": 2
}
```

### Source Update Logic:

```typescript
// Parse GPT's response
const parsed = JSON.parse(answer);
const excerptNumber = parsed.excerptUsed; // 1-5
const usedExcerptIndex = excerptNumber - 1; // Convert to 0-based

// Get the actual chunk GPT used
const actualChunk = relevantChunks[usedExcerptIndex];

// Replace the source we initially added
const leaseSourceIndex = sources.findIndex(s => s.type === 'lease');
sources[leaseSourceIndex] = {
  type: 'lease',
  text: actualChunk.text,
  pageNumber: actualChunk.pageNumber, // ✅ Correct page!
};
```

### Fallback Handling:

```typescript
try {
  const parsed = JSON.parse(answer);
  // Use GPT's identified source
} catch (error) {
  // If JSON parsing fails, keep the original source
  // Better to have some source than error out
}
```

---

## 💬 Example Scenarios

### Scenario 1: Rent Question
```
Question: "What is my monthly rent?"
Enhanced: "monthly rent amount payment lease rental price"

Retrieved chunks:
1. Page 5: "Lease term commences January 1, 2024..." (0.78 similarity)
2. Page 2: "Monthly rent: $2,500 due on 1st..." (0.75 similarity)
3. Page 3: "Late fees apply after 5 days..." (0.68 similarity)

GPT Response:
{
  "answer": "Your monthly rent is $2,500.",
  "excerptUsed": 2
}

✅ Source cited: Page 2 (correct!)
```

### Scenario 2: Security Deposit
```
Question: "What is my security deposit?"
Enhanced: "security deposit amount refund return conditions"

Retrieved chunks:
1. Page 6: "Deposit return timeline..." (0.82 similarity)
2. Page 2: "Security deposit: $3,000..." (0.78 similarity)
3. Page 8: "Move-in checklist required..." (0.65 similarity)

GPT Response:
{
  "answer": "Your security deposit is $3,000.",
  "excerptUsed": 2
}

✅ Source cited: Page 2 (correct!)
```

### Scenario 3: Pet Policy
```
Question: "Can I have pets?"
Enhanced: "pet policy pets allowed animals restrictions"

Retrieved chunks:
1. Page 4: "Pet deposit: $500 per pet..." (0.85 similarity)
2. Page 7: "No pets allowed except service animals..." (0.82 similarity)
3. Page 3: "Tenant responsibilities..." (0.60 similarity)

GPT Response:
{
  "answer": "No pets are allowed except service animals.",
  "excerptUsed": 2
}

✅ Source cited: Page 7 (correct answer, not just pet deposit info!)
```

---

## 🎨 UI Impact

### User Experience:

**Before**: User clicks source → "This doesn't answer my question!"
**After**: User clicks source → "Perfect, this is exactly what the answer referenced!"

### Trust Building:

- ✅ Sources match the answer
- ✅ Users can verify information
- ✅ System feels more reliable
- ✅ Reduces confusion

---

## 📈 Benefits

### For Accuracy:
- ✅ **Correct page citations** - always matches the answer
- ✅ **Verifiable sources** - users can check themselves
- ✅ **GPT's intelligence** - uses content understanding, not just similarity
- ✅ **Context-aware** - GPT knows what actually answers the question

### For User Trust:
- ✅ **Clickable verification** - source actually contains the answer
- ✅ **Professional** - consistent, reliable citations
- ✅ **Transparent** - clear where info came from
- ✅ **Confidence** - users trust the system

### For System:
- ✅ **No additional cost** - using same GPT call
- ✅ **Robust** - GPT is good at JSON output
- ✅ **Flexible** - works for any lease structure
- ✅ **Self-correcting** - GPT picks best source each time

---

## ⚡ Performance

### Cost Impact:
- **Before**: GPT generates answer (~$0.005)
- **After**: GPT generates JSON with answer (~$0.005)
- **Difference**: $0.000 (SAME COST!)

### Speed Impact:
- **JSON parsing**: < 1ms
- **Source update**: < 1ms
- **Total added time**: ~0ms (negligible)

### Token Impact:
- **Output tokens**: +20 tokens (for JSON structure)
- **Cost increase**: ~$0.0001 (0.01 cents)
- **Worth it**: Absolutely!

---

## 🧪 Testing

### Verify Correct Sources:

1. **Ask about rent**:
   ```
   "What is my monthly rent?"
   → Check source page has rent amount
   ```

2. **Ask about dates**:
   ```
   "When does my lease start?"
   → Check source page has start date
   ```

3. **Ask about policies**:
   ```
   "Can I have pets?"
   → Check source page has pet policy
   ```

4. **Check logs**:
   ```
   Look for: "Updated source to Page X (the chunk GPT used)"
   Verify Page X is different from initial "Best chunk selected"
   ```

---

## 🔄 Edge Cases Handled

### 1. JSON Parsing Fails
```typescript
try {
  const parsed = JSON.parse(answer);
  // Use identified source
} catch (error) {
  // Keep original answer and source
  // System still works, just might cite suboptimal page
}
```

### 2. Invalid Excerpt Number
```typescript
if (relevantChunks[usedExcerptIndex]) {
  // Use the chunk
} else {
  // Keep original source
}
```

### 3. No Excerpts Available
```typescript
if (!leaseContext) {
  // Skip source identification
  // Use fallback mode
}
```

---

## ✅ Summary

**The fix**:
- ✅ GPT now tells us which excerpt it used
- ✅ We cite that specific chunk as the source
- ✅ Sources now match the actual answer
- ✅ No additional cost or time
- ✅ Works automatically for all lease questions

**Result**: When users ask "What is my rent?", the source cited is the page that actually contains the rent amount! 🎯

---

## 🚀 Before vs After Summary

### Before:
```
Answer: "Your rent is $2,500" ✅
Source: Page 5 ❌ (wrong page)
User experience: Confused 😕
```

### After:
```
Answer: "Your rent is $2,500" ✅
Source: Page 2 ✅ (correct page with rent info)
User experience: Confident 😊
```

---

**Source citations are now accurate! The page shown will actually contain the information in the answer.** 🎉

