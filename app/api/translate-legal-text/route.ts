import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('📥 Translation API called');
  
  try {
    const body = await request.json();
    console.log('📝 Request body received:', { hasLegalText: !!body.legalText, textLength: body.legalText?.length });
    
    const { legalText } = body;

    if (!legalText) {
      console.error('❌ No legal text provided');
      return NextResponse.json(
        { error: 'Legal text is required' },
        { status: 400 }
      );
    }

    console.log('🤖 Calling OpenAI for translation...');
    
    // Translate legal text to plain English using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that translates complex legal language into plain, easy-to-understand English for tenants. 

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
Plain English: "You need to pay your rent by the 1st of each month. If you pay after the 5th, you'll be charged a $50 late fee."`,
        },
        {
          role: 'user',
          content: `Translate this legal text into plain English:\n\n"${legalText}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const plainEnglish = completion.choices[0].message.content;
    
    console.log('✅ Translation successful:', plainEnglish?.substring(0, 50) + '...');

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

