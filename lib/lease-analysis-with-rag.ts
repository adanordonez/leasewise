import OpenAI from 'openai';
import { LeaseRAGSystem } from './rag-system';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface StructuredLeaseDataWithRAG {
  building_name: string;
  property_address: string;
  monthly_rent: number;
  security_deposit: number;
  lease_start_date: string;
  lease_end_date: string;
  notice_period_days: number;
  property_type: string;
  square_footage?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_spaces?: number;
  pet_policy: string;
  utilities_included: string[];
  amenities: string[];
  landlord_name?: string;
  management_company?: string;
  contact_email?: string;
  contact_phone?: string;
  lease_terms: string[];
  special_clauses: string[];
  market_analysis: {
    rent_percentile: number;
    deposit_status: string;
    rent_analysis: string;
  };
  red_flags: Array<{
    issue: string;
    severity: string;
    explanation: string;
    source_chunk_id?: string; // Reference to chunk
  }>;
  tenant_rights: Array<{
    right: string;
    law: string;
    source_chunk_id?: string;
  }>;
  key_dates: Array<{
    event: string;
    date: string;
    description: string;
    source_chunk_id?: string;
  }>;
}

/**
 * Analyze lease using RAG for accurate source attribution
 */
export async function analyzeLeaseWithRAG(
  rag: LeaseRAGSystem,
  address: string,
  locale: string = 'en'
): Promise<StructuredLeaseDataWithRAG> {
  
  // Get relevant context from RAG system
  const rentalContext = await rag.buildContext('monthly rent security deposit lease dates', 5);
  const redFlagsContext = await rag.buildContext('fees penalties restrictions obligations', 5);
  const rightsContext = await rag.buildContext('tenant rights repairs maintenance', 5);

  const languageInstruction = locale === 'es' 
    ? '\n\nThis output is for a Spanish speaking tenant. Please output in simple spanish terms so that tenants can understand.' 
    : '';

  const prompt = `You are a real estate data extraction expert analyzing a residential lease agreement.

RELEVANT LEASE CONTEXT (with page numbers):
${rentalContext}

RED FLAGS CONTEXT:
${redFlagsContext}

TENANT RIGHTS CONTEXT:
${rightsContext}

TENANT ADDRESS: ${address}

Extract and structure the following data into a comprehensive JSON format. Be as specific and accurate as possible.

IMPORTANT: When you identify red flags, tenant rights, or key dates, note which [CHUNK X] the information came from.

Return JSON in this format:
{
  "building_name": "Name of the building or complex",
  "property_address": "Full property address",
  "monthly_rent": 0,
  "security_deposit": 0,
  "lease_start_date": "YYYY-MM-DD",
  "lease_end_date": "YYYY-MM-DD",
  "notice_period_days": 0,
  "property_type": "apartment|house|condo|townhouse|studio|other",
  "square_footage": 0,
  "bedrooms": 0,
  "bathrooms": 0,
  "parking_spaces": 0,
  "pet_policy": "Detailed pet policy",
  "utilities_included": ["list"],
  "amenities": ["list"],
  "landlord_name": "Name",
  "management_company": "Company",
  "contact_email": "email",
  "contact_phone": "phone",
  "lease_terms": ["key terms"],
  "special_clauses": ["notable clauses"],
  "market_analysis": {
    "rent_percentile": 50,
    "deposit_status": "standard",
    "rent_analysis": "Market analysis not available - analysis focuses on lease terms only"
  },
  "red_flags": [
    {
      "issue": "Description",
      "severity": "high|medium|low",
      "explanation": "Why problematic",
      "source_chunk_id": "CHUNK 1" (which chunk this came from)
    }
  ],
  "tenant_rights": [
    {
      "right": "Tenant right or provision found in the lease",
      "law": "Section or clause reference from the lease (NOT external laws)",
      "source_chunk_id": "CHUNK 2"
    }
  ],
  "key_dates": [
    {
      "event": "Event",
      "date": "YYYY-MM-DD",
      "description": "What happens",
      "source_chunk_id": "CHUNK 3"
    }
  ]
}

CRITICAL REQUIREMENTS:
- Extract ONLY information explicitly stated in the lease chunks above
- DO NOT reference external laws, statutes, or regulations
- DO NOT make assumptions about market conditions or typical practices
- For "tenant_rights", ONLY list rights/provisions explicitly stated IN THE LEASE
- For "tenant_rights" "law" field, reference the lease section/clause, NOT external statutes
- Note which CHUNK each piece of information came from
- NEVER cite or reference laws that are not explicitly mentioned in the lease chunks${languageInstruction}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a lease data extraction expert. Extract ONLY information explicitly stated in the provided lease chunks. Do NOT reference external laws, market data, or general knowledge. Return ONLY valid JSON with exact information from the lease. Note which CHUNK each piece of information came from."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const result = completion.choices[0].message.content;
  return JSON.parse(result || '{}');
}

/**
 * Map chunk IDs from AI response to actual chunks and extract sources
 * Uses specific queries for each data point for better accuracy
 */
export async function enrichWithSources(
  analysis: StructuredLeaseDataWithRAG,
  rag: LeaseRAGSystem
): Promise<any> {
  // console.log('🔍 Finding exact sources for each data point...');
  
  // Enrich red flags with specific queries
  const enrichedRedFlags = await Promise.all(
    analysis.red_flags.map(async (flag) => {
      // Create a very specific query for this red flag
      const query = `${flag.issue} ${flag.explanation}`;
      const source = await rag.findSource(query, '');
      
      return {
        ...flag,
        source: source?.text || undefined,
        page_number: source?.pageNumber || undefined,
      };
    })
  );

  // Enrich tenant rights with specific queries
  const enrichedRights = await Promise.all(
    analysis.tenant_rights.map(async (right) => {
      // Query for the specific right mentioned
      const query = `${right.right} tenant obligations responsibilities`;
      const source = await rag.findSource(query, '');
      
      return {
        ...right,
        source: source?.text || undefined,
        page_number: source?.pageNumber || undefined,
      };
    })
  );

  // Enrich key dates with specific queries
  const enrichedDates = await Promise.all(
    analysis.key_dates.map(async (date) => {
      // Query for the specific date and event
      const query = `${date.event} ${date.date} ${date.description}`;
      const source = await rag.findSource(query, '');
      
      return {
        ...date,
        source: source?.text || undefined,
        page_number: source?.pageNumber || undefined,
      };
    })
  );

  // console.log('💰 Finding sources for financial terms...');
  // For summary fields, use very specific queries
  const monthlyRentSource = await rag.findSource(
    `monthly rent payment ${analysis.monthly_rent} dollars per month due`, 
    'rent amount payment'
  );
  
  const securityDepositSource = await rag.findSource(
    `security deposit ${analysis.security_deposit} refundable`, 
    'deposit amount'
  );
  
  const leaseStartSource = await rag.findSource(
    `lease begins start commence ${analysis.lease_start_date}`, 
    'lease term start date'
  );
  
  const leaseEndSource = await rag.findSource(
    `lease ends terminate expiration ${analysis.lease_end_date}`, 
    'lease term end date'
  );
  
  const noticePeriodSource = await rag.findSource(
    `notice termination ${analysis.notice_period_days} days advance written`, 
    'notice period termination'
  );

  const sources = {
    monthly_rent: monthlyRentSource?.text,
    security_deposit: securityDepositSource?.text,
    lease_start_date: leaseStartSource?.text,
    lease_end_date: leaseEndSource?.text,
    notice_period: noticePeriodSource?.text,
  };

  const pageNumbers = {
    monthly_rent: monthlyRentSource?.pageNumber,
    security_deposit: securityDepositSource?.pageNumber,
    lease_start_date: leaseStartSource?.pageNumber,
    lease_end_date: leaseEndSource?.pageNumber,
    notice_period: noticePeriodSource?.pageNumber,
  };

  // console.log('✅ Source enrichment complete');

  return {
    ...analysis,
    red_flags: enrichedRedFlags,
    tenant_rights: enrichedRights,
    key_dates: enrichedDates,
    sources,
    page_numbers: pageNumbers,
  };
}

