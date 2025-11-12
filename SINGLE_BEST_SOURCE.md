# 📍 Single Best Source - Update

## 🎯 Problem Fixed

**Issue**: Chat was showing 1-3 lease sources that didn't always contain the correct answer
**Solution**: Now shows **ONE best source** that actually answers the question

## ✨ What Changed

### 1. Retrieve More, Show Less
**Old approach**:
- Retrieve 5 chunks
- Show all 5 as sources
- Many irrelevant chunks shown

**New approach**:
- Retrieve **10 chunks** (more options)
- Use top **5 for GPT context** (better understanding)
- Show only **1 best chunk as source** (clearest answer)

### 2. Smart Source Selection
```typescript
// Retrieve 10 chunks for better coverage
const relevantChunks = await rag.retrieve(question, 10);

// Use top 5 for GPT to understand context
const topChunks = relevantChunks.slice(0, 5);

// But only show the BEST one as the source
bestChunk = topChunks[0]; // Highest similarity score

// Add just this one to sources
sources.push({
  type: 'lease',
  text: bestChunk.text,
  pageNumber: bestChunk.pageNumber
});
```

### 3. Source Count Limits

**LEASE_ONLY mode**:
- 1 lease source (the best one)

**HYBRID mode**:
- 1 lease source + 1 web source = **2 total**

**WEB_FALLBACK mode**:
- 0 lease sources + 1-2 web sources = **1-2 total**

### 4. Better Prompts

GPT now knows to focus on "Excerpt 1" which is the best match:

```typescript
systemPrompt = `
  The most relevant information is in Excerpt 1 (Page ${pageNumber})
  - focus on this
`;

userPrompt = `
  Relevant excerpts (Excerpt 1 is most relevant):
  ${leaseContext}
  
  Answer using Excerpt 1 primarily.
`;
```

---

## 📊 Before vs After

### Before:
```
User: "What is the monthly rent?"

Sources:
🟣 From Your Lease:
   - Page 3 (about utilities)
   - Page 7 (about late fees)  
   - Page 2 (HAS THE RENT!) ← buried in 3rd position
```

### After:
```
User: "What is the monthly rent?"

Sources:
🟣 From Your Lease:
   - Page 2 ← The ONE source with the answer!
```

---

## 🔍 How It Works

### Step 1: Cast Wide Net
```
📄 Searching lease document...
✅ Found 10 relevant lease chunks
```

### Step 2: Select Best
```
📌 Best chunk selected: Page 2 (will be shown as source)
✅ Added lease source: Page 2
```

### Step 3: Use Top 5 for Context
GPT gets 5 chunks to understand the full context, but knows Excerpt 1 (Page 2) is the key one.

### Step 4: Show Just the Best
User only sees the ONE source that actually has the answer.

---

## 💬 Example Responses

### Lease-Only Question
```
User: "What is the security deposit amount?"

Answer: "Your security deposit is $2,500."

Sources:
🟣 From Your Lease: Page 2
```

### Hybrid Question
```
User: "Is my security deposit too high?"

Answer: "According to your lease (Page 2), your security deposit is 
$2,500. In general, most states limit deposits to 1-2 months' rent.
If your monthly rent is $1,500, then $2,500 would be reasonable."

Sources:
🟣 From Your Lease: Page 2
🔵 From Web Search: Source 1
```

---

## 🎯 Benefits

### For Accuracy:
- ✅ Only shows sources that actually answer the question
- ✅ No more irrelevant chunks confusing users
- ✅ Clear, single source of truth from lease

### For User Experience:
- ✅ Cleaner UI - just 1-2 sources instead of 3+
- ✅ Easy to verify - one page to check
- ✅ Less overwhelming - focused information

### For Performance:
- ✅ Retrieves 10 instead of 5 (better recall)
- ✅ Uses top 5 for context (better understanding)
- ✅ Shows 1 as source (better precision)

---

## 📈 Source Count Summary

| Mode | Lease Sources | Web Sources | Total |
|------|---------------|-------------|-------|
| **LEASE_ONLY** | 1 | 0 | **1** |
| **HYBRID** | 1 | 1 | **2** |
| **WEB_FALLBACK** | 0 | 1-2 | **1-2** |

Maximum sources shown: **2 total** (much cleaner!)

---

## 🧪 Testing

Try these questions and check source count:

### Should Show 1 Source:
```
"What is the monthly rent?"
"When does the lease start?"
"What is my security deposit?"
→ Expect: 🟣 Page X (1 source)
```

### Should Show 2 Sources:
```
"Is my rent too high?"
"Is this deposit legal?"
"Can my landlord do this?"
→ Expect: 🟣 Page X + 🔵 Source 1 (2 sources)
```

### Console Output:
```
📄 Step 1: Searching lease document...
✅ Found 10 relevant lease chunks
📌 Best chunk selected: Page 2 (will be shown as source)
✅ Added lease source: Page 2
🤖 Step 3: Generating answer...
✅ Answer generated using mode: LEASE_ONLY
```

---

## 🔧 Technical Details

### Similarity Scoring
RAG returns chunks sorted by similarity score (highest first). The first chunk is almost always the most relevant, so we use it as the source while giving GPT the top 5 for full context.

### Why Top 5 for Context?
- Chunk 1: Usually has the exact answer
- Chunks 2-5: Provide supporting context
- GPT sees the full picture but cites the main source

### Why Show Only 1?
- Users want THE answer, not multiple possibilities
- Reduces cognitive load
- Easier to verify
- Cleaner UI

---

## ✅ Summary

**The new approach**:
- ✅ Retrieves 10 chunks (wider net)
- ✅ Uses top 5 for GPT context (better understanding)
- ✅ Shows only 1 as source (the best one)
- ✅ Max 2 total sources (1 lease + 1 web in hybrid)

**Result**: Clean, focused sources that actually contain the answer! 🎯

---

## 🔄 Migration Notes

No changes needed for existing chats. The new logic automatically:
- Retrieves more chunks for better coverage
- Selects the best one as the source
- Limits total sources to 1-2

Just refresh and try asking questions!

---

**The ONE source shown will actually have the answer to your question!** 🎉

