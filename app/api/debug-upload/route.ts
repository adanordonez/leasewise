import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    const contentLength = request.headers.get('content-length');
    
    console.log('DEBUG-UPLOAD: Request received');
    console.log('DEBUG-UPLOAD: Content-Type:', contentType);
    console.log('DEBUG-UPLOAD: Content-Length:', contentLength);
    
    if (contentType?.includes('multipart/form-data')) {
      console.log('DEBUG-UPLOAD: This is a direct file upload (BAD)');
      return NextResponse.json({
        error: 'Direct file upload detected',
        contentType,
        contentLength,
        message: 'This should not happen - files should go through Supabase first'
      }, { status: 400 });
    } else {
      console.log('DEBUG-UPLOAD: This is a JSON request (GOOD)');
      const body = await request.json();
      return NextResponse.json({
        success: true,
        contentType,
        contentLength,
        bodyKeys: Object.keys(body),
        message: 'This is the correct flow - using Supabase URL'
      });
    }
  } catch (error) {
    console.error('DEBUG-UPLOAD: Error:', error);
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
