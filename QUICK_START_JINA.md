# 🚀 Quick Start - Jina AI Legal Source Extraction

## ✅ What's Done

Everything is implemented and ready to test! No npm packages needed - Jina AI is a simple HTTP API.

## 🧪 Test It Right Now

### **1. Start Your Dev Server**

```bash
cd /Users/adanordonez/Desktop/leasewise/leasewise-app
npm run dev
```

### **2. Open Test Page**

Navigate to: **http://localhost:3000/test-jina**

You'll see 4 test cases:
- ✅ **Test 1**: Illinois security deposits (should find statute)
- ✅ **Test 2**: California security deposits (should find statute)
- ⚠️ **Test 3**: Purple walls (should show "not found")
- ✅ **Test 4**: Habitability rights (should find statute)

### **3. Click "Find Legal Sources"**

Watch for:
- Loading indicator (5-15 seconds)
- Statute text in gray boxes
- Plain English explanation in blue boxes
- Links to original pages

### **4. Open Browser Console**

Press `F12` or `Cmd+Option+I` and look for:
```
🚀 Processing legal source: [URL]
📄 Fetching content from: [URL]
✅ Fetched 12543 characters
🔍 Vetting content for: [description] in [state]
📊 Vetting result: ✅ RELEVANT (score: 85/100)
📝 Reason: Contains specific statute text...
✅ Extracted 245 characters of statute text
✅ Found 2 relevant sources out of 5
```

## 🔑 Environment Setup (Optional)

Jina AI works **without an API key** for basic use. To get the free tier:

### **Get Jina API Key** (Optional)

1. Go to https://jina.ai/
2. Sign up (free)
3. Get API key
4. Add to `.env.local`:

```bash
# .env.local
JINA_API_KEY=your_jina_api_key_here
```

5. Restart dev server

## 📝 Integrate Into Your App

### **Option 1: Add to Rights Section**

In `components/LeaseWiseApp.tsx`, find the "Your Rights" section:

```tsx
import EnhancedLegalSources from '@/components/EnhancedLegalSources';

// In your rights mapping:
{analysisResult.rights.map((right, idx) => (
  <div key={idx}>
    <h3>{right.right}</h3>
    <p>{right.law}</p>
    
    {/* Add this */}
    <div className="mt-4 pt-4 border-t border-slate-200">
      <EnhancedLegalSources
        rightText={right.right}
        userAddress={address}
        description={right.right}
      />
    </div>
  </div>
))}
```

### **Option 2: Make it Collapsible**

```tsx
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const [showSources, setShowSources] = useState<number | null>(null);

// Then:
<button onClick={() => setShowSources(showSources === idx ? null : idx)}>
  <ChevronDown /> Find Legal Sources
</button>

{showSources === idx && (
  <EnhancedLegalSources {...props} />
)}
```

## 🎯 What to Expect

### **Good Sources (Pass Vetting)** ✅
- Shows statute text in gray box
- Shows plain English in blue box
- Shows external link to original page
- Message: "Found X relevant legal sources"

### **No Good Sources (Fail Vetting)** ⚠️
- Shows amber warning box
- Message: "We searched X sources but couldn't find specific legal text"
- Explains why and suggests consulting attorney
- Shows stats: "Searched: 5 • Not relevant: 5"

## 📊 Performance

- **Search + Fetch**: 5-10 seconds
- **Sources Checked**: 5 (configurable)
- **Vetting Threshold**: 60% (configurable)

## 💰 Cost

- **Free Tier**: ~$0.015 per search (OpenAI only)
- **Paid Tier**: ~$0.025 per search (OpenAI + Jina)
- **Monthly** (1000 searches): $15-25

## 🔧 Customize

### **Change Vetting Threshold**

In `lib/jina-legal-extractor.ts` line 90:

```typescript
isRelevant: result.isRelevant && result.score >= 60, // Change to 70 for stricter
```

### **Change Number of Sources**

In `app/api/enhanced-legal-sources/route.ts` line 47:

```typescript
5 // Change to 3 for faster, or 10 for more thorough
```

### **Change Colors**

In `components/EnhancedLegalSources.tsx`:

```tsx
bg-purple-600 → bg-[#6039B3]
text-purple-600 → text-[#6039B3]
```

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| "Failed to fetch" | Check OpenAI API key in `.env.local` |
| Sources not relevant | Increase threshold to 70% |
| Too slow | Reduce sources to 3 |
| No console logs | Open DevTools Console tab |

## 📚 Documentation

- **Full Guide**: `JINA_AI_LEGAL_EXTRACTION.md`
- **Integration Examples**: `INTEGRATION_EXAMPLE.md`
- **Summary**: `JINA_IMPLEMENTATION_SUMMARY.md`

## ✨ That's It!

You're ready to go. Just:

1. ✅ Test at http://localhost:3000/test-jina
2. ✅ Watch console logs
3. ✅ Integrate into your app
4. ✅ Deploy

The system will automatically vet sources and only show relevant legal text! 🎉

---

**Questions?** Check the console logs for detailed vetting information.

