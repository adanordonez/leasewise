# ⚡ LeaseWise Performance Optimization Guide

## Problem Identified

The initial lease analysis was taking **30-40 seconds** just to show basic information (Monthly Rent, Security Deposit, Lease Start, Lease End). This was unacceptable for UX.

### Root Cause Analysis

After investigation, we identified the bottleneck:

1. **PDF Text Extraction (LlamaParse)**: ~8-10 seconds ✅ (Required - cannot skip)
2. **Creating RAG Embeddings**: ~15-20 seconds ❌ (Can be deferred!)
3. **Red Flags Analysis**: ~5-8 seconds ❌ (Can be deferred!)
4. **Rights Analysis**: ~5-8 seconds ❌ (Can be deferred!)
5. **Scenarios Analysis**: ~3-5 seconds ❌ (Can be deferred!)

**Total Time**: 36-51 seconds for initial load
**Target Time**: 8-12 seconds for basic info

## Solution: Two-Phase Loading with On-Demand Embeddings

### Phase 1: Initial Load (8-12 seconds) ⚡
- **Extract PDF text** (LlamaParse) - Required
- **Extract basic lease info** (AI extraction) - Required
- **Create RAG system WITHOUT embeddings** - Fast!
- **Store chunks in database WITHOUT embeddings** - Fast!
- **Return core data immediately**

### Phase 2: On-Demand Loading (15-20 seconds) 📊
When user clicks "Red Flags", "Rights", or "Chat":
1. **Check if embeddings exist** in database
2. **If NO embeddings**: Create them now (~15s)
3. **If embeddings exist**: Skip creation (reuse!)
4. **Perform the requested analysis**
5. **Save embeddings to database** for future use

## Implementation Details

### 1. Modified `/api/analyze-lease` - Skip Embeddings

**Before:**
```typescript
rag = await createLeaseRAG(pdfData.pages, true); // Creates embeddings (~15-20s)
```

**After:**
```typescript
rag = await createLeaseRAG(pdfData.pages, false); // NO embeddings (saves 15-20s!)
```

**Changes:**
- Set `useEmbeddings` parameter to `false`
- Store chunks with `embedding: null`
- Return basic info immediately

### 2. Modified `/api/analyze-red-flags` - Create Embeddings On-Demand

**New Logic:**
```typescript
// Rebuild RAG from stored chunks
rag = rebuildRAGFromChunks(lease.chunks);

// Check if embeddings exist
const hasEmbeddings = lease.chunks.some(c => c.embedding && c.embedding.length > 0);

if (!hasEmbeddings) {
  console.log('⚡ Creating embeddings now (10-15s)...');
  
  // Create embeddings
  const chunksWithEmbeddings = await createEmbeddingsBatch(rag.getAllChunks());
  
  // Update RAG system
  rag.chunks = chunksWithEmbeddings;
  
  // Save to database for future use
  await supabase
    .from('lease_data')
    .update({ chunks: updatedChunks })
    .eq('id', leaseDataId);
}

// Now analyze red flags with embeddings ready
const redFlags = await analyzeRedFlagsWithRAG(rag, ...);
```

### 3. Modified `/api/analyze-rights` - Reuse Embeddings

**Logic:**
- Same as Red Flags endpoint
- If embeddings were created by Red Flags, they're reused here
- If not, creates them now
- Saves to database for future use

### 4. Frontend - No Changes Required! 🎉

The frontend already had the "Click to load" UI in place, so:
- **Initial load**: Shows basic info fast
- **On click**: Loads detailed analysis (with embeddings if needed)
- **Second click**: Instant! (embeddings already exist)

## Performance Comparison

### Before Optimization
| Step | Time | Can Skip? |
|------|------|-----------|
| PDF Extraction | 8-10s | ❌ No |
| Create Embeddings | 15-20s | ✅ Yes |
| Red Flags Analysis | 5-8s | ✅ Yes |
| Rights Analysis | 5-8s | ✅ Yes |
| Scenarios Analysis | 3-5s | ✅ Yes |
| **TOTAL** | **36-51s** | - |

### After Optimization (Initial Load)
| Step | Time | Can Skip? |
|------|------|-----------|
| PDF Extraction | 8-10s | ❌ No |
| Basic Info Extract | 2-4s | ❌ No |
| **TOTAL** | **10-14s** | - |

### After Optimization (On-Demand - First Click)
| Step | Time | Can Skip? |
|------|------|-----------|
| Create Embeddings | 15-20s | ❌ No (first time) |
| Analysis (Red Flags/Rights) | 5-8s | ❌ No |
| **TOTAL** | **20-28s** | - |

### After Optimization (On-Demand - Second Click)
| Step | Time | Can Skip? |
|------|------|-----------|
| Reuse Embeddings | 0s | ✅ Already exist! |
| Analysis (Red Flags/Rights) | 5-8s | ❌ No |
| **TOTAL** | **5-8s** | - |

## Expected Results

### User Experience
1. **Upload lease** → Immediate feedback
2. **Wait 10-14s** → Basic info appears ✨
3. **Click "Red Flags"** → Wait 20-28s → Results appear
4. **Click "Rights"** → Wait 5-8s → Results appear (embeddings reused!)
5. **Click "Chat"** → Instant! (embeddings reused!)

### Perceived Performance
- **Before**: 36-51 seconds to see anything useful
- **After**: 10-14 seconds to see core info (65-75% faster!)
- **Detailed analysis**: Still available, just on-demand

## Database Schema

No changes required! The `chunks` column already supports storing embeddings:

```sql
chunks: [
  {
    text: string,
    pageNumber: number,
    chunkIndex: number,
    startIndex: number,
    endIndex: number,
    embedding: number[] | null  // null initially, populated on-demand
  },
  ...
]
```

## Testing

### Test Case 1: First-Time Analysis
1. Upload a new lease PDF
2. **Expected**: Basic info loads in 10-14 seconds
3. Click "Red Flags"
4. **Expected**: Takes 20-28 seconds (creating embeddings + analysis)
5. Check database: `chunks[0].embedding` should be an array of numbers

### Test Case 2: Subsequent Analysis
1. Click "Rights" tab
2. **Expected**: Takes only 5-8 seconds (embeddings already exist!)
3. Click "Chat"
4. **Expected**: Chat works immediately (embeddings already exist!)

### Test Case 3: Reload Page
1. Refresh the page
2. Click "Red Flags" again
3. **Expected**: Takes only 5-8 seconds (embeddings persisted in database!)

## Troubleshooting

### Issue: Still Takes 30+ Seconds
**Check:**
- Is `createLeaseRAG` called with `false` parameter?
- Are embeddings being created during initial load?
- Check console logs for timing information

### Issue: Red Flags Takes Too Long
**Expected:**
- First time: 20-28 seconds (creating embeddings + analysis)
- Second time: 5-8 seconds (embeddings already exist)

**Check:**
- Are embeddings being saved to database correctly?
- Check `lease_data.chunks[0].embedding` in Supabase

### Issue: Embeddings Not Persisted
**Check:**
- Database connection working?
- `UPDATE` query executing successfully?
- Check Supabase logs for errors

## Future Optimizations

### Potential Improvements
1. **Background Embeddings Creation**: Create embeddings in background after initial load
2. **Progressive Loading**: Load chunks of embeddings progressively
3. **Caching**: Cache embeddings in Redis for faster access
4. **Batch Processing**: Process multiple leases in parallel

### Not Recommended
- ❌ Skip PDF extraction (required for accuracy)
- ❌ Skip embeddings entirely (needed for RAG accuracy)
- ❌ Use cached embeddings for different PDFs (security risk)

## Conclusion

This optimization reduces the initial perceived load time by **65-75%** while maintaining:
- ✅ Full accuracy of analysis
- ✅ Same UI/UX experience
- ✅ RAG-based source attribution
- ✅ No data loss or degradation

The key insight: **Defer expensive operations (embeddings) until actually needed!**

---

**Last Updated**: November 1, 2025
**Version**: 2.0 - On-Demand Embeddings

