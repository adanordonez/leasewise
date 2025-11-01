import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * VERIFICATION LAYER 1: Check if statute text actually exists in the fetched content
 */
export async function verifyStatuteInContent(
  statuteText: string,
  fullContent: string
): Promise<{ isVerified: boolean; confidence: number; reason: string }> {
  // console.log('🔍 VERIFICATION LAYER 1: Checking if statute exists in content...');
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a legal verification system. Your job is to verify if extracted statute text actually exists in the source content.

Return JSON:
{
  "isVerified": true/false,
  "confidence": 0-100 (how confident you are),
  "reason": "explanation of verification",
  "foundText": "the actual matching text from content (if found)"
}`
        },
        {
          role: 'user',
          content: `EXTRACTED STATUTE TEXT:
${statuteText}

FULL SOURCE CONTENT:
${fullContent.slice(0, 30000)}

Does the extracted statute text accurately represent what's in the source content? 
Check if the key legal points, statute numbers, and requirements match.
Return JSON only.`
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    // console.log(`📊 Verification Result: ${result.isVerified ? '✅ VERIFIED' : '❌ NOT VERIFIED'} (confidence: ${result.confidence}%)`);
    // console.log(`📝 Reason: ${result.reason}`);
    
    return {
      isVerified: result.isVerified && result.confidence >= 80, // Require 80%+ confidence
      confidence: result.confidence || 0,
      reason: result.reason || 'No reason provided'
    };
  } catch (error) {
    console.error('❌ Error verifying statute in content:', error);
    return {
      isVerified: false,
      confidence: 0,
      reason: 'Verification failed'
    };
  }
}

/**
 * VERIFICATION LAYER 2: Use Google Search to find official statute pages
 */
export async function googleVerifyStatute(
  statuteName: string,
  state: string,
  statuteText: string
): Promise<{
  officialSources: Array<{ url: string; title: string; snippet: string }>;
  confidence: number;
}> {
  // console.log(`🔍 VERIFICATION LAYER 2: Google search for "${statuteName}" in ${state}...`);
  
  try {
    const response = await openai.responses.create({
      model: 'gpt-4o',
      tools: [
        {
          type: 'web_search',
          filters: {
            allowed_domains: [
              `${state.toLowerCase().replace(/\s+/g, '')}.gov`,
              'legislature.state',
              'law.state',
              'law.cornell.edu',
              'justia.com',
              'findlaw.com',
            ],
          },
        },
      ],
      tool_choice: 'required',
      include: ['web_search_call.action.sources'],
      input: `Find the official government source for statute: "${statuteName}" ${state}. 
      
I need the exact statute that says: ${statuteText.slice(0, 200)}

Return ONLY official government or legal database sources.`,
    });

    const sources: Array<{ url: string; title: string; snippet: string }> = [];
    
    if (response.output) {
      for (const item of response.output) {
        if (item.type === 'web_search_call' && item.action?.sources) {
          for (const source of item.action.sources) {
            if (source.url && source.title) {
              sources.push({
                url: source.url,
                title: source.title,
                snippet: source.snippet || ''
              });
            }
          }
        }
      }
    }
    
    // console.log(`📚 Google found ${sources.length} official sources`);
    
    return {
      officialSources: sources,
      confidence: sources.length > 0 ? 85 : 0
    };
  } catch (error) {
    console.error('❌ Error in Google verification:', error);
    return {
      officialSources: [],
      confidence: 0
    };
  }
}

/**
 * VERIFICATION LAYER 3: Cross-check statute number/name format
 */
export async function verifyStatuteFormat(
  statuteText: string,
  state: string
): Promise<{ isValid: boolean; extractedStatute: string | null }> {
  // console.log('🔍 VERIFICATION LAYER 3: Verifying statute format...');
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a legal statute format validator. Extract and verify statute numbers/codes.

Return JSON:
{
  "isValid": true/false,
  "extractedStatute": "statute number/code (e.g., 765 ILCS 715/1, Cal. Civ. Code § 1950.5)",
  "reason": "why valid or invalid"
}`
        },
        {
          role: 'user',
          content: `Extract the statute number/code from this text for ${state}:

${statuteText}

Is this a valid, properly formatted statute citation?
Return JSON only.`
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    // console.log(`📋 Statute Format: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
    // console.log(`📝 Extracted: ${result.extractedStatute}`);
    
    return {
      isValid: result.isValid,
      extractedStatute: result.extractedStatute
    };
  } catch (error) {
    console.error('❌ Error verifying statute format:', error);
    return {
      isValid: false,
      extractedStatute: null
    };
  }
}

/**
 * VERIFICATION LAYER 4: Final accuracy check with multiple LLM calls
 */
export async function finalAccuracyCheck(
  statuteText: string,
  sourceUrl: string,
  fullContent: string,
  rightDescription: string,
  state: string
): Promise<{
  isAccurate: boolean;
  confidence: number;
  issues: string[];
  recommendations: string[];
}> {
  // console.log('🔍 VERIFICATION LAYER 4: Final accuracy check...');
  
  try {
    // First LLM call: Check legal accuracy
    const legalCheck = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a legal accuracy verifier. Check if extracted statute text is legally accurate for the specific tenant right.

Return JSON:
{
  "isAccurate": true/false,
  "confidence": 0-100,
  "legalIssues": ["list of any inaccuracies or concerns"],
  "stateMatch": true/false (does this apply to the correct state?)
}`
        },
        {
          role: 'user',
          content: `TENANT RIGHT: ${rightDescription}
STATE: ${state}

EXTRACTED STATUTE:
${statuteText}

SOURCE CONTENT:
${fullContent.slice(0, 20000)}

Is this statute text accurate for this tenant right in ${state}?
Return JSON only.`
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const legal = JSON.parse(legalCheck.choices[0].message.content || '{}');
    
    // Second LLM call: Check completeness
    const completenessCheck = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Check if statute text is complete and not misleading.

Return JSON:
{
  "isComplete": true/false,
  "confidence": 0-100,
  "missingInfo": ["list of missing important details"],
  "recommendations": ["suggestions to improve"]
}`
        },
        {
          role: 'user',
          content: `Is this statute text complete?

${statuteText}

Does it include all key requirements, timeframes, and conditions?
Return JSON only.`
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const completeness = JSON.parse(completenessCheck.choices[0].message.content || '{}');
    
    // Combine checks
    const overallConfidence = (legal.confidence + completeness.confidence) / 2;
    const isAccurate = legal.isAccurate && 
                      completeness.isComplete && 
                      legal.stateMatch &&
                      overallConfidence >= 75;
    
    // console.log(`📊 Final Accuracy: ${isAccurate ? '✅ ACCURATE' : '❌ NOT ACCURATE'} (confidence: ${overallConfidence}%)`);
    
    return {
      isAccurate,
      confidence: overallConfidence,
      issues: [...(legal.legalIssues || []), ...(completeness.missingInfo || [])],
      recommendations: completeness.recommendations || []
    };
  } catch (error) {
    console.error('❌ Error in final accuracy check:', error);
    return {
      isAccurate: false,
      confidence: 0,
      issues: ['Verification failed'],
      recommendations: []
    };
  }
}

/**
 * MASTER VERIFICATION: Run all verification layers
 */
export async function verifyLegalSource(
  statuteText: string,
  explanation: string,
  sourceUrl: string,
  fullContent: string,
  rightDescription: string,
  state: string,
  city?: string
): Promise<{
  isVerified: boolean;
  overallConfidence: number;
  verificationLayers: {
    contentVerification: any;
    googleVerification: any;
    formatVerification: any;
    accuracyCheck: any;
  };
  shouldShowLink: boolean;
  shouldShowStatute: boolean;
  verifiedStatuteNumber: string | null;
  recommendations: string[];
}> {
  // console.log('\n🚀 MASTER VERIFICATION STARTING...');
  // console.log(`📍 Verifying: ${rightDescription} (${city || state})`);
  // console.log(`🔗 Source: ${sourceUrl}`);
  
  // Layer 1: Verify statute exists in content
  const contentVerification = await verifyStatuteInContent(statuteText, fullContent);
  
  // Layer 2: Google search verification
  const googleVerification = await googleVerifyStatute(
    rightDescription, 
    state, 
    statuteText
  );
  
  // Layer 3: Statute format verification
  const formatVerification = await verifyStatuteFormat(statuteText, state);
  
  // Layer 4: Final accuracy check
  const accuracyCheck = await finalAccuracyCheck(
    statuteText,
    sourceUrl,
    fullContent,
    rightDescription,
    state
  );
  
  // Calculate overall confidence (weighted average)
  const weights = {
    content: 0.35,      // 35% - Most important: is it in the source?
    google: 0.20,       // 20% - Can we find it elsewhere?
    format: 0.15,       // 15% - Is the statute number valid?
    accuracy: 0.30      // 30% - Is it legally accurate?
  };
  
  const overallConfidence = 
    (contentVerification.confidence * weights.content) +
    (googleVerification.confidence * weights.google) +
    ((formatVerification.isValid ? 100 : 0) * weights.format) +
    (accuracyCheck.confidence * weights.accuracy);
  
  // Decision criteria
  const isVerified = 
    contentVerification.isVerified &&           // Must exist in content
    accuracyCheck.isAccurate &&                 // Must be accurate
    overallConfidence >= 75;                    // Overall confidence >= 75%
  
  const shouldShowLink = 
    isVerified &&                               // Must be verified
    (googleVerification.officialSources.length > 0 || // Google found it
     contentVerification.confidence >= 85);     // OR very high confidence
  
  const shouldShowStatute = 
    isVerified &&                               // Must be verified
    formatVerification.isValid &&               // Must have valid format
    contentVerification.confidence >= 80;       // High content confidence
  
  // console.log('\n📊 VERIFICATION SUMMARY:');
  // console.log(`   Overall Confidence: ${overallConfidence.toFixed(1)}%`);
  // console.log(`   ✅ Verified: ${isVerified}`);
  // console.log(`   🔗 Show Link: ${shouldShowLink}`);
  // console.log(`   📜 Show Statute: ${shouldShowStatute}`);
  // console.log(`   📋 Statute Number: ${formatVerification.extractedStatute || 'None'}`);
  
  return {
    isVerified,
    overallConfidence,
    verificationLayers: {
      contentVerification,
      googleVerification,
      formatVerification,
      accuracyCheck
    },
    shouldShowLink,
    shouldShowStatute,
    verifiedStatuteNumber: formatVerification.extractedStatute,
    recommendations: accuracyCheck.recommendations
  };
}

