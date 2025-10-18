import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';
import type { SuggestedQuestion } from '@/types/chat';

export const maxDuration = 30; // 30 seconds

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { leaseDataId } = await request.json();
    
    console.log(`🎯 Generating suggested questions for lease ${leaseDataId}`);
    
    if (!leaseDataId) {
      return NextResponse.json(
        { error: 'Missing leaseDataId' },
        { status: 400 }
      );
    }
    
    // Check if we already have suggested questions
    const { data: existingData } = await supabase
      .from('lease_data')
      .select('suggested_questions')
      .eq('id', leaseDataId)
      .single();
    
    if (existingData?.suggested_questions && existingData.suggested_questions.length > 0) {
      console.log(`✅ Using cached suggested questions`);
      return NextResponse.json({ 
        questions: existingData.suggested_questions.map((q: string) => ({ question: q, category: 'general' }))
      });
    }
    
    // Fetch lease analysis data
    const { data: leaseData, error: fetchError } = await supabase
      .from('lease_data')
      .select('red_flags, key_dates, raw_analysis, property_address, monthly_rent, pet_policy')
      .eq('id', leaseDataId)
      .single();
    
    if (fetchError || !leaseData) {
      console.error('🚨 Error fetching lease data:', fetchError);
      return NextResponse.json(
        { error: 'Lease not found' },
        { status: 404 }
      );
    }
    
    // Build context from analysis
    const redFlagsContext = leaseData.red_flags
      ?.slice(0, 3)
      .map((rf: any) => `- ${rf.issue}`)
      .join('\n') || 'None identified';
    
    const keyDatesContext = leaseData.key_dates
      ?.slice(0, 3)
      .map((kd: any) => `- ${kd.event}: ${kd.date}`)
      .join('\n') || 'None identified';
    
    // Generate suggested questions with GPT-4
    console.log(`🤖 Generating suggested questions with AI...`);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at generating helpful questions that tenants might want to ask about their lease.

Generate 6 specific, actionable questions based on the lease analysis below. Questions should:
- Be clear and specific to this lease
- Help the tenant understand important aspects
- Be answerable from the lease document
- Cover different topics (red flags, dates, rights, scenarios)
- Be phrased naturally, as a tenant would ask them

Return ONLY a JSON array of strings (questions), nothing else.`
        },
        {
          role: 'user',
          content: `Lease Information:
Property: ${leaseData.property_address || 'Not specified'}
Monthly Rent: ${leaseData.monthly_rent || 'Not specified'}
Pet Policy: ${leaseData.pet_policy || 'Not specified'}

Red Flags Identified:
${redFlagsContext}

Key Dates:
${keyDatesContext}

Generate 6 questions a tenant might want to ask about this lease.`
        }
      ],
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: "json_object" }
    });
    
    let questions: string[] = [];
    
    try {
      const responseText = completion.choices[0].message.content || '{}';
      const parsed = JSON.parse(responseText);
      
      // Handle different possible response formats
      if (Array.isArray(parsed)) {
        questions = parsed;
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        questions = parsed.questions;
      } else if (typeof parsed === 'object') {
        // Extract any array from the object
        const values = Object.values(parsed);
        const arrayValue = values.find(v => Array.isArray(v));
        if (arrayValue) {
          questions = arrayValue as string[];
        }
      }
      
      // Fallback questions if parsing fails
      if (questions.length === 0) {
        console.warn('⚠️ Failed to parse AI response, using fallback questions');
        questions = [
          "Can my landlord raise my rent during the lease term?",
          "What happens if I need to break my lease early?",
          "What are my responsibilities for maintenance and repairs?",
          "Can my landlord enter my apartment without notice?",
          "How do I get my security deposit back?",
          "What are the rules about having pets?"
        ];
      }
      
      console.log(`✅ Generated ${questions.length} suggested questions`);
      
      // Save to database for caching
      await supabase
        .from('lease_data')
        .update({ suggested_questions: questions })
        .eq('id', leaseDataId);
      
      const suggestedQuestions: SuggestedQuestion[] = questions.map(q => ({
        question: q,
        category: 'general' // Could categorize based on content later
      }));
      
      return NextResponse.json({ questions: suggestedQuestions });
      
    } catch (parseError) {
      console.error('🚨 Error parsing AI response:', parseError);
      // Return fallback questions
      return NextResponse.json({
        questions: [
          { question: "Can my landlord raise my rent during the lease term?", category: 'general' },
          { question: "What happens if I need to break my lease early?", category: 'general' },
          { question: "What are my responsibilities for maintenance and repairs?", category: 'general' },
          { question: "Can my landlord enter my apartment without notice?", category: 'general' },
          { question: "How do I get my security deposit back?", category: 'general' },
          { question: "What are the rules about having pets?", category: 'general' }
        ]
      });
    }
    
  } catch (error) {
    console.error('🚨 Error generating suggested questions:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate questions',
        details: 'An error occurred while generating suggested questions'
      },
      { status: 500 }
    );
  }
}

