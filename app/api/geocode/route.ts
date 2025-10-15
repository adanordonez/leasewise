import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Geocoding API called');
    const { address } = await request.json();
    console.log('📍 Address to geocode:', address);
    
    if (!address) {
      console.log('❌ No address provided');
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Try new secure token first, fallback to old token for migration
    let mapboxToken = process.env.MAPBOX_TOKEN; // Server-side only, no NEXT_PUBLIC_
    
    if (!mapboxToken) {
      console.log('⚠️ MAPBOX_TOKEN not found, trying NEXT_PUBLIC_MAPBOX_TOKEN as fallback');
      mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    }
    
    console.log('🔑 Mapbox token exists:', !!mapboxToken);
    console.log('🔑 Mapbox token preview:', mapboxToken ? `${mapboxToken.substring(0, 10)}...` : 'undefined');
    
    if (!mapboxToken) {
      console.log('❌ No Mapbox token configured');
      return NextResponse.json(
        { error: 'Mapbox token not configured. Please set MAPBOX_TOKEN environment variable.' },
        { status: 500 }
      );
    }

    // Make geocoding request from server
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&country=US&types=address&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return NextResponse.json({
        success: true,
        coordinates: feature.center, // [longitude, latitude]
        placeName: feature.place_name,
        context: feature.context
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No results found'
      });
    }

  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Geocoding failed' },
      { status: 500 }
    );
  }
}
