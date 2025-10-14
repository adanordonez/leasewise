# 🔄 Jina AI Legal Extraction - Visual Flow

## 📊 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                               │
│  Components/LeaseWiseApp.tsx or Components/EnhancedLegalSources.tsx│
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ User clicks "Find Legal Sources"
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    API ENDPOINT                                     │
│         app/api/enhanced-legal-sources/route.ts                     │
│                                                                     │
│  • Receives: rightText, userAddress, description                   │
│  • Calls: searchEnhancedLegalSources()                            │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│              STEP 1: SEARCH FOR SOURCES                             │
│                lib/legal-search.ts                                  │
│                                                                     │
│  OpenAI Web Search (gpt-4o)                                        │
│  • Input: "Find security deposit laws in Illinois"                 │
│  • Filters: .gov, nolo.com, law.cornell.edu                       │
│  • Output: 5-10 URLs with titles                                   │
│                                                                     │
│  Result: [                                                          │
│    {url: "https://ilga.gov/...", title: "765 ILCS 715/1"},        │
│    {url: "https://nolo.com/...", title: "IL Deposit Guide"},      │
│    ...                                                              │
│  ]                                                                  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│           STEP 2: PARALLEL PROCESSING (Top 5 Sources)              │
│              lib/jina-legal-extractor.ts                           │
│                                                                     │
│  For each URL, do this in parallel:                                │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  SOURCE 1: https://ilga.gov/...                            │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  2a) FETCH with Jina AI                                    │  │
│  │      GET https://r.jina.ai/https://ilga.gov/...            │  │
│  │      ↓                                                      │  │
│  │      Returns: Full page content (10k-50k chars)            │  │
│  │                                                             │  │
│  │  2b) VET with GPT-4o-mini                                  │  │
│  │      Prompt: "Is this relevant legal text about            │  │
│  │               security deposits in Illinois?"               │  │
│  │      ↓                                                      │  │
│  │      Returns: {                                             │  │
│  │        isRelevant: true,                                    │  │
│  │        score: 85,                                           │  │
│  │        reason: "Contains specific statute text..."          │  │
│  │      }                                                       │  │
│  │                                                             │  │
│  │  2c) DECISION                                               │  │
│  │      If score >= 60%:                                       │  │
│  │        → Go to EXTRACT                                      │  │
│  │      Else:                                                  │  │
│  │        → Mark as "not relevant", skip                       │  │
│  │                                                             │  │
│  │  2d) EXTRACT with GPT-4o-mini (if passed vetting)          │  │
│  │      Prompt: "Extract the exact statute text about         │  │
│  │               security deposits from this content"          │  │
│  │      ↓                                                      │  │
│  │      Returns: {                                             │  │
│  │        statuteText: "A lessor of residential real...",     │  │
│  │        explanation: "Your landlord must return..."         │  │
│  │      }                                                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  (Repeat for SOURCE 2, 3, 4, 5 in parallel)                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   STEP 3: AGGREGATE RESULTS                         │
│                                                                     │
│  Results from 5 sources:                                            │
│  • Source 1: ✅ RELEVANT (score: 85)                               │
│  • Source 2: ❌ NOT RELEVANT (score: 45)                           │
│  • Source 3: ✅ RELEVANT (score: 78)                               │
│  • Source 4: ❌ NOT RELEVANT (score: 30)                           │
│  • Source 5: ❌ NOT RELEVANT (score: 55)                           │
│                                                                     │
│  Filtered Results (only relevant):                                  │
│  [                                                                  │
│    {                                                                │
│      url: "https://ilga.gov/...",                                  │
│      title: "765 ILCS 715/1",                                      │
│      statuteText: "A lessor of residential real property...",      │
│      explanation: "Your landlord must return your deposit..."      │
│    },                                                               │
│    {                                                                │
│      url: "https://law.cornell.edu/...",                           │
│      title: "Illinois Security Deposit Act",                        │
│      statuteText: "The security deposit shall be returned...",     │
│      explanation: "You're entitled to get your money back..."       │
│    }                                                                │
│  ]                                                                  │
│                                                                     │
│  Stats:                                                             │
│  • totalSearched: 5                                                 │
│  • notFoundCount: 3                                                 │
│  • relevantSources: 2                                               │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    STEP 4: RETURN TO USER                           │
│                                                                     │
│  If relevantSources.length > 0:                                     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  ✅ Success Message                                       │     │
│  │  "Found 2 relevant legal sources with specific statute   │     │
│  │   text."                                                  │     │
│  │                                                            │     │
│  │  📄 SOURCE 1: 765 ILCS 715/1                             │     │
│  │  ┌────────────────────────────────────────────────┐     │     │
│  │  │ 📜 Legal Text                                  │     │     │
│  │  │ "A lessor of residential real property, who   │     │     │
│  │  │  receives a security deposit from a tenant...  │     │     │
│  │  │  must return the tenant's security deposit     │     │     │
│  │  │  within 45 days..."                            │     │     │
│  │  └────────────────────────────────────────────────┘     │     │
│  │  ┌────────────────────────────────────────────────┐     │     │
│  │  │ 💡 What This Means                             │     │     │
│  │  │ Your landlord must return your security        │     │     │
│  │  │ deposit within 45 days after you move out.     │     │     │
│  │  └────────────────────────────────────────────────┘     │     │
│  │  [View Full Legal Page →]                         │     │     │
│  │                                                            │     │
│  │  📄 SOURCE 2: Illinois Security Deposit Act        │     │     │
│  │  ...                                                      │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│  Else (no relevant sources):                                        │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  ⚠️ Not Found Message                                    │     │
│  │  "We searched 5 legal sources but couldn't find          │     │
│  │   specific legal text about 'purple walls' for your      │     │
│  │   area. This may mean:                                    │     │
│  │                                                            │     │
│  │   • The law doesn't have publicly available text          │     │
│  │   • Your area may not have specific regulations           │     │
│  │   • The legal text requires manual research               │     │
│  │                                                            │     │
│  │   We recommend consulting with a local attorney."         │     │
│  │                                                            │     │
│  │   Searched: 5 sources • Not relevant: 5                   │     │
│  └──────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

## ⏱️ Timing Breakdown

```
Total Time: 15-25 seconds

├─ Step 1: OpenAI Web Search              2-3s
├─ Step 2a: Jina AI Fetch (5 parallel)    3-5s each (parallel = 3-5s total)
├─ Step 2b: GPT Vetting (5 parallel)      1-2s each (parallel = 1-2s total)
├─ Step 2c: GPT Extraction (2 relevant)   1-2s each (parallel = 1-2s total)
└─ Step 3: Aggregation                    <1s

Parallel Processing = Much Faster!
```

## 💰 Cost Breakdown

```
Per Search (checking 5 sources):

OpenAI Web Search:          $0.002
Jina AI Fetch (5 sources):  $0.010 (or FREE with free tier)
GPT Vetting (5 sources):    $0.005
GPT Extraction (2 pass):    $0.004
────────────────────────────────
TOTAL:                      $0.021 (or $0.011 with Jina free tier)
```

## 🎯 Vetting Decision Tree

```
                    Full Page Content
                           │
                           ↓
                    [GPT-4o-mini VET]
                           │
                  ┌────────┴────────┐
                  │                 │
            Score >= 60%      Score < 60%
                  │                 │
                  ↓                 ↓
          ✅ PASS VETTING    ❌ REJECT
                  │                 │
                  ↓                 │
        [GPT-4o-mini EXTRACT]       │
                  │                 │
                  ↓                 ↓
          Show Statute Text   Skip Source
          + Explanation       + Log Reason
          + Link to Page
```

## 📦 Data Flow

```
User Input:
├─ rightText: "Security deposit must be returned"
├─ userAddress: "123 Main St, Chicago, IL 60601"
└─ description: "Security deposit return timeline"

                    ↓

OpenAI Search Output:
[
  { url: "https://ilga.gov/...", title: "765 ILCS 715/1" },
  { url: "https://nolo.com/...", title: "IL Deposit Guide" },
  ...
]

                    ↓

Jina AI Fetch Output (per URL):
"Illinois Compiled Statutes (765 ILCS 715/) Security Deposit 
Return Act. Sec. 1. A lessor of residential real property, 
containing 5 or more units, who receives a security deposit 
from a tenant to secure the payment of rent or to compensate 
for property damage, must, within 45 days after the date..."
(12,543 characters total)

                    ↓

GPT Vetting Output:
{
  isRelevant: true,
  score: 85,
  reason: "Contains specific Illinois statute (765 ILCS 715/1) 
          with exact security deposit return requirements"
}

                    ↓

GPT Extraction Output:
{
  statuteText: "A lessor of residential real property, containing 
                5 or more units, who receives a security deposit 
                from a tenant... must, within 45 days after the 
                date that occupancy terminates, return to the tenant 
                any security deposit...",
  explanation: "In Illinois, your landlord must return your security 
                deposit within 45 days after you move out, unless 
                they're using it for unpaid rent or damage repairs."
}

                    ↓

Final Output to User:
{
  url: "https://ilga.gov/legislation/ilcs/ilcs3.asp?ActID=2201",
  title: "765 ILCS 715/1 - Security Deposit Return Act",
  statuteText: "A lessor of residential real property...",
  explanation: "In Illinois, your landlord must return...",
  isRelevant: true
}
```

## 🔑 Key Benefits of This Flow

1. **Parallel Processing**: Checks 5 sources simultaneously
2. **Smart Vetting**: Rejects 60%+ of irrelevant sources
3. **Exact Text**: Quotes actual statutes, not summaries
4. **User-Friendly**: Shows plain English explanations
5. **Transparent**: Shows stats on sources searched/rejected
6. **Helpful Failures**: Explains why no sources were found

---

This architecture ensures users only see **relevant, verified legal text** with proper explanations and source links! 🎉

