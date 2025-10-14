# 🏛️ Real Legal Sources with OpenAI Web Search

## 🎯 Overview

This implementation uses **OpenAI's web search API** to find real, authoritative legal sources for tenant rights based on the user's location (state/city extracted from their address).

---

## 🔧 Implementation

### **Architecture:**

```
User uploads lease
    ↓
RAG extracts tenant rights (fast)
    ↓
User clicks "Find Legal Sources" button
    ↓
OpenAI web search finds real laws/statutes
    ↓
Display authoritative sources with links
```

---

## 📁 Files Created

### 1. **`lib/legal-search.ts`**
Core logic for searching legal sources using OpenAI's Responses API with web search.

**Key Functions:**
- `searchLegalSources()` - Search for a single tenant right
- `searchMultipleLegalSources()` - Batch search for multiple rights
- `searchSpecificStatute()` - Find a specific statute by name

### 2. **`app/api/search-legal-sources/route.ts`**
API endpoint that accepts requests and calls the legal search functions.

### 3. **`components/LegalSourcesDisplay.tsx`**
UI component that displays a button to search for legal sources and shows the results.

---

## 🎨 How It Works

### **Step 1: Domain Filtering (CRITICAL)**

We restrict searches to **authoritative legal domains only**:

```typescript
const legalDomains = [
  // State government sites
  `${state.toLowerCase()}.gov`,
  'legislature.state',
  'law.state',
  
  // Legal aid and tenant advocacy
  'nolo.com',
  'legalaidnetwork.org',
  'justia.com',
  'findlaw.com',
  
  // HUD and federal resources
  'hud.gov',
  'consumerfinance.gov',
  
  // Legal databases
  'law.cornell.edu',
  'law.justia.com',
  
  // Bar associations
  'americanbar.org',
  
  // Tenant unions
  'tenantsunion.org',
  'tenant.net',
];
```

**Why:** This ensures we only get results from trusted legal sources, not random blogs or unreliable sites.

### **Step 2: Location-Based Search**

```typescript
user_location: {
  type: 'approximate',
  country: 'US',
  city: city || undefined,
  region: state || undefined,
}
```

**Why:** Returns laws specific to the user's state/city.

### **Step 3: Strict Search Query**

```typescript
const searchQuery = `${state} tenant rights law ${tenantRight} statute regulation`;

const prompt = `Find authoritative legal sources about tenant rights in ${state} regarding: ${tenantRight}.

Search for:
1. Specific state statutes or regulations
2. Legal code sections (with numbers)
3. Official government guidance
4. Tenant protection laws

Focus on ${city}, ${state} laws specifically.

Only cite authoritative legal sources. Do not speculate.`;
```

**Why:** Very specific queries return relevant legal sources, not general information.

### **Step 4: Extract Sources and Citations**

```typescript
// Get inline citations
textContent.annotations.forEach((annotation) => {
  if (annotation.type === 'url_citation') {
    sources.push({
      url: annotation.url,
      title: annotation.title,
      snippet: outputText.substring(annotation.start_index, annotation.end_index),
    });
  }
});

// Also get all sources consulted
webSearchCall.action.sources.forEach((source) => {
  sources.push({
    url: source.url,
    title: source.title,
    snippet: '',
  });
});
```

**Why:** We get both cited sources (most relevant) and all sources consulted (comprehensive).

---

## 🎨 User Experience

### **In the Analysis Results:**

Each tenant right will have a **"Find Legal Sources"** button:

```
┌──────────────────────────────────────────────┐
│ Your Rights                                  │
├──────────────────────────────────────────────┤
│ ✅ Right to habitability                     │
│    Illinois law requires landlords to...    │
│                                              │
│    [🔍 Find Legal Sources]  ← NEW BUTTON    │
│                                              │
├──────────────────────────────────────────────┤
│ ✅ Right to privacy                          │
│    Landlords must give 24-hour notice...    │
│                                              │
│    [🔍 Find Legal Sources]                   │
└──────────────────────────────────────────────┘
```

### **After Clicking:**

```
┌──────────────────────────────────────────────┐
│ ✅ Right to habitability                     │
│    Illinois law requires landlords to...    │
│                                              │
│    [📚 View Legal Sources (5)]  ← Shows count│
│                                              │
│    ┌────────────────────────────────────┐   │
│    │ 📜 Legal Summary                    │   │
│    │ ────────────────────────────────── │   │
│    │ Under Illinois Compiled Statutes   │   │
│    │ 765 ILCS 735/1, landlords must     │   │
│    │ maintain properties in habitable   │   │
│    │ condition including...             │   │
│    └────────────────────────────────────┘   │
│                                              │
│    Authoritative Sources (5)                 │
│    ┌────────────────────────────────────┐   │
│    │ 🔗 Illinois Compiled Statutes      │   │
│    │    765 ILCS 735/1 - Habitability   │   │
│    │    www.ilga.gov                    │   │
│    └────────────────────────────────────┘   │
│    ┌────────────────────────────────────┐   │
│    │ 🔗 IL Legal Aid - Tenant Rights    │   │
│    │    Guide to habitability standards │   │
│    │    www.illinoislegalaid.org        │   │
│    └────────────────────────────────────┘   │
│    ... (3 more sources)                     │
│                                              │
│    💡 Note: Always consult with a licensed  │
│    attorney for legal advice.               │
└──────────────────────────────────────────────┘
```

---

## 🔌 Integration with Existing Code

### **Option 1: Add to LeaseWiseApp.tsx (Recommended)**

Add the `LegalSourcesDisplay` component to each tenant right:

```typescript
import LegalSourcesDisplay from '@/components/LegalSourcesDisplay';

// In the rights section
{analysisResult.rights.map((right, i) => (
  <div key={i} className="...">
    <CheckCircle className="..." />
    <div>
      <p className="font-semibold">{right.right}</p>
      {right.law && <p className="text-sm text-slate-500">{right.law}</p>}
      
      {/* ADD THIS: */}
      <LegalSourcesDisplay
        rightText={right.right}
        userAddress={address}
        description={right.law}
      />
    </div>
  </div>
))}
```

### **Option 2: Batch Search on Load (Alternative)**

Search for all rights when analysis completes:

```typescript
useEffect(() => {
  if (analysisResult && analysisResult.rights) {
    // Batch search for all rights
    fetch('/api/search-legal-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAddress: address,
        tenantRights: analysisResult.rights.map(r => ({
          right: r.right,
          description: r.law,
        })),
      }),
    }).then(res => res.json())
      .then(data => {
        // Store results in state
        setLegalSources(data.results);
      });
  }
}, [analysisResult]);
```

---

## 💰 Cost Considerations

### **Pricing:**
- **Web search tool**: ~$0.01 per search
- **Model usage**: Standard GPT-4o pricing (~$0.005 per 1K tokens)
- **Total per right**: ~$0.015 - $0.02

### **Optimization Strategies:**

**1. On-Demand Loading (Recommended)**
- Only search when user clicks "Find Legal Sources"
- Cost: ~$0.02 per right clicked
- **Most tenants will click 1-3 rights** = $0.02 - $0.06 per user

**2. Batch Search (Alternative)**
- Search all rights on load
- Cost: ~$0.15 - $0.20 per analysis (for 8-10 rights)
- **Higher cost but better UX**

**3. Caching (Future Enhancement)**
- Cache common rights by state
- E.g., "Right to habitability in Illinois"
- Reuse for all Illinois leases
- **Reduces cost to near-zero for cached rights**

### **Recommendation:**
Start with **Option 1 (On-Demand)** to minimize costs while testing. Add caching later.

---

## 🧪 Testing

### **Step 1: Test API Directly**

```bash
curl -X POST http://localhost:3000/api/search-legal-sources \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "123 Main St, Chicago, IL 60615",
    "singleRight": {
      "right": "Right to habitability",
      "description": "Landlords must maintain livable conditions"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "sources": [
      {
        "url": "https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=2201",
        "title": "Illinois Compiled Statutes - 765 ILCS 735/1",
        "snippet": "..."
      },
      ...
    ],
    "summary": "Under Illinois law (765 ILCS 735/1), landlords must..."
  }
}
```

### **Step 2: Test in UI**

1. Upload and analyze a lease
2. Go to "Your Rights" section
3. Click "Find Legal Sources" on any right
4. Should see:
   - Loading spinner
   - Legal summary appears
   - List of authoritative sources with links
   - Each source is clickable

### **Step 3: Verify Domain Filtering**

Check that all returned URLs are from authoritative domains:
- ✅ `.gov` sites
- ✅ `nolo.com`, `findlaw.com`, etc.
- ❌ Random blogs or unreliable sites

---

## 🎯 Key Features

### **1. Location-Aware** 🌍
- Extracts state/city from user address
- Returns laws specific to that location
- Works for all 50 US states

### **2. Authoritative Sources Only** 🏛️
- Restricted to trusted legal domains
- Government websites (.gov)
- Established legal databases
- Legal aid organizations

### **3. Real Citations** 📚
- Actual statute numbers (e.g., "765 ILCS 735/1")
- Official government URLs
- Legal code sections
- Bar association resources

### **4. Plain English Summary** 💬
- AI summarizes the legal sources
- Explains what the law means for tenants
- Includes important exceptions
- Easy to understand

### **5. Verifiable** ✅
- Every source has a clickable URL
- Users can verify on official websites
- Builds trust and credibility
- Shows you're not making things up

---

## 🚀 Deployment Checklist

### Before Going Live:

- [ ] **OpenAI API Key**: Ensure `OPENAI_API_KEY` is set in production
- [ ] **Rate Limits**: Monitor OpenAI rate limits (standard tier limits apply)
- [ ] **Cost Monitoring**: Set up alerts for API usage
- [ ] **Error Handling**: Test what happens when web search fails
- [ ] **Domain List**: Review and update legal domains list if needed
- [ ] **UI Testing**: Test on mobile and desktop
- [ ] **Legal Disclaimer**: Add disclaimer that this is legal information, not advice

---

## 📊 Success Metrics

### **Quality Metrics:**
- % of searches that return >= 3 sources
- % of sources from .gov domains
- User feedback on source relevance

### **Usage Metrics:**
- How many users click "Find Legal Sources"
- Which rights are searched most
- Average sources per search

### **Cost Metrics:**
- Average cost per user
- Total monthly web search costs
- ROI: Does this increase conversions?

---

## 🎯 Future Enhancements

### **1. Caching Layer**
```typescript
// Cache common right + state combinations
const cacheKey = `${state}_${rightSlug}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

// Otherwise search and cache
const result = await searchLegalSources(...);
await redis.set(cacheKey, result, { ex: 86400 }); // 24 hour cache
```

### **2. Deep Research Mode**
For complex issues, use `o3-deep-research` model:
```typescript
model: 'o3-deep-research',
// Searches hundreds of sources, runs for several minutes
// Best for very complex legal questions
```

### **3. Statute Database**
Build a database of known statutes by state:
```typescript
const knownStatutes = {
  'IL': {
    'habitability': '765 ILCS 735/1',
    'security_deposit': '765 ILCS 715/1',
    ...
  },
  ...
};
```

### **4. AI Legal Assistant**
Allow users to ask follow-up questions:
```typescript
"What does this mean if my landlord refuses to fix the heat?"
→ Search for enforcement mechanisms and tenant remedies
```

---

## ⚠️ Important Notes

### **Legal Disclaimer:**
This provides **legal information**, not **legal advice**. Always include:

```
"This information is for educational purposes only and does not 
constitute legal advice. Laws vary by jurisdiction and change over 
time. Consult with a licensed attorney for advice specific to your 
situation."
```

### **Accuracy:**
- Web search returns **current** information (unlike static databases)
- OpenAI cites sources, reducing hallucinations
- Users can verify by clicking source URLs
- Still recommend consulting an attorney

### **Privacy:**
- User addresses are used for location-based search
- Not stored permanently by OpenAI
- Complies with OpenAI's data usage policies

---

## 📝 Summary

### **What It Does:**
✅ Searches authoritative legal websites for tenant rights  
✅ Returns real statutes, codes, and regulations  
✅ Provides clickable URLs to verify sources  
✅ Generates plain English summaries  
✅ Location-aware (state/city specific)  

### **What It Costs:**
💰 ~$0.02 per right searched  
💰 ~$0.02 - $0.06 per user (on-demand)  
💰 ~$0.15 - $0.20 per user (batch search)  

### **What It Improves:**
📈 Credibility (real sources, not AI hallucinations)  
📈 Trust (users can verify)  
📈 Legal accuracy (current laws)  
📈 User education (learn actual rights)  
📈 Transparency (show your sources)  

---

**Status:** ✅ **READY TO INTEGRATE**  
**Next Step:** Add `LegalSourcesDisplay` component to tenant rights section  
**Test:** Upload a lease and click "Find Legal Sources"  
**Deploy:** Monitor costs and adjust as needed  

This will significantly enhance your app's credibility and usefulness! 🚀

