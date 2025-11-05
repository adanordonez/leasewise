import Perplexity from '@perplexity-ai/perplexity_ai';

const client = new Perplexity({
  apiKey: process.env.PERPLEXITY_API_KEY,
});

interface PerplexityLegalInfo {
  lawType: string;
  explanation: string;
  example: string;
  sourceUrl: string;
  sourceTitle: string;
  statute?: string;
}

async function getLegalInfoForCategory(
  category: string,
  state: string,
  city: string,
  leaseContext?: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
  },
  locale: string = 'en'
): Promise<PerplexityLegalInfo | null> {
  try {
    const stateDomain = `${state.toLowerCase().replace(/\s+/g, '')}.gov`;
    
    const legalDomains = [
      'law.justia.com',
      'law.cornell.edu',
      'nolo.com',
      'hud.gov',
      stateDomain,
      'municode.com',
      'findlaw.com',
    ];

    const categoryPrompts: Record<string, string> = {
      'Security Deposit Terms': `${state} security deposit law statute maximum amount return timeline`,
      'Rent Amount and Increase Provisions': `${state} rent control rent increase notice law statute`,
      'Maintenance and Repair Responsibilities': `${state} landlord tenant repair maintenance habitability law`,
      'Entry and Privacy Rights': `${state} landlord entry notice privacy tenant rights statute`,
      'Lease Term and Renewal Options': `${state} lease renewal automatic notice requirements law`,
      'Pet Policies and Fees': `${state} pet deposit pet fees service animal law statute`,
      'Subletting and Assignment Rights': `${state} subletting assignment tenant rights law statute`,
      'Eviction Procedures and Protections': `${state} eviction notice requirements tenant protections law`,
      'Utilities and Service Responsibilities': `${state} utilities tenant landlord responsibility law statute`,
      'Modifications and Alterations': `${state} tenant modifications alterations property law statute`,
    };

    const searchQuery = categoryPrompts[category] || `${state} ${category} tenant law statute`;
    const cityContext = city ? ` Focus on ${city} if city-specific laws exist.` : '';

    const userPrompt = locale === 'es' 
      ? `Encuentra información legal sobre "${category}" para inquilinos en ${city ? `${city}, ` : ''}${state}. ${cityContext}

Responde en español simple con:
1. Una explicación clara de qué dice la ley (30 palabras máximo)
2. La cita del estatuto específico (ej: "765 ILCS 715/1")
3. Un ejemplo personalizado usando: renta mensual ${leaseContext?.monthlyRent || '$X'}, depósito ${leaseContext?.securityDeposit || '$Y'}

Responde SOLO en formato JSON:
{
  "explanation": "Explicación clara de la ley",
  "statute": "Cita del estatuto",
  "example": "Ejemplo específico usando los números del contrato"
}`
      : `Find legal information about "${category}" for tenants in ${city ? `${city}, ` : ''}${state}. ${cityContext}

Respond with:
1. A clear explanation of what the law says (30 words max)
2. The specific statute citation (e.g., "765 ILCS 715/1")
3. A personalized example using: monthly rent ${leaseContext?.monthlyRent || '$X'}, deposit ${leaseContext?.securityDeposit || '$Y'}

Respond ONLY in JSON format:
{
  "explanation": "Clear explanation of the law",
  "statute": "Statute citation",
  "example": "Specific example using the lease numbers"
}`;

    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      model: 'sonar',
      web_search_options: {
        search_domain_filter: legalDomains,
        search_recency_filter: 'year',
      },
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      return null;
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const citations = (completion as any).citations || [];
    const sourceUrl = citations.length > 0 ? citations[0] : '';
    const sourceTitle = sourceUrl ? `Search: ${state} ${category}` : 'No source available';

    return {
      lawType: category,
      explanation: parsed.explanation || 'No information found',
      example: parsed.example || 'No example available',
      statute: parsed.statute || undefined,
      sourceUrl,
      sourceTitle,
    };
  } catch (error) {
    return null;
  }
}

export async function searchLegalInfoWithPerplexity(
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
  const addressParts = userAddress.split(',').map(s => s.trim());
  const state = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '';
  const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3] : '';

  const categories = locale === 'es' ? [
    'Términos del Depósito de Seguridad',
    'Disposiciones sobre Monto y Aumento de Renta',
    'Responsabilidades de Mantenimiento y Reparación',
    'Derechos de Entrada y Privacidad',
    'Término del Contrato y Opciones de Renovación',
    'Políticas y Cargos por Mascotas',
    'Derechos de Subarrendamiento y Cesión',
    'Procedimientos y Protecciones de Desalojo',
    'Responsabilidades de Servicios y Utilidades',
    'Modificaciones y Alteraciones',
  ] : [
    'Security Deposit Terms',
    'Rent Amount and Increase Provisions',
    'Maintenance and Repair Responsibilities',
    'Entry and Privacy Rights',
    'Lease Term and Renewal Options',
    'Pet Policies and Fees',
    'Subletting and Assignment Rights',
    'Eviction Procedures and Protections',
    'Utilities and Service Responsibilities',
    'Modifications and Alterations',
  ];

  const legalInfoPromises = categories.map(category =>
    getLegalInfoForCategory(category, state, city, leaseContext, locale)
  );

  const results = await Promise.all(legalInfoPromises);
  
  const legalInfo = results.filter((result): result is PerplexityLegalInfo => result !== null);

  return {
    legalInfo,
    searchMetadata: {
      state,
      city,
      totalSources: legalInfo.length,
      verifiedSources: legalInfo.filter(info => info.sourceUrl).length,
      rejectedSources: categories.length - legalInfo.length,
    },
  };
}

