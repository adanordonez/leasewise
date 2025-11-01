# Testing Guide for Performance Optimization

## 🧪 Quick Testing Checklist

### Test 1: Basic Upload & Analysis (Expected: 8-10 seconds)
1. Go to the homepage
2. Click "Get Started" or "Analyze My Lease"
3. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Address: Use autocomplete or type an address
4. Upload a PDF lease
5. Click "Analyze My Lease"
6. **✅ Expected**: See basic info (rent, deposit, dates) in 8-10 seconds
7. **✅ Expected**: See "Click to Analyze" badges on Red Flags section

### Test 2: On-Demand Red Flags (Expected: 8-10 seconds)
1. After basic analysis completes, find the "Red Flags" section
2. **✅ Expected**: Header shows "Click to Analyze" badge
3. Click anywhere on the Red Flags header
4. **✅ Expected**: Section expands and shows loading spinner
5. **✅ Expected**: After 8-10 seconds, red flags appear (or "No red flags found")
6. Click the header again
7. **✅ Expected**: Section collapses
8. Click the header one more time
9. **✅ Expected**: Section expands immediately (cached results, no loading)

### Test 3: Dashboard View
1. Navigate to `/dashboard` page
2. **✅ Expected**: See your uploaded lease in the list
3. **✅ Expected**: See "Partial Analysis" badge on the lease
4. Go back to the analysis page and load red flags
5. Refresh dashboard
6. **✅ Expected**: See red flag count badge instead of "Partial Analysis"

### Test 4: Error Handling
1. Try to analyze red flags without internet connection
2. **✅ Expected**: See error message, not a crash
3. Reconnect and try again
4. **✅ Expected**: Works normally

---

## 🐛 Common Issues & Solutions

### Issue: "No chunks found" error when clicking Red Flags
**Cause**: Lease was uploaded before chunks feature was added  
**Solution**: Re-upload the lease PDF

### Issue: Red Flags section doesn't expand
**Cause**: JavaScript error or `leaseDataId` not set  
**Solution**: Check browser console for errors

### Issue: Loading spinner never stops
**Cause**: API endpoint timeout or error  
**Solution**: Check network tab in browser DevTools, look for failed API calls

### Issue: Dashboard shows "Partial Analysis" forever
**Cause**: Red flags/rights never actually analyzed  
**Solution**: This is expected behavior! Only shows full analysis after user clicks to analyze those sections

---

## 📊 Performance Expectations

### Initial Analysis
- **Target**: < 15 seconds
- **Typical**: 8-10 seconds
- **Shows**: Rent, deposit, dates, property details

### On-Demand Sections (Each)
- **Target**: < 15 seconds each
- **Typical**: 8-10 seconds each
- **Sections**: Red Flags, Tenant Rights, Scenarios

### Cached Loads
- **Target**: < 1 second
- **Typical**: Instant (< 500ms)

---

## 🔍 Debugging Commands

### Check if chunks exist for a lease
```sql
SELECT 
  id, 
  user_email, 
  user_address,
  CASE 
    WHEN chunks IS NOT NULL THEN jsonb_array_length(chunks)
    ELSE 0 
  END as chunk_count,
  red_flags IS NOT NULL as has_red_flags,
  tenant_rights IS NOT NULL as has_rights
FROM lease_data 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check API logs (in terminal where Next.js is running)
Look for:
- `🔍 Extracting basic lease info (fast mode)...`
- `✅ Basic info extracted - skipping heavy analysis`
- `💾 Preparing to store XX chunks with embeddings...`
- `🚩 Starting on-demand red flags analysis...` (when user clicks)

### Check browser console
Look for:
- `🚩 Loading red flags on-demand...`
- `✅ Red flags loaded: X`
- Any error messages in red

---

## ✅ Success Indicators

You'll know it's working when:
1. Initial page load shows results in ~10 seconds (not 30-40s)
2. Red Flags section has "Click to Analyze" badge initially
3. Clicking expands with loading, then shows results
4. Second click on same section is instant (cached)
5. Dashboard shows "Partial Analysis" badge for new uploads
6. After analyzing red flags, dashboard updates to show count

---

## 🚀 Ready to Test!

1. Start your development server: `npm run dev`
2. Open `http://localhost:3000`
3. Follow Test 1 → Test 2 → Test 3
4. Report any issues or unexpected behavior

**Good luck!** 🎉

