# Translation Debugging Steps

## Quick Test

### 1. Test the API Directly

Visit this URL in your browser:
```
http://localhost:3000/test-translation
```

**What you'll see:**
- A button that says "Test Translation API"
- Click it and see if it works
- Check browser console (F12) for logs

**Expected result:**
```json
{
  "success": true,
  "plainEnglish": "You need to pay your rent by the 1st of each month."
}
```

**If it fails:**
- Check the error message
- Look at browser console
- Look at server terminal

---

### 2. Check OpenAI API Key

```bash
cd /Users/adanordonez/Desktop/leasewise/leasewise-app
cat .env.local | grep OPENAI_API_KEY
```

**Should show:**
```
OPENAI_API_KEY=sk-proj-...
```

**If not found:**
```bash
echo "OPENAI_API_KEY=your-key-here" >> .env.local
```

Then restart server:
```bash
npm run dev
```

---

### 3. Test in Actual App

1. **Upload a lease** and analyze it
2. **Click the 📄 icon** next to any red flag
3. **Look for the green button** that says "Explain in Plain English"
4. **Click it**
5. **Open browser console** (F12) and look for:
   ```
   🔄 Starting translation for text: ...
   📡 Translation API response status: 200
   ✅ Translation received: ...
   ```

---

## Common Issues

### Issue 1: Button Not Showing

**Check:**
- Is the source citation modal open?
- Do you see the gray box with the legal text?
- Do you see the purple "View in Original PDF" button?

**If no:**
- The modal might not be rendering
- Check browser console for React errors

### Issue 2: Button Shows But Nothing Happens

**Check browser console for:**
- `🔄 Starting translation...` ← Should appear when you click
- Any red errors

**If you see 404:**
- API route not found
- Restart server: `npm run dev`

**If you see 500:**
- Server error
- Check terminal where `npm run dev` is running
- Likely OpenAI API key issue

### Issue 3: "Failed to fetch"

**Possible causes:**
- Server not running
- CORS issue
- Network problem

**Fix:**
```bash
# Restart server
npm run dev
```

---

## Manual API Test (Terminal)

### Test the API with curl:

```bash
curl -X POST http://localhost:3000/api/translate-legal-text \
  -H "Content-Type: application/json" \
  -d '{"legalText":"Tenant shall remit payment within 5 days."}'
```

**Expected response:**
```json
{
  "success": true,
  "plainEnglish": "You need to pay within 5 days."
}
```

**If it fails:**
- Check if server is running
- Check terminal for error messages
- Verify OpenAI API key

---

## Step-by-Step Debugging

### Step 1: Server Running?
```bash
# Check if dev server is running
ps aux | grep "next dev"
```

If not, start it:
```bash
cd /Users/adanordonez/Desktop/leasewise/leasewise-app
npm run dev
```

### Step 2: API Route Exists?
```bash
ls -la /Users/adanordonez/Desktop/leasewise/leasewise-app/app/api/translate-legal-text/route.ts
```

Should show the file. If not, the file is missing.

### Step 3: OpenAI Key Set?
```bash
cat /Users/adanordonez/Desktop/leasewise/leasewise-app/.env.local | grep OPENAI
```

Should show your key. If not, add it.

### Step 4: Test API Directly

Go to http://localhost:3000/test-translation

Click the button. If it works here, the issue is in the SourceCitation component.

### Step 5: Check SourceCitation Component

Open browser console, then:
1. Upload and analyze a lease
2. Click 📄 icon
3. Look for the green button
4. Click it
5. Watch console for logs

**Should see:**
```
🔄 Starting translation for text: Non-compliance fees...
📡 Translation API response status: 200
✅ Translation received: If you break a lease rule...
```

**If you see an error:**
- Copy the error message
- Check if it's a 404, 500, or network error
- Look at server terminal for more details

---

## What To Send Me

If it's still not working, send me:

### 1. Browser Console Output
- Open console (F12)
- Click "Explain in Plain English"
- Copy all the logs
- Send me the text

### 2. Server Terminal Output
- Look at terminal where `npm run dev` is running
- Copy the output when you click the button
- Send me the text

### 3. Test Page Result
- Go to http://localhost:3000/test-translation
- Click the button
- Copy the result
- Send me the text

### 4. Environment Check
```bash
# Run this and send me the output:
cd /Users/adanordonez/Desktop/leasewise/leasewise-app
echo "=== OpenAI Key Check ==="
cat .env.local | grep OPENAI_API_KEY | head -c 30
echo "..."
echo ""
echo "=== API Route Exists ==="
ls -la app/api/translate-legal-text/route.ts
echo ""
echo "=== Server Running ==="
ps aux | grep "next dev" | grep -v grep
```

---

## Quick Fixes

### Fix 1: Hard Refresh Browser
```
Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Fix 2: Clear Next.js Cache
```bash
cd /Users/adanordonez/Desktop/leasewise/leasewise-app
rm -rf .next
npm run dev
```

### Fix 3: Reinstall Dependencies
```bash
cd /Users/adanordonez/Desktop/leasewise/leasewise-app
npm install
npm run dev
```

### Fix 4: Check Port
```bash
# Make sure port 3000 is not already in use
lsof -i :3000

# If something is using it, kill it:
kill -9 <PID>

# Then start server:
npm run dev
```

---

## Expected Files

These files should exist:

1. `/app/api/translate-legal-text/route.ts` - API endpoint
2. `/components/SourceCitation.tsx` - Component with button
3. `/app/test-translation/page.tsx` - Test page

Check if they exist:
```bash
ls -la app/api/translate-legal-text/route.ts
ls -la components/SourceCitation.tsx
ls -la app/test-translation/page.tsx
```

---

**Start Here:** http://localhost:3000/test-translation

If that works, the API is fine. If it doesn't, we know it's an API/environment issue.

