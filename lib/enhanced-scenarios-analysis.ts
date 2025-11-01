import OpenAI from 'openai';
import { LeaseRAG } from './rag-system';
import { searchLegalInfoWithGoogleSearch } from './perplexity-legal-search';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EnhancedScenario {
  title: string;
  advice: string;
  stateLaw?: {
    lawType: string;
    explanation: string;
    statute?: string;
    sourceUrl?: string;
  };
  leaseRelevantText?: string;
  pageNumber?: number;
  severity?: 'high' | 'medium' | 'low';
  actionableSteps?: string[];
}

export interface EnhancedScenariosResult {
  scenarios: EnhancedScenario[];
  location: {
    state: string;
    city: string;
  };
}

/**
 * Enhanced scenarios analysis using RAG + state law research
 * This provides accurate, location-specific advice based on both the lease and state laws
 */
export async function generateEnhancedScenarios(
  rag: LeaseRAG,
  address: string,
  leaseContext: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
  }
): Promise<EnhancedScenariosResult> {
  // console.log('🎯 Starting enhanced scenarios analysis...');

  // Step 1: Extract location info
  const locationInfo = extractLocationFromAddress(address);
  // console.log(`📍 Location: ${locationInfo.city}, ${locationInfo.state}`);

  // Step 2: Get state-specific legal information
  // console.log('⚖️ Researching state-specific laws...');
  const legalInfo = await searchLegalInfoWithGoogleSearch(address, leaseContext);
  // console.log(`✅ Found ${legalInfo.legalInfo.length} relevant laws`);

  // Step 3: Use RAG to find relevant lease clauses for each scenario
  // console.log('🔍 Analyzing lease with RAG for scenario-specific content...');
  
  const scenarioQueries = [
    {
      title: "What if something breaks?",
      queries: [
        'maintenance repairs landlord responsibilities tenant obligations',
        'broken appliances heating cooling plumbing electrical',
        'repair requests maintenance procedures emergency repairs',
        'habitable living conditions essential services'
      ]
    },
    {
      title: "Getting my security deposit back",
      queries: [
        'security deposit return timeline deductions cleaning',
        'deposit refund conditions move out inspection',
        'normal wear and tear damage charges',
        'deposit interest requirements return procedures'
      ]
    },
    {
      title: "Landlord entry and privacy rights",
      queries: [
        'landlord entry access notice requirements privacy',
        'property inspection maintenance access emergency entry',
        'tenant privacy rights landlord access rules',
        'advance notice entry requirements tenant consent'
      ]
    },
    {
      title: "Breaking my lease early",
      queries: [
        'early termination lease break penalties fees',
        'lease termination conditions notice requirements',
        'subletting assignment lease transfer options',
        'default breach termination procedures'
      ]
    }
  ];

  const enhancedScenarios: EnhancedScenario[] = [];

  for (const scenario of scenarioQueries) {
    // console.log(`🔍 Processing scenario: ${scenario.title}`);
    
    try {
      // Use RAG to find relevant lease content
      const relevantChunks: Array<{
        text: string;
        pageNumber: number;
        score: number;
      }> = [];

      for (const query of scenario.queries) {
        try {
          const chunks = await rag.retrieve(query, 3); // Top 3 for each query
          chunks.forEach(chunk => {
            relevantChunks.push({
              text: chunk.text,
              pageNumber: chunk.pageNumber,
              score: chunk.score || 0
            });
          });
        } catch (ragError) {
          console.warn(`⚠️ RAG retrieval failed for query "${query}":`, ragError);
          // Continue with other queries
        }
      }

      // Remove duplicates and sort by relevance
      const uniqueChunks = relevantChunks.filter((chunk, index, self) =>
        index === self.findIndex(c => c.text === chunk.text)
      ).sort((a, b) => b.score - a.score);

      // Find relevant state law for this scenario
      const relevantLaw = findRelevantStateLaw(scenario.title, legalInfo.legalInfo);
      
      // console.log(`   Found ${uniqueChunks.length} relevant lease clauses`);
      // console.log(`   Found relevant state law: ${relevantLaw ? relevantLaw.lawType : 'None'}`);

      // Generate enhanced advice using both lease and state law
      const enhancedAdvice = await generateEnhancedAdvice(
        scenario.title,
        uniqueChunks,
        relevantLaw,
        locationInfo,
        leaseContext
      );

      enhancedScenarios.push({
        title: scenario.title,
        advice: enhancedAdvice.advice,
        stateLaw: relevantLaw,
        leaseRelevantText: uniqueChunks.length > 0 ? uniqueChunks[0].text : undefined,
        pageNumber: uniqueChunks.length > 0 ? uniqueChunks[0].pageNumber : undefined,
        severity: enhancedAdvice.severity,
        actionableSteps: enhancedAdvice.actionableSteps
      });
      
    } catch (scenarioError) {
      console.error(`❌ Failed to process scenario "${scenario.title}":`, scenarioError);
      
      // Fallback: create a basic scenario without RAG
      enhancedScenarios.push({
        title: scenario.title,
        advice: `Here's what you should know about ${scenario.title.toLowerCase()}. Check your lease and local laws for specific details.`,
        severity: 'medium',
        actionableSteps: [
          'Check your lease for specific terms',
          'Contact your landlord if needed',
          'Keep records of all communication',
          'Know your local tenant rights'
        ]
      });
    }
  }

  // console.log(`✅ Generated ${enhancedScenarios.length} enhanced scenarios`);

  return {
    scenarios: enhancedScenarios,
    location: locationInfo
  };
}

/**
 * Generate enhanced advice combining lease content and state law
 */
async function generateEnhancedAdvice(
  scenarioTitle: string,
  leaseChunks: Array<{ text: string; pageNumber: number; score: number }>,
  stateLaw: any,
  location: { state: string; city: string },
  leaseContext: any
): Promise<{
  advice: string;
  severity: 'high' | 'medium' | 'low';
  actionableSteps: string[];
}> {
  
  const leaseText = leaseChunks.map(c => c.text).join('\n\n');
  
  const prompt = `You are a tenant rights expert providing scenario-specific advice for ${location.city}, ${location.state}.

SCENARIO: ${scenarioTitle}

LEASE CONTEXT:
- Monthly Rent: ${leaseContext.monthlyRent || 'Not specified'}
- Security Deposit: ${leaseContext.securityDeposit || 'Not specified'}
- Lease Start: ${leaseContext.leaseStart || 'Not specified'}
- Lease End: ${leaseContext.leaseEnd || 'Not specified'}

RELEVANT LEASE CLAUSES:
${leaseText || 'No specific clauses found in lease'}

STATE LAW INFORMATION:
${stateLaw ? `
- Law Type: ${stateLaw.lawType}
- Explanation: ${stateLaw.explanation}
- Statute: ${stateLaw.statute || 'Not specified'}
` : 'No specific state law found'}

INSTRUCTIONS:
1. Write advice like you're explaining to a 5-year-old - use simple words and short sentences
2. Keep the main advice to 2-3 sentences maximum - make it super easy to understand
3. Focus on the most important thing the tenant needs to know right now
4. Use everyday language, avoid legal jargon completely
5. Rate severity: HIGH (urgent/expensive), MEDIUM (important), LOW (informational)
6. Make actionable steps very simple and clear
7. Think: "What's the one most important thing they should do?"

Return JSON:
{
  "advice": "Super simple 1-2 sentence explanation in everyday language (like talking to a 5-year-old)",
  "severity": "high" | "medium" | "low",
  "actionableSteps": [
    "Simple step 1 (like: Call your landlord)",
    "Simple step 2 (like: Take a photo)",
    "Simple step 3 (like: Keep a copy)",
    "Simple step 4 (like: Wait 2 weeks)"
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a friendly helper who explains tenant rights in super simple terms. Think like you\'re talking to a 5-year-old - use short words, simple sentences, and be very clear. Never use legal words or complicated explanations. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      advice: result.advice || 'Advice could not be generated',
      severity: result.severity || 'medium',
      actionableSteps: result.actionableSteps || []
    };
    
  } catch (error) {
    console.error('Error generating enhanced advice:', error);
    return {
      advice: `Based on ${location.state} law, here's what you should know about ${scenarioTitle.toLowerCase()}.`,
      severity: 'medium',
      actionableSteps: []
    };
  }
}

/**
 * Find relevant state law for a scenario
 */
function findRelevantStateLaw(scenarioTitle: string, legalInfo: any[]): any {
  const scenarioKeywords = {
    "What if something breaks?": ['maintenance', 'repairs', 'habitable'],
    "Getting my security deposit back": ['security deposit', 'deposit return'],
    "Landlord entry and privacy rights": ['landlord entry', 'privacy', 'access'],
    "Breaking my lease early": ['lease termination', 'early termination']
  };

  const keywords = scenarioKeywords[scenarioTitle as keyof typeof scenarioKeywords] || [];
  
  for (const law of legalInfo) {
    const lawTypeLower = law.lawType.toLowerCase();
    const explanationLower = law.explanation.toLowerCase();
    
    if (keywords.some(keyword => 
      lawTypeLower.includes(keyword) || explanationLower.includes(keyword)
    )) {
      return law;
    }
  }
  
  return null;
}

/**
 * Extract state and city from address
 */
function extractLocationFromAddress(address: string): { state: string; city: string } {
  // Simple parsing - could be enhanced with geocoding
  const parts = address.split(',').map(p => p.trim());
  
  if (parts.length >= 2) {
    const state = parts[parts.length - 1];
    const city = parts[parts.length - 2];
    return { state, city };
  }
  
  // Fallback
  return { state: 'Unknown', city: 'Unknown' };
}
