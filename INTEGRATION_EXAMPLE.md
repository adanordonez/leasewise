# 🔧 Integration Example - Enhanced Legal Sources

## Quick Start

Here's how to integrate the new Jina AI-powered legal source extraction into your app.

## 📍 Where to Add It

### **Option 1: Replace Existing Source Citation**

In `LeaseWiseApp.tsx`, find the "Your Rights" section and add the enhanced legal sources component:

```tsx
// Add import at the top
import EnhancedLegalSources from '@/components/EnhancedLegalSources';

// In your "Your Rights" section, after displaying each right:
<div className="space-y-4">
  {analysisResult.rights.map((right, idx) => (
    <div key={idx} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      {/* Existing right display */}
      <div className="flex items-start gap-3">
        <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-2">{right.right}</h3>
          <p className="text-sm text-slate-600">{right.law}</p>
          
          {/* ADD THIS: Enhanced Legal Sources */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <EnhancedLegalSources
              rightText={right.right}
              userAddress={address}
              description={right.right}
            />
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
```

### **Option 2: Add as Expandable Section**

For a cleaner UI, add it as a collapsible section:

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import EnhancedLegalSources from '@/components/EnhancedLegalSources';

// Inside your component
const [expandedRightIndex, setExpandedRightIndex] = useState<number | null>(null);

// In your rights mapping:
{analysisResult.rights.map((right, idx) => (
  <div key={idx} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
    <div className="flex items-start gap-3">
      <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
      <div className="flex-1">
        <h3 className="font-semibold text-slate-900 mb-2">{right.right}</h3>
        <p className="text-sm text-slate-600">{right.law}</p>
        
        {/* Toggle button */}
        <button
          onClick={() => setExpandedRightIndex(expandedRightIndex === idx ? null : idx)}
          className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
        >
          {expandedRightIndex === idx ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Legal Sources
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Find Legal Sources
            </>
          )}
        </button>
        
        {/* Expandable legal sources */}
        {expandedRightIndex === idx && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <EnhancedLegalSources
              rightText={right.right}
              userAddress={address}
              description={right.right}
            />
          </div>
        )}
      </div>
    </div>
  </div>
))}
```

### **Option 3: Dedicated "Legal Research" Section**

Add a new section at the bottom of the analysis:

```tsx
{/* After all other sections */}
<div className="bg-white rounded-xl shadow-lg p-8">
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
      <FileText className="w-7 h-7 text-purple-600" />
      Legal Research
    </h2>
    <p className="text-slate-600 mt-2">
      Search for specific legal text and statutes related to your rights
    </p>
  </div>
  
  <div className="space-y-6">
    {analysisResult.rights.slice(0, 3).map((right, idx) => (
      <div key={idx} className="border-b border-slate-200 pb-6 last:border-b-0">
        <h3 className="font-semibold text-slate-900 mb-4">{right.right}</h3>
        <EnhancedLegalSources
          rightText={right.right}
          userAddress={address}
          description={right.right}
        />
      </div>
    ))}
  </div>
</div>
```

## 🎨 Styling Tips

### **Match Your App's Color Scheme**

The component uses `purple-600` by default. To customize:

```tsx
// In EnhancedLegalSources.tsx, replace:
bg-purple-600 → bg-[#6039B3]
text-purple-600 → text-[#6039B3]
hover:bg-purple-700 → hover:bg-[#5030A0]
```

### **Adjust Loading Messages**

In `jina-legal-extractor.ts`, customize console logs and messages:

```typescript
console.log(`🔍 Searching for "${tenantRight}" laws in ${state}...`);
// Change to:
console.log(`🔍 Finding exact legal text for "${tenantRight}"...`);
```

## 🧪 Test It

### **1. Test with a Common Right**

```tsx
<EnhancedLegalSources
  rightText="Right to a habitable dwelling"
  userAddress="123 Main St, Chicago, IL 60601"
  description="Right to habitable dwelling"
/>
```

**Expected**: Should find Illinois statutes about habitability

### **2. Test with Obscure Right**

```tsx
<EnhancedLegalSources
  rightText="Right to paint walls purple"
  userAddress="123 Main St, Chicago, IL 60601"
  description="Right to paint walls purple"
/>
```

**Expected**: Should show "couldn't find exact legal text" message

### **3. Test Different States**

```tsx
<EnhancedLegalSources
  rightText="Security deposit return timeline"
  userAddress="123 Main St, Los Angeles, CA 90001"
  description="Security deposit timeline"
/>
```

**Expected**: Should find California-specific deposit laws

## 📊 Monitor Performance

### **Check Console Logs**

Open browser DevTools → Console and look for:
- ✅ "Found X relevant sources"
- 📊 Vetting scores (should be 60%+)
- ⏱️ Timing (should be 5-10 seconds total)

### **Check Network Tab**

1. Open DevTools → Network
2. Click "Find Legal Sources"
3. Look for:
   - `enhanced-legal-sources` API call (30-60s)
   - `r.jina.ai` requests (3-5s each)

## 🔧 Troubleshooting

### **Issue**: "Failed to fetch legal sources"
**Solution**: Check that OpenAI API key is set in `.env.local`

### **Issue**: Sources not relevant
**Solution**: Increase vetting threshold in `jina-legal-extractor.ts`:
```typescript
return {
  isRelevant: result.isRelevant && result.score >= 70, // Changed from 60
  ...
};
```

### **Issue**: Too slow
**Solution**: Reduce number of sources checked in `enhanced-legal-sources/route.ts`:
```typescript
const vettedResults = await fetchAndVetMultipleSources(
  potentialSources,
  description,
  state,
  city,
  3 // Changed from 5
);
```

## 💡 Pro Tips

1. **Cache Results**: Store results in state to avoid re-fetching
2. **Lazy Load**: Only fetch when user clicks "Find Legal Sources"
3. **Limit Calls**: Add rate limiting to prevent abuse
4. **Show Stats**: Display "Searched X sources, found Y" for transparency

## 🚀 Go Live

1. ✅ Integrate the component into your UI
2. ✅ Test with real lease data
3. ✅ Deploy to Vercel
4. ✅ Monitor API costs in OpenAI dashboard
5. ✅ Collect user feedback

---

**That's it!** You now have a powerful legal source extraction system that vets content before showing it to users. 🎉

