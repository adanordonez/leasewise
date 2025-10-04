import { NextRequest, NextResponse } from 'next/server';
import { analyzeLease, generateActionableScenarios } from '@/lib/openai';
import { extractText } from 'unpdf';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const address = formData.get('address') as string;

    if (!file || !address) {
      return NextResponse.json(
        { error: 'File and address are required' },
        { status: 400 }
      );
    }

    // Convert file to Uint8Array (not Buffer)
    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);

    // Extract text from PDF
    const { text } = await extractText(uint8Array);
    const leaseText = Array.isArray(text) ? text.join(' ') : text;

    // Analyze with AI
    const analysis = await analyzeLease(leaseText, address);
    const scenarios = await generateActionableScenarios(leaseText, address);

    return NextResponse.json({
      success: true,
      analysis,
      scenarios,
      address
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze lease' },
      { status: 500 }
    );
  }
}
