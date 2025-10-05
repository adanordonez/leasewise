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
