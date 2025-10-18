import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';
import { LeaseRAGSystem } from '@/lib/rag-system';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leaseDataId } = body;

    console.log(`🔍 Extracting landlord information for lease ${leaseDataId}...`);

    // Fetch lease data from Supabase
    const { data: leaseData, error: leaseError } = await supabase
      .from('lease_data')
      .select('*')
      .eq('id', leaseDataId)
      .single();

    if (leaseError || !leaseData) {
      console.error('Error fetching lease data:', leaseError);
      return NextResponse.json(
        { error: 'Lease data not found' },
        { status: 404 }
      );
    }

    console.log('✅ Lease data fetched successfully');

    // Rebuild RAG system from stored chunks
    let relevantSections = '';
    if (leaseData.chunks && Array.isArray(leaseData.chunks) && leaseData.chunks.length > 0) {
      console.log(`🔄 Rebuilding RAG system from ${leaseData.chunks.length} stored chunks...`);
      
      const pagesFromChunks = leaseData.chunks.map((chunk: any) => ({
        text: chunk.text,
        pageNumber: chunk.pageNumber,
      }));

      try {
        const leaseRAG = new LeaseRAGSystem(true); // Enable embeddings
        
        // Reconstruct chunks with embeddings
        const reconstructedChunks = leaseData.chunks.map((chunk: any) => ({
          text: chunk.text,
          pageNumber: chunk.pageNumber,
          embedding: chunk.embedding || [],
          chunkIndex: chunk.chunkIndex,
          startIndex: chunk.startIndex || 0,
          endIndex: chunk.endIndex || 0
        }));
        
        // Set chunks directly
        leaseRAG['chunks'] = reconstructedChunks;
        console.log('✅ RAG system rebuilt successfully');

        // Search for landlord information
        const queries = [
          'landlord name owner lessor property manager',
          'owner information contact address',
          'lessor name and address',
          'property owner details'
        ];

        for (const query of queries) {
          const chunks = await leaseRAG.retrieve(query, 3);
          if (chunks.length > 0) {
            relevantSections += chunks.map(c => c.text).join('\n\n') + '\n\n';
          }
        }
        
        console.log('✅ Retrieved relevant sections about landlord');
      } catch (error) {
        console.error('Error with RAG:', error);
      }
    }

    // Use OpenAI to extract landlord name and address
    const prompt = `You are extracting landlord/owner information from a lease document.

RELEVANT LEASE SECTIONS:
${relevantSections || 'No specific sections found.'}

INSTRUCTIONS:
Extract the following information:
1. Landlord/Owner/Lessor Name (full legal name or property management company name)
2. Landlord/Owner Address (full mailing address)

Look for terms like:
- "Landlord", "Owner", "Lessor", "Property Manager", "Management Company"
- Contact information sections
- Signature blocks
- Notice delivery addresses

Return ONLY a JSON object in this exact format:
{
  "landlordName": "extracted name or empty string if not found",
  "landlordAddress": "extracted address or empty string if not found"
}

If you cannot find the information with confidence, return empty strings. Do not make up information.
Return ONLY the JSON object, no other text.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a precise information extraction assistant. You extract specific information from legal documents and return it in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      console.log('AI Response:', responseText);
      
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        console.log('✅ Extracted landlord info:', extracted);
        
        return NextResponse.json({
          landlordName: extracted.landlordName || '',
          landlordAddress: extracted.landlordAddress || '',
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log('⚠️ Could not parse JSON from AI response');
        return NextResponse.json({
          landlordName: '',
          landlordAddress: '',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      return NextResponse.json({
        landlordName: '',
        landlordAddress: '',
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    console.error('❌ Error extracting landlord info:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to extract landlord information', details: errorMessage },
      { status: 500 }
    );
  }
}

