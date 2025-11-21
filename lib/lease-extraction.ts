import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface BasicLeaseInfo {
  monthly_rent: number;
  security_deposit: number;
  building_name: string;
  property_address: string;
  lease_start_date: string;
  lease_end_date: string;
  property_type: string;
  square_footage?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities: string[];
  utilities_included: string[];
  landlord_name?: string;
  management_company?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface DetailedLeaseSummary {
  tenant_names: string[];
  apartment_unit?: string;
  administrative_fee?: number;
  rent_concession?: number;
  late_fee_day?: number;
  late_fee_amount?: number;
  late_fee_formula?: string;
  returned_payment_fee?: number;
  lease_renewal_type?: string;
  move_out_notice_days?: number;
  move_out_notice_consequence?: string;
  insurance_required?: boolean;
  insurance_min_coverage?: number;
  insurance_violation_fee?: number;
  utilities?: {
    resident_responsibility?: string[];
    owner_allocated?: string[];
    owner_flat_rate?: string[];
  };
  utility_admin_fee?: number;
  utility_setup_fee?: number;
  utility_processing_fee?: number;
  early_termination?: {
    notice_days?: number;
    buyout_fee?: number;
    buyout_formula?: string;
    concession_repayment?: number;
  };
  smoking_policy?: string;
  smoking_violation_fee?: number;
  guest_policy?: string;
  guest_limit_days?: number;
  pet_policy?: string;
  pet_fees_paid?: number;
}

export async function extractBasicLeaseInfo(leaseText: string, userAddress: string): Promise<BasicLeaseInfo> {
  const prompt = `You are a data extraction specialist. Extract ONLY the basic lease information from the provided lease text.

LEASE TEXT:
${leaseText}

USER ADDRESS (for context): ${userAddress}

Extract the following information and return it as a JSON object. Be precise and use the specified data types. If a field is not found, use null for numbers/strings, empty array for arrays.

{
  "monthly_rent": 0,
  "security_deposit": 0,
  "building_name": "string",
  "property_address": "string",
  "lease_start_date": "YYYY-MM-DD",
  "lease_end_date": "YYYY-MM-DD",
  "property_type": "apartment|house|condo|townhouse|studio|other",
  "square_footage": 0,
  "bedrooms": 0,
  "bathrooms": 0,
  "amenities": ["list", "of", "amenities"],
  "utilities_included": ["list", "of", "utilities"],
  "landlord_name": "string",
  "management_company": "string",
  "contact_email": "string",
  "contact_phone": "string"
}

IMPORTANT:
- Extract actual numbers, dates, and amounts from the lease
- For monthly_rent and security_deposit, use numbers only (e.g., 1500, not $1,500)
- For dates, use YYYY-MM-DD format
- For property_type, choose the most appropriate category
- Be specific about property details (sq ft, bedrooms, etc.)
- Include all contact information if available
- Focus on data that would be valuable for property management companies`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a data extraction specialist. Extract lease information accurately and return only valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.1, // Low temperature for consistent extraction
  });

  const result = completion.choices[0].message.content;
  return JSON.parse(result || '{}');
}

export async function extractDetailedSummary(leaseText: string, userAddress: string, locale: string = 'en'): Promise<DetailedLeaseSummary> {
  const languageInstruction = locale === 'es' 
    ? '\n\nIMPORTANT: All text descriptions (policies, formulas, consequences) must be written in SPANISH. Numbers, dates, and field names remain in English for the JSON structure, but all descriptive text content should be in Spanish.'
    : '';
  
  const prompt = `You are a detailed lease information extraction specialist. Extract ALL specific terms, fees, policies, and requirements from the lease.

LEASE TEXT:
${leaseText}

USER ADDRESS (for context): ${userAddress}

Extract detailed lease information and return it as a JSON object. Be extremely precise with numbers, formulas, and policy details. If a field is not found, use null.${languageInstruction}

{
  "tenant_names": ["array of full tenant/lessee/resident names"],
  "apartment_unit": "unit number if specified",
  "administrative_fee": 0,
  "rent_concession": 0,
  "late_fee_day": 0,
  "late_fee_amount": 0,
  "late_fee_formula": "exact formula or description of late fee calculation",
  "returned_payment_fee": 0,
  "lease_renewal_type": "automatic|non-automatic|month-to-month|other",
  "move_out_notice_days": 0,
  "move_out_notice_consequence": "description of what happens if notice not given",
  "insurance_required": true/false,
  "insurance_min_coverage": 0,
  "insurance_violation_fee": 0,
  "utilities": {
    "resident_responsibility": ["list utilities tenant must contract/pay"],
    "owner_allocated": ["list utilities provided but charged back via allocation"],
    "owner_flat_rate": ["list utilities provided at flat rate"]
  },
  "utility_admin_fee": 0,
  "utility_setup_fee": 0,
  "utility_processing_fee": 0,
  "early_termination": {
    "notice_days": 0,
    "buyout_fee": 0,
    "buyout_formula": "description of how buyout is calculated",
    "concession_repayment": 0
  },
  "smoking_policy": "description of smoking/vaping policy",
  "smoking_violation_fee": 0,
  "guest_policy": "description of guest restrictions",
  "guest_limit_days": 0,
  "pet_policy": "description of animal/pet policy",
  "pet_fees_paid": 0
}

IMPORTANT EXTRACTION RULES:
- Extract EXACT numbers, amounts, and formulas as written in the lease
- For fees: extract the base amount AND the formula/description (e.g., "$10.00 plus 5% of rent over $500")
- For policies: extract the complete policy text, not summaries
- For tenant names: extract ALL names listed as lessees/residents/tenants
- For utilities: carefully categorize into resident responsibility, owner allocated, or flat rate
- For early termination: extract all components (notice period, fees, formulas, conditions)
- For insurance: extract coverage amounts, requirements, and violation fees
- Be specific about day counts (e.g., "5th day of month", "60 days notice")
- If a section doesn't exist in the lease, use null for that field
- Extract monetary amounts as numbers only (e.g., 550, not $550)`;

  const systemContent = locale === 'es'
    ? "You are a detailed lease extraction specialist. Extract all specific terms, fees, policies, and requirements accurately. All text descriptions must be in SPANISH. Return only valid JSON."
    : "You are a detailed lease extraction specialist. Extract all specific terms, fees, policies, and requirements accurately. Return only valid JSON.";
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemContent
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.1, // Low temperature for consistent extraction
  });

  const result = completion.choices[0].message.content;
  return JSON.parse(result || '{}');
}
