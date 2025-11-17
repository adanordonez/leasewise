# 📚 Know Your Renter Rights - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Two Operating Modes](#two-operating-modes)
4. [Data Flow](#data-flow)
5. [Component Breakdown](#component-breakdown)
6. [API Endpoints](#api-endpoints)
7. [Perplexity Integration](#perplexity-integration)
8. [RAG Integration](#rag-integration)
9. [Prompt Engineering](#prompt-engineering)
10. [Data Structures](#data-structures)
11. [Performance & Costs](#performance--costs)
12. [UI/UX Features](#uiux-features)
13. [Internationalization](#internationalization)
14. [Error Handling](#error-handling)
15. [Troubleshooting](#troubleshooting)

---

## Overview

### What is "Know Your Renter Rights"?

The "Know Your Renter Rights" section is a comprehensive legal information table that provides tenants with **10 legal categories** of information based on their location. It's designed to educate tenants about their legal rights and protections under state and local laws.

### Key Features

- ✅ **10 Legal Categories** covering all major tenant rights areas
- ✅ **Real Legal Sources** with citations from authoritative legal websites
- ✅ **Statute Citations** (e.g., "765 ILCS 715/1")
- ✅ **Two Modes**: Generic examples OR lease-specific examples
- ✅ **Bilingual Support** (English & Spanish)
- ✅ **Search Functionality** to filter through categories
- ✅ **Responsive Design** (desktop table + mobile cards)
- ✅ **Auto-loading** for seamless UX

### The 10 Legal Categories

1. **Security Deposit Terms**
2. **Rent Amount and Increase Provisions**
3. **Maintenance and Repair Responsibilities**
4. **Entry and Privacy Rights**
5. **Lease Term and Renewal Options**
6. **Pet Policies and Fees**
7. **Subletting and Assignment Rights**
8. **Eviction Procedures and Protections**
9. **Utilities and Service Responsibilities**
10. **Modifications and Alterations**

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    User Input Layer                          │
│  (Address + Optional Lease PDF + Lease Context)             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Frontend Component Layer                        │
│  • ComprehensiveLegalTable.tsx (Main Display)               │
│  • LeaseReportHTML.tsx (Full Analysis Mode)                 │
│  • AddressOnlyResults.tsx (Address-Only Mode)               │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  API Route Layer                             │
│        /api/comprehensive-legal-info                         │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
         ┌─────────┴──────────┐
         ↓                    ↓
┌──────────────────┐  ┌──────────────────┐
│  Perplexity AI   │  │   RAG System     │
│   (Always Used)  │  │ (Conditional)    │
└─────────┬────────┘  └────────┬─────────┘
          ↓                    ↓
    ┌─────────────────────────────┐
    │    Merge & Return Data      │
    └──────────────┬──────────────┘
                   ↓
         Display in Table
```

### Technology Stack

- **Frontend**: React, Next.js, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **AI Services**:
  - **Perplexity AI** (`sonar` model) - Web search & citations
  - **OpenAI GPT-4o** - RAG analysis
  - **OpenAI text-embedding-3-small** - Vector embeddings
- **PDF Processing**: LlamaParse
- **Database**: Supabase (for RAG chunks storage)

---

## Two Operating Modes

### Mode 1: Address-Only Mode 🏠

**When:** User provides only their address (no lease upload)

**Purpose:** Quick legal information without lease analysis

**Data Sources:**
- ✅ Perplexity AI (all 10 categories)
- ❌ RAG System (not used)

**What User Gets:**
- Legal explanations for their state/city
- Statute citations
- **Generic examples** (e.g., "For a $1,500/month apartment...")
- Real source URLs from legal websites

**Use Cases:**
- User doesn't have lease handy
- User wants quick overview before signing
- User shopping for apartments and wants to know local laws

**Example Flow:**
```
User enters: "123 Main St, Chicago, Illinois"
    ↓
Perplexity searches Illinois & Chicago tenant laws
    ↓
Returns 10 categories with generic examples
    ↓
Table displays: "Illinois limits deposits to 1 month rent.
                 Example: For $1,500/month, max deposit is $1,500"
```

---

### Mode 2: Full Analysis Mode 📄

**When:** User uploads their lease PDF

**Purpose:** Personalized legal analysis based on actual lease

**Data Sources:**
- ✅ Perplexity AI (law explanations, statutes, sources)
- ✅ RAG System (lease-specific examples)

**What User Gets:**
- Legal explanations for their state/city
- Statute citations
- **Lease-specific examples** (e.g., "According to Section 5 on page 3...")
- Real source URLs from legal websites
- References to actual lease clauses

**Use Cases:**
- User already signed lease, wants to understand rights
- User reviewing lease before signing
- User needs to know how law applies to their specific contract

**Example Flow:**
```
User uploads: lease.pdf + "123 Main St, Chicago, Illinois"
    ↓
Perplexity searches Illinois & Chicago tenant laws
    ↓
RAG extracts lease text & creates embeddings
    ↓
For each category, RAG searches lease for relevant clauses
    ↓
GPT-4o compares law vs. lease and generates specific application
    ↓
Table displays: "Illinois limits deposits to 1 month rent.
                 Your lease (Section 5, page 3) requires a $2,250 deposit,
                 which exceeds the legal limit of $1,500 for your $1,500/month rent.
                 You may be entitled to a refund."
```

---

## Data Flow

### Complete Request Flow

```typescript
// Step 1: User Input
{
  userAddress: "123 Main St, Chicago, Illinois",
  leaseContext: {
    monthlyRent: "$1,500",
    securityDeposit: "$2,250",
    leaseStart: "2024-01-01",
    leaseEnd: "2024-12-31"
  },
  pdfUrl?: "https://..." // Optional
}

// Step 2: Parse Address
state = "Illinois"
city = "Chicago"

// Step 3: Perplexity Search (Always Runs)
for each of 10 categories:
  - Search legal domains (law.cornell.edu, nolo.com, illinois.gov, etc.)
  - Extract: explanation, statute, generic example, source URL
  
Result: 10 categories with generic data

// Step 4: RAG Analysis (Only if pdfUrl provided)
if (pdfUrl) {
  - Extract PDF text with page numbers
  - Create chunks & embeddings
  - For each category:
    * Search lease for relevant clauses
    * Use GPT-4o to compare law vs. lease
    * Generate lease-specific application
  - Replace generic examples with lease-specific ones
}

// Step 5: Return Merged Data
{
  legalInfo: [
    {
      lawType: "Security Deposit Terms",
      explanation: "Illinois limits deposits..." // From Perplexity
      statute: "765 ILCS 715/1", // From Perplexity
      sourceUrl: "https://...", // From Perplexity
      example: "Your lease requires $2,250..." // From RAG (or generic)
    },
    // ... 9 more categories
  ],
  searchMetadata: {
    state: "Illinois",
    city: "Chicago",
    totalSources: 10
  }
}
```

---

## Component Breakdown

### 1. ComprehensiveLegalTable.tsx

**Location:** `components/ComprehensiveLegalTable.tsx`

**Purpose:** Main UI component that displays the "Know Your Renter Rights" table

**Props:**
```typescript
interface ComprehensiveLegalTableProps {
  userAddress: string;          // Required: "123 Main St, City, State"
  pdfUrl?: string;              // Optional: URL to uploaded lease PDF
  leaseContext?: {              // Optional: Extracted lease metadata
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
  };
}
```

**Key Features:**

1. **Auto-Loading** (Lines 71-76)
```typescript
useEffect(() => {
  if (userAddress && !hasLoadedRef.current && !legalInfo.length && !isLoading && !error) {
    fetchLegalInfo(); // Automatically loads on mount
  }
}, [userAddress]);
```

2. **Search Functionality** (Lines 78-95)
```typescript
const filtered = legalInfo.filter(item =>
  item.lawType.toLowerCase().includes(term) ||
  item.explanation.toLowerCase().includes(term) ||
  item.example.toLowerCase().includes(term) ||
  (item.statute && item.statute.toLowerCase().includes(term))
);
```

3. **Responsive Design**
- Desktop: Full table with 5 columns
- Mobile: Card layout with expandable sections

4. **Loading States**
```typescript
{isLoading && (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <motion.div animate={{ rotate: 360 }} />
    <p>Searching authoritative legal sources...</p>
    <p className="text-sm">This may take 10-20 seconds</p>
  </div>
)}
```

**State Management:**
```typescript
const [legalInfo, setLegalInfo] = useState<VerifiedLegalInfo[]>([]);
const [filteredInfo, setFilteredInfo] = useState<VerifiedLegalInfo[]>([]);
const [searchTerm, setSearchTerm] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const hasLoadedRef = useRef(false); // Prevent duplicate loads
```

---

### 2. API Route: comprehensive-legal-info

**Location:** `app/api/comprehensive-legal-info/route.ts`

**Purpose:** Orchestrate data gathering from Perplexity + optional RAG

**Flow:**

```typescript
export async function POST(request: NextRequest) {
  // 1. Extract request data
  const { userAddress, leaseContext, pdfUrl } = await request.json();
  const locale = request.cookies.get('locale')?.value || 'en';
  
  // 2. Always call Perplexity for legal info
  const result = await searchLegalInfoWithPerplexity(
    userAddress, 
    leaseContext, 
    locale
  );
  // Returns: 10 categories with generic examples
  
  // 3. If PDF provided, enhance with RAG
  if (pdfUrl && result.legalInfo.length > 0) {
    // Extract PDF text
    const pdfResponse = await fetch(pdfUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const { pages } = await extractTextWithPageNumbers(
      new Uint8Array(pdfBuffer)
    );
    
    // Create RAG system
    const leaseRAG = await createLeaseRAG(pages);
    
    // Analyze how each law applies to this lease
    const applications = await analyzeLawApplications(
      result.legalInfo,
      leaseRAG,
      leaseContext,
      locale
    );
    
    // Replace generic examples with lease-specific applications
    const enrichedLegalInfo = result.legalInfo.map((info, index) => ({
      ...info,
      example: applications[index]?.application || info.example
    }));
    
    return NextResponse.json({
      success: true,
      legalInfo: enrichedLegalInfo,
      searchMetadata: result.searchMetadata
    });
  }
  
  // 4. Return generic data if no PDF
  return NextResponse.json({
    success: true,
    ...result
  });
}
```

**Configuration:**
```typescript
export const maxDuration = 120; // 2 minutes timeout
```

**Error Handling:**
- Graceful fallback if RAG fails (keeps generic examples)
- Returns 400 if address missing
- Returns 500 on Perplexity failure

---

## Perplexity Integration

### File: `lib/perplexity-legal-search-real.ts`

### Purpose

Use Perplexity AI to search authoritative legal websites and return:
- Law explanations
- Statute citations
- Generic examples
- **Real source URLs** (not fake Google search links)

### How It Works

#### 1. Initialize Perplexity Client

```typescript
import Perplexity from '@perplexity-ai/perplexity_ai';

const client = new Perplexity({
  apiKey: process.env.PERPLEXITY_API_KEY,
});
```

#### 2. Define Legal Domains to Search

```typescript
const legalDomains = [
  'law.justia.com',      // Case law & statutes
  'law.cornell.edu',     // Legal Information Institute
  'nolo.com',            // Tenant law guides
  'hud.gov',             // HUD regulations
  'illinois.gov',        // State-specific (dynamic)
  'municode.com',        // Municipal codes
  'findlaw.com',         // Legal resources
];
```

#### 3. Create Search Query for Each Category

```typescript
const categoryPrompts: Record<string, string> = {
  'Security Deposit Terms': 
    `${state} security deposit law statute maximum amount return timeline`,
  'Rent Amount and Increase Provisions': 
    `${state} rent control rent increase notice law statute`,
  'Maintenance and Repair Responsibilities': 
    `${state} landlord tenant repair maintenance habitability law`,
  // ... 7 more categories
};
```

#### 4. Call Perplexity API

```typescript
const completion = await client.chat.completions.create({
  messages: [
    {
      role: 'user',
      content: `Find legal information about "Security Deposit Terms" 
                for tenants in Chicago, Illinois.
                
                Respond with:
                1. A clear explanation of what the law says (30 words max)
                2. The specific statute citation (e.g., "765 ILCS 715/1")
                3. A personalized example using: monthly rent $1,500, deposit $3,000
                
                Respond ONLY in JSON format:
                {
                  "explanation": "Clear explanation of the law",
                  "statute": "Statute citation",
                  "example": "Specific example using the lease numbers"
                }`
    }
  ],
  model: 'sonar', // Perplexity's search-optimized model
  web_search_options: {
    search_domain_filter: legalDomains,    // Only search legal sites
    search_recency_filter: 'year',         // Laws from last year
  },
});
```

#### 5. Extract Citations

```typescript
const content = completion.choices[0].message.content;
const citations = completion.citations || []; // Real URLs!

// Parse JSON response
const parsed = JSON.parse(content);

return {
  lawType: "Security Deposit Terms",
  explanation: parsed.explanation,
  example: parsed.example,
  statute: parsed.statute,
  sourceUrl: citations[0],  // First citation from Perplexity
  sourceTitle: "Illinois General Assembly"
};
```

#### 6. Process All 10 Categories in Parallel

```typescript
export async function searchLegalInfoWithPerplexity(
  userAddress: string,
  leaseContext?: { /* ... */ },
  locale: string = 'en'
) {
  // Parse address
  const state = "Illinois";
  const city = "Chicago";
  
  // Define 10 categories
  const categories = [
    'Security Deposit Terms',
    'Rent Amount and Increase Provisions',
    // ... 8 more
  ];
  
  // Search ALL categories in parallel
  const results = await Promise.all(
    categories.map(category =>
      getLegalInfoForCategory(category, state, city, leaseContext, locale)
    )
  );
  
  return {
    legalInfo: results.filter(r => r !== null),
    searchMetadata: {
      state,
      city,
      totalSources: results.length
    }
  };
}
```

### Perplexity Performance

- **Speed**: ~15-20 seconds for all 10 categories (parallel processing)
- **Cost**: ~$0.05 per request (10 Perplexity API calls)
- **Accuracy**: High (searches only authoritative legal sites)
- **Citations**: Real URLs with source verification

### Why Perplexity?

| Feature | Perplexity | GPT-4o | Google Search API |
|---------|------------|--------|-------------------|
| **Real-time web search** | ✅ Yes | ❌ No | ✅ Yes |
| **Source citations** | ✅ Real URLs | ❌ No | ⚠️ Search results only |
| **Domain filtering** | ✅ Yes | ❌ No | ⚠️ Limited |
| **Legal accuracy** | ✅ High | ⚠️ Training data | ⚠️ Varies |
| **Cost per 10 searches** | $0.05 | $0.02 (but no web access) | $0.50+ |

**Verdict:** Perplexity is ideal for this use case because it combines web search + AI understanding + real citations.

---

## RAG Integration

### File: `lib/lease-law-application.ts`

### Purpose

Use RAG (Retrieval Augmented Generation) to:
1. Find relevant sections in the uploaded lease
2. Compare what the LAW says vs. what the LEASE says
3. Generate lease-specific examples with page references

### How It Works

#### 1. Search Lease for Relevant Sections

```typescript
// Use multiple queries to find all relevant parts
const specificQueries = [
  `Find lease terms related to: ${lawType}`,
  `lease clauses about ${lawType.toLowerCase()}`,
  `tenant obligations for ${lawType.toLowerCase()}`,
  `landlord requirements for ${lawType.toLowerCase()}`,
  `timeline requirements for ${lawType.toLowerCase()}`,
  `conditions related to ${lawType.toLowerCase()}`
];

const allChunks: any[] = [];
for (const query of specificQueries) {
  const chunks = await leaseRAG.retrieve(query, 4); // 4 chunks per query
  allChunks.push(...chunks);
}

// Remove duplicates
const uniqueChunks = allChunks.filter((chunk, index, self) =>
  index === self.findIndex(c => c.text === chunk.text)
);

const relevantChunks = uniqueChunks.slice(0, 8); // Top 8 most relevant
```

#### 2. Combine Lease Text

```typescript
const leaseText = relevantChunks.map(c => c.text).join('\n\n');
```

#### 3. Call GPT-4o to Compare Law vs. Lease

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'system',
      content: `You are a tenant rights advisor. Compare what the LAW says 
                with what the LEASE says, and explain how this applies to the tenant.
                
                IMPORTANT:
                - Be specific about how the lease complies or conflicts with the law
                - Use the tenant's actual numbers (rent, deposit, dates) when relevant
                - If lease is silent on something the law requires, point that out
                - If lease violates the law, clearly state that
                - Provide detailed explanation (80-120 words) with full context
                - Write in second person ("Your lease says...", "You are entitled to...")
                - Include specific examples from the lease text
                - Explain the practical implications for the tenant`
    },
    {
      role: 'user',
      content: `LAW: ${lawType}
                "${lawText}"
                
                LEASE CONTEXT:
                - Monthly Rent: ${leaseContext.monthlyRent}
                - Security Deposit: ${leaseContext.securityDeposit}
                - Lease Start: ${leaseContext.leaseStart}
                - Lease End: ${leaseContext.leaseEnd}
                
                RELEVANT LEASE TEXT:
                "${leaseText}"
                
                Explain in 80-120 words how this law specifically applies to 
                THIS tenant's lease. Include specific examples from the lease text 
                and explain the practical implications for the tenant.`
    }
  ],
  temperature: 0.3,
  max_tokens: 200
});
```

#### 4. Return Lease-Specific Application

```typescript
return {
  application: completion.choices[0].message.content,
  relevantLeaseText: leaseText.slice(0, 800),
  hasMatch: true
};
```

### Example RAG Output

**Law:** Security Deposit Terms  
**Perplexity Explanation:** "Illinois limits security deposits to 1 month's rent."

**Generic Example (Address-Only):**
> "For a $1,500/month apartment, the maximum security deposit is $1,500. Landlord must return within 45 days."

**RAG-Enhanced Example (Full Analysis):**
> "Your lease (Section 5, page 3) requires a $2,250 security deposit for your $1,500/month apartment, which exceeds Illinois' legal limit of $1,500. You may be entitled to a refund of $750. Additionally, your lease states a 30-day return period, which is within the legal 45-day requirement. Request an itemized deduction list if any charges are made."

### RAG Performance

- **Speed**: +15-30 seconds additional processing time
- **Cost**: ~$0.10 per analysis (GPT-4o calls for 10 categories)
- **Accuracy**: High (uses actual lease text)
- **Personalization**: Very high (specific page numbers, sections, amounts)

---

## Prompt Engineering

### 🎯 Where to Update Prompts

There are **TWO prompts** that control the "Example" column:

#### Prompt #1: Generic Examples (Perplexity)

**Location:** `lib/perplexity-legal-search-real.ts` - Lines 71-83 (English) and 57-70 (Spanish)

**Controls:** Generic examples for Address-Only mode

**Current Prompt:**
```typescript
const userPrompt = `Find legal information about "${category}" 
for tenants in ${city ? `${city}, ` : ''}${state}.

Respond with:
1. A clear explanation of what the law says (30 words max)
2. The specific statute citation (e.g., "765 ILCS 715/1")
3. A personalized example using: monthly rent ${leaseContext?.monthlyRent || '$X'}, 
   deposit ${leaseContext?.securityDeposit || '$Y'}

Respond ONLY in JSON format:
{
  "explanation": "Clear explanation of the law",
  "statute": "Statute citation",
  "example": "Specific example using the lease numbers"
}`;
```

**How to Modify:**
- Change the example instructions (item #3)
- Adjust word count limits
- Add/remove context variables
- Change output format

**Example Modification:**
```typescript
// Before:
3. A personalized example using: monthly rent $X, deposit $Y

// After (more detailed):
3. A detailed practical example (40-60 words) showing:
   - How this law applies to a tenant paying ${monthlyRent} rent
   - Specific numbers and timelines
   - What actions the tenant should take
   - Common pitfalls to avoid
```

---

#### Prompt #2: Lease-Specific Examples (RAG + GPT-4o)

**Location:** `lib/lease-law-application.ts` - Lines 72-111

**Controls:** Lease-specific examples for Full Analysis mode

**Current Prompt (System Message):**
```typescript
{
  role: 'system',
  content: `You are a tenant rights advisor. Compare what the LAW says 
            with what the LEASE says, and explain how this applies to the tenant.
            
            IMPORTANT:
            - Be specific about how the lease complies or conflicts with the law
            - Use the tenant's actual numbers (rent, deposit, dates) when relevant
            - If lease is silent on something the law requires, point that out
            - If lease violates the law, clearly state that
            - Provide detailed explanation (80-120 words) with full context
            - Write in second person ("Your lease says...", "You are entitled to...")
            - Include specific examples from the lease text
            - Explain the practical implications for the tenant`
}
```

**Current Prompt (User Message):**
```typescript
{
  role: 'user',
  content: `LAW: ${lawType}
            "${lawText}"
            
            LEASE CONTEXT:
            - Monthly Rent: ${leaseContext.monthlyRent || 'Not specified'}
            - Security Deposit: ${leaseContext.securityDeposit || 'Not specified'}
            - Lease Start: ${leaseContext.leaseStart || 'Not specified'}
            - Lease End: ${leaseContext.leaseEnd || 'Not specified'}
            - Address: ${leaseContext.address || 'Not specified'}
            
            RELEVANT LEASE TEXT:
            "${leaseText}"
            
            Explain in 80-120 words how this law specifically applies to 
            THIS tenant's lease. Include specific examples from the lease text 
            and explain the practical implications for the tenant.`
}
```

**How to Modify:**

1. **Change Output Length:**
```typescript
// Before:
Provide detailed explanation (80-120 words) with full context

// After (shorter):
Provide concise explanation (40-60 words) highlighting key points
```

2. **Change Tone:**
```typescript
// Before:
Write in second person ("Your lease says...")

// After (more formal):
Write in third person ("The lease states...")
```

3. **Add Specific Instructions:**
```typescript
IMPORTANT:
- Be specific about how the lease complies or conflicts with the law
- Use the tenant's actual numbers (rent, deposit, dates) when relevant
- ALWAYS include the specific page number where info was found  // ← NEW
- ALWAYS quote the exact lease language in quotes  // ← NEW
- Rate the compliance on a scale of "Complies", "Partial", or "Violates"  // ← NEW
```

4. **Change Model Settings:**
```typescript
// Line 109-110
temperature: 0.3,     // Lower = more consistent, Higher = more creative
max_tokens: 200,      // Increase for longer responses
```

---

### 💡 Prompt Modification Best Practices

1. **Test with both modes** - Changes affect Address-Only OR Full Analysis
2. **Consider token limits** - Longer prompts = higher costs
3. **Maintain JSON format** - Perplexity prompt requires strict JSON output
4. **Balance detail vs. brevity** - Too long = user won't read, too short = not helpful
5. **Include examples in prompt** - Shows AI what good output looks like
6. **Use constraints** - Word limits, must-include elements, formatting rules
7. **Test in both languages** - Spanish prompts may need different instructions

---

## Data Structures

### VerifiedLegalInfo (Frontend Interface)

```typescript
interface VerifiedLegalInfo {
  lawType: string;           // Category name (e.g., "Security Deposit Terms")
  explanation: string;       // What the law says (from Perplexity)
  example: string;          // Generic OR lease-specific application
  statute?: string;         // Legal citation (e.g., "765 ILCS 715/1")
  sourceUrl: string;        // Citation URL from Perplexity
  sourceTitle: string;      // Display name for the link
  hasMatch?: boolean;       // True if RAG found relevant lease text
}
```

### PerplexityLegalInfo (Backend Interface)

```typescript
interface PerplexityLegalInfo {
  lawType: string;
  explanation: string;
  example: string;
  sourceUrl: string;
  sourceTitle: string;
  statute?: string;
}
```

### API Request Body

```typescript
interface ComprehensiveLegalInfoRequest {
  userAddress: string;      // Required: "123 Main St, Chicago, Illinois"
  pdfUrl?: string;          // Optional: Signed URL to uploaded PDF
  leaseContext?: {          // Optional: Extracted from lease
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
  };
}
```

### API Response

```typescript
interface ComprehensiveLegalInfoResponse {
  success: boolean;
  legalInfo: VerifiedLegalInfo[];  // Array of 10 categories
  searchMetadata: {
    state: string;                 // e.g., "Illinois"
    city: string;                  // e.g., "Chicago"
    totalSources: number;          // Usually 10
    verifiedSources?: number;      // How many have real URLs
    rejectedSources?: number;      // How many failed
  };
}
```

---

## Performance & Costs

### Performance Metrics

| Metric | Address-Only Mode | Full Analysis Mode |
|--------|-------------------|-------------------|
| **Processing Time** | 15-20 seconds | 30-45 seconds |
| **API Calls** | 10 Perplexity | 10 Perplexity + 10 GPT-4o |
| **PDF Processing** | N/A | ~5 seconds |
| **Embedding Creation** | N/A | ~10 seconds (if not cached) |
| **RAG Queries** | N/A | ~60 queries (6 per category) |
| **Total Time (First Load)** | 15-20s | 30-45s |
| **Total Time (Cached)** | 15-20s | 20-30s |

### Cost Breakdown

#### Address-Only Mode
```
Perplexity API:
- 10 searches @ $0.005 each = $0.05

Total: ~$0.05 per request
```

#### Full Analysis Mode
```
Perplexity API:
- 10 searches @ $0.005 each = $0.05

OpenAI Embeddings:
- 50 chunks × 500 tokens = 25,000 tokens
- @ $0.00002 per 1K tokens = $0.0005

OpenAI GPT-4o (RAG Analysis):
- 10 categories × 2,000 input tokens = 20,000 tokens input
- 10 categories × 150 output tokens = 1,500 tokens output
- Input: 20K × $5/1M = $0.10
- Output: 1.5K × $15/1M = $0.02

Total: ~$0.17 per request
```

### Optimization Opportunities

1. **Cache Perplexity Results**
   - Same state/city → same legal info
   - Could save to database for 30 days
   - Savings: ~$0.05 per repeat user

2. **Reuse RAG Chunks**
   - Already implemented! Chunks stored in Supabase
   - Embeddings only created once per lease
   - Savings: ~$0.10 on subsequent analyses

3. **Use GPT-4o-mini**
   - For RAG analysis (not critical reasoning)
   - Cost: $0.15/$0.60 per 1M tokens (vs. $5/$15)
   - Savings: ~87% on GPT costs

4. **Batch Perplexity Calls**
   - Already doing this! (Promise.all)
   - 10 parallel calls = 3-4x faster than sequential

---

## UI/UX Features

### 1. Auto-Loading

**Feature:** Table automatically loads when component mounts

**Implementation:**
```typescript
useEffect(() => {
  if (userAddress && !hasLoadedRef.current) {
    fetchLegalInfo();
  }
}, [userAddress]);
```

**Benefits:**
- No "Load Rights" button needed
- Seamless user experience
- Reduces clicks

---

### 2. Search Functionality

**Feature:** Live search filtering across all fields

**Implementation:**
```typescript
const filtered = legalInfo.filter(item =>
  item.lawType.toLowerCase().includes(term) ||
  item.explanation.toLowerCase().includes(term) ||
  item.example.toLowerCase().includes(term) ||
  (item.statute && item.statute.toLowerCase().includes(term))
);
```

**Searchable Fields:**
- Law Type (e.g., "Security Deposit")
- Explanation text
- Example text
- Statute citation

---

### 3. Responsive Design

**Desktop View:**
- Full 5-column table
- Sortable columns
- Hover effects

**Mobile View:**
- Card-based layout
- Expandable sections
- Touch-friendly

---

### 4. Loading States

**Initial Load:**
```
[Spinning animation]
"Searching authoritative legal sources..."
"This may take 10-20 seconds"
```

**Benefits:**
- Sets user expectations
- Reduces perceived wait time
- Professional appearance

---

### 5. External Links

**Feature:** Clickable source citations

```tsx
<a
  href={item.sourceUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="text-purple-600 hover:text-purple-700"
>
  <ExternalLink className="w-3 h-3" />
  {item.sourceTitle}
</a>
```

**Security:**
- `target="_blank"` - Opens in new tab
- `rel="noopener noreferrer"` - Security best practice

---

### 6. Empty States

**No Results:**
```tsx
{filteredInfo.length === 0 && (
  <div className="text-center py-12">
    <p>No results found for "{searchTerm}"</p>
    <Button onClick={() => setSearchTerm('')}>Clear Search</Button>
  </div>
)}
```

---

### 7. Disclaimer

**Footer Message:**
> "⚠️ This information is educational. Consult a lawyer for legal advice."

**Purpose:**
- Legal protection
- Sets appropriate expectations
- Encourages professional consultation

---

## Internationalization

### Supported Languages

- 🇺🇸 **English** (default)
- 🇪🇸 **Spanish** (full support)

### Implementation

**1. Locale Detection:**
```typescript
const locale = request.cookies.get('locale')?.value || 'en';
```

**2. Translated Categories:**
```typescript
const categories = locale === 'es' ? [
  'Términos del Depósito de Seguridad',
  'Disposiciones sobre Monto y Aumento de Renta',
  // ... 8 more in Spanish
] : [
  'Security Deposit Terms',
  'Rent Amount and Increase Provisions',
  // ... 8 more in English
];
```

**3. Perplexity Prompts:**
```typescript
const userPrompt = locale === 'es' 
  ? `Encuentra información legal sobre "${category}" para inquilinos en ${state}.
     Responde en español simple con:
     1. Una explicación clara...
     2. La cita del estatuto...
     3. Un ejemplo personalizado...`
  : `Find legal information about "${category}" for tenants in ${state}.
     Respond with:
     1. A clear explanation...
     2. The specific statute...
     3. A personalized example...`;
```

**4. RAG Prompts:**
```typescript
const languageInstruction = locale === 'es' 
  ? '\n\nThis output is for a Spanish speaking tenant. Please output in simple spanish terms so that tenants can understand.' 
  : '';
```

**5. UI Text:**
```typescript
import { useTranslations } from 'next-intl';

const t = useTranslations();

<TableHead>{t('ResultsPage.table.headers.lawType')}</TableHead>
<TableHead>{t('ResultsPage.table.headers.whatItSays')}</TableHead>
<TableHead>{t('ResultsPage.table.headers.example')}</TableHead>
<TableHead>{t('ResultsPage.table.headers.statute')}</TableHead>
<TableHead>{t('ResultsPage.table.headers.source')}</TableHead>
```

### Translation Files

**Location:** `messages/en.json` and `messages/es.json`

---

## Error Handling

### 1. Missing Address

```typescript
if (!userAddress) {
  return NextResponse.json(
    { error: 'User address is required' },
    { status: 400 }
  );
}
```

---

### 2. Perplexity API Failure

```typescript
try {
  const completion = await client.chat.completions.create({ /* ... */ });
} catch (error) {
  return null; // Fail gracefully, exclude this category
}
```

**Result:** If 1-2 categories fail, others still display

---

### 3. RAG Analysis Failure

```typescript
if (pdfUrl && result.legalInfo.length > 0) {
  try {
    // ... RAG processing ...
  } catch (ragError) {
    console.error('⚠️ RAG analysis failed, returning generic examples:', ragError);
    // Continue with Perplexity data only
  }
}
```

**Result:** Falls back to generic examples

---

### 4. PDF Processing Failure

```typescript
try {
  const pdfResponse = await fetch(pdfUrl);
  const pdfBuffer = await pdfResponse.arrayBuffer();
  const { pages } = await extractTextWithPageNumbers(new Uint8Array(pdfBuffer));
} catch (error) {
  // RAG block will be skipped, generic examples used
}
```

---

### 5. Embedding Creation Failure

```typescript
try {
  const leaseRAG = await createLeaseRAG(pages);
} catch (error) {
  console.error('Embedding creation failed:', error);
  throw error; // Caught by outer try-catch, falls back to generic
}
```

---

### 6. Frontend Error Display

```tsx
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <AlertCircle className="w-5 h-5 text-red-600" />
    <p className="text-sm font-semibold text-red-900">
      Error loading legal information
    </p>
    <p className="text-xs text-red-700">{error}</p>
  </div>
)}
```

---

## Troubleshooting

### Problem: "No results found" / Empty table

**Possible Causes:**
1. Perplexity API key missing/invalid
2. Address format not recognized
3. All 10 Perplexity calls failed

**Debug Steps:**
```typescript
// 1. Check API key
console.log('Perplexity API Key:', process.env.PERPLEXITY_API_KEY ? 'Set' : 'Missing');

// 2. Check address parsing
const addressParts = userAddress.split(',').map(s => s.trim());
console.log('State:', addressParts[addressParts.length - 2]);
console.log('City:', addressParts[addressParts.length - 3]);

// 3. Check Perplexity response
console.log('Perplexity response:', completion);
console.log('Citations:', completion.citations);
```

**Solution:**
- Verify `PERPLEXITY_API_KEY` in `.env.local`
- Ensure address format: "Street, City, State"
- Check Perplexity API status

---

### Problem: Generic examples even with lease uploaded

**Possible Causes:**
1. `pdfUrl` not provided to component
2. RAG analysis failed silently
3. Embeddings not created

**Debug Steps:**
```typescript
// 1. Check pdfUrl prop
console.log('PDF URL:', pdfUrl);

// 2. Check RAG execution
console.log('Starting RAG analysis...');
const leaseRAG = await createLeaseRAG(pages);
console.log('RAG created successfully');

// 3. Check applications
console.log('Applications:', applications);
```

**Solution:**
- Verify lease PDF is uploaded to Supabase storage
- Check Supabase storage URL permissions
- Verify OpenAI API key for embeddings

---

### Problem: "Searching..." spinner never finishes

**Possible Causes:**
1. Timeout exceeded (120s limit)
2. Perplexity API hanging
3. PDF too large/complex

**Debug Steps:**
```typescript
// Add timeout logging
const startTime = Date.now();
const result = await searchLegalInfoWithPerplexity(/* ... */);
console.log(`Perplexity took ${Date.now() - startTime}ms`);
```

**Solution:**
- Check Vercel function logs for timeout errors
- Reduce PDF size (split large leases)
- Increase `maxDuration` if needed

---

### Problem: Spanish output mixed with English

**Possible Causes:**
1. Locale cookie not set
2. Perplexity ignoring language instruction
3. Translation files incomplete

**Debug Steps:**
```typescript
// 1. Check locale
const locale = request.cookies.get('locale')?.value || 'en';
console.log('Detected locale:', locale);

// 2. Check prompt
console.log('Perplexity prompt:', userPrompt);

// 3. Check response language
console.log('Explanation language:', parsed.explanation);
```

**Solution:**
- Set locale cookie in middleware
- Strengthen language instruction in Perplexity prompt
- Add "Respond ENTIRELY in Spanish" emphasis

---

### Problem: Sources showing "No source available"

**Possible Causes:**
1. Perplexity didn't return citations
2. Domain filter too restrictive
3. No results found for that category

**Debug Steps:**
```typescript
console.log('Citations array:', completion.citations);
console.log('Citations length:', citations.length);
console.log('First citation:', citations[0]);
```

**Solution:**
- Broaden domain filter
- Adjust search query
- Add fallback domains (e.g., `.org` sites)

---

### Problem: RAG examples too generic / not specific

**Possible Causes:**
1. RAG not finding relevant chunks
2. Chunk similarity threshold too high
3. Prompt not emphasizing specificity

**Debug Steps:**
```typescript
console.log('Chunks found:', relevantChunks.length);
console.log('Chunk text:', relevantChunks[0].text);
console.log('RAG query:', specificQueries);
```

**Solution:**
- Adjust RAG query specificity (lines 32-39 in `lease-law-application.ts`)
- Increase chunk limit (currently 8, could go to 12)
- Strengthen prompt: "MUST include page numbers and section references"

---

## API Reference

### POST `/api/comprehensive-legal-info`

**Description:** Get comprehensive legal information for a specific address, with optional lease-specific examples.

**Request:**
```typescript
{
  userAddress: string;      // Required: "123 Main St, Chicago, Illinois"
  pdfUrl?: string;          // Optional: URL to lease PDF
  leaseContext?: {          // Optional: Lease metadata
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
  }
}
```

**Response (Success - 200):**
```typescript
{
  success: true,
  legalInfo: [
    {
      lawType: "Security Deposit Terms",
      explanation: "Illinois limits security deposits to 1 month's rent...",
      example: "For your $1,500/month apartment...",
      statute: "765 ILCS 715/1",
      sourceUrl: "https://www.ilga.gov/...",
      sourceTitle: "Illinois General Assembly",
      hasMatch: true  // Only present in Full Analysis mode
    },
    // ... 9 more categories
  ],
  searchMetadata: {
    state: "Illinois",
    city: "Chicago",
    totalSources: 10,
    verifiedSources: 10,
    rejectedSources: 0
  }
}
```

**Response (Error - 400):**
```typescript
{
  error: "User address is required"
}
```

**Response (Error - 500):**
```typescript
{
  error: "Failed to search legal information",
  details: "Perplexity API error: ..."
}
```

**Configuration:**
- **Max Duration:** 120 seconds
- **Method:** POST
- **Content-Type:** application/json

---

## Summary

### Key Takeaways

1. **Hybrid Architecture**: Perplexity for law + RAG for lease-specific examples
2. **Two Modes**: Address-Only (fast) vs. Full Analysis (personalized)
3. **Real Sources**: Perplexity provides actual legal website citations
4. **Parallel Processing**: All 10 categories processed simultaneously
5. **Graceful Degradation**: Falls back to generic examples if RAG fails
6. **Bilingual Support**: Full English + Spanish support
7. **Cost Efficient**: ~$0.05 (address-only) to ~$0.17 (full analysis)
8. **User-Friendly**: Auto-loading, search, responsive design

### Files to Know

| File | Purpose |
|------|---------|
| `components/ComprehensiveLegalTable.tsx` | Main UI component |
| `app/api/comprehensive-legal-info/route.ts` | Orchestration API |
| `lib/perplexity-legal-search-real.ts` | Perplexity integration |
| `lib/lease-law-application.ts` | RAG analysis |
| `lib/rag-system.ts` | RAG core functionality |

---

**Last Updated:** November 14, 2024  
**Version:** 2.0  
**Author:** LeaseWise Development Team

