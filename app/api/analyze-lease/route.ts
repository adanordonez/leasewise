import { NextRequest, NextResponse } from 'next/server';
import { analyzeLease, generateActionableScenarios } from '@/lib/openai';
import { extractText } from 'unpdf';

// Helper function to chunk large text
function chunkText(text: string, maxChunkSize: number = 50000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // Try to break at a sentence or paragraph
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > start + maxChunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }
    
    chunks.push(text.slice(start, end));
    start = end;
  }
  
  return chunks;
}

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

    // Check file size (5MB limit for Vercel)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB for production.' },
        { status: 413 }
      );
    }

    // Convert file to Uint8Array (not Buffer)
    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);

    // Extract text from PDF
    const { text } = await extractText(uint8Array);
    const leaseText = Array.isArray(text) ? text.join(' ') : text;

    // Check if text is too large and chunk if necessary
    const maxTextSize = 100000; // 100k characters
    let analysis, scenarios;

    if (leaseText.length > maxTextSize) {
      // For very large texts, use the first chunk for analysis
      const chunks = chunkText(leaseText, maxTextSize);
      const firstChunk = chunks[0];
      
      console.log(`Text too large (${leaseText.length} chars), using first chunk (${firstChunk.length} chars)`);
      
      analysis = await analyzeLease(firstChunk, address);
      scenarios = await generateActionableScenarios(firstChunk, address);
    } else {
      analysis = await analyzeLease(leaseText, address);
      scenarios = await generateActionableScenarios(leaseText, address);
    }

    return NextResponse.json({
      success: true,
      analysis,
      scenarios,
      address,
      textLength: leaseText.length,
      chunked: leaseText.length > maxTextSize
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('payload') || error.message.includes('too large')) {
        return NextResponse.json(
          { error: 'File too large. Please try with a smaller PDF file.' },
          { status: 413 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze lease. Please try again.' },
      { status: 500 }
    );
  }
}
