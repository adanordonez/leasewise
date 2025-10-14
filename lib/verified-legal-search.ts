import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VerifiedLegalInfo {
  lawType: string;
  explanation: string;
  example: string;
  sourceUrl: string;
  sourceTitle: string;
  statute?: string;
  isVerified: boolean;
  verificationScore: number;
  fullPageContent?: string; // Keep for debugging
}

/**
 * VERIFICATION STEP 1: Fetch full page content with Jina AI
 */
async function fetchPageContent(url: string): Promise<string | null> {
  try {
    console.log(`📄 Fetching content from: ${url}`);
    
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'text',
      },
    });

    if (!response.ok) {
      console.error(`❌ Jina AI fetch failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.data?.content || data.content || '';
    
    console.log(`✅ Fetched ${content.length} characters`);
    return content;
  } catch (error) {
    console.error('❌ Error fetching with Jina AI:', error);
    return null;
  }
}

/**
 * VERIFICATION STEP 2: Check if the explanation actually exists in the page content
 */
async function verifyExplanationExists(
  explanation: string,
  pageContent: string,
  lawType: string,
  state: string
): Promise<{ isVerified: boolean; score: number; reason: string }> {
  try {
    console.log(`🔍 Verifying "${lawType}" exists in page content...`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a legal content verifier. Check if the CLAIM matches the ACTUAL PAGE CONTENT.

CRITICAL: Only return isVerified=true if the page ACTUALLY contains this information.

Return JSON:
{
  "isVerified": true/false,
  "score": 0-100,
  "reason": "why verified or not",
  "matchingText": "the actual text from the page that matches (if found)"
}`
        },
        {
          role: 'user',
          content: `STATE: ${state}
LAW TYPE: ${lawType}

CLAIM (what we're saying):
"${explanation}"

ACTUAL PAGE CONTENT:
${pageContent.slice(0, 15000)}

Does the page ACTUALLY contain information supporting this claim about ${state} law?
Return JSON only.`
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    console.log(`   ${result.isVerified ? '✅' : '❌'} Verification: ${result.score}/100`);
    console.log(`   Reason: ${result.reason}`);
    
    return {
      isVerified: result.isVerified && result.score >= 80,
      score: result.score || 0,
      reason: result.reason || 'No reason provided'
    };
  } catch (error) {
    console.error('❌ Error verifying:', error);
    return {
      isVerified: false,
      score: 0,
      reason: 'Verification failed'
    };
  }
}

/**
 * VERIFICATION STEP 3: Cross-check with another LLM call
 */
async function doubleCheckAccuracy(
  explanation: string,
  lawType: string,
  state: string
): Promise<{ isAccurate: boolean; issues: string[] }> {
  try {
    console.log(`🔍 Double-checking accuracy for "${lawType}"...`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a legal accuracy checker. Check if this legal information seems accurate for ${state}.

Return JSON:
{
  "isAccurate": true/false,
  "issues": ["list any red flags or concerns"],
  "confidence": 0-100
}`
        },
        {
          role: 'user',
          content: `For ${state}, is this accurate?
"${explanation}"

Law type: ${lawType}

Check for:
- Does this sound like real law or made up?
- Are the details specific enough?
- Any obvious red flags?

Return JSON only.`
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    console.log(`   ${result.isAccurate ? '✅' : '❌'} Accuracy check: ${result.confidence}/100`);
    if (result.issues && result.issues.length > 0) {
      console.log(`   Issues found: ${result.issues.join(', ')}`);
    }
    
    return {
      isAccurate: result.isAccurate && result.confidence >= 75,
      issues: result.issues || []
    };
  } catch (error) {
    console.error('❌ Error in accuracy check:', error);
    return {
      isAccurate: false,
      issues: ['Accuracy check failed']
    };
  }
}

/**
 * MASTER FUNCTION: Search and VERIFY legal information
 * Only returns information that passes ALL verification steps
 */
export async function searchVerifiedLegalInfo(
  userAddress: string,
  leaseContext?: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
  }
): Promise<{
  legalInfo: VerifiedLegalInfo[];
  searchMetadata: {
    state: string;
    city: string;
    totalSources: number;
    verifiedSources: number;
    rejectedSources: number;
  };
}> {
  console.log('\n🚀 STARTING VERIFIED LEGAL SEARCH');
  console.log(`📍 Location: ${userAddress}`);
  
  // Extract state and city
  const addressParts = userAddress.split(',').map(s => s.trim());
  const state = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '';
  const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3] : '';
  
  console.log(`📍 Parsed: ${city}, ${state}`);
  
  // Legal domains - ONLY the most authoritative
  const legalDomains = [
    `${state.toLowerCase().replace(/\s+/g, '')}.gov`,
    'law.cornell.edu',
    'justia.com',
    'legislature.state',
    'ilga.gov',
    'leginfo.legislature.ca.gov',
  ];
  
  // Search for legal sources
  console.log('🔍 Step 1: Searching for authoritative sources...');
  
  const searchCompletion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a legal research assistant. Find OFFICIAL government sources for ${state} renter/tenant laws.

CRITICAL: Only cite sources from these domains: ${legalDomains.join(', ')}

Return JSON with format:
{
  "sources": [
    {
      "url": "full URL",
      "title": "page title",
      "relevance": "which category this covers"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Find official ${state} statutes and codes about these 10 renter rights categories:

1. Security Deposit Terms
2. Rent Amount and Increase Provisions
3. Maintenance and Repair Responsibilities
4. Entry and Privacy Rights
5. Lease Term and Renewal Options
6. Pet Policies and Fees
7. Subletting and Assignment Rights
8. Eviction Procedures and Protections
9. Utilities and Service Responsibilities
10. Modifications and Alterations

Find the OFFICIAL government sources that contain the actual statute text for ${state}.
Return JSON with sources array.`
      }
    ],
    tools: [
      {
        type: 'web_search',
      },
    ],
    temperature: 0.1,
  });
  
  // Extract URLs from the response
  const potentialSources: Array<{ url: string; title: string }> = [];
  
  // Check if tool was called
  if (searchCompletion.choices[0].message.tool_calls) {
    for (const toolCall of searchCompletion.choices[0].message.tool_calls) {
      if (toolCall.type === 'web_search') {
        // Tool was called, parse the results
        console.log('🔍 Web search tool was used');
      }
    }
  }
  
  // For now, use common known sources as fallback
  const commonSources = [
    {
      url: `https://www.${state.toLowerCase().replace(/\s+/g, '')}.gov/topics/landlord-tenant`,
      title: `${state} Landlord-Tenant Laws`
    },
    {
      url: `https://law.cornell.edu/wex/${state.toLowerCase()}_landlord_tenant_law`,
      title: `${state} Landlord-Tenant Law - Cornell`
    },
  ];
  
  potentialSources.push(...commonSources);
  
  console.log(`✅ Found ${potentialSources.length} potential sources`);
  
  if (potentialSources.length === 0) {
    console.log('❌ No sources found, returning empty');
    return {
      legalInfo: [],
      searchMetadata: {
        state,
        city,
        totalSources: 0,
        verifiedSources: 0,
        rejectedSources: 0
      }
    };
  }
  
  // Now get explanations for each category from the web search output
  console.log('🔍 Step 2: Extracting legal information...');
  
  const extractResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Extract legal information for ${state} about renter rights.

CRITICAL RULES:
1. ONLY use information from the web search results
2. Do NOT make up or infer anything
3. If you don't have information, say "Information not found"
4. Quote statute numbers when available
5. Be specific and factual

Return JSON with ALL 10 categories:
{
  "legalInfo": [
    {
      "lawType": "Security Deposit Terms",
      "explanation": "Specific law from ${state}",
      "statute": "Statute number if available",
      "sourceUrl": "URL where this came from",
      "sourceTitle": "Source title"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Based on the search results about ${state} renter laws, provide information for ALL 10 categories:

1. Security Deposit Terms
2. Rent Amount and Increase Provisions
3. Maintenance and Repair Responsibilities
4. Entry and Privacy Rights
5. Lease Term and Renewal Options
6. Pet Policies and Fees
7. Subletting and Assignment Rights
8. Eviction Procedures and Protections
9. Utilities and Service Responsibilities
10. Modifications and Alterations

Sources found: ${potentialSources.map(s => `${s.title}: ${s.url}`).join('\n')}

Return ONLY JSON. Use "Information not found" if you don't have data for a category.`
      }
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' }
  });
  
  const extracted = JSON.parse(extractResponse.choices[0].message.content || '{}');
  const initialLegalInfo = extracted.legalInfo || [];
  
  console.log(`✅ Extracted ${initialLegalInfo.length} categories`);
  
  // VERIFICATION PHASE: Check each one
  console.log('\n🔒 Step 3: VERIFYING each source...');
  
  const verifiedInfo: VerifiedLegalInfo[] = [];
  let rejectedCount = 0;
  
  for (const info of initialLegalInfo) {
    console.log(`\n📋 Verifying: ${info.lawType}`);
    
    // Skip if no URL or says "Information not found"
    if (!info.sourceUrl || info.explanation?.includes('Information not found')) {
      console.log('   ⏭️  Skipping - no source URL or no info');
      rejectedCount++;
      continue;
    }
    
    // Fetch page content
    const pageContent = await fetchPageContent(info.sourceUrl);
    if (!pageContent || pageContent.length < 100) {
      console.log('   ❌ REJECTED - could not fetch page content');
      rejectedCount++;
      continue;
    }
    
    // Verify explanation exists in content
    const verification = await verifyExplanationExists(
      info.explanation,
      pageContent,
      info.lawType,
      state
    );
    
    if (!verification.isVerified) {
      console.log(`   ❌ REJECTED - verification failed (score: ${verification.score})`);
      rejectedCount++;
      continue;
    }
    
    // Double-check accuracy
    const accuracyCheck = await doubleCheckAccuracy(
      info.explanation,
      info.lawType,
      state
    );
    
    if (!accuracyCheck.isAccurate) {
      console.log(`   ❌ REJECTED - accuracy check failed`);
      console.log(`   Issues: ${accuracyCheck.issues.join(', ')}`);
      rejectedCount++;
      continue;
    }
    
    // ALL CHECKS PASSED!
    console.log(`   ✅ VERIFIED - adding to results`);
    
    verifiedInfo.push({
      ...info,
      isVerified: true,
      verificationScore: verification.score,
      fullPageContent: pageContent.slice(0, 1000) // Keep first 1000 chars for debugging
    });
  }
  
  console.log(`\n📊 VERIFICATION SUMMARY:`);
  console.log(`   Total checked: ${initialLegalInfo.length}`);
  console.log(`   ✅ Verified: ${verifiedInfo.length}`);
  console.log(`   ❌ Rejected: ${rejectedCount}`);
  
  return {
    legalInfo: verifiedInfo,
    searchMetadata: {
      state,
      city,
      totalSources: initialLegalInfo.length,
      verifiedSources: verifiedInfo.length,
      rejectedSources: rejectedCount
    }
  };
}

