import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PerplexityLegalInfo {
  lawType: string;
  explanation: string;
  example: string;
  sourceUrl: string;
  sourceTitle: string;
  statute?: string;
}

/**
 * Generate a Google search URL for the statute (simple and reliable)
 */
function generateGoogleSearchUrl(
  statute: string,
  lawType: string,
  state: string
): string {
  // console.log(`🔍 Generating Google search URL for: ${statute} (${lawType})`);
  
  // Create a simple search query - just the statute and state
  const searchQuery = encodeURIComponent(`${statute} ${state}`);
  
  const googleUrl = `https://www.google.com/search?q=${searchQuery}`;
  
  // console.log(`   Generated: ${googleUrl}`);
  return googleUrl;
}

/**
 * Get legal information using GPT-4o, then generate Google search URLs for statutes
 */
async function getLegalInformationWithGoogleSearch(
  state: string,
  city: string,
  leaseContext?: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
  },
  locale: string = 'en'
): Promise<PerplexityLegalInfo[]> {
  // console.log(`🔍 Getting legal information for ${state} with Perplexity URL search...`);
  
  const languageInstruction = locale === 'es' 
    ? '\n\nThis output is for a Spanish speaking tenant. Please output in simple spanish terms so that tenants can understand.' 
    : '';
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a legal information assistant specializing in landlord-tenant law for ${city}, ${state}.

CRITICAL RULES:
1. PRIORITIZE ${city}-specific laws if they exist, otherwise use ${state} laws
2. Only provide information you are CERTAIN about for ${city}, ${state}
3. Include REAL statute citations (e.g., "765 ILCS 715/1" for Illinois, "Chicago Municipal Code 5-12" for Chicago)
4. If no specific statute exists for a category, set "statute" to null
5. Be specific and factual
6. DO NOT include source URLs - we will find them separately

IMPORTANT: If you cannot find a specific statute for a law type, set "statute" to null rather than making one up.

Return JSON with this EXACT structure:
{
  "legalInfo": [
    {
      "lawType": "Category name",
      "explanation": "What the law says for ${city}, ${state}",
      "example": "How it applies (use lease context if provided)",
      "statute": "Specific statute citation or null if none exists"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Provide renter law information for ${city}, ${state} for ALL 10 categories below.

LOCATION: ${city}, ${state}
FOCUS: Look for ${city}-specific ordinances and regulations first, then fall back to ${state} laws if no city-specific laws exist.

Categories:
${locale === 'es' ? `
1. Términos del Depósito de Seguridad
2. Disposiciones sobre Monto y Aumento de Renta
3. Responsabilidades de Mantenimiento y Reparación
4. Derechos de Entrada y Privacidad
5. Término del Contrato y Opciones de Renovación
6. Políticas y Cargos por Mascotas
7. Derechos de Subarrendamiento y Cesión
8. Procedimientos y Protecciones de Desalojo
9. Responsabilidades de Servicios y Utilidades
10. Modificaciones y Alteraciones
` : `
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
`}

${leaseContext ? `
Personalize examples using this lease:
- Monthly Rent: ${leaseContext.monthlyRent || 'Not specified'}
- Security Deposit: ${leaseContext.securityDeposit || 'Not specified'}
- Lease Period: ${leaseContext.leaseStart || 'N/A'} to ${leaseContext.leaseEnd || 'N/A'}
- Location: ${city}, ${state}
` : ''}

IMPORTANT: 
- For ${city}, ${state} ONLY
- Include real statute citations when they exist
- Set statute to null if no specific law exists for that category
- Prioritize city laws over state laws when available

Return ONLY valid JSON.${languageInstruction}`
      }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0].message.content || '{}';
  const parsed = JSON.parse(content);
  const legalInfo = parsed.legalInfo || [];
  
  // console.log(`✅ Got ${legalInfo.length} categories from GPT-4o`);
  
  // Now generate Google search URLs for each statute (only if statute exists)
  // console.log('🔍 Generating Google search URLs for statutes...');
  
  const legalInfoWithUrls: PerplexityLegalInfo[] = [];
  
  for (const info of legalInfo) {
    // console.log(`   Processing: ${info.lawType} (${info.statute || 'No statute'})`);
    
    // Only generate URL if statute exists
    if (info.statute) {
      const googleSearchUrl = generateGoogleSearchUrl(
        info.statute,
        info.lawType,
        state
      );
      
      legalInfoWithUrls.push({
        ...info,
        sourceUrl: googleSearchUrl,
        sourceTitle: `Search: ${info.statute} - ${state}`
      });
    } else {
      // No statute found - leave sourceUrl empty
      legalInfoWithUrls.push({
        ...info,
        sourceUrl: '', // Empty URL when no statute exists
        sourceTitle: `No specific statute found for ${info.lawType} in ${city}, ${state}`
      });
    }
  }
  
  // console.log(`✅ Generated Google search URLs for ${legalInfoWithUrls.length} categories`);
  return legalInfoWithUrls;
}

/**
 * Main function to search legal information with Google search URLs
 */
export async function searchLegalInfoWithGoogleSearch(
  userAddress: string,
  leaseContext?: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
  },
  locale: string = 'en'
): Promise<{
  legalInfo: PerplexityLegalInfo[];
  searchMetadata: {
    state: string;
    city: string;
    totalSources: number;
    verifiedSources: number;
    rejectedSources: number;
  };
}> {
  // console.log('\n🚀 PERPLEXITY LEGAL SEARCH');
  
  const addressParts = userAddress.split(',').map(s => s.trim());
  const state = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '';
  const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3] : '';
  
  // console.log(`📍 Location: ${userAddress}`);
  // console.log(`📍 Parsed: ${city}, ${state}`);

  // Get legal information with Google search URLs
  const legalInfo = await getLegalInformationWithGoogleSearch(state, city, leaseContext, locale);

  if (legalInfo.length === 0) {
    // console.log('❌ No legal information found, returning empty');
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
  
  // console.log(`✅ Returning ${legalInfo.length} categories with Google search URLs\n`);
  
  return {
    legalInfo,
    searchMetadata: {
      state,
      city,
      totalSources: legalInfo.length,
      verifiedSources: legalInfo.length,
      rejectedSources: 0
    }
  };
}
