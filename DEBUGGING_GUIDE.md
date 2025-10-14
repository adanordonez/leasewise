# 🐛 Debugging Guide - Enhanced Legal Sources Not Showing

## ✅ What to Check

### **Step 1: Is the Component Rendering?**

Open browser console (F12) and look for:
```
🔍 EnhancedLegalSources rendered: {rightText: "...", userAddress: "...", hasPdfUrl: true, hasLeaseContext: true}
```

**If you DON'T see this**:
- Component is not rendering at all
- Check if you're on the results page
- Check if rights section is visible

**If you DO see this**:
- Component is rendering ✅
- Move to Step 2

---

### **Step 2: Is the Button Visible?**

On the results page, in the "Your Rights" section, look for:
- A purple button that says **"Find Legal Sources"**
- It should appear below each right

**If you DON'T see the button**:
- Check if `sources.length === 0` (should be true initially)
- Check if `isLoading` is false
- Look for CSS issues hiding the button

**If you DO see the button**:
- Button is rendered ✅
- Move to Step 3

---

### **Step 3: Does Clicking the Button Work?**

Click the "Find Legal Sources" button and check console for:
```
🚀 searchLegalSources called!
📦 Sending data: {rightText: "...", userAddress: "...", ...}
📡 Fetching enhanced legal sources...
```

**If you DON'T see these logs**:
- onClick handler not firing
- Button might be disabled
- JavaScript error preventing execution

**If you DO see these logs**:
- Function is being called ✅
- Move to Step 4

---

### **Step 4: Is the API Being Called?**

Open DevTools → Network tab → Click button again

Look for a request to: `/api/enhanced-legal-sources`

**If you DON'T see the request**:
- Fetch is failing before sending
- CORS issue
- Network blocked

**If you DO see the request**:
- Check the status code
- Check the response
- Move to Step 5

---

### **Step 5: What's the API Response?**

Click on the `/api/enhanced-legal-sources` request in Network tab

Check:
- **Status**: Should be 200
- **Response**: Should have `success: true` and `sources` array

**Common Issues**:

**Status 400**: Missing required fields
```json
{
  "error": "rightText, userAddress, and description are required"
}
```
**Fix**: Check that props are being passed correctly

**Status 500**: Server error
```json
{
  "error": "Failed to search legal sources",
  "details": "..."
}
```
**Fix**: Check server logs for the actual error

**Status 200 but empty sources**:
```json
{
  "success": true,
  "sources": [],
  "message": "We searched X sources but couldn't find..."
}
```
**This is normal** - means no legal sources were found for this right

---

## 🔧 Quick Fixes

### **Fix 1: Hard Refresh**
```
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### **Fix 2: Clear Browser Cache**
```
DevTools → Application → Clear Storage → Clear site data
```

### **Fix 3: Restart Dev Server**
```bash
# Kill the server
lsof -ti:3007 | xargs kill -9

# Restart
cd /Users/adanordonez/Desktop/leasewise/leasewise-app
npm run dev
```

### **Fix 4: Check for TypeScript Errors**
```bash
cd /Users/adanordonez/Desktop/leasewise/leasewise-app
npm run build
```

If there are errors, they'll show up here.

---

## 📋 Checklist

Use this checklist to debug:

- [ ] Open http://localhost:3007
- [ ] Upload a lease PDF
- [ ] Go to "Your Rights" section
- [ ] Open browser console (F12)
- [ ] Look for: `🔍 EnhancedLegalSources rendered`
- [ ] Look for purple "Find Legal Sources" button
- [ ] Click the button
- [ ] Look for: `🚀 searchLegalSources called!`
- [ ] Open Network tab
- [ ] Look for `/api/enhanced-legal-sources` request
- [ ] Check request payload has `pdfUrl` and `leaseContext`
- [ ] Check response status is 200
- [ ] Check response has `sources` array
- [ ] Wait 20-30 seconds for results
- [ ] Should see legal sources with purple/blue boxes

---

## 🎯 Expected Flow

### **Console Logs (in order)**:
```
1. 🔍 EnhancedLegalSources rendered: {...}
2. (User clicks button)
3. 🚀 searchLegalSources called!
4. 📦 Sending data: {...}
5. 📡 Fetching enhanced legal sources...
6. 📡 Response status: 200
7. ✅ Found X relevant legal sources
```

### **Network Tab**:
```
POST /api/enhanced-legal-sources
Status: 200
Response: {
  success: true,
  sources: [...],
  totalSearched: 5,
  notFoundCount: 3
}
```

### **UI Changes**:
```
1. Button shows
2. Click button
3. Loading spinner appears
4. After 20-30 seconds...
5. Legal sources appear with:
   - Verification badge
   - Statute text
   - Purple/blue "How It Applies to Your Lease" box
   - Copy button
   - Link to source
```

---

## 🚨 Common Errors

### **Error: "Module not found"**
**Cause**: Missing import or file
**Fix**: Check all imports in the modified files

### **Error: "Cannot read property 'pdfUrl' of undefined"**
**Cause**: `analysisResult` is undefined
**Fix**: Make sure you're on the results page after analyzing a lease

### **Error: "Unexpected token"**
**Cause**: Syntax error in code
**Fix**: Check for missing commas, brackets, etc.

### **No errors but nothing happens**
**Cause**: Silent failure, check console for warnings
**Fix**: Look for React warnings or errors

---

## 📞 What to Report

If it's still not working, provide:

1. **Console logs** (copy all logs from console)
2. **Network tab** (screenshot of the request/response)
3. **What you see** (screenshot of the UI)
4. **What page you're on** (landing, upload, or results)
5. **Browser** (Chrome, Safari, Firefox, etc.)

---

**Start with Step 1 and work through each step until you find where it breaks!**

