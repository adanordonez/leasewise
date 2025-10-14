# 🧪 Testing the New Verified Legal Search

## ✅ What's Fixed

1. ✅ **Error resolved** - No more crashes
2. ✅ **Removed "Find Legal Sources"** from rights section
3. ✅ **Added verification system** to "Know Your Renter Rights"
4. ✅ **Visual verification badges** - ✅ for verified, ⚠️ for unverified
5. ✅ **Transparent to users** - See what's verified and what's not

---

## 🧪 Testing Steps

### **1. Start the App**
```bash
cd /Users/adanordonez/Desktop/leasewise/leasewise-app
npm run dev
```

Visit: http://localhost:3007

---

### **2. Upload a Lease**

1. Go to the analyze page
2. Enter your name and email
3. Enter an address (e.g., "123 Main St, Chicago, IL 60601")
4. Upload any PDF lease
5. Click "Analyze Lease"

---

### **3. Scroll to "Know Your Renter Rights"**

You'll see a section that says:
```
📚 Know Your Renter Rights

Comprehensive legal information for your state

[Search Renter Laws for Your Area]
```

---

### **4. Open Browser Console** (CRITICAL!)

Press **F12** or:
- Chrome/Edge: Right-click → Inspect → Console tab
- Firefox: Right-click → Inspect Element → Console tab
- Safari: Develop → Show JavaScript Console

---

### **5. Click "Search Renter Laws for Your Area"**

**Watch the console!** You'll see:

```
🚀 VERIFIED LEGAL SEARCH
📍 Location: 123 Main St, Chicago, IL 60601
📍 Parsed: Chicago, Illinois

📚 STEP 1: Getting legal information...
✅ Got 10 categories

🔒 STEP 2: VERIFYING each source...

📋 Security Deposit Terms
📄 Fetching: https://ilga.gov/...
✅ Got 15234 chars
🔍 Verifying "Security Deposit Terms"...
   ✅ Score: 92/100
   Reason: Page contains Illinois statute about security deposits
   ✅ VERIFIED

📋 Rent Amount and Increase Provisions
📄 Fetching: https://illinois.gov/...
✅ Got 8432 chars
🔍 Verifying "Rent Amount and Increase Provisions"...
   ⚠️ Score: 65/100
   Reason: Page discusses rent but not Illinois-specific
   ⚠️  Not verified but keeping for user

... (8 more categories)

📊 SUMMARY:
   Total: 10
   ✅ Verified: 7
   ⚠️  Unverified: 3
```

---

### **6. Check the Results**

At the top, you'll see **verification stats**:
```
┌─────────────────────────────────────────┐
│ ✅ 7 Verified                           │
│    Cross-checked with official sources  │
│                                         │
│ ⚠️ 3 Unverified                         │
│    Could not confirm from sources       │
│                                         │
│ 📚 Illinois                             │
│    State laws                           │
└─────────────────────────────────────────┘
```

---

### **7. Check Individual Rows**

**Verified rows** look like:
```
┌─────────────────────────────────────────────────┐
│ ✅ Security Deposit Terms                       │
│ Explanation: In Illinois, landlords must...     │
│ Statute: 765 ILCS 715/1                         │
│ Source: https://ilga.gov/...                    │
└─────────────────────────────────────────────────┘
```

**Unverified rows** look like:
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Pet Policies and Fees                        │
│ Explanation: Pet policies vary by locality...   │
│ ⚠️ This information could not be verified       │
│    against official sources                     │
└─────────────────────────────────────────────────┘
```

---

## 🔍 What to Look For

### **Console Logs** ✅

You should see:
1. ✅ **Fetch logs** - "Fetching: https://..."
2. ✅ **Character counts** - "Got 15234 chars"
3. ✅ **Verification scores** - "Score: 92/100"
4. ✅ **Reasons** - Why verified or not
5. ✅ **Final summary** - Total verified/unverified

### **UI Elements** ✅

You should see:
1. ✅ **Stats box** at top with verification counts
2. ✅ **Green checkmarks** (✅) for verified items
3. ✅ **Amber warnings** (⚠️) for unverified items
4. ✅ **Verification scores** on desktop view
5. ✅ **Warning text** on unverified items

### **Mobile View** 📱

1. Resize browser to mobile width (< 768px)
2. Cards should show verification status
3. ✅ or ⚠️ icon next to title
4. "Verified 92%" or "Could not verify" text

---

## ❌ What Should NOT Happen

1. ❌ **No crashes** - Should not see error messages
2. ❌ **No "Find Legal Sources" button** in rights section
3. ❌ **No blank tables** - All 10 categories should show
4. ❌ **No missing icons** - All badges should render

---

## 🎯 Expected Results

### **For Illinois** (or any state with good .gov sites):
- **7-8 verified** categories
- **2-3 unverified** categories
- Good statute citations (e.g., "765 ILCS 715/1")
- Working source links

### **For states with poor .gov sites**:
- **3-5 verified** categories
- **5-7 unverified** categories
- More generic information
- Some broken source links

---

## 💡 Tips

1. **Always check console** - That's where verification details are
2. **Try different states** - Results vary by state
3. **Check verification reasons** - See why things failed
4. **Mobile test** - Ensure it works on small screens
5. **Links should work** - Click source links to verify

---

## 🐛 If You See Errors

### **"Failed to fetch legal information"**
- Check console for specific error
- Verify OpenAI API key is set
- Check network tab for failed requests

### **"No categories showing"**
- Check console for parsing errors
- Verify API response format
- Check if state was parsed correctly

### **"Verification not showing"**
- Check if `isVerified` field exists in data
- Verify icons are imported correctly
- Check browser console for rendering errors

---

## 📊 Success Criteria

✅ **No crashes** - App loads and works
✅ **Console shows logs** - See verification process
✅ **Stats box shows** - Verification counts at top
✅ **Badges show** - ✅ and ⚠️ icons render
✅ **All 10 categories** - Even unverified ones show
✅ **Links work** - Source URLs are clickable
✅ **Mobile works** - Responsive on small screens

---

## 🎯 What This Proves

This system proves that:

1. ✅ **We fetch real pages** - Not just making things up
2. ✅ **We verify claims** - Cross-check against sources
3. ✅ **We're transparent** - Show what's verified and what's not
4. ✅ **We're honest** - Don't hide unverified info
5. ✅ **We're accurate** - Only mark as verified if page confirms

---

**Start testing now!** Remember to open the console (F12) before clicking "Search Renter Laws". 🚀

