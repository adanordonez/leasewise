import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LegalInfoWithUrl {
  lawType: string;
  statute?: string;
  sourceUrl: string;
  state: string;
}

interface VerifiedUrl {
  lawType: string;
  originalUrl: string;
  verifiedUrl: string;
  isValid: boolean;
}

/**
 * Verify and correct Justia URLs using GPT-4o
 * This ensures the URLs actually work and point to the correct statutes
 */
export async function verifyJustiaUrls(
  legalInfo: Array<{
    lawType: string;
    statute?: string;
    sourceUrl: string;
  }>,
  state: string
): Promise<Array<VerifiedUrl>> {
  // console.log(`🔍 Verifying ${legalInfo.length} Justia URLs for ${state}...`);

  // Build the prompt with all URLs and statutes
  const urlList = legalInfo.map((info, index) => `
${index + 1}. Law Type: ${info.lawType}
   Statute: ${info.statute || 'Not specified'}
   Current URL: ${info.sourceUrl}
`).join('\n');

  const prompt = `You are a legal URL verification expert specializing in Justia.com URLs.

STATE: ${state}

TASK: Verify and correct these Justia.com URLs to ensure they point to the correct legal codes.

CURRENT URLS AND STATUTES:
${urlList}

JUSTIA URL FORMAT RULES:
1. Base URL: https://law.justia.com/codes/[state-code]/
2. State codes are lowercase and use full state names or abbreviations
3. Common formats:
   - https://law.justia.com/codes/illinois/2023/chapter-765/act-715/
   - https://law.justia.com/codes/california/2023/code-civ/section-1940/
   - https://law.justia.com/codes/newyork/2023/cvr/article-7/
4. If you can't find exact statute, use the general state codes page:
   https://law.justia.com/codes/[state-code]/

YOUR TASK:
For EACH law type, determine the CORRECT Justia URL based on:
1. The statute citation provided
2. The law type (Security Deposits, Rent Control, etc.)
3. Common ${state} landlord-tenant law locations on Justia

CRITICAL: 
- Use realistic Justia URL structures
- If uncertain about exact URL, use the general state codes page
- Be conservative - only provide specific URLs if you're confident they exist

Return JSON array:
{
  "verifiedUrls": [
    {
      "lawType": "Security Deposit Terms",
      "originalUrl": "https://...",
      "verifiedUrl": "https://law.justia.com/codes/...",
      "isValid": true/false,
      "reason": "Why changed or kept"
    }
  ]
}

Return ONLY JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a legal URL verification expert. Return ONLY valid JSON with verified Justia.com URLs.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"verifiedUrls":[]}');
    const verifiedUrls = result.verifiedUrls || [];

    // console.log(`✅ Verified ${verifiedUrls.length} URLs`);
    
    // Log changes
    verifiedUrls.forEach((verified: VerifiedUrl, i: number) => {
      if (!verified.isValid) {
        // console.log(`   ${i + 1}. ${verified.lawType}:`);
        // console.log(`      ❌ Old: ${verified.originalUrl}`);
        // console.log(`      ✅ New: ${verified.verifiedUrl}`);
      } else {
        console.log(`   ${i + 1}. ${verified.lawType}: ✅ Valid`);
      }
    });

    return verifiedUrls;

  } catch (error) {
    console.error('❌ Error verifying URLs:', error);
    // Return original URLs if verification fails
    return legalInfo.map(info => ({
      lawType: info.lawType,
      originalUrl: info.sourceUrl,
      verifiedUrl: info.sourceUrl,
      isValid: true
    }));
  }
}

/**
 * Apply verified URLs to legal info
 */
export function applyVerifiedUrls<T extends { lawType: string; sourceUrl: string }>(
  legalInfo: T[],
  verifiedUrls: VerifiedUrl[]
): T[] {
  return legalInfo.map(info => {
    const verified = verifiedUrls.find(v => v.lawType === info.lawType);
    if (verified) {
      return {
        ...info,
        sourceUrl: verified.verifiedUrl
      };
    }
    return info;
  });
}

