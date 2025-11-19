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
  zipCode: string,
  county: string,
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

    const locationContext = zipCode 
      ? `${zipCode} ${city}, ${state}`
      : `${city}, ${state}`;
    
    const cityCountyState = county 
      ? `${city}, ${county}, ${state}`
      : `${city}, ${state}`;

    const categoryPrompts: Record<string, string> = {
      // Security Deposit Terms
      'Security Deposit Terms': `Research current residential landlord-tenant law on security deposits for renters in ${locationContext}. Summarize: (1) maximum amount landlord can charge; (2) how and where deposit must be held; (3) deadlines and rules for returning deposit`,
      'Términos del Depósito de Seguridad': `Investiga la ley actual de arrendamiento residencial sobre depósitos de seguridad para inquilinos en ${locationContext}. Resume: (1) el monto máximo que puede cobrar el propietario; (2) cómo y dónde debe mantenerse el depósito; (3) plazos y reglas para devolver el depósito`,
      
      // Rent Amount and Increase Provisions
      'Rent Amount and Increase Provisions': `Research current residential landlord-tenant law on rent amount and rent increase provisions for renters in ${locationContext}, and summarize: (1) any limits on initial rent (rent control or stabilization) and whether state law preempts or restricts local rent regulations; (2) rules on rent increases during the tenancy (including how often and by how much rent can be raised); and (3) minimum advance notice required for any rent increase depending on type of lease (fixed-term and month-to-month)`,
      'Disposiciones sobre Monto y Aumento de Renta': `Investiga la ley actual de arrendamiento residencial sobre monto de renta y aumentos para inquilinos en ${locationContext}, y resume: (1) cualquier límite en la renta inicial (control o estabilización de rentas) y si la ley estatal anula o restringe las regulaciones locales de renta; (2) reglas sobre aumentos de renta durante el arrendamiento (incluyendo con qué frecuencia y cuánto puede aumentarse); y (3) aviso mínimo requerido para cualquier aumento según el tipo de contrato (plazo fijo y mes a mes)`,
      
      // Maintenance and Repair Responsibilities
      'Maintenance and Repair Responsibilities': `Research current residential landlord-tenant law on maintenance and repair responsibilities for renters in ${locationContext}, and summarize: (1) the landlord's duty to provide and maintain habitable housing (i.e., warranty of habitability); (2) timelines and standards for making repairs (including any specific deadlines for emergencies); and (3) tenant remedies if the landlord fails to repair (e.g., rent withholding, repair-and-deduct, terminating the lease, damages)`,
      'Responsabilidades de Mantenimiento y Reparación': `Investiga la ley actual de arrendamiento residencial sobre responsabilidades de mantenimiento y reparación para inquilinos en ${locationContext}, y resume: (1) el deber del propietario de proporcionar y mantener vivienda habitable (garantía de habitabilidad); (2) plazos y estándares para hacer reparaciones (incluyendo plazos específicos para emergencias); y (3) remedios del inquilino si el propietario no repara (ej. retención de renta, reparar y deducir, terminar el contrato, daños)`,
      
      // Entry and Privacy Rights
      'Entry and Privacy Rights': `Research current residential landlord-tenant law on landlord entry and tenant privacy rights for renters in ${locationContext}, and summarize: (1) minimum advance notice required for non-emergency entry and any limits on time of day or frequency; (2) legally permitted reasons for entry (such as repairs, inspections, showings, and emergencies); and (3) tenant rights and remedies if the landlord enters without proper notice or valid reason`,
      'Derechos de Entrada y Privacidad': `Investiga la ley actual de arrendamiento residencial sobre entrada del propietario y derechos de privacidad del inquilino en ${locationContext}, y resume: (1) aviso mínimo requerido para entrada no urgente y límites de hora del día o frecuencia; (2) razones legalmente permitidas para entrar (reparaciones, inspecciones, mostrar propiedad, emergencias); y (3) derechos y remedios del inquilino si el propietario entra sin aviso apropiado o razón válida`,
      
      // Lease Term and Renewal Options
      'Lease Term and Renewal Options': `Research current residential landlord-tenant law on lease term and renewal options for renters in ${locationContext}, and summarize: (1) what happens at the end of a fixed term or if the tenant "holds over"; (2) rules and deadlines for non-renewal or termination by either landlord or tenant (including notice requirements and any special rules for automatic renewal clauses); and (3) tenant options and consequences for ending the lease early (e.g., fees, reletting duties, mitigation of damages)`,
      'Término del Contrato y Opciones de Renovación': `Investiga la ley actual de arrendamiento residencial sobre término del contrato y opciones de renovación para inquilinos en ${locationContext}, y resume: (1) qué sucede al final de un plazo fijo o si el inquilino se queda después del término; (2) reglas y plazos para no renovar o terminar por propietario o inquilino (incluyendo requisitos de aviso y reglas especiales para cláusulas de renovación automática); y (3) opciones y consecuencias para el inquilino de terminar el contrato antes de tiempo (ej. cargos, deberes de re-arrendar, mitigación de daños)`,
      
      // Pet Policies and Fees
      'Pet Policies and Fees': `For the U.S. state of ${state}, briefly explain the rules on residential pet policies, including: (1) when and how landlords may restrict or prohibit pets (e.g., limits on number, size, or breed, and consequences for unauthorized pets), (2) what pet-related charges are allowed (pet deposits, nonrefundable fees, and monthly pet rent), including any caps, refund rules, and interaction with security deposit limits, and (3) how service animals and emotional support animals are treated differently from pets, including when landlords must waive pet rules and fees as a reasonable accommodation. Cite the key statutes and regulations you rely on (e.g., "Cal. Civ. Code § 1950.5", state fair-housing statutes). Keep the entire answer under 150 words and avoid any introduction or conclusion`,
      'Políticas y Cargos por Mascotas': `Para el estado de ${state} en EE.UU., explica brevemente las reglas sobre políticas de mascotas residenciales, incluyendo: (1) cuándo y cómo los propietarios pueden restringir o prohibir mascotas (límites de número, tamaño, raza, consecuencias por mascotas no autorizadas), (2) qué cargos relacionados con mascotas están permitidos (depósitos, tarifas no reembolsables, renta mensual por mascota), incluyendo límites, reglas de reembolso e interacción con límites de depósito de seguridad, y (3) cómo los animales de servicio y apoyo emocional se tratan diferente a las mascotas, incluyendo cuándo los propietarios deben renunciar a reglas y cargos por mascotas como acomodación razonable. Cita los estatutos y regulaciones clave. Mantén la respuesta bajo 150 palabras y evita introducción o conclusión`,
      
      // Subletting and Assignment Rights
      'Subletting and Assignment Rights': `For a residential renter in ${cityCountyState}, briefly explain the rules on tenant subletting and assignment under state law and any applicable city or county ordinances. Address: (1) whether and when tenants may sublet or assign, when landlord consent is required, and any standards or deadlines for granting or refusing consent; (2) required procedures (notice, information to provide) and the consequences of unauthorized subletting or assignment. Cite the key statutes and ordinances you rely on. Keep the entire answer under 150 words and avoid any introduction or conclusion`,
      'Derechos de Subarrendamiento y Cesión': `Para un inquilino residencial en ${cityCountyState}, explica brevemente las reglas sobre subarrendamiento y cesión del inquilino bajo la ley estatal y ordenanzas municipales o del condado aplicables. Aborda: (1) si y cuándo los inquilinos pueden subarrendar o ceder, cuándo se requiere consentimiento del propietario, y estándares o plazos para otorgar o rechazar consentimiento; (2) procedimientos requeridos (aviso, información a proporcionar) y consecuencias de subarrendamiento o cesión no autorizada. Cita los estatutos y ordenanzas clave. Mantén la respuesta bajo 150 palabras y evita introducción o conclusión`,
      
      // Eviction Procedures and Protections
      'Eviction Procedures and Protections': `For a residential renter in ${cityCountyState}, briefly explain eviction rules under state law and any applicable city or county ordinances. Address: (1) what legal reasons ("just causes") landlords may use to evict and what type/length of notice is required for each; (2) the basic court process and timeline (when an eviction case can be filed, tenant deadlines to respond, any right to cure or "pay and stay" before judgment); and (3) key tenant protections and defenses, such as bans on self-help/lockouts, anti-retaliation and anti-discrimination rules, habitability/rent withholding defenses, and any local "just cause" or special protections (e.g., during emergencies). Cite the main statutes and ordinances you rely on. Keep the entire answer under 150 words`,
      'Procedimientos y Protecciones de Desalojo': `Para un inquilino residencial en ${cityCountyState}, explica brevemente las reglas de desalojo bajo la ley estatal y ordenanzas municipales o del condado aplicables. Aborda: (1) qué razones legales ("causa justa") pueden usar los propietarios para desalojar y qué tipo/duración de aviso se requiere para cada una; (2) el proceso básico judicial y cronología (cuándo se puede presentar un caso de desalojo, plazos del inquilino para responder, derecho a remediar o "pagar y quedarse" antes del juicio); y (3) protecciones clave del inquilino, como prohibiciones de auto-ayuda/cierre forzado, reglas anti-represalia y anti-discriminación, defensas de habitabilidad/retención de renta, y protecciones locales especiales. Cita los estatutos y ordenanzas principales. Mantén la respuesta bajo 150 palabras`,
      
      // Utilities and Service Responsibilities
      'Utilities and Service Responsibilities': `For a residential renter in ${cityCountyState}, briefly explain the rules on utilities and essential services under state law and any applicable city or county ordinances. Address: (1) which utilities and services (e.g., heat, water, electricity, gas, trash) landlords must provide or maintain, including minimum habitability standards and any seasonal heat/hot-water rules; (2) when and how utilities may be billed to the tenant (separately metered vs. shared/RUBS billing, required disclosures, any caps or late-fee limits); and (3) protections against shutoffs or "constructive eviction," including bans on landlords deliberately cutting utilities to force move-out, basic shutoff rules, and key tenant remedies if required services are not provided. Cite the main statutes, regulations, and ordinances you rely on. Keep the entire answer under 150 words and avoid any introduction or conclusion`,
      'Responsabilidades de Servicios y Utilidades': `Para un inquilino residencial en ${cityCountyState}, explica brevemente las reglas sobre servicios esenciales y utilidades bajo la ley estatal y ordenanzas municipales o del condado aplicables. Aborda: (1) qué utilidades y servicios (calefacción, agua, electricidad, gas, basura) deben proporcionar o mantener los propietarios, incluyendo estándares mínimos de habitabilidad y reglas estacionales; (2) cuándo y cómo las utilidades pueden cobrarse al inquilino (medidores separados vs. facturación compartida, divulgaciones requeridas, límites); y (3) protecciones contra cortes o "desalojo constructivo", incluyendo prohibiciones de que propietarios corten servicios deliberadamente, reglas básicas de corte, y remedios clave del inquilino si no se proporcionan servicios requeridos. Cita los estatutos, regulaciones y ordenanzas principales. Mantén la respuesta bajo 150 palabras y evita introducción o conclusión`,
      
      // Modifications and Alterations
      'Modifications and Alterations': `For a residential renter in ${cityCountyState}, briefly explain the rules on tenant modifications and alterations under state law and any applicable city or county ordinances. Address: (1) when tenants can make changes and when consent is required (paint, fixtures, structural work); (2) who pays for the work, whether tenant must restore at move-out, and impact on the security deposit; and (3) disability-related modifications in one short line (landlord has to allow some changes as a reasonable accommodation). Cite the key statutes and ordinances. Keep the entire answer under 150 words and avoid any introduction or conclusion`,
      'Modificaciones y Alteraciones': `Para un inquilino residencial en ${cityCountyState}, explica brevemente las reglas sobre modificaciones y alteraciones del inquilino bajo la ley estatal y ordenanzas municipales o del condado aplicables. Aborda: (1) cuándo los inquilinos pueden hacer cambios y cuándo se requiere consentimiento (pintura, accesorios, trabajo estructural); (2) quién paga el trabajo, si el inquilino debe restaurar al mudarse, e impacto en el depósito de seguridad; y (3) modificaciones relacionadas con discapacidad en una línea corta (el propietario debe permitir algunos cambios como acomodación razonable). Cita los estatutos y ordenanzas clave. Mantén la respuesta bajo 150 palabras y evita introducción o conclusión`,
    };

    const searchQuery = categoryPrompts[category] || `${state} ${category} tenant law statute`;
    const cityContext = city ? ` Focus on ${city} if city-specific laws exist.` : '';

    // For Security Deposit Terms, use more structured guidance
    const isSecurityDeposit = category === 'Security Deposit Terms' || category === 'Términos del Depósito de Seguridad';
    
    const userPrompt = locale === 'es' 
      ? (isSecurityDeposit 
        ? `${searchQuery}

Responde en español simple con:
1. Una explicación clara que cubra: (a) monto máximo permitido, (b) cómo debe mantenerse el depósito, (c) plazos de devolución (40 palabras máximo)
2. La cita del estatuto específico (ej: "765 ILCS 715/1")
3. Un ejemplo MUY BREVE (máximo 15 palabras) usando: renta ${leaseContext?.monthlyRent || '$X'}, depósito ${leaseContext?.securityDeposit || '$Y'}

IMPORTANTE: El ejemplo debe ser EXTREMADAMENTE conciso, como: "Con renta de $1,200, el depósito no puede exceder $2,400."

Responde SOLO en formato JSON:
{
  "explanation": "Explicación clara cubriendo (1) límite máximo (2) requisitos de mantenimiento (3) plazos de devolución",
  "statute": "Cita del estatuto",
  "example": "Ejemplo muy breve de 15 palabras o menos"
}`
        : `Encuentra información legal sobre "${category}" para inquilinos en ${city ? `${city}, ` : ''}${state}. ${cityContext}

Responde en español simple con:
1. Una explicación clara de qué dice la ley (30 palabras máximo)
2. La cita del estatuto específico (ej: "765 ILCS 715/1")
3. Un ejemplo MUY BREVE (15 palabras máximo, UNA SOLA oración corta) usando: renta ${leaseContext?.monthlyRent || '$X'}, depósito ${leaseContext?.securityDeposit || '$Y'}

IMPORTANTE: El ejemplo debe ser EXTREMADAMENTE conciso, como: "Con renta de $1,200, el depósito no puede exceder $2,400."

Responde SOLO en formato JSON:
{
  "explanation": "Explicación clara de la ley",
  "statute": "Cita del estatuto",
  "example": "Ejemplo muy breve de 15 palabras o menos"
}`)
      : (isSecurityDeposit
        ? `${searchQuery}

Respond with:
1. A clear explanation covering: (a) maximum amount allowed, (b) how deposit must be held, (c) return deadlines (40 words max)
2. The specific statute citation (e.g., "765 ILCS 715/1")
3. ONE SHORT example sentence (15 words max) using: rent ${leaseContext?.monthlyRent || '$X'}, deposit ${leaseContext?.securityDeposit || '$Y'}

CRITICAL: Example must be EXTREMELY brief, like: "With $1,200 rent, deposit cannot exceed $2,400."

Respond ONLY in JSON format:
{
  "explanation": "Clear explanation covering (1) maximum limit (2) holding requirements (3) return deadlines",
  "statute": "Statute citation",
  "example": "Very brief example of 15 words or less"
}`
        : `Find legal information about "${category}" for tenants in ${city ? `${city}, ` : ''}${state}. ${cityContext}

Respond with:
1. A clear explanation of what the law says (30 words max)
2. The specific statute citation (e.g., "765 ILCS 715/1")
3. ONE SHORT example sentence (15 words max, ONE sentence only) using: rent ${leaseContext?.monthlyRent || '$X'}, deposit ${leaseContext?.securityDeposit || '$Y'}

CRITICAL: Example must be EXTREMELY brief, like: "With $1,200 rent, deposit cannot exceed $2,400."

Respond ONLY in JSON format:
{
  "explanation": "Clear explanation of the law",
  "statute": "Statute citation",
  "example": "Very brief example of 15 words or less"
}`);

    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      model: 'sonar',
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      return null;
    }

    // Handle content as string or array
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);

    const jsonMatch = contentString.match(/\{[\s\S]*\}/);
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
  
  // Extract zip code from the state part (e.g., "IL 60614" or "Illinois 60614")
  const stateAndZip = addressParts.length >= 2 ? addressParts[addressParts.length - 1] : '';
  const zipMatch = stateAndZip.match(/\d{5}(-\d{4})?$/);
  const zipCode = zipMatch ? zipMatch[0] : '';
  
  // Extract county if present (typically between city and state in full addresses)
  // Example: "123 Main St, Chicago, Cook County, IL 60614"
  const county = addressParts.length >= 4 ? addressParts[addressParts.length - 4] : '';

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
    getLegalInfoForCategory(category, state, city, zipCode, county, leaseContext, locale)
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

