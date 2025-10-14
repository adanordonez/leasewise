# 🚀 Quick Start: New Features

## ✨ What's New

### 1. **Smarter PDF Highlighting** 🎯
- Now shows only **1-2 focused highlights** (not 10-15)
- Only highlights text with **2+ matching keywords**
- Much cleaner and more precise

### 2. **Plain English Translation** 💬
- Click "Explain in Plain English" button in source citations
- Translates complex legal jargon into simple language
- Perfect for tenants who aren't lawyers!

---

## 🎮 How to Use

### Step 1: Start the App
```bash
cd /Users/adanordonez/Desktop/leasewise/leasewise-app
npm run dev
```

### Step 2: Upload a Lease
1. Go to `http://localhost:3000`
2. Enter your name and email
3. Enter your address
4. Upload your lease PDF
5. Click "Analyze your lease now"

### Step 3: View Sources with Translation

#### When you see analysis results:

**Red Flags, Rights, or Key Dates** will show a 📄 icon

**Click the 📄 icon** → Source citation modal opens

**You'll see:**
```
┌─────────────────────────────────────────┐
│  Red Flag Source               Page 3   │
├─────────────────────────────────────────┤
│                                         │
│  📄 Excerpt from your lease:            │
│  ┌───────────────────────────────────┐ │
│  │ "Non-compliance fees must be     │ │
│  │  paid within 5 days of written   │ │
│  │  notice. Payment of non-         │ │
│  │  compliance fees does not waive  │ │
│  │  Owner's rights to pursue        │ │
│  │  eviction or other remedies."    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [💬 Explain in Plain English]          │  ← Click this!
│  [📄 View in Original PDF]              │
│                                         │
└─────────────────────────────────────────┘
```

**After clicking "Explain in Plain English":**
```
┌─────────────────────────────────────────┐
│  Red Flag Source               Page 3   │
├─────────────────────────────────────────┤
│                                         │
│  📄 Excerpt from your lease:            │
│  ┌───────────────────────────────────┐ │
│  │ "Non-compliance fees must be...  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  💬 Plain English Translation:          │  ← NEW!
│  ┌───────────────────────────────────┐ │
│  │ If you break a lease rule,       │ │
│  │ you'll get a notice to pay a fee │ │
│  │ within 5 days. Even if you pay   │ │
│  │ the fee, the landlord can still  │ │
│  │ evict you or take other legal    │ │
│  │ action.                           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [💬 Hide Translation]                  │  ← Toggle off
│  [📄 View in Original PDF]              │
│                                         │
└─────────────────────────────────────────┘
```

### Step 4: View Highlighted PDF

**Click "View in Original PDF"** → PDF viewer opens

**You'll see:**
- PDF at the correct page number
- **1-2 yellow highlights** on the most relevant text
- Page navigation controls
- Zoom in/out buttons

**Before (Too much highlighting):**
```
┌─────────────────────────────┐
│ Page 3                      │
├─────────────────────────────┤
│ [██████] Tenant Name        │  ← Highlighted
│ [██████] Phone: 555-1234    │  ← Highlighted
│ [██████] Email: x@y.com     │  ← Highlighted
│ [██████] Lease Start: ...   │  ← Highlighted
│ [██████] Non-compliance fee │  ← Highlighted (the one we want!)
│ [██████] Payment terms...   │  ← Highlighted
│ [██████] Security deposit   │  ← Highlighted
│ ... 10 more highlights ...
└─────────────────────────────┘
```

**After (Precise highlighting):**
```
┌─────────────────────────────┐
│ Page 3                      │
├─────────────────────────────┤
│ Tenant Name                 │
│ Phone: 555-1234             │
│ Email: x@y.com              │
│ Lease Start: ...            │
│ [██████] Non-compliance fee │  ← Only relevant text!
│ [██████] must be paid...    │  ← And context
│ Payment terms...            │
│ Security deposit            │
└─────────────────────────────┘
```

---

## 📋 Testing Checklist

### ✅ Highlighting Test:
- [ ] Upload your lease
- [ ] Click source citation (📄 icon)
- [ ] Click "View in Original PDF"
- [ ] **Verify**: Only 1-2 yellow boxes appear
- [ ] **Verify**: Highlights are on relevant text
- [ ] **Pass**: Not highlighting entire page

### ✅ Translation Test:
- [ ] Click source citation (📄 icon)
- [ ] See legal text in gray box
- [ ] Click "Explain in Plain English" button
- [ ] **Verify**: Button shows "Translating..."
- [ ] **Verify**: Green box appears with plain English
- [ ] **Verify**: Text is easy to understand
- [ ] **Verify**: Uses "you" language
- [ ] **Verify**: No legal jargon
- [ ] Click button again
- [ ] **Verify**: Translation hides

### ✅ Overall Quality:
- [ ] All sources are relevant (not generic text)
- [ ] Page numbers are correct
- [ ] Translations make sense
- [ ] UI is responsive and smooth

---

## 🐛 Troubleshooting

### "Translation failed"
- **Check**: Is OpenAI API key set in `.env.local`?
- **Fix**: Add `OPENAI_API_KEY=sk-...` to `.env.local`
- **Restart**: Server with `npm run dev`

### Too many highlights still showing
- **Clear cache**: Refresh browser (Cmd+Shift+R)
- **Check**: Score threshold is set to 2 in `PDFViewer.tsx`
- **Adjust**: Can increase to 3 for even fewer highlights

### Translation too long/complex
- **Check**: `max_tokens: 200` in API route
- **Adjust**: Temperature (currently 0.3) for consistency
- **Note**: Should be 2-4 sentences by design

---

## 🎨 UI Reference

### Source Citation Button:
```tsx
<button className="...">
  <FileText className="w-4 h-4 text-slate-500" />
  {pageNumber && (
    <span className="...">Page {pageNumber}</span>
  )}
</button>
```

### Plain English Button (New):
```tsx
<button className="... bg-green-600 hover:bg-green-700">
  <MessageCircle className="w-4 h-4" />
  {isTranslating 
    ? 'Translating...' 
    : plainEnglish 
      ? 'Hide Translation' 
      : 'Explain in Plain English'}
</button>
```

### Translation Box (New):
```tsx
<div className="bg-green-50 border border-green-200">
  <MessageCircle className="text-green-600" />
  Plain English Translation:
  <p>{plainEnglish}</p>
</div>
```

---

## 🎯 Expected User Flow

```
User uploads lease
     ↓
Analysis completes
     ↓
User sees "Red Flag: Non-compliance fee"
     ↓
User clicks 📄 icon (curious about source)
     ↓
Modal opens with legal text
     ↓
User reads legal text (confused)
     ↓
User clicks "Explain in Plain English"
     ↓
AI translates in 1-2 seconds
     ↓
User sees simple explanation in green box
     ↓
User understands! ✨
     ↓
User clicks "View in Original PDF" (wants to verify)
     ↓
PDF opens to correct page
     ↓
User sees 1-2 yellow highlights on exact text
     ↓
User verifies source is accurate
     ↓
User trusts the analysis ✅
```

---

## 📊 Key Metrics

### Highlighting Precision:
- **Goal**: 1-2 highlights per source
- **Method**: Require 2+ keyword matches
- **Fallback**: Single best match if none qualify

### Translation Quality:
- **Goal**: Simple, clear, tenant-friendly
- **Length**: 2-4 sentences max
- **Tone**: "You" language, no jargon
- **Speed**: 1-2 seconds

### User Experience:
- **Transparency**: See exact source text
- **Understanding**: Get plain English explanation
- **Verification**: View highlighted PDF
- **Trust**: Verify AI accuracy yourself

---

**Status**: ✅ Ready to test!  
**Features**: Highlighting + Translation  
**Next**: Upload your lease and try it! 🚀

