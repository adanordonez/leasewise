# 🚀 Quick Test Guide

## What We Fixed

### 1. 🎯 **PDF Highlighting** → ONE clean box (not 10+ boxes)
### 2. 💬 **Translation** → Added debug logs to find the issue

---

## ⚡ Quick Test

### Start the Server:
```bash
cd /Users/adanordonez/Desktop/leasewise/leasewise-app
npm run dev
```

### Test Highlighting (30 seconds):

1. **Upload your lease** → Analyze
2. **Click 📄 icon** next to any red flag
3. **Click "View in Original PDF"**
4. **Look for**: ONE yellow-bordered box (not many yellow fills)

**Expected**:
```
┌──────────────────────────┐
│ PDF Page                 │
│                          │
│ Some other text...       │
│ ┏━━━━━━━━━━━━━━━━━━━━┓  │ ← ONE BOX!
│ ┃ Relevant text here  ┃  │
│ ┃ that matches source ┃  │
│ ┗━━━━━━━━━━━━━━━━━━━━┛  │
│ More text below...       │
│                          │
└──────────────────────────┘
```

---

### Test Translation (30 seconds):

1. **Click 📄 icon** next to any red flag
2. **Open browser console** (Press F12 or Cmd+Option+I)
3. **Click "Explain in Plain English"** button
4. **Watch console** for these logs:

**Frontend (Browser Console):**
```
🔄 Starting translation for text: Non-compliance fees must be...
📡 Translation API response status: 200
✅ Translation received: If you break a lease rule, you'll...
```

**Backend (Terminal where npm run dev is running):**
```
📥 Translation API called
📝 Request body received: { hasLegalText: true, textLength: 234 }
🤖 Calling OpenAI for translation...
✅ Translation successful: If you break a lease rule...
```

5. **Look for green box** with plain English text

---

## 🐛 If Translation Fails

### Check These:

**1. OpenAI API Key**
```bash
# Check if it exists
cat leasewise-app/.env.local | grep OPENAI_API_KEY

# Should show:
# OPENAI_API_KEY=sk-...

# If not, add it:
echo "OPENAI_API_KEY=your-key-here" >> leasewise-app/.env.local

# Then restart server
```

**2. Console Errors**

Open browser console (F12) and look for:
- ❌ Red errors
- 🔴 `404` → API route not found
- 🔴 `500` → Server error (check terminal)
- 🔴 `Failed to fetch` → Network issue

**3. Server Logs**

Look at your terminal where `npm run dev` is running:
- Should see `📥 Translation API called`
- If you see errors, they'll show here

**4. Restart Server**
```bash
# Press Ctrl+C to stop
# Then start again:
npm run dev
```

---

## ✅ Success Checklist

### Highlighting:
- [ ] Only ONE box appears (not 10+)
- [ ] Box has yellow border (not filled yellow)
- [ ] Box surrounds the relevant text
- [ ] Box is not scattered all over the page

### Translation:
- [ ] Button says "Explain in Plain English"
- [ ] Clicking shows "Translating..."
- [ ] Green box appears after 1-2 seconds
- [ ] Text is simple and easy to read
- [ ] Console shows debug logs (🔄, 📡, ✅)

---

## 📸 What You Should See

### Source Citation Modal:
```
┌────────────────────────────────────────┐
│ Red Flag Source              Page 3    │
├────────────────────────────────────────┤
│ 📄 Excerpt from your lease:            │
│ ┌────────────────────────────────────┐ │
│ │ "Non-compliance fees must be paid │ │
│ │  within 5 days..."                │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [💬 Explain in Plain English]  ← CLICK │
│ [📄 View in Original PDF]              │
└────────────────────────────────────────┘
```

### After Clicking Translation:
```
┌────────────────────────────────────────┐
│ Red Flag Source              Page 3    │
├────────────────────────────────────────┤
│ 📄 Excerpt from your lease:            │
│ ┌────────────────────────────────────┐ │
│ │ "Non-compliance fees must be paid │ │
│ │  within 5 days..."                │ │
│ └────────────────────────────────────┘ │
│                                        │
│ 💬 Plain English Translation:  ← NEW!  │
│ ┌────────────────────────────────────┐ │
│ │ If you break a lease rule, you'll │ │
│ │ get a notice to pay a fee within  │ │
│ │ 5 days. Even if you pay the fee,  │ │
│ │ the landlord can still evict you. │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [💬 Hide Translation]                  │
│ [📄 View in Original PDF]              │
└────────────────────────────────────────┘
```

### PDF Viewer:
```
┌──────────────────────────────────────┐
│ Lease Document            Page 3     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ [<] Page 3 of 12 [>]  [-] 100% [+]  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                      │
│ Contract Terms and Conditions        │
│                                      │
│ The Tenant agrees to...              │
│                                      │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ Non-compliance fees must be   ┃  │ ← ONE BOX!
│ ┃ paid within 5 days of written ┃  │
│ ┃ notice. Payment does not      ┃  │
│ ┃ waive Owner's rights to       ┃  │
│ ┃ pursue eviction or remedies.  ┃  │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                      │
│ Additional terms below...            │
│                                      │
└──────────────────────────────────────┘
```

---

## 🎯 Key Changes

### Highlighting:
- **Algorithm**: Calculates ONE bounding box around all matching text
- **Style**: Border (not filled) with `border-4 border-yellow-400`
- **Background**: Very subtle `bg-yellow-100 bg-opacity-20`
- **Result**: ONE clean box

### Translation:
- **Logging**: Console logs at every step
- **Frontend**: `SourceCitation.tsx` logs API calls
- **Backend**: `route.ts` logs request/response
- **Error Handling**: Better error messages

---

## 🔍 Debug Commands

### Check if API route exists:
```bash
ls -la leasewise-app/app/api/translate-legal-text/route.ts
# Should show the file
```

### Check for OpenAI key:
```bash
grep OPENAI_API_KEY leasewise-app/.env.local
# Should show: OPENAI_API_KEY=sk-...
```

### Test API directly (optional):
```bash
curl -X POST http://localhost:3000/api/translate-legal-text \
  -H "Content-Type: application/json" \
  -d '{"legalText":"Tenant shall remit payment within 5 days."}'

# Should return:
# {"success":true,"plainEnglish":"You need to pay within 5 days."}
```

---

**Ready to test!** 🚀

**Expected time**: 2 minutes total
- 30 seconds to test highlighting
- 30 seconds to test translation
- 1 minute for debugging if needed

Let me know what you see! 👀

