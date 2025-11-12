# 🎯 Intelligent Source Selection - 1-3 Relevant Pages

## Overview

The system now intelligently selects **1-3 truly relevant lease sources** instead of just citing one page. GPT evaluates which excerpts are actually useful and only includes sources that directly support the answer.

## Key Features

✅ **Lease sources: 1-3 pages** (only truly relevant)  
✅ **Web sources: 2-3 links** (from Perplexity)  
✅ **Only relevant sources** (not irrelevant pages)  
✅ **No sources if not useful** (empty array if none apply)  
✅ **No duplicate pages** (same page not shown twice)  
✅ **Quality over quantity** (relevance matters)

---

## How It Works

### Step-by-Step Process

**1. RAG Retrieval**
```
Retrieve 10 chunks → Select top 5 for GPT context
```

**2. GPT Evaluation**
```json
{
  "answer": "Your answer here...",
  "excerptsUsed": [2, 4]  // GPT picks 1-3 relevant excerpts (or [] if none)
}
```

**3. Source Addition**
```typescript
// Add only the excerpts GPT identified as relevant
for (const excerptNum of excerptsUsed) {
  sources.push({
    type: 'lease',
    pageNumber: relevantChunks[excerptNum - 1].pageNumber
  });
}
```

**4. Display to User**
```
🟣 From Your Lease: Page 3, Page 7
```

---

## Examples

### Example 1: Single Relevant Source

**Question:** "What is my monthly rent?"

**RAG provides 5 excerpts:**
1. Page 2: Landlord contact info
2. Page 5: **Monthly rent is $2,500** ← Relevant!
3. Page 8: Pet policies
4. Page 10: Termination
5. Page 12: Utilities

**GPT returns:**
```json
{
  "answer": "Your monthly rent is $2,500, due on the 1st of each month.",
  "excerptsUsed": [2]
}
```

**Sources shown:** 🟣 Page 5 only

---

### Example 2: Multiple Relevant Sources

**Question:** "How much will it cost me to move in?"

**RAG provides 5 excerpts:**
1. Page 3: **First month's rent: $2,500** ← Relevant!
2. Page 5: Parking rules
3. Page 7: **Security deposit: $2,500** ← Relevant!
4. Page 9: Utilities responsibility
5. Page 11: **Application fee: $50** ← Relevant!

**GPT returns:**
```json
{
  "answer": "Your move-in costs are: First month's rent ($2,500), security deposit ($2,500), and application fee ($50), totaling $5,050.",
  "excerptsUsed": [1, 3, 5]
}
```

**Sources shown:** 🟣 Page 3, Page 7, Page 11

---

### Example 3: No Relevant Sources (Web-Based Answer)

**Question:** "What are tenant rights in Illinois?"

**RAG provides 5 excerpts:**
1. Page 2: Property address
2. Page 4: Rent amount
3. Page 6: Pet policies
4. Page 8: Parking
5. Page 10: Maintenance

**GPT returns:**
```json
{
  "answer": "Illinois tenant rights include... [from Perplexity]",
  "excerptsUsed": []
}
```

**Sources shown:** 🔵 Web sources only (no lease sources)

---

### Example 4: Avoiding Duplicate Pages

**Question:** "Tell me about my lease terms."

**RAG provides 5 excerpts:**
1. Page 5: Rent info ← Relevant
2. Page 5: Deposit info (same page) ← Relevant but duplicate
3. Page 8: Term dates ← Relevant
4. Page 12: Utilities
5. Page 15: Termination

**GPT returns:**
```json
{
  "answer": "Your lease is for 12 months starting Jan 1...",
  "excerptsUsed": [1, 2, 3]
}
```

**System deduplicates:**
```typescript
// Excerpts 1 and 2 are both Page 5
// Only add Page 5 once
sources = [Page 5, Page 8]
```

**Sources shown:** 🟣 Page 5, Page 8 (not "Page 5, Page 5, Page 8")

---

## GPT Prompt Instructions

### LEASE_ONLY Mode

```
6. CRITICAL: Identify 1-3 excerpt numbers that are TRULY RELEVANT to your answer
   - If an excerpt doesn't directly support your answer, DON'T include it
   - If NONE of the excerpts are useful, return an empty array []
   - Only include excerpts you actually used to answer the question

OUTPUT FORMAT:
{
  "answer": "your answer here",
  "excerptsUsed": [1, 2]  // 1-3 excerpt numbers, or [] if none are useful
}
```

### HYBRID Mode

```
6. CRITICAL: Identify 1-3 excerpt numbers that are TRULY RELEVANT to your answer
   - If an excerpt doesn't directly support your answer, DON'T include it
   - If NONE of the excerpts are useful, return an empty array []
   - Only include excerpts you actually used to answer the question

OUTPUT FORMAT:
{
  "answer": "your answer here (combining lease info + web context)",
  "excerptsUsed": [2, 4]  // 1-3 excerpt numbers, or [] if none are useful
}
```

---

## Source Selection Logic

```typescript
// Parse GPT response
const excerptsUsed = parsed.excerptsUsed || []; // [2, 4, 5] or []

if (excerptsUsed.length > 0) {
  const addedPages = new Set<number>(); // Track duplicates
  
  for (const excerptNum of excerptsUsed.slice(0, 3)) { // Max 3
    const chunk = relevantChunks[excerptNum - 1];
    
    // Avoid duplicate pages
    if (!addedPages.has(chunk.pageNumber)) {
      sources.unshift({
        type: 'lease',
        text: chunk.text,
        pageNumber: chunk.pageNumber
      });
      addedPages.add(chunk.pageNumber);
    }
  }
} else {
  // No lease sources - answer is from web only
  console.log('GPT returned empty array - no relevant lease sources');
}
```

---

## Benefits

### 1. **Better Accuracy**
- ✅ Shows ALL relevant pages
- ❌ Doesn't show irrelevant pages

### 2. **More Context**
- User sees 2-3 related sections
- Better understanding of how answer was derived

### 3. **Transparency**
- If GPT uses multiple parts of lease, user sees all of them
- Can verify answer by checking all cited pages

### 4. **Flexibility**
- Sometimes 1 source is enough
- Sometimes 3 are needed
- GPT decides based on the question

### 5. **No False Citations**
- If lease doesn't have info, no lease sources shown
- Prevents citing irrelevant pages just to have a source

---

## Testing

### Test Case 1: Rent + Deposit Question

**Input:** "What are my monthly costs?"

**Expected:**
- Answer mentions rent ($2,500) + utilities estimate
- Sources: 2 pages (rent page + utilities page)
- ✅ Both pages are relevant

### Test Case 2: General Question

**Input:** "What is a security deposit?"

**Expected:**
- Answer is definitional from Perplexity
- Sources: Web sources only
- ✅ No lease sources (none are relevant to definition)

### Test Case 3: Complex Multi-Part Question

**Input:** "What are my move-in costs and responsibilities?"

**Expected:**
- Answer covers: rent, deposit, utilities, maintenance
- Sources: 3 pages (rent/deposit page, utilities page, maintenance page)
- ✅ All 3 pages directly support the answer

### Test Case 4: Deduction Question

**Input:** "When does my lease end?"

**Expected:**
- Answer: "December 31, 2024" (deduced from start + term)
- Sources: 1 page (the page with start date and term)
- ✅ Only the relevant page shown

---

## Edge Cases

### 1. All 5 Excerpts from Same Page
```typescript
// GPT returns: [1, 2, 3, 4, 5]
// All from Page 8
// System deduplicates → Shows only "Page 8" once
```

### 2. GPT Returns Invalid Numbers
```typescript
// GPT returns: [10, 15] (but we only have 5 excerpts)
// System checks: if (relevantChunks[usedExcerptIndex]) { ... }
// Invalid excerpts are skipped
```

### 3. GPT Returns Empty Array
```typescript
// GPT returns: []
// System: console.log('No relevant lease sources')
// Result: Only web sources shown
```

### 4. JSON Parse Failure
```typescript
catch (error) {
  console.error('JSON parse failed');
  // Fallback: use first chunk as source
  sources.unshift(relevantChunks[0]);
}
```

---

## Comparison: Before vs After

### Before (Single Source)

**Question:** "What are my financial obligations?"

**Answer:** Correctly mentions rent, deposit, utilities  
**Sources:** 🟣 Page 3 (only rent page)  
**Problem:** ❌ Deposit and utilities are on other pages but not cited

### After (1-3 Relevant Sources)

**Question:** "What are my financial obligations?"

**Answer:** Correctly mentions rent, deposit, utilities  
**Sources:** 🟣 Page 3, Page 5, Page 9 (rent, deposit, utilities)  
**Benefit:** ✅ All relevant pages cited, user can verify all info

---

## Console Logs

```bash
# Single source
📍 GPT identified 1 relevant excerpt(s): 2
✅ Added lease source: Page 5

# Multiple sources
📍 GPT identified 3 relevant excerpt(s): 1, 3, 5
✅ Added lease source: Page 3
✅ Added lease source: Page 7
✅ Added lease source: Page 11

# No relevant sources
📍 GPT identified 0 relevant excerpt(s): 
ℹ️ GPT returned empty excerpts array - no lease sources are relevant

# Duplicates avoided
📍 GPT identified 3 relevant excerpt(s): 1, 2, 3
✅ Added lease source: Page 5
✅ Added lease source: Page 5 (skipped - duplicate)
✅ Added lease source: Page 8
```

---

## Summary

🎯 **1-3 relevant sources** (not just 1)  
✅ **Quality over quantity** (only truly relevant pages)  
🚫 **No irrelevant sources** (GPT filters them out)  
🔍 **Full transparency** (user sees all pages used)  
🎨 **Smart deduplication** (same page not shown twice)  

The system now provides **accurate, comprehensive, and trustworthy source citations** that genuinely support the answer! 🚀

