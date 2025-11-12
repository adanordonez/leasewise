# 🔍 Enhanced Hybrid Detection - Update

## 🎯 Problem Fixed

**Issue**: Question "is the lease amount too much?" was classified as LEASE_ONLY instead of HYBRID
**Reason**: The detection wasn't catching fairness/comparison keywords like "too much"

## ✨ What Changed

### 1. Enhanced `shouldAlsoUsePerplexity()` Function

**New keywords added** to trigger hybrid mode:

#### Fairness/Comparison Questions:
- `too much`, `too high`, `too expensive`, `too low`
- `is this fair`, `is this normal`, `is this reasonable`
- `is this typical`, `is this standard`, `is this common`
- `fair`, `unfair`, `reasonable`, `unreasonable`
- `typical`, `normal`, `standard`, `average`

#### Comparison Questions:
- `compare`, `comparison`, `versus`, `vs`
- `better than`, `worse than`, `higher than`, `lower than`
- `should be`, `supposed to be`

#### Requirement Questions:
- `can landlord`, `can my landlord`, `allowed to`
- `required to`, `have to`, `must`

### 2. Source Limiting

**Now limits sources to 1-3 total per response:**
- Max 3 lease sources (top 3 most relevant chunks)
- Web sources adjust based on lease sources: `maxWebSources = 3 - leaseSourceCount`
- Always at least 1 web source if Perplexity is used

**Examples:**
- 3 lease sources + 0 web sources = 3 total
- 2 lease sources + 1 web source = 3 total
- 1 lease source + 2 web sources = 3 total
- 0 lease sources + 3 web sources = 3 total

### 3. Better Logging

**New log field `willBeHybrid`**:
```javascript
🧠 Analysis: { 
  leaseChunks: 5,
  leaseHasAnswer: true,
  asksAboutLaws: true,        // ← Now detects "too much"
  needsPerplexity: true,
  willBeHybrid: true,          // ← NEW: Shows hybrid decision
  question: 'is the lease amount too much?...'
}
```

---

## 📊 Examples of Hybrid Questions Now Detected

### Fairness Questions:
```
✅ "Is the lease amount too much?"
✅ "Is my rent too high?"
✅ "Is this deposit reasonable?"
✅ "Is this fair?"
✅ "Is this normal?"
```

### Comparison Questions:
```
✅ "How does my rent compare to average?"
✅ "Is this higher than typical?"
✅ "Should my deposit be this amount?"
```

### Legal/Rights Questions:
```
✅ "Can my landlord do this?"
✅ "Is this legal?"
✅ "What are my rights?"
✅ "Is the landlord required to...?"
```

---

## 🔄 Flow for Hybrid Questions

### Question: "Is the lease amount too much?"

**Step 1: Search Lease**
```
📄 Step 1: Searching lease document...
✅ Found 5 relevant lease chunks
```

**Step 2: Analysis**
```
🧠 Analysis: { 
  leaseChunks: 5,
  leaseHasAnswer: true,      // Has lease info ✅
  asksAboutLaws: true,       // Detects "too much" ✅
  needsPerplexity: true,     // Will use Perplexity ✅
  willBeHybrid: true         // Will be HYBRID mode ✅
}
```

**Step 3: Use Perplexity as Supplement**
```
🌐 Step 2: Using Perplexity as supplement...
✅ Perplexity completed with 5 citations
```

**Step 4: Generate Hybrid Answer**
```
🤖 Step 3: Generating answer...
✅ Answer generated using mode: HYBRID
```

**Step 5: Response**
```
Sources:
  🟣 From Your Lease: Page 2, Page 3
  🔵 From Web Search: Source 1
  
(Total: 3 sources)
```

---

## 💬 Example Response Format

### Question: "Is the lease amount too much?"

**Answer:**
> According to your lease (Page 2), your monthly rent is $2,500 for a 2-bedroom apartment. The lease also mentions (Page 3) that this includes utilities.
> 
> In general, housing experts recommend spending no more than 30% of your gross monthly income on rent. For a $2,500 rent, this suggests an income of about $8,333/month or $100,000/year. In your area (San Francisco), the average rent for a 2-bedroom is around $3,200, so your rent is actually below market rate.

**Sources:**
- 🟣 **From Your Lease:** Page 2, Page 3
- 🔵 **From Web Search:** [Source 1](https://example.com)

---

## 📈 Expected Behavior Changes

### Questions That Now Trigger Hybrid:

| Question | Before | After | Reason |
|----------|--------|-------|--------|
| "Is rent too high?" | LEASE_ONLY | HYBRID | Added "too high" |
| "Is deposit fair?" | LEASE_ONLY | HYBRID | Added "fair" |
| "Is this normal?" | LEASE_ONLY | HYBRID | Added "normal" |
| "Can landlord do this?" | LEASE_ONLY | HYBRID | Added "can landlord" |
| "Should lease say this?" | LEASE_ONLY | HYBRID | Added "should" |

### Questions That Stay Lease-Only:

| Question | Mode | Reason |
|----------|------|--------|
| "What is the rent?" | LEASE_ONLY | No comparison |
| "What does page 5 say?" | LEASE_ONLY | No comparison |
| "When does lease start?" | LEASE_ONLY | No comparison |

---

## 🧪 Testing

### Test Hybrid Detection:
```bash
# Should trigger HYBRID mode:
"Is my rent too high?"
"Is the deposit reasonable?"
"Is this fair?"
"Can my landlord increase rent?"
"Should my lease have this clause?"

# Should stay LEASE_ONLY:
"What is my rent?"
"What is the deposit amount?"
"When does my lease end?"
```

### Expected Console Output (Hybrid):
```
📄 Step 1: Searching lease document...
✅ Found 3 relevant lease chunks
🧠 Analysis: { 
  leaseHasAnswer: true,
  asksAboutLaws: true,
  willBeHybrid: true  ← Look for this!
}
🌐 Step 2: Using Perplexity as supplement...
✅ Answer generated using mode: HYBRID
```

---

## 💰 Impact

### Cost (No Change):
- Hybrid questions already cost ~$0.011 per message
- Now we're just catching MORE hybrid questions correctly

### Accuracy (Improved):
- ✅ Fairness questions get proper context
- ✅ Comparison questions get market data
- ✅ Users get complete answers (lease + norms)

### Source Count (Improved):
- ✅ Limited to 1-3 sources total (less clutter)
- ✅ Balanced between lease and web sources
- ✅ Only shows most relevant citations

---

## ✅ Summary

**Enhanced hybrid detection now catches:**
- ✅ Fairness questions ("too much", "fair", "reasonable")
- ✅ Comparison questions ("compare", "normal", "typical")  
- ✅ Requirement questions ("can landlord", "must", "required to")
- ✅ Legal questions ("legal", "rights", "allowed")

**Source limiting:**
- ✅ Max 3 lease sources (top relevance)
- ✅ Web sources adjust to fit 1-3 total
- ✅ Cleaner, more focused responses

**Result:** Questions like "Is the lease amount too much?" now correctly use HYBRID mode with both lease info AND market/legal context! 🎉

---

## 🔄 Before vs After

### Before:
```
Q: "Is the lease amount too much?"
→ LEASE_ONLY mode
→ Only shows what lease says about amount
→ Doesn't compare to market rates ❌
→ User doesn't know if it's reasonable
```

### After:
```
Q: "Is the lease amount too much?"
→ HYBRID mode ✅
→ Shows lease amount (🟣 Page 2)
→ PLUS market comparison (🔵 Web Source)
→ User gets complete picture
```

---

**The hybrid detection is now much smarter and will catch all comparison/fairness questions!** 🚀

