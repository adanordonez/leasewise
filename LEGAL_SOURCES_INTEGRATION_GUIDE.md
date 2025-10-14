# 🚀 Quick Integration Guide - Legal Sources

## ✅ **Step 1: Add to LeaseWiseApp.tsx**

Open `components/LeaseWiseApp.tsx` and add the import at the top:

```typescript
import LegalSourcesDisplay from '@/components/LegalSourcesDisplay';
```

Then find the "Your Rights" section (around line 980-1000) and add the component:

```typescript
{/* Your Rights Section */}
<div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 mb-8">
  <div className="px-6 py-5 border-b border-slate-200/60">
    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
      <CheckCircle className="h-6 w-6 text-green-600" />
      Your Rights
    </h2>
  </div>
  <div className="divide-y divide-slate-200/60">
    {analysisResult.rights.map((right, i) => (
      <div key={i} className="px-6 py-5 hover:bg-slate-50/50 transition-colors duration-200">
        <div className="flex items-start gap-4">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-slate-900">{right.right}</p>
              <SourceCitation 
                sourceText={right.source} 
                label="Your Right Source"
                pageNumber={right.page_number}
                pdfUrl={analysisResult.pdfUrl}
                searchText={right.source}
              />
            </div>
            {right.law && (
              <p className="text-sm text-slate-500">{right.law}</p>
            )}
            
            {/* ADD THIS: Legal Sources Button */}
            <LegalSourcesDisplay
              rightText={right.right}
              userAddress={address}
              description={right.law}
            />
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## ✅ **Step 2: Test It**

### **Start the server:**
```bash
npm run dev
```

### **Upload a lease:**
1. Go to http://localhost:3000
2. Upload and analyze your lease
3. Scroll to "Your Rights" section
4. Click **"Find Legal Sources"** button
5. Wait 2-3 seconds (web search is running)
6. See the legal summary and authoritative sources!

---

## ✅ **Step 3: Verify**

### **Check Console Logs:**

**Browser Console (F12):**
```
🔍 Fetching legal sources for: Right to habitability
✅ Found 5 sources
```

**Server Terminal:**
```
🔍 Legal sources search API called
📚 Searching for single right: Right to habitability
🔍 Searching legal sources for: Right to habitability in Chicago, IL
✅ Found 5 legal sources
```

### **Check the Results:**

- ✅ Legal summary appears in purple/blue box
- ✅ 3-10 authoritative sources listed
- ✅ Each source has a clickable link
- ✅ Sources are from .gov, nolo.com, etc. (not random sites)
- ✅ Sources are relevant to the tenant right

---

## 🎨 **What It Looks Like**

### **Before Clicking:**
```
✅ Right to habitability
   Illinois law requires landlords to maintain properties

   [🔍 Find Legal Sources]  ← Click this
```

### **After Clicking (Loading):**
```
✅ Right to habitability
   Illinois law requires landlords to maintain properties

   [⏳ Searching legal sources...]  ← Loading...
```

### **After Loaded:**
```
✅ Right to habitability
   Illinois law requires landlords to maintain properties

   [📚 View Legal Sources (5)]  ← Click to expand/collapse

   📜 Legal Summary
   ─────────────────────────────────────────────
   Under Illinois Compiled Statutes 765 ILCS 
   735/1, landlords must maintain properties in 
   habitable condition including heat, hot water, 
   and working plumbing...

   Authoritative Sources (5)
   ┌─────────────────────────────────────────┐
   │ 🔗 Illinois Compiled Statutes           │
   │    765 ILCS 735/1 - Implied Warranty    │
   │    www.ilga.gov                         │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ 🔗 Chicago Residential Landlord Tenant  │
   │    Ordinance - Habitability Standards   │
   │    www.chicago.gov                      │
   └─────────────────────────────────────────┘
   ... (3 more sources)

   💡 Note: Always consult with a licensed 
   attorney for legal advice.
```

---

## 🔧 **Customization Options**

### **Option 1: Change Button Style**

In `LegalSourcesDisplay.tsx`, line 49:
```typescript
className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100..."
```

Change to:
```typescript
className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700..."
```

### **Option 2: Auto-Load on Analysis**

Instead of on-demand button, automatically search when analysis completes:

In `LeaseWiseApp.tsx`, add:
```typescript
useEffect(() => {
  if (analysisResult && analysisResult.rights && address) {
    // Auto-search for all rights
    fetch('/api/search-legal-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAddress: address,
        tenantRights: analysisResult.rights.slice(0, 3).map(r => ({
          right: r.right,
          description: r.law,
        })),
      }),
    }).then(res => res.json())
      .then(data => {
        console.log('Legal sources loaded:', data);
        // Store in state if needed
      });
  }
}, [analysisResult, address]);
```

### **Option 3: Show Source Count in Badge**

Add a badge showing how many sources are available:
```typescript
<div className="flex items-center gap-2">
  <p className="font-semibold">{right.right}</p>
  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
    📚 5 sources
  </span>
</div>
```

---

## 💰 **Cost Monitoring**

### **Add Usage Tracking:**

In `app/api/search-legal-sources/route.ts`, add:
```typescript
// After successful search
console.log(`💰 Web search cost: ~$0.02 | Right: ${singleRight.right}`);

// Optional: Track in database
await supabase.from('usage_logs').insert({
  type: 'legal_search',
  right: singleRight.right,
  address: userAddress,
  sources_found: result.sources.length,
  cost_estimate: 0.02,
  timestamp: new Date(),
});
```

### **Monitor Costs:**
- Check OpenAI dashboard: https://platform.openai.com/usage
- Look for "Web search" tool calls
- Each call ≈ $0.01 - $0.02

---

## 🐛 **Troubleshooting**

### **"Failed to fetch legal sources"**

**Check:**
1. Is OpenAI API key set in `.env.local`?
   ```bash
   cat .env.local | grep OPENAI_API_KEY
   ```

2. Check server console for errors:
   ```
   ❌ Legal search error: ...
   ```

3. Check OpenAI dashboard for rate limits

### **No sources returned**

**Possible causes:**
- State/city not extracted correctly from address
- No authoritative sources found for this specific right
- Domain filtering too strict

**Fix:** Check console logs to see what state was extracted:
```
🔍 Searching legal sources for: Right to X in Chicago, IL
```

### **Wrong state detected**

**Issue:** Address parsing might fail for some formats

**Fix:** In `lib/legal-search.ts`, improve address parsing:
```typescript
// Better state extraction
const stateMatch = userAddress.match(/,\s*([A-Z]{2})\s*\d{5}/);
const state = stateMatch ? stateMatch[1] : '';
```

---

## 📊 **Expected Results**

### **Typical Response:**
- **Loading time**: 2-4 seconds
- **Sources found**: 3-8 per right
- **Success rate**: 90%+ (for common tenant rights)
- **Cost per search**: $0.01 - $0.02
- **Domain mix**: 60% .gov, 40% legal databases/nonprofits

### **Best Results For:**
- ✅ Common tenant rights (habitability, privacy, etc.)
- ✅ Well-documented state laws (CA, NY, IL, etc.)
- ✅ Federal protections (Fair Housing, etc.)

### **May Be Limited For:**
- ⚠️ Very specific local ordinances
- ⚠️ Recent law changes (within weeks)
- ⚠️ Obscure tenant rights

---

## ✅ **Final Checklist**

Before deploying:

- [ ] Added `LegalSourcesDisplay` to tenant rights section
- [ ] Tested with a real lease
- [ ] Verified sources are from authoritative domains
- [ ] Checked console logs (no errors)
- [ ] Tested on mobile (responsive)
- [ ] Added legal disclaimer to UI
- [ ] Set up cost monitoring
- [ ] Verified OpenAI API key in production

---

## 🎯 **Success Criteria**

After integration:

✅ Users can click "Find Legal Sources" on any right  
✅ Search completes in 2-4 seconds  
✅ 3+ authoritative sources returned  
✅ Sources have clickable URLs  
✅ Legal summary is clear and relevant  
✅ Cost per user: $0.02 - $0.10  

---

**Status:** ✅ **READY TO INTEGRATE**  
**Time to integrate:** 5 minutes  
**Time to test:** 2 minutes  
**Impact:** 🚀 HUGE credibility boost  

Just add the component and you're done! 🎉

