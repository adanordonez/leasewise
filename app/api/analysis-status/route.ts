import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leaseDataId = searchParams.get('id');

    if (!leaseDataId) {
      return NextResponse.json(
        { error: 'Lease data ID is required' },
        { status: 400 }
      );
    }

    const { data: leaseData, error } = await supabase
      .from('lease_data')
      .select('id, analysis_status, analysis_data, enhanced_at, created_at')
      .eq('id', leaseDataId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Lease data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: leaseData.analysis_status,
      hasEnhancedData: !!leaseData.enhanced_at,
      enhancedAt: leaseData.enhanced_at,
      createdAt: leaseData.created_at,
      analysisData: leaseData.analysis_data
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
