import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface StructuredLeaseData {
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
    source?: string;
    page_number?: number;
  }>;
  tenant_rights: Array<{
    right: string;
    law: string;
    source?: string;
    page_number?: number;
  }>;
  key_dates: Array<{
    event: string;
    date: string;
    description: string;
    source?: string;
    page_number?: number;
  }>;
  sources?: {
    monthly_rent?: string;
    security_deposit?: string;
    lease_start_date?: string;
    lease_end_date?: string;
    notice_period?: string;
  };
  page_numbers?: {
    monthly_rent?: number;
    security_deposit?: number;
    lease_start_date?: number;
    lease_end_date?: number;
    notice_period?: number;
  };
}

export async function analyzeLeaseStructured(leaseText: string, address: string): Promise<StructuredLeaseData> {
  const prompt = `You are a real estate data extraction expert analyzing a residential lease agreement. 

LEASE TEXT:
${leaseText}

TENANT ADDRESS: ${address}

Extract and structure the following data into a comprehensive JSON format. Be as specific and accurate as possible.

CRITICAL: For each piece of information you extract (especially red flags, tenant rights, and key dates), also provide the EXACT TEXT from the lease document where you found this information. This will be shown to users so they can verify the accuracy of the extraction.

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
  "pet_policy": "Detailed pet policy including fees, restrictions, etc.",
  "utilities_included": ["list", "of", "included", "utilities"],
  "amenities": ["list", "of", "building", "amenities"],
  "landlord_name": "Name of landlord if mentioned",
  "management_company": "Management company name if mentioned",
  "contact_email": "Contact email if provided",
  "contact_phone": "Contact phone if provided",
  "lease_terms": ["key", "lease", "terms", "and", "conditions"],
  "special_clauses": ["unusual", "or", "notable", "clauses"],
  "market_analysis": {
    "rent_percentile": 50,
    "deposit_status": "standard",
    "rent_analysis": "Market analysis not available - analysis focuses on lease terms only"
  },
  "red_flags": [
    {
      "issue": "Description of potential issue",
      "severity": "high|medium|low",
      "explanation": "Why this is problematic",
      "source": "Exact text from the lease that shows this issue (1-3 sentences)"
    }
  ],
  "tenant_rights": [
    {
      "right": "Tenant right or provision found in the lease",
      "law": "Section or clause reference from the lease (NOT external laws)",
      "source": "Exact text from the lease that mentions this right (1-3 sentences)"
    }
  ],
  "key_dates": [
    {
      "event": "Important event or deadline",
      "date": "YYYY-MM-DD",
      "description": "What needs to happen",
      "source": "Exact text from the lease that specifies this date (1-2 sentences)"
    }
  ],
  "sources": {
    "monthly_rent": "Exact text from lease showing the monthly rent amount",
    "security_deposit": "Exact text from lease showing the security deposit amount",
    "lease_start_date": "Exact text from lease showing the start date",
    "lease_end_date": "Exact text from lease showing the end date",
    "notice_period": "Exact text from lease showing the notice period requirements"
  }
}

CRITICAL REQUIREMENTS:
- Extract ONLY information explicitly stated in the lease document above
- DO NOT reference external laws, statutes, or regulations
- DO NOT make assumptions about market conditions or typical practices
- Extract actual numbers, dates, and amounts directly from the lease
- If information is not available in the lease, use null or appropriate defaults
- Be specific about property details found in the lease (sq ft, bedrooms, etc.)
- For "tenant_rights", ONLY list rights/provisions explicitly stated IN THE LEASE
- For "tenant_rights" "law" field, reference the lease section/clause, NOT external statutes
- Ensure all dates are in YYYY-MM-DD format
- Make sure all monetary amounts are numbers, not strings

SOURCE TEXT REQUIREMENTS:
- For every source field, provide the EXACT text as it appears in the lease document
- Keep source excerpts concise (1-3 sentences maximum)
- Include enough context to be meaningful but not the entire section
- If multiple sections relate to the same item, choose the most relevant excerpt
- Do not paraphrase - use the exact wording from the lease
- NEVER cite or reference laws that are not explicitly mentioned in the lease text`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a lease data extraction expert. Extract ONLY information explicitly stated in the provided lease document. Do NOT reference external laws, market data, or general knowledge. Return ONLY valid JSON with exact information from the lease."
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

export async function generateActionableScenarios(leaseText: string, address: string) {
  const prompt = `Based on this lease and location (${address}), generate 4 common tenant scenarios with specific advice.

LEASE: ${leaseText}

Provide JSON:
{
  "scenarios": [
    {
      "title": "What if something breaks?",
      "advice": "specific steps based on this lease"
    },
    {
      "title": "Getting my deposit back",
      "advice": "specific timeline and process"
    },
    {
      "title": "Landlord entry rules", 
      "advice": "specific notice requirements"
    },
    {
      "title": "Breaking my lease early",
      "advice": "specific penalties and process"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const result = completion.choices[0].message.content;
  return JSON.parse(result || '{}');
}
