# 🎯 Strict Source Filtering - Eliminating Irrelevant Sources

## Problem

Users reported that the system was still citing **irrelevant lease sources** even after implementing intelligent source selection. Perplexity sources were accurate, but lease sources were not relevant to the answers.

### Example Issues:
- Question: "Is my rent too high?" → Cited page about parking policies ❌
- Question: "What are tenant rights?" → Cited rent page when answer came from web ❌
- Question: "Can landlord do X?" → Cited multiple irrelevant pages ❌

---

## Root Cause

GPT was being **too lenient** about what counted as "relevant":
- Including excerpts that were only tangentially related
- Citing sources even when the answer came primarily from web search
- Not strict enough about "directly used" vs "vaguely related"

---

## Solution: EXTREMELY Strict Filtering

### Updated Prompt Strategy

**1. Explicit Strictness Instructions**
```
CRITICAL - BE EXTREMELY STRICT about source relevance:
- ONLY include an excerpt if you directly quoted or paraphrased information from it
- If an excerpt is only tangentially related, DON'T include it
- If you answered using web search only, return []
- Better to return [] than to include an irrelevant source
```

**2. Self-Check Question**
```
ASK YOURSELF: "Did I use specific information from this excerpt to answer the question?"
- If NO → Don't include it
- If YES → Include it
```

**3. Concrete Examples**
```
✅ GOOD: Q: "When does my lease end?" + Excerpt 2 has "Start: 1/1/24, Term: 12 months" → excerptsUsed: [2]
❌ BAD: Q: "Is this legal?" + Excerpt has rent info BUT question is about legality → excerptsUsed: []
❌ BAD: Q: "Can I have pets?" + Excerpt 3 has "No pets" BUT you answered from general knowledge → excerptsUsed: []
```

**4. Reinforcement in User Prompt**
```
IMPORTANT: Be STRICT about excerptsUsed!
- If you answered mainly from web search → return []
- If an excerpt didn't contribute to your answer → don't include it
- Only include excerpts where you used specific information from them
```

---

## Key Changes

### HYBRID Mode

**Before:**
```
6. IMPORTANT: You MUST identify which excerpt number (1-5) contains the key information from the lease
```

**After:**
```
6. CRITICAL - BE EXTREMELY STRICT about source relevance:
   - ONLY include an excerpt if you directly quoted or paraphrased information from it
   - If an excerpt is only tangentially related, DON'T include it
   - If you answered the question using web search only, return []
   - If you made deductions without using specific lease text, return []
   - Better to return [] than to include an irrelevant source
   
   ASK YOURSELF: "Did I use specific information from this excerpt to answer the question?"
   - If NO → Don't include it
   - If YES → Include it
```

### LEASE_ONLY Mode

**Before:**
```
6. CRITICAL: Identify 1-3 excerpt numbers that are TRULY RELEVANT to your answer
   - If an excerpt doesn't directly support your answer, DON'T include it
```

**After:**
```
6. CRITICAL - BE EXTREMELY STRICT about source relevance:
   - ONLY include an excerpt if you directly quoted or paraphrased information from it
   - If an excerpt is only tangentially related, DON'T include it
   - If you can't find relevant information in the excerpts, return []
   - Better to return [] than to include an irrelevant source
   
   ASK YOURSELF: "Did I use specific information from this excerpt to answer the question?"
   - If NO → Don't include it
   - If YES → Include it

EXAMPLES OF GOOD SOURCE SELECTION:
✅ GOOD: Q: "When does my lease end?" + Excerpt 2 has "Start: 1/1/24, Term: 12 months" → excerptsUsed: [2]
✅ GOOD: Q: "How much is my deposit?" + Excerpt 1 has "Deposit: $2000" → excerptsUsed: [1]
❌ BAD: Q: "Can I have pets?" + Excerpt 3 has "No pets" BUT you answered from general knowledge → excerptsUsed: []
❌ BAD: Q: "Is this legal?" + Excerpt has rent info BUT question is about legality → excerptsUsed: []
```

---

## Expected Behavior

### Scenario 1: Hybrid Question (Web-Heavy Answer)

**Question:** "Is my security deposit too high for Chicago?"

**RAG Excerpts:**
1. Page 5: Rent information
2. Page 7: Security deposit: $2,500
3. Page 9: Pet policies
4. Page 11: Utilities
5. Page 13: Parking

**Expected Response:**
```json
{
  "answer": "Your lease requires a $2,500 security deposit (from Page 7). According to Illinois law and Chicago market data, typical security deposits range from $1,500-$3,000 for similar properties. Your deposit is within the normal range for Chicago.",
  "excerptsUsed": [2]  // ONLY Page 7 (deposit info), NOT the other pages
}
```

**Sources Shown:**
- 🟣 From Your Lease: Page 7
- 🔵 From Web Search: Illinois law, Chicago market data

---

### Scenario 2: General Question (Web-Only Answer)

**Question:** "What are my rights if the landlord enters without notice?"

**RAG Excerpts:**
1. Page 3: Rent amount
2. Page 5: Maintenance
3. Page 8: Entry notice: "24 hours required"
4. Page 10: Termination
5. Page 12: Pets

**Expected Response:**
```json
{
  "answer": "Your lease requires 24-hour notice for entry. In Illinois, landlords must provide reasonable notice (typically 24-48 hours) before entering. If your landlord enters without notice, you may have grounds to file a complaint or seek legal remedy.",
  "excerptsUsed": [3]  // Only Page 8 (entry notice), even though answer is mostly from web
}
```

**Sources Shown:**
- 🟣 From Your Lease: Page 8
- 🔵 From Web Search: Illinois tenant rights

---

### Scenario 3: Legal Question (Web-Only Answer)

**Question:** "What are tenant rights in Illinois?"

**RAG Excerpts:**
1. Page 2: Property address
2. Page 4: Rent
3. Page 6: Deposit
4. Page 8: Pets
5. Page 10: Utilities

**Expected Response:**
```json
{
  "answer": "Illinois tenant rights include: right to habitable housing, protection from discrimination, right to privacy, security deposit return within 45 days, and protection from retaliatory eviction. Your lease doesn't specifically outline these general rights.",
  "excerptsUsed": []  // ✅ EMPTY because answer came from web, not lease
}
```

**Sources Shown:**
- 🔵 From Web Search: Illinois tenant rights law (NO lease sources)

---

## Enhanced Debugging

Added console logs to help identify when irrelevant sources are being selected:

```typescript
console.log(`📍 GPT identified ${excerptsUsed.length} relevant excerpt(s): ${JSON.stringify(excerptsUsed)}`);
console.log(`📚 Available excerpts: ${relevantChunks.slice(0, 5).map((c, i) => `${i+1}:Page${c.pageNumber}`).join(', ')}`);
```

**Example Output:**
```
📍 GPT identified 1 relevant excerpt(s): [2]
📚 Available excerpts: 1:Page3, 2:Page7, 3:Page9, 4:Page11, 5:Page13
✅ Added lease source: Page 7
```

This helps verify that:
1. GPT is returning the correct excerpt numbers
2. The correct pages are being mapped
3. Only relevant sources are being added

---

## Philosophy

### Guiding Principle:
**"Better to show NO lease source than to show an IRRELEVANT lease source."**

### Why This Matters:
1. **User Trust:** Showing irrelevant sources breaks user confidence
2. **Verification:** Users can't verify answer if source is wrong
3. **Transparency:** Empty sources for web-based answers is honest
4. **Quality:** Better UX to show only web sources than mix with irrelevant lease sources

### Trade-offs:
- ✅ Higher quality, more accurate sources
- ✅ Users can trust and verify sources
- ⚠️ May show fewer lease sources (but that's OK!)
- ⚠️ Some answers may have only web sources (appropriate)

---

## Testing

### Test Case 1: Strict Filtering Works

**Question:** "What are tenant rights in Chicago?"

**Before:**
- Sources: 🟣 Page 3 (rent), 🟣 Page 5 (deposit), 🔵 Web ❌

**After:**
- Sources: 🔵 Web only ✅

---

### Test Case 2: Relevant Sources Still Shown

**Question:** "What is my monthly rent?"

**Before:**
- Sources: 🟣 Page 5 (rent) ✅

**After:**
- Sources: 🟣 Page 5 (rent) ✅ (no change, correctly kept)

---

### Test Case 3: Hybrid with Partial Lease Use

**Question:** "Is my deposit amount fair?"

**Before:**
- Sources: 🟣 Page 3 (rent), 🟣 Page 5 (deposit), 🔵 Web ❌

**After:**
- Sources: 🟣 Page 5 (deposit only), 🔵 Web ✅

---

## Summary

✅ **Stricter filtering** - Only truly relevant sources  
✅ **Better instructions** - Clear examples of what NOT to include  
✅ **Self-check mechanism** - GPT must verify each source  
✅ **Empty array support** - OK to show no lease sources  
✅ **Enhanced logging** - Better debugging of source selection  

The system now provides **only genuinely relevant lease sources**, improving user trust and answer verifiability! 🎯

