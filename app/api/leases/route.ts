import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const minRent = searchParams.get('minRent');
    const maxRent = searchParams.get('maxRent');
    const propertyType = searchParams.get('propertyType');
    const city = searchParams.get('city');

    let query = supabase
      .from('lease_data')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (minRent) {
      query = query.gte('monthly_rent', parseFloat(minRent));
    }
    if (maxRent) {
      query = query.lte('monthly_rent', parseFloat(maxRent));
    }
    if (propertyType) {
      query = query.eq('property_type', propertyType);
    }
    if (city) {
      query = query.ilike('property_address', `%${city}%`);
    }

    const { data: leases, error } = await query;

    if (error) {
      console.error('Error fetching leases:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lease data' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('lease_data')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      leases: leases || [],
      total: count || 0,
      pagination: {
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    });

  } catch (error) {
    console.error('Leases API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lease data' },
      { status: 500 }
    );
  }
}
