import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

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

    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN environment variable is not set');
      return NextResponse.json(
        { 
          error: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.',
          setupRequired: true 
        },
        { status: 500 }
      );
    }

    // Check file size (20MB limit for blob storage)
    const maxFileSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB.' },
        { status: 413 }
      );
    }

    // Generate a unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${file.name}`;

    console.log('Uploading file to blob storage:', uniqueFilename);

    // Upload file directly to Vercel Blob Storage
    const blob = await put(uniqueFilename, file, {
      access: 'public',
      contentType: file.type,
    });

    console.log('File uploaded successfully:', blob.url);

    return NextResponse.json({
      success: true,
      blobUrl: blob.url,
      filename: uniqueFilename,
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('token')) {
        return NextResponse.json(
          { error: 'Invalid blob storage token. Please check your BLOB_READ_WRITE_TOKEN.' },
          { status: 500 }
        );
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'Network error connecting to blob storage. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}