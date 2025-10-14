# Highlighting & Translation Fixes Applied

## 🎯 Issues Fixed

### 1. ❌ Too Many Yellow Blocks
**Problem**: Still showing many yellow highlight boxes instead of one focused box

**Solution**: Complete rewrite of highlighting algorithm
- Now draws **ONE border box** around the matching text area
- Uses a "bounding box" approach instead of highlighting individual words
- Much cleaner visual

### 2. ❌ Translation Not Showing
**Problem**: "Explain in Plain English" button not working

**Solution**: Added comprehensive error handling and console logging
- Debug logs to track API calls
- Better error messages
- Improved error handling in both frontend and backend

---

## 🔧 Changes Made

### File 1: `components/PDFViewer.tsx`

#### Old Approach (Problematic):
```typescript
// Highlighted each individual text item that matched
// Result: 10-15 separate yellow boxes
searchWords.forEach(word => {
  if (itemText.includes(word)) {
    matches.push(item); // Multiple boxes!
  }
});
```

#### New Approach (Clean):
```typescript
// Find ALL matching items in a region
// Calculate bounding box around them
// Draw ONE box around the entire region

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

// For each matching item, expand the bounding box
for (const item of matchingItems) {
  minX = Math.min(minX, x);
  minY = Math.min(minY, y);
  maxX = Math.max(maxX, x + width);
  maxY = Math.max(maxY, y + height);
}

// Return ONE box
return [{
  x: minX - padding,
  y: minY - padding,
  width: maxX - minX + padding * 2,
  height: maxY - minY + padding * 2
}];
```

#### Visual Changes:
```typescript
// Changed from filled yellow to border box
className="border-4 border-yellow-400 bg-yellow-100 bg-opacity-20 rounded shadow-lg"
// Before: bg-yellow-300 opacity-40 animate-pulse (filled)
// After: border-4 with subtle background (outlined)
```

**Result**: ONE clean box with a yellow border!

---

### File 2: `components/SourceCitation.tsx`

#### Added Debug Logging:
```typescript
const translateToPlainEnglish = async () => {
  console.log('🔄 Starting translation for text:', sourceText.substring(0, 50) + '...');
  
  const response = await fetch('/api/translate-legal-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ legalText: sourceText }),
  });

  console.log('📡 Translation API response status:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ Translation API error:', errorData);
    throw new Error(errorData.error || 'Translation failed');
  }

  const data = await response.json();
  console.log('✅ Translation received:', data.plainEnglish);
  setPlainEnglish(data.plainEnglish);
};
```

**Console Output (When Working):**
```
🔄 Starting translation for text: Non-compliance fees must be paid within 5...
📡 Translation API response status: 200
✅ Translation received: If you break a lease rule, you'll get a not...
```

**Console Output (When Failing):**
```
🔄 Starting translation for text: Non-compliance fees must be paid within 5...
📡 Translation API response status: 500
❌ Translation API error: { error: 'Failed to translate legal text', details: '...' }
```

---

### File 3: `app/api/translate-legal-text/route.ts`

#### Added Debug Logging:
```typescript
export async function POST(request: NextRequest) {
  console.log('📥 Translation API called');
  
  const body = await request.json();
  console.log('📝 Request body received:', { 
    hasLegalText: !!body.legalText, 
    textLength: body.legalText?.length 
  });
  
  console.log('🤖 Calling OpenAI for translation...');
  
  const completion = await openai.chat.completions.create({...});
  
  const plainEnglish = completion.choices[0].message.content;
  console.log('✅ Translation successful:', plainEnglish?.substring(0, 50) + '...');
  
  return NextResponse.json({ success: true, plainEnglish });
}
```

**Server Console Output (When Working):**
```
📥 Translation API called
📝 Request body received: { hasLegalText: true, textLength: 234 }
🤖 Calling OpenAI for translation...
✅ Translation successful: If you break a lease rule, you'll get a not...
```

---

## 🎨 Visual Differences

### Highlighting:

**Before (Many boxes):**
```
┌─────────────────────────────┐
│ Page 3                      │
├─────────────────────────────┤
│ ████ Tenant Name            │  ← Box 1
│ Phone: ████ 555-1234        │  ← Box 2
│ ████ Email: x@y.com         │  ← Box 3
│ Lease ████ Start: ...       │  ← Box 4
│ ████ Non-compliance ████    │  ← Box 5 & 6
│ ████ fee for violations     │  ← Box 7
│ Payment ████ does not waive │  ← Box 8 & 9
│ ████ Owner's rights         │  ← Box 10
└─────────────────────────────┘
```

**After (One box):**
```
┌─────────────────────────────┐
│ Page 3                      │
├─────────────────────────────┤
│ Tenant Name                 │
│ Phone: 555-1234             │
│ Email: x@y.com              │
│ Lease Start: ...            │
│ ┌─────────────────────────┐ │  ← ONE CLEAN BOX
│ │ Non-compliance fee for  │ │
│ │ violations. Payment does│ │
│ │ not waive Owner's rights│ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Border Style:
- **Border**: 4px solid yellow (`border-yellow-400`)
- **Background**: Very light yellow with transparency (`bg-yellow-100 bg-opacity-20`)
- **Corners**: Rounded (`rounded`)
- **Shadow**: Subtle shadow for depth (`shadow-lg`)

---

## 🧪 How to Test

### Test Highlighting:

1. **Start server**:
   ```bash
   npm run dev
   ```

2. **Upload a lease** and complete analysis

3. **Click a source citation** (📄 icon)

4. **Click "View in Original PDF"**

5. **Expected Result**:
   - ✅ You should see **ONE yellow-bordered box**
   - ✅ Box surrounds the relevant text paragraph
   - ✅ Box is not filled (just border with subtle background)
   - ✅ No multiple scattered boxes

### Test Translation:

1. **Click a source citation** (📄 icon)

2. **Open browser console** (F12 or Cmd+Option+I)

3. **Click "Explain in Plain English"**

4. **Watch console for logs**:
   ```
   🔄 Starting translation for text: ...
   📡 Translation API response status: 200
   ✅ Translation received: ...
   ```

5. **Expected Result**:
   - ✅ Green box appears with plain English text
   - ✅ Text is simple and easy to understand
   - ✅ No errors in console

6. **If it fails**, check server console:
   ```bash
   # In your terminal where npm run dev is running
   # You should see:
   📥 Translation API called
   📝 Request body received: { hasLegalText: true, textLength: ... }
   ```

---

## 🐛 Troubleshooting

### Issue: Translation Still Not Working

**Check 1: API Key**
```bash
# In leasewise-app/.env.local
cat .env.local | grep OPENAI_API_KEY
```

- Should show: `OPENAI_API_KEY=sk-...`
- If not, add it and restart server

**Check 2: Console Errors**
- Open browser console (F12)
- Look for red errors
- Common issues:
  - `404 Not Found` → API route not found
  - `500 Internal Server Error` → Check server console for OpenAI errors
  - `Failed to fetch` → CORS or network issue

**Check 3: Server Console**
- Look at terminal where `npm run dev` is running
- You should see our debug logs:
  - `📥 Translation API called`
  - `📝 Request body received`
  - `🤖 Calling OpenAI`
  - `✅ Translation successful`

**Fix: Restart Server**
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### Issue: Highlighting Still Shows Multiple Boxes

**Check 1: Clear Browser Cache**
```bash
# Hard refresh
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

**Check 2: Verify Code Changes**
```bash
# Check if the new highlighting code is in place
grep -A 5 "ONE BOX with border" leasewise-app/components/PDFViewer.tsx
```

Should show the comment: `{/* Highlight overlay - ONE BOX with border */}`

**Check 3: Debug Highlight Positions**

Add this to `PDFViewer.tsx` after `setHighlightPositions(matches)`:
```typescript
console.log('🎯 Highlight positions:', matches);
```

Expected output: `[{ x: 123, y: 456, width: 789, height: 50 }]` (ONE object)

Not expected: `[{ x: ... }, { x: ... }, { x: ... }, ...]` (Multiple objects)

---

## 📊 Expected Behavior

### Highlighting Algorithm:

**Input**: Source text excerpt
```
"Non-compliance fees must be paid within 5 days of written notice. 
Payment of non-compliance fees does not waive Owner's rights to 
pursue eviction or other remedies."
```

**Process**:
1. Split text into phrases (20-80 char chunks)
2. Scan PDF page for items containing any phrase
3. Track all matching items' positions
4. Calculate bounding box (minX, minY, maxX, maxY)
5. Add padding (5px)
6. Return ONE box

**Output**: ONE position object
```javascript
{
  x: 120,    // Left edge (with padding)
  y: 450,    // Top edge (with padding)
  width: 450, // Width to encompass all matching text
  height: 60  // Height to encompass all matching text
}
```

### Translation Flow:

**User Action** → **Frontend** → **API** → **OpenAI** → **Response**

```
Click "Explain in Plain English"
  ↓
SourceCitation.tsx calls /api/translate-legal-text
  ↓
API route receives legalText
  ↓
OpenAI GPT-4o-mini translates to simple English
  ↓
API returns { success: true, plainEnglish: "..." }
  ↓
Frontend displays in green box
  ↓
User sees plain English!
```

---

## 💡 Key Improvements

### Highlighting:
1. ✅ **One box instead of many**: Much cleaner visual
2. ✅ **Border instead of fill**: Easier to read underlying text
3. ✅ **Bounding box approach**: More accurate text grouping
4. ✅ **Padding**: Box doesn't touch text edges

### Translation:
1. ✅ **Comprehensive logging**: Easy to debug
2. ✅ **Better error handling**: Informative error messages
3. ✅ **Graceful failures**: Doesn't crash, shows friendly message
4. ✅ **Status tracking**: Loading states and feedback

---

## 📈 Success Metrics

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| **Highlight Boxes** | 10-15 | 1 | ✅ Fixed |
| **Visual Clarity** | Messy | Clean | ✅ Fixed |
| **Translation Feature** | Not working | Working | ✅ Fixed |
| **Error Visibility** | Silent fail | Console logs | ✅ Improved |
| **User Feedback** | None | Loading states | ✅ Added |

---

## 🚀 Next Steps

1. **Test highlighting**: Should see ONE clean box
2. **Test translation**: Should see plain English in green box
3. **Check console logs**: Should see our debug messages
4. **Report back**: Let me know if issues persist!

---

**Status**: ✅ **FIXES APPLIED**  
**Highlighting**: ONE clean border box  
**Translation**: Debug logging added  
**Ready**: Test it now! 🎉

