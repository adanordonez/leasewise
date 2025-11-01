# LeaseWise Performance Optimization Plan
## Two-Phase Loading Architecture

**Created**: November 1, 2025  
**Status**: In Progress  
**Goal**: Reduce initial analysis time from 30-40s to 8-10s

---

## 🎯 Executive Summary

**Problem**: Users wait 30-40 seconds for complete lease analysis before seeing ANY results.

**Solution**: Split analysis into two phases:
- **Phase 1 (Fast)**: Essential info only (8-10 seconds)
- **Phase 2 (On-Demand)**: Detailed analysis when user requests it (8 seconds per section)

**Impact**: 
- 75% faster initial load time
- Better user experience
- Lower costs (pay only for what users need)
- More resilient error handling

---

## 📊 Current Architecture (BEFORE)

### Single API Call Does Everything

```
POST /api/analyze-lease
├─ 1. Extract PDF text (5s)
├─ 2. Initialize RAG + embeddings (3s)
├─ 3. Extract basic info (1s)
├─ 4. Analyze lease with RAG (12s)
│  ├─ Monthly rent ✓
│  ├─ Security deposit ✓
│  ├─ Dates ✓
│  └─ Tenant rights ← HEAVY
├─ 5. Analyze red flags (10s) ← HEAVY
├─ 6. Save to database (2s)
└─ Total: 33 seconds 😰
```

### Problems

1. **Slow Initial Response**: User sees nothing for 30+ seconds
2. **Wasted Analysis**: If red flags analysis fails, everything fails
3. **Unnecessary Work**: Many users don't need all sections immediately
4. **Poor UX**: No progressive disclosure or feedback
5. **Higher Costs**: AI calls for features users might not use

---

## 🚀 New Architecture (AFTER)

### Phase 1: Fast Initial Load

```
POST /api/analyze-lease
├─ 1. Extract PDF text (5s)
├─ 2. Initialize RAG + embeddings (3s)
├─ 3. Extract basic info ONLY (1s)
│  ├─ Monthly rent ✓
│  ├─ Security deposit ✓
│  ├─ Lease dates ✓
│  ├─ Property details ✓
│  └─ Contact info ✓
├─ 4. Save RAG chunks to DB (1s)
└─ Total: 10 seconds ⚡
```

**Returns to frontend**:
```json
{
  "success": true,
  "leaseDataId": "uuid-123",
  "analysis": {
    "summary": {
      "monthlyRent": "$2,000",
      "securityDeposit": "$4,000",
      "leaseStart": "2024-01-01",
      "leaseEnd": "2024-12-31"
    }
  },
  "redFlagsReady": false,
  "rightsReady": false,
  "scenariosReady": false
}
```

### Phase 2: On-Demand Analysis

**When user clicks "Show Red Flags"**:
```
POST /api/analyze-red-flags
├─ 1. Load RAG chunks from DB (0.5s)
├─ 2. Rebuild RAG system from chunks (0.5s)
├─ 3. Analyze red flags only (8s)
├─ 4. Update lease_data record (1s)
└─ Total: 10 seconds

Returns: Array of red flags with sources
```

**When user clicks "Show Tenant Rights"**:
```
POST /api/analyze-rights
├─ 1. Load RAG chunks from DB (0.5s)
├─ 2. Rebuild RAG system from chunks (0.5s)
├─ 3. Analyze tenant rights only (8s)
├─ 4. Update lease_data record (1s)
└─ Total: 10 seconds

Returns: Array of tenant rights with sources
```

**When user clicks "Show Scenarios"** (already exists):
```
POST /api/generate-scenarios
└─ Already implemented! ✓
```

### Benefits

1. ✅ **75% Faster Initial Load**: 10s instead of 33s
2. ✅ **Progressive Disclosure**: Show simple info first, details on demand
3. ✅ **Cost Savings**: Don't analyze features users don't view
4. ✅ **Isolated Failures**: Red flags fail? User still gets basic info
5. ✅ **Better UX**: Clear loading states for each section
6. ✅ **Scalable**: Easy to add more on-demand sections

---

## 🔧 Implementation Details

### Step 1: Modify `/api/analyze-lease`

**Changes**:
- ✅ Keep: PDF extraction
- ✅ Keep: RAG initialization
- ✅ Keep: Basic info extraction (`extractBasicLeaseInfo`)
- ✅ Keep: Save RAG chunks to database
- ❌ Remove: `analyzeRedFlagsWithRAG()` call
- ❌ Remove: Tenant rights from `analyzeLeaseWithRAG()`
- ❌ Remove: Scenarios (already separate)

**New Response Format**:
```typescript
{
  success: true,
  leaseDataId: string,
  analysis: {
    summary: {
      monthlyRent: string,
      securityDeposit: string,
      leaseStart: string,
      leaseEnd: string,
      noticePeriod: string,
      // ... other basic fields
    }
    // NO red_flags array
    // NO rights array
    // NO keyDates array (unless it's in basic info)
  },
  redFlagsReady: false,
  rightsReady: false
}
```

### Step 2: Create `/api/analyze-red-flags`

**New File**: `app/api/analyze-red-flags/route.ts`

**Input**:
```typescript
{
  leaseDataId: string  // UUID of the lease
}
```

**Process**:
1. Load lease_data from Supabase (get chunks)
2. Rebuild RAG system from stored chunks
3. Call `analyzeRedFlagsWithRAG(rag, basicInfo, locale)`
4. Update lease_data.red_flags in database
5. Return red flags array

**Output**:
```typescript
{
  success: true,
  redFlags: Array<{
    issue: string,
    severity: string,
    explanation: string,
    source: string,
    page_number: number
  }>
}
```

**Error Handling**:
- If leaseDataId not found → 404
- If chunks missing → Fallback: ask user to re-upload (or re-parse PDF)
- If analysis fails → 500 with details

### Step 3: Create `/api/analyze-rights`

**New File**: `app/api/analyze-rights/route.ts`

**Input**:
```typescript
{
  leaseDataId: string
}
```

**Process**:
1. Load lease_data from Supabase (get chunks)
2. Rebuild RAG system from stored chunks
3. Analyze tenant rights (extract from `analyzeLeaseWithRAG` logic)
4. Update lease_data.tenant_rights in database
5. Return rights array

**Output**:
```typescript
{
  success: true,
  rights: Array<{
    right: string,
    law: string,
    source: string,
    page_number: number
  }>
}
```

### Step 4: Update Frontend Components

**Main Upload/Analysis Page**:

**Before**:
```tsx
// Show loading spinner for 30s
// Then show everything at once
```

**After**:
```tsx
// Phase 1: Show basic info after 10s
<SummarySection data={summary} />

// Phase 2: Show expandable sections
<ExpandableSection 
  title="Red Flags"
  onExpand={() => fetchRedFlags(leaseDataId)}
  loading={redFlagsLoading}
  data={redFlags}
/>

<ExpandableSection 
  title="Tenant Rights"
  onExpand={() => fetchRights(leaseDataId)}
  loading={rightsLoading}
  data={rights}
/>

<ExpandableSection 
  title="Common Scenarios"
  onExpand={() => fetchScenarios(leaseDataId)}
  loading={scenariosLoading}
  data={scenarios}
/>
```

**Dashboard Page**:

Handle cases where data is incomplete:
```tsx
{lease.red_flags ? (
  <RedFlagsBadge count={lease.red_flags.length} />
) : (
  <Badge variant="secondary">Not Analyzed</Badge>
)}
```

---

## 🗄️ Database Changes

### No Schema Changes Required! 🎉

The existing `lease_data` table already supports this:
- `chunks` JSONB → Already storing RAG chunks with embeddings
- `red_flags` JSONB → Can be NULL initially
- `tenant_rights` JSONB → Can be NULL initially

**Migration**: None needed! Just ensure columns are nullable.

---

## 📋 Implementation Checklist

### Phase 1: MVP (4-6 hours)

**Backend**:
- [ ] Modify `/api/analyze-lease/route.ts`
  - [ ] Remove `analyzeRedFlagsWithRAG()` call
  - [ ] Simplify `analyzeLeaseWithRAG()` to skip tenant rights
  - [ ] Update response format
  - [ ] Add `redFlagsReady: false` to response
- [ ] Create `/api/analyze-red-flags/route.ts`
  - [ ] Accept leaseDataId
  - [ ] Load chunks from database
  - [ ] Rebuild RAG system
  - [ ] Run red flags analysis
  - [ ] Save to database
- [ ] Create `/api/analyze-rights/route.ts`
  - [ ] Same pattern as red flags
  - [ ] Extract tenant rights analysis logic

**Frontend**:
- [ ] Update main analysis page
  - [ ] Show summary immediately after initial analysis
  - [ ] Add expandable sections for red flags
  - [ ] Add expandable sections for rights
  - [ ] Add loading states
  - [ ] Handle on-demand API calls
- [ ] Update dashboard
  - [ ] Handle NULL red_flags gracefully
  - [ ] Handle NULL tenant_rights gracefully
  - [ ] Show "Not Analyzed" badges

**Testing**:
- [ ] Test fast initial load (<15s)
- [ ] Test on-demand red flags loading
- [ ] Test on-demand rights loading
- [ ] Test error handling (missing chunks)
- [ ] Test database NULL handling

### Phase 2: Polish (2-3 hours)

- [ ] Add "Analyze Everything Now" checkbox option
- [ ] Add progress indicators
- [ ] Improve error messages
- [ ] Add retry logic for failed sections
- [ ] Add analytics tracking (which sections are most used?)

### Phase 3: Advanced (Optional)

- [ ] Background job to auto-analyze after 30 seconds
- [ ] Caching layer for repeat analyses
- [ ] Batch analysis for dashboard
- [ ] Real-time progress updates (SSE)

---

## 🧪 Testing Strategy

### Test Case 1: Happy Path
1. Upload 15-page lease
2. Verify initial response in <15s
3. Click "Show Red Flags"
4. Verify red flags load in <12s
5. Click "Show Tenant Rights"
6. Verify rights load in <12s

### Test Case 2: Missing Chunks
1. Upload lease
2. Manually delete chunks from database
3. Try to load red flags
4. Verify graceful error message

### Test Case 3: Dashboard with Incomplete Data
1. Upload 3 leases
2. Only analyze red flags for 2 of them
3. Load dashboard
4. Verify "Not Analyzed" badges appear

### Test Case 4: Error Recovery
1. Upload lease
2. Simulate red flags API failure
3. Verify basic info still displays
4. Verify "Retry" button works

---

## 📈 Expected Performance Metrics

### Before Optimization

| Metric | Value |
|--------|-------|
| Initial Load Time | 30-40s |
| Time to First Content | 30-40s |
| User Engagement (guessed) | Low (due to wait time) |
| AI Cost per Upload | $0.003 |
| Success Rate | 90% (one failure = all fail) |

### After Optimization

| Metric | Value |
|--------|-------|
| Initial Load Time | 8-10s ⚡ |
| Time to First Content | 8-10s ⚡ |
| Red Flags Load (if clicked) | +8-10s |
| Rights Load (if clicked) | +8-10s |
| User Engagement (predicted) | High (fast feedback) |
| AI Cost per Upload | $0.001-0.003 (depends on usage) |
| Success Rate | 95% (isolated failures) |

### Cost Savings (Estimated)

If only 70% of users click "Red Flags":
- Old: 100 uploads × $0.003 = $0.30
- New: (100 × $0.001) + (70 × $0.002) = $0.24
- **Savings**: 20% cost reduction

---

## 🚨 Risks & Mitigations

### Risk 1: Missing Chunks in Database
**Issue**: If chunks aren't saved, on-demand loading fails.

**Mitigation**:
- Add validation: Check chunks exist before returning success
- Fallback: Re-parse PDF if chunks missing (slower but works)
- Alert: Log warning if chunks are missing

### Risk 2: Dashboard Showing Incomplete Data
**Issue**: Leases without red flags analysis look "broken".

**Mitigation**:
- Show clear "Not Analyzed" badges
- Add "Analyze Now" button in dashboard
- Filter option: "Show only fully analyzed leases"

### Risk 3: User Confusion
**Issue**: Users might not realize they need to click to see more.

**Mitigation**:
- Clear UI: Big buttons saying "Click to Analyze Red Flags"
- Auto-expand: First section auto-expands after 2 seconds
- Tutorial: Show tooltip on first use

### Risk 4: RAG Rebuild Performance
**Issue**: Rebuilding RAG from chunks might be slow.

**Mitigation**:
- Optimize: Load only needed chunks
- Cache: Keep RAG in memory for 5 minutes
- Monitor: Track rebuild times

---

## 🎓 Technical Deep Dive

### How RAG Chunks Enable Lazy Loading

**The Magic** is in this code (already implemented in `route.ts:293-300`):

```typescript
const chunksToStore = rag.getAllChunks().map(chunk => ({
  text: chunk.text,
  pageNumber: chunk.pageNumber,
  embedding: chunk.embedding,  // ← The key!
  chunkIndex: chunk.chunkIndex
}));
```

**Why This Works**:
1. Embeddings are already created during initial upload
2. Stored in database as JSONB
3. On-demand APIs can rebuild RAG instantly by loading these
4. No need to re-parse PDF or re-create embeddings!

**Rebuild Process**:
```typescript
// Load from database
const { data } = await supabase
  .from('lease_data')
  .select('chunks')
  .eq('id', leaseDataId)
  .single();

// Rebuild RAG
const rag = new LeaseRAG();
rag.loadFromChunks(data.chunks);  // Instant!

// Now ready for analysis
const redFlags = await analyzeRedFlagsWithRAG(rag, ...);
```

---

## 📝 Code Examples

### New API Endpoint Template

```typescript
// app/api/analyze-red-flags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createLeaseRAG } from '@/lib/rag-system';
import { analyzeRedFlagsWithRAG } from '@/lib/red-flags-analysis';

export const maxDuration = 60; // 1 minute should be enough

export async function POST(request: NextRequest) {
  try {
    const { leaseDataId } = await request.json();
    
    // 1. Load lease data with chunks
    const { data: lease, error } = await supabase
      .from('lease_data')
      .select('*')
      .eq('id', leaseDataId)
      .single();
    
    if (error || !lease) {
      return NextResponse.json(
        { error: 'Lease not found' },
        { status: 404 }
      );
    }
    
    if (!lease.chunks || lease.chunks.length === 0) {
      return NextResponse.json(
        { error: 'No chunks found. Please re-upload lease.' },
        { status: 400 }
      );
    }
    
    // 2. Rebuild RAG from stored chunks
    const rag = await createLeaseRAG(
      lease.chunks.map((chunk: any) => ({
        pageNumber: chunk.pageNumber,
        text: chunk.text
      })),
      false  // Don't create new embeddings!
    );
    
    // Load existing embeddings
    rag.loadEmbeddings(lease.chunks.map((c: any) => c.embedding));
    
    // 3. Analyze red flags
    const redFlags = await analyzeRedFlagsWithRAG(rag, {
      monthlyRent: lease.monthly_rent?.toString(),
      securityDeposit: lease.security_deposit?.toString(),
      address: lease.user_address
    }, 'en');
    
    // 4. Save to database
    await supabase
      .from('lease_data')
      .update({ red_flags: redFlags })
      .eq('id', leaseDataId);
    
    return NextResponse.json({
      success: true,
      redFlags
    });
    
  } catch (error) {
    console.error('Red flags analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
```

### Frontend Hook Example

```typescript
// hooks/useLeaseAnalysis.ts
export function useLeaseAnalysis(leaseDataId: string) {
  const [redFlags, setRedFlags] = useState(null);
  const [redFlagsLoading, setRedFlagsLoading] = useState(false);
  
  const fetchRedFlags = async () => {
    setRedFlagsLoading(true);
    try {
      const response = await fetch('/api/analyze-red-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseDataId })
      });
      const data = await response.json();
      setRedFlags(data.redFlags);
    } catch (error) {
      console.error('Failed to load red flags:', error);
    } finally {
      setRedFlagsLoading(false);
    }
  };
  
  return { redFlags, redFlagsLoading, fetchRedFlags };
}
```

---

## 🎯 Success Criteria

This optimization is successful if:

1. ✅ Initial load time < 15 seconds (down from 30-40s)
2. ✅ User sees basic info within 15 seconds
3. ✅ On-demand sections load in < 15 seconds each
4. ✅ No increase in error rate
5. ✅ Cost per upload stays same or decreases
6. ✅ User engagement increases (measured by analytics)

---

## 📞 Next Steps

1. **Review this plan** with team
2. **Start Phase 1 implementation**
3. **Test thoroughly** with real lease PDFs
4. **Deploy to staging** for user testing
5. **Monitor performance** metrics
6. **Iterate** based on feedback

---

**Questions? Concerns? Let's discuss before implementation!**

