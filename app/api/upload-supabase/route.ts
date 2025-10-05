import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload-supabase: Starting file upload...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const address = formData.get('address') as string;

    console.log('Upload-supabase: File details:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      address: address
    });

    if (!file || !address) {
      console.error('Upload-supabase: Missing file or address');
      return NextResponse.json(
        { error: 'File and address are required' },
        { status: 400 }
      );
    }

    // Check file size (50MB limit for Supabase)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 413 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `leases/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lease-documents')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      
      // Provide specific error messages
      if (uploadError.message.includes('row-level security')) {
        return NextResponse.json(
          { error: 'Storage access denied. Please check Supabase RLS policies.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to upload file to storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('lease-documents')
      .getPublicUrl(filePath);

    // Save file metadata to database
    const { data: pdfData, error: dbError } = await supabase
      .from('pdf_uploads')
      .insert({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_url: urlData.publicUrl,
        address: address
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save file metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pdfUploadId: pdfData.id,
      url: urlData.publicUrl,
      filename: file.name
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
