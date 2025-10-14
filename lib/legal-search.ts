import OpenAI from 'openai';
import { fetchAndVetMultipleSources } from './jina-legal-extractor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Interface for structured legal information
 */
export interface LegalInfoRow {
  lawType: string;
  explanation: string;
  example: string;
  sourceUrl: string;
  sourceTitle: string;
  statute?: string;
}

/**
 * Search for comprehensive categorized renter laws based on the lease
 */
export async function searchComprehensiveLegalInfo(
  userAddress: string,
  leaseContext?: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
    address?: string;
  }
): Promise<{
  legalInfo: LegalInfoRow[];
  searchMetadata: {
    state: string;
    city: string;
    totalSources: number;
  };
}> {
  try {
    // Extract state and city from address
    const addressParts = userAddress.split(',').map(s => s.trim());
    const state = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '';
    const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3] : '';
    
    console.log(`🔍 Searching comprehensive renter laws for: ${city}, ${state}`);
    console.log(`📄 Using lease context:`, leaseContext);
    
    // Authoritative legal domains
    const legalDomains = [
      `${state.toLowerCase().replace(/\s+/g, '')}.gov`,
      'legislature.state',
      'law.state',
      'nolo.com',
      'legalaidnetwork.org',
      'justia.com',
      'findlaw.com',
      'hud.gov',
      'consumerfinance.gov',
      'law.cornell.edu',
      'law.justia.com',
      'americanbar.org',
      'tenantsunion.org',
      'tenant.net',
    ];
    
    // Build lease context string
    const leaseContextStr = leaseContext ? `

TENANT'S LEASE DETAILS (use these in your examples):
- Monthly Rent: ${leaseContext.monthlyRent || 'Not specified'}
- Security Deposit: ${leaseContext.securityDeposit || 'Not specified'}
- Lease Start: ${leaseContext.leaseStart || 'Not specified'}
- Lease End: ${leaseContext.leaseEnd || 'Not specified'}
- Property Address: ${leaseContext.address || userAddress}` : '';
    
    const response = await openai.responses.create({
      model: 'gpt-4o',
      tools: [
        {
          type: 'web_search',
          filters: {
            allowed_domains: legalDomains,
          },
          user_location: {
            type: 'approximate',
            country: 'US',
            city: city || undefined,
            region: state || undefined,
          },
        },
      ],
      tool_choice: 'required',
      include: ['web_search_call.action.sources'],
      input: `Find comprehensive renter/tenant law information for ${city ? `${city}, ` : ''}${state}.${leaseContextStr}

You MUST return information for ALL 10 of these categories (in this exact order):

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

For EACH category, return structured information in JSON format:

{
  "legalInfo": [
    {
      "lawType": "Security Deposit Terms",
      "explanation": "What the law says about security deposits in ${state}",
      "example": "Use the tenant's actual rent (${leaseContext?.monthlyRent || '$X'}) and deposit (${leaseContext?.securityDeposit || '$Y'}) to create a personalized example",
      "statute": "Specific statute or code (e.g., '765 ILCS 715/1')",
      "sourceUrl": "Direct URL to the official source",
      "sourceTitle": "Title of the source page"
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Return ONLY JSON - no other text
2. Include ALL 10 categories above (no more, no less)
3. Use the tenant's actual lease details in examples when available
4. Use SIMPLE language (not legal jargon)
5. Each explanation: max 30 words
6. Each example: personalized to THIS tenant's lease, max 35 words
7. MUST include valid sourceUrl for each item
8. Only include laws specific to ${state}

Return the JSON now:`,
    });
    
    // Extract the response
    let outputText = response.output_text || '';
    console.log('📝 Raw response:', outputText.substring(0, 200));
    
    // Clean up the response to extract JSON
    // Remove markdown code blocks if present
    outputText = outputText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    outputText = outputText.trim();
    
    // Try to parse JSON
    let parsedData: { legalInfo: LegalInfoRow[] };
    
    try {
      parsedData = JSON.parse(outputText);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON, attempting retry...');
      
      // Retry with more explicit instructions
      const retryResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a legal information system that ONLY outputs valid JSON. Never include any text outside the JSON structure.',
          },
          {
            role: 'user',
            content: `Based on ${state} renter laws, create a JSON object with ALL 10 of these categories:

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

JSON structure:
{
  "legalInfo": [
    {
      "lawType": "Security Deposit Terms",
      "explanation": "Brief explanation for ${state}",
      "example": "Real example${leaseContext ? ` using rent ${leaseContext.monthlyRent} and deposit ${leaseContext.securityDeposit}` : ''}",
      "statute": "Code reference",
      "sourceUrl": "https://example.gov",
      "sourceTitle": "Source name"
    }
  ]
}

MUST include all 10 categories. Use simple language. Return ONLY the JSON.`,
          },
        ],
      });
      
      const retryText = retryResponse.choices[0].message.content || '{}';
      parsedData = JSON.parse(retryText);
    }
    
    // Extract sources from the web search response
    const messageOutput = response.output?.find((item: any) => item.type === 'message');
    const additionalSources: string[] = [];
    
    if (messageOutput && messageOutput.content) {
      const textContent = messageOutput.content.find((c: any) => c.type === 'output_text');
      if (textContent && textContent.annotations) {
        textContent.annotations.forEach((annotation: any) => {
          if (annotation.type === 'url_citation') {
            additionalSources.push(annotation.url);
          }
        });
      }
    }
    
    console.log(`✅ Found ${parsedData.legalInfo?.length || 0} legal categories`);
    console.log(`✅ Found ${additionalSources.length} additional sources`);
    
    return {
      legalInfo: parsedData.legalInfo || [],
      searchMetadata: {
        state,
        city,
        totalSources: additionalSources.length,
      },
    };
    
  } catch (error) {
    console.error('❌ Error searching comprehensive legal info:', error);
    throw error;
  }
}

/**
 * Search for real legal sources using OpenAI's web search
 * Restricted to authoritative legal domains
 */
export async function searchLegalSources(
  userAddress: string,
  tenantRight: string,
  issueDescription?: string
): Promise<{
  sources: Array<{
    url: string;
    title: string;
    snippet: string;
  }>;
  summary: string;
}> {
  try {
    // Extract state and city from address
    const addressParts = userAddress.split(',').map(s => s.trim());
    const state = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '';
    const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3] : '';
    
    console.log(`🔍 Searching legal sources for: ${tenantRight} in ${city}, ${state}`);
    
    // Construct a specific legal search query
    const searchQuery = issueDescription
      ? `${state} tenant rights law ${tenantRight} ${issueDescription} statute regulation`
      : `${state} tenant rights law ${tenantRight} statute regulation`;
    
    // Authoritative legal domains to search
    const legalDomains = [
      // State government sites
      `${state.toLowerCase().replace(/\s+/g, '')}.gov`,
      'legislature.state',
      'law.state',
      
      // Legal aid and tenant advocacy
      'nolo.com',
      'legalaidnetwork.org',
      'justia.com',
      'findlaw.com',
      
      // HUD and federal resources
      'hud.gov',
      'consumerfinance.gov',
      
      // Legal databases
      'law.cornell.edu',
      'law.justia.com',
      
      // Bar associations
      'americanbar.org',
      
      // Tenant unions and advocacy
      'tenantsunion.org',
      'tenant.net',
    ];
    
    const response = await openai.responses.create({
      model: 'gpt-4o',
      tools: [
        {
          type: 'web_search',
          filters: {
            allowed_domains: legalDomains,
          },
          user_location: {
            type: 'approximate',
            country: 'US',
            city: city || undefined,
            region: state || undefined,
          },
        },
      ],
      tool_choice: 'required', // Force it to use web search
      include: ['web_search_call.action.sources'],
      input: `You are explaining tenant rights laws to a renter who is NOT a lawyer. Find and explain the law about: "${tenantRight}" in ${city ? `${city}, ` : ''}${state}.

IMPORTANT INSTRUCTIONS:
1. Write in EXTREMELY SIMPLE language - like explaining to a high school student
2. Use short sentences
3. NO legal jargon - use everyday words
4. Be direct and clear
5. Only include information that is directly relevant to "${tenantRight}"

Format your response EXACTLY like this:

**What This Means for You:**
[2-3 simple sentences explaining what this tenant right means in plain English]

**The Law:**
[Name the specific law or statute that protects this right - include the code number if available]

**Your Rights:**
• [Specific thing you can do or are protected from]
• [Another specific thing]
• [One more if relevant]

**What Your Landlord Must Do:**
• [Specific obligation]
• [Another obligation if relevant]

**Important Notes:**
• [Any exceptions or conditions tenants should know about]

ONLY cite information from authoritative government websites or established legal resources. Keep it brief - 150 words maximum.`,
    });
    
    // Extract output text
    const outputText = response.output_text || '';
    
    // Extract sources from annotations
    const sources: Array<{ url: string; title: string; snippet: string }> = [];
    
    // Find the message output item
    const messageOutput = response.output?.find((item: any) => item.type === 'message');
    
    if (messageOutput && messageOutput.content) {
      const textContent = messageOutput.content.find((c: any) => c.type === 'output_text');
      
      if (textContent && textContent.annotations) {
        textContent.annotations.forEach((annotation: any) => {
          if (annotation.type === 'url_citation') {
            // Extract snippet from the cited text
            const snippet = outputText.substring(
              Math.max(0, annotation.start_index - 50),
              Math.min(outputText.length, annotation.end_index + 50)
            );
            
            sources.push({
              url: annotation.url,
              title: annotation.title || annotation.url,
              snippet: snippet.trim(),
            });
          }
        });
      }
    }
    
    // Also get sources from web_search_call if available
    const webSearchCall = response.output?.find((item: any) => item.type === 'web_search_call');
    if (webSearchCall && webSearchCall.action && webSearchCall.action.sources) {
      webSearchCall.action.sources.forEach((source: any) => {
        // Avoid duplicates
        if (!sources.find(s => s.url === source.url)) {
          sources.push({
            url: source.url,
            title: source.title || source.url,
            snippet: '', // Sources don't have snippets
          });
        }
      });
    }
    
    console.log(`✅ Found ${sources.length} legal sources`);
    
    return {
      sources,
      summary: outputText,
    };
    
  } catch (error) {
    console.error('❌ Error searching legal sources:', error);
    throw error;
  }
}

/**
 * Batch search for multiple tenant rights
 */
export async function searchMultipleLegalSources(
  userAddress: string,
  tenantRights: Array<{ right: string; description?: string }>
): Promise<Map<string, { sources: Array<{ url: string; title: string; snippet: string }>; summary: string }>> {
  const results = new Map();
  
  // Search for each right (with small delay to avoid rate limits)
  for (const right of tenantRights) {
    try {
      const result = await searchLegalSources(userAddress, right.right, right.description);
      results.set(right.right, result);
      
      // Small delay between searches (200ms)
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to search for: ${right.right}`, error);
      // Continue with other searches even if one fails
    }
  }
  
  return results;
}

/**
 * Search for specific legal code/statute
 */
export async function searchSpecificStatute(
  state: string,
  statuteName: string
): Promise<{
  url?: string;
  title?: string;
  fullText?: string;
}> {
  try {
    const response = await openai.responses.create({
      model: 'gpt-4o',
      tools: [
        {
          type: 'web_search',
          filters: {
            allowed_domains: [
              `${state.toLowerCase().replace(/\s+/g, '')}.gov`,
              'law.cornell.edu',
              'law.justia.com',
              'legislature.state',
            ],
          },
        },
      ],
      tool_choice: 'required',
      input: `Find the full text of ${state} statute: ${statuteName}. 
      
Provide:
1. The official statute URL
2. The full legal text
3. Any relevant amendments or updates

Only cite official government or legal database sources.`,
    });
    
    const outputText = response.output_text || '';
    
    // Extract the first URL from annotations
    const messageOutput = response.output?.find((item: any) => item.type === 'message');
    let url = '';
    let title = '';
    
    if (messageOutput && messageOutput.content) {
      const textContent = messageOutput.content.find((c: any) => c.type === 'output_text');
      if (textContent && textContent.annotations && textContent.annotations.length > 0) {
        const firstAnnotation = textContent.annotations[0];
        url = firstAnnotation.url;
        title = firstAnnotation.title;
      }
    }
    
    return {
      url,
      title,
      fullText: outputText,
    };
    
  } catch (error) {
    console.error('Error searching for statute:', error);
    throw error;
  }
}

/**
 * Enhanced legal source search with Jina AI content extraction and vetting
 * Returns only VETTED sources with actual legal text
 */
export async function searchEnhancedLegalSources(
  rightText: string,
  userAddress: string,
  description: string
): Promise<{
  sources: Array<{
    url: string;
    title: string;
    statuteText: string;
    explanation: string;
    isRelevant: boolean;
  }>;
  notFoundCount: number;
  totalSearched: number;
}> {
  try {
    // Extract state and city
    const addressParts = userAddress.split(',').map(s => s.trim());
    const state = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '';
    const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3] : '';
    
    console.log(`\n🔍 Enhanced search for: "${description}" in ${city || state}`);
    
    // Step 1: Use OpenAI web search to find potential sources
    const legalDomains = [
      `${state.toLowerCase().replace(/\s+/g, '')}.gov`,
      'legislature.state',
      'nolo.com',
      'hud.gov',
      'law.cornell.edu',
      'justia.com',
      'findlaw.com',
    ];
    
    const searchResponse = await openai.responses.create({
      model: 'gpt-4o',
      tools: [
        {
          type: 'web_search',
          filters: {
            allowed_domains: legalDomains,
          },
          user_location: {
            type: 'approximate',
            country: 'US',
            city: city || undefined,
            region: state || undefined,
          },
        },
      ],
      tool_choice: 'required',
      include: ['web_search_call.action.sources'],
      input: `Find authoritative legal sources about "${description}" for tenants in ${city ? `${city}, ` : ''}${state}.

Focus on:
- Official statutes and legal codes
- Government websites
- Specific legal text about: ${rightText}

Return the most authoritative sources with specific legal information.`,
    });
    
    // Extract URLs from search results
    const potentialSources: Array<{ url: string; title: string }> = [];
    
    if (searchResponse.output) {
      for (const item of searchResponse.output) {
        if (item.type === 'web_search_call' && item.action?.sources) {
          for (const source of item.action.sources) {
            if (source.url && source.title) {
              potentialSources.push({
                url: source.url,
                title: source.title
              });
            }
          }
        }
      }
    }
    
    console.log(`📚 Found ${potentialSources.length} potential sources to vet`);
    
    if (potentialSources.length === 0) {
      return {
        sources: [],
        notFoundCount: 0,
        totalSearched: 0
      };
    }
    
    // Step 2: Fetch, vet, and extract content from top 5 sources using Jina AI
    const vettedResults = await fetchAndVetMultipleSources(
      potentialSources,
      description,
      state,
      city,
      5 // Check top 5 sources
    );
    
    // Step 3: Filter to only relevant sources with actual legal text
    const relevantSources = vettedResults.filter(r => r.isRelevant && r.statuteText);
    const notFoundCount = vettedResults.filter(r => !r.isRelevant).length;
    
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Relevant sources: ${relevantSources.length}`);
    console.log(`   ❌ Not relevant: ${notFoundCount}`);
    
    return {
      sources: relevantSources.map(s => ({
        url: s.url,
        title: s.title,
        statuteText: s.statuteText || '',
        explanation: s.explanation || '',
        isRelevant: s.isRelevant,
        isVerified: s.isVerified,
        verificationConfidence: s.verificationConfidence,
        shouldShowLink: s.shouldShowLink,
        shouldShowStatute: s.shouldShowStatute,
        statuteNumber: s.statuteNumber
      })),
      notFoundCount,
      totalSearched: vettedResults.length
    };
    
  } catch (error) {
    console.error('❌ Error in enhanced legal search:', error);
    throw error;
  }
}

