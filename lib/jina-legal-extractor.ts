import OpenAI from 'openai';
import { verifyLegalSource } from './legal-verification';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ExtractedLegalContent {
  isRelevant: boolean;
  relevanceScore: number;
  statuteText?: string;
  explanation?: string;
  reason?: string; // Why it was rejected if not relevant
  isVerified?: boolean; // NEW: Multi-layer verification passed
  verificationConfidence?: number; // NEW: Overall verification confidence
  shouldShowLink?: boolean; // NEW: Should we show the URL?
  shouldShowStatute?: boolean; // NEW: Should we show statute text?
  statuteNumber?: string | null; // NEW: Verified statute number
  fullContent?: string; // NEW: Keep full content for verification
}

/**
 * Fetch full page content using Jina AI Reader
 */
async function fetchPageContent(url: string): Promise<string | null> {
  try {
    console.log(`📄 Fetching content from: ${url}`);
    
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'text',
        // Jina AI is free for basic use, add key if you have one
        ...(process.env.JINA_API_KEY && { 'Authorization': `Bearer ${process.env.JINA_API_KEY}` })
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
 * VET the extracted content - check if it's actually relevant legal text
 */
async function vetLegalContent(
  content: string,
  tenantRight: string,
  state: string,
  city?: string
): Promise<{ isRelevant: boolean; reason: string; score: number }> {
  try {
    console.log(`🔍 Vetting content for: "${tenantRight}" in ${city || state}`);
    
    // Truncate to first 10k characters for vetting (cost optimization)
    const truncatedContent = content.slice(0, 10000);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a legal content validator. Your job is to determine if a webpage contains ACTUAL, SPECIFIC legal text about tenant rights.

RELEVANT content includes:
- Specific statutes or legal codes (e.g., "765 ILCS 715/1")
- Direct quotes from laws
- Official government legal text
- Detailed legal requirements with specifics

NOT RELEVANT content includes:
- General advice articles
- Blog posts
- Marketing content
- Vague summaries without specifics
- Content about different states/cities
- Broken or error pages

Return your assessment in JSON format:
{
  "isRelevant": true/false,
  "score": 0-100 (confidence score),
  "reason": "brief explanation why relevant or not relevant"
}`
        },
        {
          role: 'user',
          content: `Assess if this webpage contains specific, authoritative legal text about "${tenantRight}" for ${city ? `${city}, ` : ''}${state}:

WEBPAGE CONTENT:
${truncatedContent}

Return JSON only.`
        }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    console.log(`📊 Vetting result: ${result.isRelevant ? '✅ RELEVANT' : '❌ NOT RELEVANT'} (score: ${result.score}/100)`);
    console.log(`📝 Reason: ${result.reason}`);
    
    return {
      isRelevant: result.isRelevant && result.score >= 60, // Require 60%+ confidence
      reason: result.reason || 'No reason provided',
      score: result.score || 0
    };
  } catch (error) {
    console.error('❌ Error vetting content:', error);
    return {
      isRelevant: false,
      reason: 'Error during vetting process',
      score: 0
    };
  }
}

/**
 * Extract the specific statute text from vetted content
 */
async function extractSpecificStatute(
  content: string,
  tenantRight: string,
  state: string,
  city?: string
): Promise<{ statuteText: string; explanation: string }> {
  try {
    console.log(`📝 Extracting specific statute text for: "${tenantRight}"`);
    
    // Use more content for extraction (up to 30k chars)
    const truncatedContent = content.slice(0, 30000);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract the EXACT legal text related to the tenant right. 

Return JSON with:
{
  "statuteText": "The exact statute or legal text, quoted verbatim",
  "explanation": "1-2 sentence plain English explanation of what this means for the tenant"
}

Important:
- Quote the EXACT text from the law
- Include statute numbers/codes
- Keep it concise (max 150 words for statuteText)
- Make explanation very simple and clear`
        },
        {
          role: 'user',
          content: `Extract the specific legal text about "${tenantRight}" for ${city ? `${city}, ` : ''}${state} from this content:

${truncatedContent}`
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    console.log(`✅ Extracted ${result.statuteText?.length || 0} characters of statute text`);
    
    return {
      statuteText: result.statuteText || 'Could not extract specific text',
      explanation: result.explanation || 'No explanation available'
    };
  } catch (error) {
    console.error('❌ Error extracting statute:', error);
    return {
      statuteText: 'Error extracting statute text',
      explanation: 'An error occurred during extraction'
    };
  }
}

/**
 * MAIN FUNCTION: Fetch, vet, and extract legal content
 */
export async function fetchAndVetLegalSource(
  url: string,
  tenantRight: string,
  state: string,
  city?: string
): Promise<ExtractedLegalContent> {
  console.log(`\n🚀 Processing legal source: ${url}`);
  console.log(`📍 Looking for: "${tenantRight}" in ${city || state}`);
  
  // Step 1: Fetch full page content with Jina AI
  const content = await fetchPageContent(url);
  
  if (!content || content.length < 100) {
    return {
      isRelevant: false,
      relevanceScore: 0,
      reason: 'Could not fetch page content or content too short'
    };
  }
  
  // Step 2: VET the content
  const vettingResult = await vetLegalContent(content, tenantRight, state, city);
  
  if (!vettingResult.isRelevant) {
    return {
      isRelevant: false,
      relevanceScore: vettingResult.score,
      reason: vettingResult.reason
    };
  }
  
  // Step 3: Extract specific statute text
  const extracted = await extractSpecificStatute(content, tenantRight, state, city);
  
  // Step 4: MULTI-LAYER VERIFICATION (NEW!)
  console.log('🔒 Starting multi-layer verification...');
  const verification = await verifyLegalSource(
    extracted.statuteText,
    extracted.explanation,
    url,
    content,
    tenantRight,
    state,
    city
  );
  
  console.log(`🔒 Verification complete: ${verification.isVerified ? '✅ VERIFIED' : '❌ FAILED'}`);
  console.log(`📊 Confidence: ${verification.overallConfidence.toFixed(1)}%`);
  console.log(`🔗 Show Link: ${verification.shouldShowLink}`);
  console.log(`📜 Show Statute: ${verification.shouldShowStatute}`);
  
  // Only return if verification passed
  if (!verification.isVerified) {
    return {
      isRelevant: false,
      relevanceScore: 0,
      reason: `Failed verification checks (confidence: ${verification.overallConfidence.toFixed(1)}%)`
    };
  }
  
  return {
    isRelevant: true,
    relevanceScore: vettingResult.score,
    statuteText: extracted.statuteText,
    explanation: extracted.explanation,
    isVerified: verification.isVerified,
    verificationConfidence: verification.overallConfidence,
    shouldShowLink: verification.shouldShowLink,
    shouldShowStatute: verification.shouldShowStatute,
    statuteNumber: verification.verifiedStatuteNumber,
    fullContent: content // Keep for future reference
  };
}

/**
 * Process multiple sources in parallel (with rate limiting)
 */
export async function fetchAndVetMultipleSources(
  sources: Array<{ url: string; title: string }>,
  tenantRight: string,
  state: string,
  city?: string,
  maxSources: number = 3
): Promise<Array<{
  url: string;
  title: string;
  isRelevant: boolean;
  statuteText?: string;
  explanation?: string;
  reason?: string;
  isVerified?: boolean;
  verificationConfidence?: number;
  shouldShowLink?: boolean;
  shouldShowStatute?: boolean;
  statuteNumber?: string | null;
}>> {
  console.log(`\n📚 Processing ${Math.min(sources.length, maxSources)} sources...`);
  
  const sourcesToProcess = sources.slice(0, maxSources);
  
  const results = await Promise.all(
    sourcesToProcess.map(async (source) => {
      const result = await fetchAndVetLegalSource(source.url, tenantRight, state, city);
      
      return {
        url: source.url,
        title: source.title,
        ...result
      };
    })
  );
  
  // Filter to only relevant sources
  const relevantSources = results.filter(r => r.isRelevant);
  
  console.log(`\n✅ Found ${relevantSources.length} relevant sources out of ${sourcesToProcess.length}`);
  
  return results;
}

