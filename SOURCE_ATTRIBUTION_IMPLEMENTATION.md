# Source Attribution Implementation Plan

## Overview
Adding source attribution to show users the exact text from their lease that was used to extract each piece of information.

## What's Been Done

### 1. ✅ Removed Market Analysis Section
- Removed the market comparison UI from results page
- Updated `AnalysisResult` interface to remove `marketComparison`

### 2. ✅ Created SourceCitation Component
**File**: `components/SourceCitation.tsx`

Features:
- Small file icon next to each data point
- Clickable to open a modal
- Shows exact text excerpt from the lease
- Clean, professional modal design
- Click outside or close button to dismiss

### 3. ✅ Updated Data Interface
Added optional `source` fields to store the original lease text:
```typescript
interface AnalysisResult {
  summary: {
    monthlyRent: string;
    securityDeposit: string;
    // ... other fields
    sources?: {
      monthlyRent?: string;
      securityDeposit?: string;
      leaseStart?: string;
      leaseEnd?: string;
      noticePeriod?: string;
    }
  };
  redFlags: Array<{ issue: string; severity: string; explanation: string; source?: string }>;
  rights: Array<{ right: string; law: string; source?: string }>;
  keyDates: Array<{ event: string; date: string; description: string; source?: string }>;
}
```

### 4. ✅ Integrated Component
- Imported `SourceCitation` component
- Added to Monthly Rent summary card as example
- Ready to add to other fields

## Next Steps to Complete

### Step 1: Add Source Citations to All UI Elements

#### A. Summary Cards (4 remaining)
Need to add `<SourceCitation>` to:
- Security Deposit
- Lease Start
- Lease End
- Notice Period

Example code:
```tsx
<div className="text-sm font-medium text-slate-500 mb-2 flex items-center">
  Security Deposit
  <SourceCitation sourceText={analysisResult.summary.sources?.securityDeposit} label="Security Deposit Source" />
</div>
```

#### B. Red Flags Section
Add source citation to each red flag:
```tsx
{analysisResult.redFlags.map((flag, index) => (
  <div key={index} className="...">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-slate-900">{flag.issue}</h3>
        <SourceCitation sourceText={flag.source} label={`Red Flag: ${flag.issue}`} />
      </div>
      <span className={`badge-${flag.severity}`}>{flag.severity}</span>
    </div>
    <p>{flag.explanation}</p>
  </div>
))}
```

#### C. Rights Section
Add to each right:
```tsx
{analysisResult.rights.map((right, index) => (
  <div key={index}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CheckCircle />
        <span>{right.right}</span>
        <SourceCitation sourceText={right.source} label={`Your Right: ${right.right}`} />
      </div>
    </div>
  </div>
))}
```

#### D. Key Dates Section
Add to each date:
```tsx
{analysisResult.keyDates.map((date, index) => (
  <div key={index}>
    <div className="flex items-center gap-2">
      <span className="font-semibold">{date.event}</span>
      <SourceCitation sourceText={date.source} label={`Key Date: ${date.event}`} />
    </div>
  </div>
))}
```

### Step 2: Update OpenAI Prompts to Extract Sources

The API needs to be updated to instruct OpenAI to include the source text. We have two approaches:

#### Option A: Enhanced Prompt (Simpler, Recommended)
Update the OpenAI prompts in `lib/lease-analysis.ts` and `lib/lease-extraction.ts` to explicitly request source citations.

Example prompt modification:
```typescript
const prompt = `Analyze this lease and extract the following information.
For EACH piece of information you extract, also provide the EXACT TEXT from the lease where you found it.

Return JSON in this format:
{
  "summary": {
    "monthlyRent": "$2000",
    "sources": {
      "monthlyRent": "The Tenant shall pay a monthly rent of Two Thousand Dollars ($2,000.00) on the first day of each month."
    }
  },
  "redFlags": [
    {
      "issue": "Non-refundable deposit",
      "severity": "High",
      "explanation": "...",
      "source": "All deposits are non-refundable under any circumstances..."
    }
  ]
}

Lease text:
${leaseText}
`;
```

#### Option B: RAG with Vector Search (More Advanced)
1. Split the lease into chunks with chunk IDs
2. Store chunks in a vector database (or in-memory for now)
3. When extracting info, reference the chunk ID
4. Return chunk ID + exact excerpt

This is more complex but allows for:
- Better attribution for long documents
- Page number references
- Multiple sources per data point

**Recommendation**: Start with Option A (Enhanced Prompt), it's simpler and will work well for most leases.

### Step 3: Update API Route

File: `app/api/analyze-lease/route.ts`

The API already returns the analysis result, we just need to ensure the OpenAI responses include source attributions.

No code changes needed in the API route itself - just update the prompts that generate the data.

### Step 4: Update Prompt Files

#### File: `lib/lease-extraction.ts`
Update `extractBasicLeaseInfo` function to request sources:

```typescript
export async function extractBasicLeaseInfo(leaseText: string): Promise<BasicLeaseInfo & { sources?: Record<string, string> }> {
  const prompt = `Extract basic lease information from the following lease document.
For each piece of information, also include the EXACT TEXT from the lease where you found it.

Return ONLY valid JSON in this exact format:
{
  "building_name": "...",
  "property_address": "...",
  "monthly_rent": "...",
  "security_deposit": "...",
  "lease_start_date": "YYYY-MM-DD",
  "lease_end_date": "YYYY-MM-DD",
  "property_type": "...",
  "square_footage": 0,
  "bedrooms": 0,
  "bathrooms": 0,
  "sources": {
    "monthly_rent": "exact text from lease...",
    "security_deposit": "exact text from lease...",
    "lease_start_date": "exact text from lease...",
    "lease_end_date": "exact text from lease..."
  }
}

Lease document:
${leaseText}
`;

  // ... rest of function
}
```

#### File: `lib/lease-analysis.ts`
Update the structured analysis function to include sources for red flags, rights, and key dates:

```typescript
// Update the return type and prompt to include sources
const prompt = `Analyze this lease document and identify red flags, tenant rights, and key dates.
For EACH item you identify, include the EXACT TEXT from the lease that supports your finding.

Return JSON:
{
  "redFlags": [
    {
      "issue": "...",
      "severity": "High|Medium|Low",
      "explanation": "...",
      "source": "exact text from lease..."
    }
  ],
  "rights": [
    {
      "right": "...",
      "law": "...",
      "source": "exact text from lease..."
    }
  ],
  "keyDates": [
    {
      "event": "...",
      "date": "YYYY-MM-DD",
      "description": "...",
      "source": "exact text from lease..."
    }
  ]
}
`;
```

### Step 5: Handle Long Source Text

Since source text can be long, implement truncation in the component:

```typescript
// In SourceCitation component
const displayText = sourceText && sourceText.length > 500 
  ? sourceText.substring(0, 500) + '...'
  : sourceText;
```

Or show the full text with better formatting/scrolling (already implemented).

## Testing Plan

1. Upload a test lease
2. Check that source icons appear next to data points
3. Click on source icons
4. Verify modal shows exact text from lease
5. Test on different screen sizes (mobile/desktop)
6. Verify all sections have source attribution

## Benefits

✅ **Transparency**: Users can see exactly where information came from  
✅ **Trust**: Builds confidence in AI analysis  
✅ **Verification**: Users can cross-check against their lease  
✅ **Legal Protection**: Shows we're not making things up  
✅ **Better UX**: Educational for users to understand their lease  

## Limitations & Considerations

⚠️ **Token Usage**: Including sources increases token usage  
⚠️ **API Costs**: More tokens = higher OpenAI costs  
⚠️ **Response Time**: Longer responses may take more time  
⚠️ **Accuracy**: AI needs to accurately extract source text  

**Mitigation**: 
- Only include sources for key information
- Truncate very long excerpts
- Cache results to avoid re-analysis

## Future Enhancements

1. **Page Numbers**: Include page references from PDF
2. **Highlighting**: Highlight the source text in the original PDF
3. **Multiple Sources**: Support multiple source excerpts per data point
4. **Confidence Scores**: Show AI confidence in extraction
5. **Manual Corrections**: Allow users to flag incorrect sources
6. **Source Comparison**: Compare multiple similar clauses

## Status

- [x] Market Analysis Removed
- [x] SourceCitation Component Created
- [x] Interface Updated
- [x] Component Integrated (1 of 4 summary cards)
- [ ] Complete UI Integration (all data points)
- [ ] Update OpenAI Prompts
- [ ] Test End-to-End
- [ ] Deploy

## Next Action

Complete the UI integration by adding `<SourceCitation>` components to all remaining data points, then update the OpenAI prompts to extract source text.

