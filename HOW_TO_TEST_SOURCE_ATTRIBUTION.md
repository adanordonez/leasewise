# How to Test Source Attribution Feature

## Quick Start Guide

### Step 1: Start the Development Server
```bash
cd leasewise-app
npm run dev
```

### Step 2: Upload a Test Lease
1. Go to `http://localhost:3000`
2. Click "Analyze your lease now"
3. Fill in:
   - Your name
   - Your email
   - Your address
4. Upload a PDF lease
5. Click "Analyze Lease"

### Step 3: Look for Source Icons
After analysis completes, you should see small **📄 file icons** next to:
- Monthly Rent
- Security Deposit
- Lease Start
- Lease End
- Each Red Flag
- Each Tenant Right
- Each Key Date

### Step 4: Click a Source Icon
1. Click any 📄 icon
2. A modal should pop up
3. The modal shows:
   - Header: "Monthly Rent Source" (or relevant label)
   - Body: Exact text from the lease
   - Footer: Close button

### Step 5: Verify the Feature Works
- [ ] Icons appear where they should
- [ ] Clicking icon opens modal
- [ ] Modal shows relevant lease text
- [ ] Clicking outside modal closes it
- [ ] Close button works
- [ ] No icons appear if source is missing (that's correct behavior)
- [ ] Works on mobile (responsive)

---

## What You Should See

### Before Analysis:
```
┌─────────────────────────────────────┐
│  Upload your lease                  │
│  Enter your information             │
│  ▼ Select PDF                       │
│  [Analyze Lease]                    │
└─────────────────────────────────────┘
```

### After Analysis (with source icons):
```
┌─────────────────────────────────────┐
│  Summary                            │
│  ┌─────────────┐  ┌──────────────┐ │
│  │ Monthly Rent│  │Sec. Deposit  │ │
│  │ 📄          │  │ 📄           │ │
│  │   $2,000    │  │   $2,000     │ │
│  └─────────────┘  └──────────────┘ │
│                                     │
│  Red Flags                          │
│  ⚠️ Non-refundable deposit 📄       │
│     This is problematic because...  │
│                                     │
│  Your Rights                        │
│  ✅ Right to quiet enjoyment 📄     │
│     Illinois Landlord Tenant Act... │
│                                     │
│  Key Dates                          │
│  📅 First rent due 📄               │
│     February 1, 2024                │
└─────────────────────────────────────┘
```

### Clicking a Source Icon:
```
┌────────────────────────────────────────────────────┐
│                                                    │
│  ╔══════════════════════════════════════════════╗ │
│  ║ 📄 Monthly Rent Source                   [X]║ │
│  ╠══════════════════════════════════════════════╣ │
│  ║                                              ║ │
│  ║  Excerpt from your lease:                   ║ │
│  ║  ┌────────────────────────────────────────┐ ║ │
│  ║  │ "The Tenant agrees to pay monthly rent│ ║ │
│  ║  │ of Two Thousand Dollars ($2,000.00),  │ ║ │
│  ║  │ payable in advance on the first day   │ ║ │
│  ║  │ of each calendar month."              │ ║ │
│  ║  └────────────────────────────────────────┘ ║ │
│  ║                                              ║ │
│  ║  This is the exact text from your lease     ║ │
│  ║  document that was used to extract this     ║ │
│  ║  information.                                ║ │
│  ║                                              ║ │
│  ╠══════════════════════════════════════════════╣ │
│  ║                     [Close]                  ║ │
│  ╚══════════════════════════════════════════════╝ │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: No source icons appear
**Cause**: The OpenAI response didn't include source text  
**Solution**: 
- Check console for errors
- Verify OpenAI API key is set
- Try with a different/simpler lease
- The prompts should request sources, but AI may not always comply

### Issue: Modal doesn't open
**Cause**: JavaScript error or component issue  
**Solution**:
- Check browser console for errors
- Verify `SourceCitation.tsx` exists
- Check that component is imported in `LeaseWiseApp.tsx`

### Issue: Source text is incorrect/irrelevant
**Cause**: AI extraction error  
**Solution**:
- This is expected occasionally with AI
- The prompt instructs AI to use exact text, but it may still paraphrase
- Future: Could add confidence scores or manual correction

### Issue: Modal won't close
**Cause**: Click handler issue  
**Solution**:
- Check that `onClick` handlers are working
- Try clicking the X button or outside the modal
- Check browser console for errors

---

## Testing Checklist

Use this checklist to verify everything works:

### Functionality
- [ ] Source icons appear on summary cards
- [ ] Source icons appear on red flags
- [ ] Source icons appear on tenant rights
- [ ] Source icons appear on key dates
- [ ] Clicking icon opens modal
- [ ] Modal displays source text
- [ ] Close button closes modal
- [ ] Clicking outside closes modal
- [ ] No icons show when source is empty (correct)

### Visual/UI
- [ ] Icons are properly sized and positioned
- [ ] Icons are subtle but visible
- [ ] Modal is centered and readable
- [ ] Modal header is clear
- [ ] Source text is formatted nicely (italics, quote marks)
- [ ] Close button is obvious

### Responsive
- [ ] Works on desktop (1920x1080)
- [ ] Works on laptop (1366x768)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] Modal scales properly on small screens
- [ ] Text is readable at all sizes

### Content Quality
- [ ] Source text is relevant to the data point
- [ ] Source text is actual text from the lease (not paraphrased)
- [ ] Source text is concise (not entire paragraphs)
- [ ] Source text includes enough context to understand

### Edge Cases
- [ ] What if source text is very long? (Should still work, scrollable)
- [ ] What if source is missing? (No icon appears)
- [ ] What if PDF extraction fails? (Error message, no sources)
- [ ] What if OpenAI is down? (Error message, analysis fails)

---

## Expected Behavior

### When Source Available:
- Small 📄 icon appears
- Hover changes cursor to pointer
- Click opens modal
- Modal shows exact lease text
- User can verify accuracy

### When Source Not Available:
- No icon appears (graceful degradation)
- Data still displays normally
- User can still see the analysis
- No errors or broken UI

---

## Sample Test Leases

For best testing results, use leases that have:
- ✅ Clear rent amount stated
- ✅ Security deposit mentioned
- ✅ Explicit start and end dates
- ✅ Well-defined terms and clauses
- ✅ Standard lease language

Avoid:
- ❌ Handwritten leases (OCR issues)
- ❌ Scanned at low resolution (OCR issues)
- ❌ Non-standard formats (harder to extract)
- ❌ Very long leases (may timeout, though should handle up to 50MB)

---

## Performance Expectations

### Analysis Time:
- **Before**: 10-20 seconds
- **After**: 12-25 seconds
- **Increase**: +2-5 seconds (acceptable)

### Token Usage:
- **Before**: ~3,000-5,000 tokens
- **After**: ~3,500-6,000 tokens
- **Increase**: ~10-20%

### File Size:
- **Maximum**: 50MB (Supabase limit)
- **Recommended**: Under 10MB for best performance
- **Typical lease**: 1-5MB

---

## Next Steps After Testing

### If Everything Works:
1. ✅ Commit changes
2. ✅ Deploy to production
3. ✅ Monitor for issues
4. ✅ Collect user feedback

### If Issues Found:
1. 🐛 Document the issue
2. 🔍 Check browser console
3. 📝 Review relevant code files
4. 🔧 Fix and retest

### Future Improvements:
1. Add page numbers to sources
2. Highlight source text in PDF
3. Add confidence scores
4. Allow user corrections
5. Track which sources are most useful

---

## Questions to Ask

When testing, ask yourself:

1. **Is it useful?** Does showing the source help users trust the analysis?
2. **Is it accurate?** Is the source text relevant and correct?
3. **Is it clear?** Do users understand what the icon means?
4. **Is it accessible?** Can users with disabilities use it?
5. **Is it performant?** Does it slow down the analysis significantly?

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Review `SOURCE_ATTRIBUTION_COMPLETE.md` for implementation details
3. Check component code in `components/SourceCitation.tsx`
4. Review API logs for OpenAI response structure

---

**Happy Testing! 🎉**

The source attribution feature should significantly improve user trust and transparency in the lease analysis.

