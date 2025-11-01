import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  // console.log('📥 Translation API called');
  
  try {
    const body = await request.json();
    // console.log('📝 Request body received:', { hasLegalText: !!body.legalText, textLength: body.legalText?.length });
    
    const { legalText } = body;
    
    // Get locale from cookies
    const locale = request.cookies.get('locale')?.value || 'en';
    // console.log(`🌐 Detected locale: ${locale}`);

    if (!legalText) {
      console.error('❌ No legal text provided');
      return NextResponse.json(
        { error: 'Legal text is required' },
        { status: 400 }
      );
    }

    // console.log('🤖 Calling OpenAI for translation...');
    
    const systemContent = locale === 'es' 
      ? `Eres un asistente útil que traduce lenguaje legal complejo a español sencillo y fácil de entender para inquilinos.

Reglas:
1. Use lenguaje sencillo y cotidiano
2. Evite jerga legal
3. Explique qué significa esto en la práctica para un inquilino
4. Sea conciso pero completo
5. Concéntrese en lo que el inquilino necesita saber y entender
6. Use segunda persona ("usted" o "tú") para hacerlo personal
7. Si hay implicaciones importantes, establézcalas claramente
8. Manténgalo en 3-4 oraciones

Ejemplo:
Legal: "El inquilino deberá remitir el pago del alquiler en o antes del primer día de cada mes calendario, de lo contrario se evaluará una tarifa por pago atrasado de $50.00 después de un período de gracia de cinco (5) días."
Español Sencillo: "Necesita pagar su alquiler antes del día 1 de cada mes. Si paga después del día 5, se le cobrará una tarifa de $50 por pago atrasado."`
      : `You are a helpful assistant that translates complex legal language into plain, easy-to-understand English for tenants. 

Rules:
1. Use simple, everyday language
2. Avoid legal jargon
3. Explain what this means in practice for a tenant
4. Be concise but complete
5. Focus on what the tenant needs to know and understand
6. Use second person ("you") to make it personal
7. If there are important implications, clearly state them
8. Keep it under 3-4 sentences

Example:
Legal: "Tenant shall remit payment of rent on or before the first day of each calendar month, failing which a late fee of $50.00 shall be assessed after a grace period of five (5) days."
Plain English: "You need to pay your rent by the 1st of each month. If you pay after the 5th, you'll be charged a $50 late fee."`;

    const userContent = locale === 'es'
      ? `Traduce este texto legal a español sencillo:\n\n"${legalText}"`
      : `Translate this legal text into plain English:\n\n"${legalText}"`;
    
    // Translate legal text to plain language using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const plainEnglish = completion.choices[0].message.content;
    
    // console.log('✅ Translation successful:', plainEnglish?.substring(0, 50) + '...');

    return NextResponse.json({
      success: true,
      plainEnglish,
    });
  } catch (error) {
    console.error('❌ Translation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to translate legal text',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

